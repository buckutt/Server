const express         = require('express');
const Promise         = require('bluebird');
const { memoize }     = require('lodash');
const APIError        = require('../../errors/APIError');
const logger          = require('../../lib/log');
const vat             = require('../../lib/vat');
const { r }           = require('../../lib/requelize');
const canSellOrReload = require('../../lib/canSellOrReload');
const dbCatch         = require('../../lib/dbCatch');

const log = logger(module);

const getArticlePrice    = memoize(purchase => r.table('Price').get(purchase.Price_id)('amount').run());
const getPromotionPrices = memoize(item => Promise.all(
    item.articles.map(article => r.table('Price').get(article.price)('amount').run())
));

/* istanbul ignore next */
setInterval(() => {
    getArticlePrice.cache.clear();
    getPromotionPrices.cache.clear();
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

    req.Buyer_id = req.body[0].Buyer_id;

    if (!req.Buyer_id) {
        return next(new APIError(module, 400, 'Invalid buyer'));
    }

    req.app.locals.models.User
        .get(req.Buyer_id).run()
        .then((user) => {
            req.buyer = user;
            next();
        });
});

router.post('/services/basket', (req, res, next) => {
    let purchases = req.body.filter(item => item.type === 'purchase');

    const getArticleCost = purchases.map(purchase => getArticlePrice(purchase));

    const initialPromise = Promise.all(getArticleCost)
        .then((articleCosts) => {
            purchases = purchases.map((purchase, i) => {
                purchase.cost = articleCosts[i];

                return purchase;
            });
        });

    const getPromotionsCosts = purchases.map(item => getPromotionPrices(item));

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
    // Purchases-Articles queries: prevent from uniqify
    const purchasesRels = [];

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

    // Disabled for offline requests:
    // if (req.buyer.credit < totalCost) {
    //     return next(new APIError(module, 400, 'Not enough credit'));
    // }

    if (req.event.config.maxPerAccount && req.buyer.credit - totalCost > req.event.config.maxPerAccount) {
        const max = (req.event.config.maxPerAccount / 100).toFixed(2);
        return next(new APIError(module, 400, `Maximum exceeded : ${max}€`, { user: req.user.id }));
    }

    if (req.event.config.minReload && reloadOnly < req.event.config.minReload && reloadOnly > 0) {
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

    const userRights = canSellOrReload(req.user, req.connectType);

    const unallowedPurchase = (req.body.find(item => item.type === 'purchase') && !userRights.canSell);
    const unallowedReload   = (req.body.find(item => item.type === 'reload') && !userRights.canReload);

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
            const purchase = new models.Purchase({
                Buyer_id    : item.Buyer_id,
                Price_id    : item.Price_id,
                Point_id    : req.Point_id,
                Promotion_id: item.Promotion_id || null,
                Seller_id   : item.Seller_id,
                alcohol     : item.alcohol,
                vat         : vat(item)
            });

            purchasesRels.push(articlesIds);

            // Stock reduction
            articlesIds.forEach((article) => {
                const stockReduction = models.Article
                    .get(article)
                    .update({
                        stock: r.row('stock').sub(1)
                    })
                    .run();

                stocks.push(stockReduction);
            });

            purchases.push(purchase.save());
        } else if (typeof item.credit === 'number') {
            // Reloads
            const reload = new models.Reload({
                credit   : item.credit,
                type     : item.type,
                trace    : item.trace || '',
                Point_id : req.Point_id,
                Buyer_id : item.Buyer_id,
                Seller_id: item.Seller_id
            });

            reloads.push(reload.save());
        }
    });

    const updateCredit = r.table('User')
        .get(req.buyer.id)
        .update({
            credit: newCredit
        })
        .run();

    const everythingSaving = [updateCredit].concat(reloads).concat(stocks);

    Promise
        .all(purchases)
        .then((purchases_) => {
            const allRels = purchases_.map(({ id }, i) =>
                models.r.table('Article_Purchase').insert(purchasesRels[i].map(articleId =>
                    ({
                        Article : articleId,
                        Purchase: id
                    })
                ))
            );

            return Promise.all(allRels);
        })
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
