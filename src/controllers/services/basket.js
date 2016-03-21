import express  from 'express';
import Promise  from 'bluebird';
import APIError from '../../errors/APIError';
import logger   from '../../lib/log';
import thinky   from '../../lib/thinky';
import { pp }   from '../../lib/utils';

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

    req.Buyer_id = req.body[0].Buyer_id;

    if (!req.Buyer_id) {
        return next(new APIError(400, 'Invalid buyer'));
    }

    req.app.locals.models.User
        .get(req.Buyer_id)
        .then(user => {
            req.buyer = user;
            next();
        });
});

router.post('/services/basket', (req, res, next) => {
    const models = req.app.locals.models;

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
                Buyer_id    : item.Buyer_id,
                Fundation_id: item.Fundation_id,
                Point_id    : req.Point_id,
                Promotion_id: item.Promotion_id ? item.Promotion_id : '',
                Seller_id   : item.Seller_id
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
                credit   : item.credit,
                trace    : item.trace,
                Point_id : req.Point_id,
                Buyer_id : item.Buyer_id,
                Seller_id: item.Seller_id
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

export default router;
