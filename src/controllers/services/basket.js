const express         = require('express');
const Promise         = require('bluebird');
const APIError        = require('../../errors/APIError');
const canSellOrReload = require('../../lib/canSellOrReload');
const logger          = require('../../lib/log');
const thinky          = require('../../lib/thinky');
const { pp }          = require('../../lib/utils');

const log = logger(module);

/**
 * Basket controller. Handles purchases and reloads
 */
const router = new express.Router();

// Get the buyer
router.post('/services/basket', (req, res, next) => {
    if (!Array.isArray(req.body)) {
        return next(new APIError(400, 'Invalid basket'));
    }

    if (req.body.length === 0) {
        return res.status(200).json({}).end();
    }

    req.Buyer_id = req.body[0].Buyer_id;

    if (!req.Buyer_id) {
        return next(new APIError(400, 'Invalid buyer'));
    }

    req.app.locals.models.User
        .get(req.Buyer_id)
        .then((user) => {
            req.buyer = user;
            next();
        });
});

router.post('/services/basket', (req, res, next) => {
    const models = req.app.locals.models;

    // Purchases documents
    const purchases     = [];
    // Reloads documents
    const reloads       = [];
    // Stock reduciton queries
    const stocks        = [];
    // Purchases-Articles queries: prevent thinky from uniqify
    const purchasesRels = [];

    let queryLog  = '';

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
        .filter(item => item.type === 'reload')
        .map(item => item.credit)
        .reduce((a, b) => a + b, 0);

    if (req.buyer.credit < totalCost) {
        return next(new APIError(400, 'Not enough credit'));
    }

    if (req.event.config.maxPerAccount && req.buyer.credit - totalCost > req.event.config.maxPerAccount) {
        const max = (req.event.config.maxPerAccount / 100).toFixed(2);
        return next(new APIError(400, `Maximum exceeded : ${max}€`));
    }

    if (req.event.config.minReload && reloadOnly < req.event.config.minReload && reloadOnly > 0) {
        const min = (req.event.config.minReload / 100).toFixed(2);
        return next(new APIError(400, `Can not reload less than : ${min}€`));
    }

    queryLog += `User ${req.buyer.id} `;

    const newCredit = req.buyer.credit - totalCost;

    if (isNaN(newCredit)) {
        return res
            .status(400)
            .json({
                newCredit: req.buyer.credit
            })
            .end();
    }

    const userRights = canSellOrReload(req.user);

    const unallowedPurchase = (req.body.find(item => item.type === 'purchase') && !userRights.canSell);
    const unallowedReload   = (req.body.find(item => item.type === 'reload') && !userRights.canReload);

    if (unallowedPurchase || unallowedReload) {
        return next(new APIError(401, 'No right to reload or sell', { unallowedPurchase, unallowedReload }));
    }

    req.body.forEach((item) => {
        if (typeof item.cost === 'number') {
            // Purchases
            const articlesIds = item.articles.map(article => article.id);

            const articlesAmount = item.articles.map(article => ({
                id   : article.id,
                price: article.price,
                vat  : article.vat
            }));

            const purchase = new models.Purchase({
                Buyer_id    : item.Buyer_id,
                Price_id    : item.Price_id,
                Point_id    : req.Point_id,
                Promotion_id: item.Promotion_id ? item.Promotion_id : '',
                Seller_id   : item.Seller_id,
                articlesAmount
            });

            queryLog += `buys ${pp(articlesIds)} `;
            purchasesRels.push(articlesIds);

            // Stock reduction
            articlesIds.forEach((article) => {
                const stockReduction = models.Article
                    .get(article)
                    .update({
                        stock: thinky.r.row('stock').sub(1)
                    })
                    .run();

                stocks.push(stockReduction);
            });

            purchases.push(purchase.save());
        } else if (typeof item.credit === 'number') {
            queryLog += `reloads ${item.credit} `;

            // Reloads
            const reload = new models.Reload({
                credit   : item.credit,
                type     : item.type || 'reload',
                trace    : item.trace || '',
                Point_id : req.Point_id,
                Buyer_id : item.Buyer_id,
                Seller_id: item.Seller_id
            });

            reloads.push(reload.save());
        }
    });

    queryLog += `and update credit to ${newCredit}`;
    const updateCredit = thinky.r.table('User')
        .get(req.buyer.id)
        .update({
            credit: newCredit
        })
        .run();

    log.info(queryLog);

    const everythingSaving = [updateCredit].concat(reloads).concat(stocks);

    Promise
        .all(purchases)
        .then((purchases_) => {
            const allRels = purchases_.map(({ id }, i) =>
                models.r.table('Article_Purchase').insert(purchasesRels[i].map(articleId =>
                    ({
                        Article_id : articleId,
                        Purchase_id: id
                    })
                ))
            );

            return Promise.all(allRels);
        })
        .all(everythingSaving)
        .then(() =>
            res
                .status(200)
                .json({
                    newCredit
                })
                .end()
        )
        .catch(thinky.Errors.ValidationError, (err) => {
            /* istanbul ignore next */
            next(new APIError(400, 'Invalid model', err));
        })
        .catch(thinky.Errors.InvalidWrite, (err) => {
            /* istanbul ignore next */
            next(new APIError(500, 'Couldn\'t write to disk', err));
        })
        .catch((err) => {
            /* istanbul ignore next */
            next(new APIError(500, 'Unknown error', err));
        });
});

module.exports = router;
