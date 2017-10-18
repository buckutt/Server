const express              = require('express');
const Promise              = require('bluebird');
const { memoize, countBy } = require('lodash');
const APIError             = require('../../errors/APIError');
const logger               = require('../../lib/log');
const vat                  = require('../../lib/vat');
const { bookshelf }        = require('../../lib/bookshelf');
const canSellOrReload      = require('../../lib/canSellOrReload');
const dbCatch              = require('../../lib/dbCatch');

const log = logger(module);

const getArticleCost = memoize((Price, article) =>
    Price
        .where({ id: article.price_id })
        .fetch()
        .then(price => price.get('amount'))
);

setInterval(() => {
    getArticleCost.cache.clear();
}, 60 * 1000);

/**
 * Basket controller. Handles purchases and reloads
 */
const router = new express.Router();

// Get the buyer
router.post('/services/basket', (req, res, next) => {
    log.info(`Processing basket ${JSON.stringify(req.body)}`, req.details);

    if (!Array.isArray(req.body)) {
        return next(new APIError(module, 400, 'Invalid basket'));
    }

    if (req.body.length === 0) {
        return res.status(200).json({}).end();
    }

    req.buyer_id = req.body[0].buyer_id;

    if (!req.buyer_id) {
        return next(new APIError(module, 400, 'Invalid buyer'));
    }

    req.app.locals.models.User
        .where({ id: req.buyer_id })
        .fetch()
        .then((user) => {
            req.buyer = user.toJSON();
            next();
        });
});

router.post('/services/basket', (req, res, next) => {
    const { Price } = req.app.locals.models;
    let purchases = req.body.filter(item => typeof item.cost === 'number');

    const getArticleCosts = purchases.map(purchase => getArticleCost(Price, purchase));

    const initialPromise = Promise.all(getArticleCosts)
        .then((articleCosts) => {
            purchases = purchases.map((purchase, i) => {
                purchase.cost = articleCosts[i];

                return purchase;
            });
        });

    const getPromotionsCosts = purchases.map(item =>
        Promise.all(
            item.articles.map(article => getArticleCost(Price, article))
        )
    );

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
    const purchases     = [];
    // Reloads documents
    const reloads       = [];
    // Stock reduciton queries
    const stocks        = [];

    const totalCost = req.body
        .map((item) => {
            if (typeof item.cost === 'number') {
                return item.cost;
            } else if (typeof item.credit === 'number') {
                return -1 * item.credit;
            }
        })
        .reduce((a, b) => a + b);

    const reloadOnly = req.body
        .filter(item => typeof item.credit === 'number')
        .map(item => item.credit)
        .reduce((a, b) => a + b, 0);

    const now         = new Date().getTime();
    const minus       = now - 10000;
    const requestDate = new Date(req.body[0].date).getTime();

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
    if (isNaN(newCredit)) {
        log.error('credit is not a number');

        return res
            .status(400)
            .json({
                newCredit: req.buyer.credit
            })
            .end();
    }

    const userRights = canSellOrReload(req.user, req.point_id);

    const unallowedPurchase = (req.body.find(item => typeof item.cost === 'number') && !userRights.canSell);
    const unallowedReload   = (req.body.find(item => typeof item.credit === 'number') && !userRights.canReload);

    if (unallowedPurchase || unallowedReload) {
        return next(new APIError(module, 401, 'No right to reload or sell', {
            user: req.user.id,
            unallowedPurchase,
            unallowedReload
        }));
    }

    req.body.forEach((item) => {
        if (typeof item.cost === 'number') {
            // Purchases
            const articlesIds = item.articles.map(article => article.id);
            const countIds    = countBy(articlesIds);

            const purchase = new models.Purchase({
                buyer_id    : item.buyer_id,
                price_id    : item.price_id,
                point_id    : req.point_id,
                promotion_id: item.promotion_id || null,
                seller_id   : req.user.id,
                alcohol     : item.alcohol,
                vat         : vat(item)
            });

            // Stock reduction
            articlesIds.forEach((articleId) => {
                const stockReduction = models.Article
                    .query()
                    .where({ id: articleId })
                    .decrement('stock');

                stocks.push(stockReduction);
            });

            const savePurchase = purchase
                .save()
                .then(() => Promise.all(
                    Object.keys(countIds).map((articleId) => {
                        const count = countIds[articleId];

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
                    })
                ));

            purchases.push(savePurchase);
        } else if (typeof item.credit === 'number') {
            // Reloads
            const reload = new models.Reload({
                credit   : item.credit,
                type     : item.type,
                trace    : item.trace || '',
                point_id : req.point_id,
                buyer_id : item.buyer_id,
                seller_id: req.user.id
            });

            reloads.push(reload.save());
        }
    });

    const updateCredit = bookshelf.knex('users')
        .where({ id: req.buyer.id })
        .update({
            credit    : newCredit,
            updated_at: new Date()
        });

    const everythingSaving = [updateCredit].concat(reloads).concat(stocks);

    Promise
        .all(purchases)
        .then(() => Promise.all(everythingSaving))
        .then(() =>
            res
                .status(200)
                .json({
                    newCredit
                })
                .end()
        )
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
