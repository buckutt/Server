const express               = require('express');
const Promise               = require('bluebird');
const { countBy }           = require('lodash');
const APIError              = require('../../errors/APIError');
const logger                = require('../../lib/log');
const vat                   = require('../../lib/vat');
const { bookshelf }         = require('../../lib/bookshelf');
const canSellReloadOrAssign = require('../../lib/canSellReloadOrAssign');
const dbCatch               = require('../../lib/dbCatch');

const log = logger(module);

const getPriceAmount = (Price, priceId) => Price
    .where({ id: priceId })
    .fetch()
    .then(price => price.get('amount'));

/**
 * Basket controller. Handles purchases and reloads
 */
const router = new express.Router();

// Get the buyer
router.post('/services/basket', (req, res, next) => {
    log.info(`Processing basket ${JSON.stringify(req.body)}`, req.details);

    if (!req.body.buyer || !req.body.molType || !Array.isArray(req.body.basket)) {
        return next(new APIError(module, 400, 'Invalid basket'));
    }

    if (req.body.basket.length === 0) {
        return res.status(200).json({}).end();
    }

    req.buyer   = req.body.buyer;
    req.molType = req.body.molType;

    if (!req.buyer || !req.molType) {
        return next(new APIError(module, 400, 'Invalid buyer'));
    }

    req.app.locals.models.MeanOfLogin
        .where({
            type   : req.molType,
            data   : req.buyer,
            blocked: false
        })
        .fetch({
            withRelated: ['user']
        })
        .then(mol => ((mol) ? mol.toJSON() : null))
        .then((mol) => {
            if (!mol || !mol.user.id) {
                return next(new APIError(module, 400, 'Invalid buyer'));
            }

            req.buyer          = mol.user;
            req.buyer.pin      = '';
            req.buyer.password = '';

            next();
        });
});

router.post('/services/basket', (req, res, next) => {
    const { Price } = req.app.locals.models;
    let purchases   = req.body.basket.filter(item => typeof item.cost === 'number');

    const getArticleCosts = purchases.map(purchase => getPriceAmount(Price, purchase.price_id));

    const initialPromise = Promise.all(getArticleCosts)
        .then((articleCosts) => {
            purchases = purchases.map((purchase, i) => {
                purchase.cost = articleCosts[i];

                return purchase;
            });
        });

    const getPromotionsCosts = purchases.map(item =>
        Promise.all(item.articles.map(article => getPriceAmount(Price, article.price))));

    initialPromise
        .then(() => Promise.all(getPromotionsCosts))
        .then((promotionsCosts) => {
            purchases = purchases.map((purchase, i) => {
                purchase.articles = purchase.articles.map((amount, j) => {
                    amount.cost = promotionsCosts[i][j];

                    return amount;
                });

                return purchase;
            });
        })
        .then(() => next());
});

router.post('/services/basket', (req, res, next) => {
    const models = req.app.locals.models;

    // Purchases documents
    const purchases = [];
    // Reloads documents
    const reloads   = [];

    const transactionIds = { purchases: [], reloads: [] };

    const totalCost = req.body.basket
        .map((item) => {
            if (typeof item.cost === 'number') {
                return item.cost;
            } else if (typeof item.credit === 'number') {
                return -1 * item.credit;
            }
        })
        .reduce((a, b) => a + b);

    const reloadOnly = req.body.basket
        .filter(item => typeof item.credit === 'number')
        .map(item => item.credit)
        .reduce((a, b) => a + b, 0);

    const now         = new Date().getTime();
    const minus       = now - 10000;
    const requestDate = new Date(req.body.date).getTime();

    if (req.buyer.credit < totalCost && (requestDate >= minus && requestDate <= now)) {
        return next(new APIError(module, 400, 'Not enough credit'));
    }

    if (req.event.maxPerAccount && req.buyer.credit - totalCost > req.event.maxPerAccount) {
        const max = (req.event.config.maxPerAccount / 100).toFixed(2);
        return next(new APIError(module, 400, `Maximum exceeded : ${max}€`, { user: req.user.id }));
    }

    if (req.event.minReload && reloadOnly < req.event.minReload && reloadOnly > 0) {
        const min = (req.event.config.minReload / 100).toFixed(2);
        return next(new APIError(module, 400, `Can not reload less than : ${min}€`));
    }

    const newCredit = req.buyer.credit - totalCost;

    // TODO: standardize error response
    if (Number.isNaN(newCredit)) {
        log.error('credit is not a number');

        return res
            .status(400)
            .json({
                newCredit: req.buyer.credit
            })
            .end();
    }

    const userRights = canSellReloadOrAssign(req.user, req.point_id);

    const unallowedPurchase = (req.body.basket.find(item => typeof item.cost === 'number') && !userRights.canSell);
    const unallowedReload   = (req.body.basket.find(item => typeof item.credit === 'number') && !userRights.canReload);

    if (unallowedPurchase || unallowedReload) {
        return next(new APIError(module, 401, 'No right to reload or sell', {
            user: req.user.id,
            unallowedPurchase,
            unallowedReload
        }));
    }

    req.body.basket.forEach((item) => {
        if (typeof item.cost === 'number') {
            // Purchases
            const articlesIds = item.articles.map(article => article.id);
            const countIds    = countBy(articlesIds);

            const purchase = new models.Purchase({
                buyer_id    : req.buyer.id,
                price_id    : item.price_id,
                point_id    : req.point_id,
                promotion_id: item.promotion_id || null,
                seller_id   : req.user.id,
                alcohol     : item.alcohol,
                vat         : vat(item)
            });

            const savePurchase = purchase
                .save()
                .then(() => Promise.all(Object.keys(countIds).map((articleId) => {
                    const count = countIds[articleId];

                    transactionIds.purchases.push(purchase.id);

                    return bookshelf
                        .knex('articles_purchases')
                        .insert({
                            article_id : articleId,
                            purchase_id: purchase.id,
                            count,
                            created_at : new Date(),
                            updated_at : new Date(),
                            deleted_at : null
                        });
                })));

            purchases.push(savePurchase);
        } else if (typeof item.credit === 'number') {
            // Reloads
            const reload = new models.Reload({
                credit   : item.credit,
                type     : item.type,
                trace    : item.trace || '',
                point_id : req.point_id,
                buyer_id : req.buyer.id,
                seller_id: req.user.id
            });

            const saveReload = reload
                .save()
                .then(() => transactionIds.reloads.push(reload.id));

            reloads.push(saveReload);
        }
    });

    const updatedAt = new Date();

    const updateCredit = bookshelf.knex('users')
        .where({ id: req.buyer.id })
        .update({
            credit    : newCredit,
            updated_at: updatedAt
        });

    req.buyer.credit     = newCredit;
    req.buyer.updated_at = updatedAt;

    Promise
        .all([updateCredit].concat(purchases).concat(reloads))
        .then(() => {
            req.app.locals.modelChanges.emit('userCreditUpdate', req.buyer);

            return res
                .status(200)
                .json({
                    transactionIds,
                    ...req.buyer
                })
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
