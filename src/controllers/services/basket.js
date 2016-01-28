import APIError from '../../APIError';
import logger   from '../../log';
import thinky   from '../../thinky';
import { pp }   from '../../lib/utils';
import express  from 'express';
import Promise  from 'bluebird';

const log = logger(module);

/**
 * Basket controller. Handles purchases and reloads
 * @param {Application} app Express main application
 */
export default app => {
    const models = app.locals.models;
    const router = new express.Router();

    // Get the buyer
    router.post('/services/basket', (req, res, next) => {
        if (!Array.isArray(req.body)) {
            return next(new APIError(400, 'Invalid basket'));
        }

        req.buyerId = req.body[0].buyerId;

        if (!req.buyerId) {
            return next(new APIError(400, 'Invalid buyer'));
        }

        models.User
            .get(req.buyerId)
            .then(user => {
                req.buyer = user;
                next();
            });
    });

    router.post('/services/basket', (req, res, next) => {
        // Purchases documents
        const purchases = [];
        // Reloads documents
        const reloads   = [];
        // Stock reduciton queries
        const stocks    = [];

        let queryLog  = '';

        const totalCost = req.body
            .map(item => {
                if (item.type === 'purchase') {
                    return item.cost;
                } else if (item.type === 'reload') {
                    return -1 * item.credit;
                }
            })
            .reduce((a, b) => a + b);

        if (req.buyer.credit < totalCost) {
            return next(new APIError(400, 'Not enough credit'));
        }

        queryLog += `User ${req.buyer.id} `;

        req.body.forEach(item => {
            if (item.type === 'purchase') {
                // Purchases
                const purchase = new models.Purchase({
                    buyerId    : item.buyerId,
                    fundationId: item.fundationId,
                    pointId    : req.pointId,
                    promotionId: item.promotionId ? item.promotionId : '',
                    sellerId   : item.sellerId
                });

                queryLog += `buys ${pp(item.articles)} `;
                purchase.articles = item.articles;

                // Stock reduction
                item.articles.forEach(article => {
                    const stockReduction = models.Article
                        .get(article)
                        .update({
                            stock: thinky.r.row('stock').sub(1)
                        })
                        .run();

                    stocks.push(stockReduction);
                });

                purchases.push(purchase.saveAll({
                    articles: true
                }));
            } else if (item.type === 'reload') {
                queryLog += `reloads ${item.credit} `;

                // Reloads
                const reload = new models.Reload({
                    credit  : item.credit,
                    trace   : item.trace,
                    pointId : req.pointId,
                    buyerId : item.buyerId,
                    sellerId: item.sellerId
                });

                reloads.push(reload);
            }
        });

        const newCredit = req.buyer.credit - totalCost;

        if (isNaN(newCredit)) {
            return res
                .status(200)
                .json({
                    newCredit: req.buyer.credit
                })
                .end();
        }

        queryLog += `and update credit to ${newCredit}`;
        const updateCredit = thinky.r.table('User')
            .get(req.buyer.id)
            .update({
                credit: newCredit
            }).run();

        log.info(queryLog);

        const everythingSaving = [updateCredit].concat(purchases).concat(reloads).concat(stocks);
        Promise
            .all(everythingSaving)
            .then(() =>
                res
                    .status(200)
                    .json({
                        newCredit
                    })
                    .end()
            )
            .catch(thinky.Errors.ValidationError, err =>
                /* istanbul ignore next */
                next(new APIError(400, 'Invalid model', err))
            )
            .catch(thinky.Errors.InvalidWrite, err =>
                /* istanbul ignore next */
                next(new APIError(500, 'Couldn\'t write to disk', err))
            )
            .catch(err =>
                /* istanbul ignore next */
                next(new APIError(500, 'Unknown error', err))
            );
    });

    app.use(router);
};
