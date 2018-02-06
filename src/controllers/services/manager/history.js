const express     = require('express');
const { flatten } = require('lodash');
const logger      = require('../../../lib/log');

const log = logger(module);

/**
 * History controller.
 */
const router = new express.Router();

router.get('/services/manager/history', (req, res, next) => {
    const adminRight = req.details.rights.find(right => right.name === 'admin' && right.end > new Date());

    if (adminRight) {
        return req.app.locals.models.User
            .where({ id: req.query.buyer })
            .fetch()
            .then((user) => {
                req.history = {
                    user  : req.query.buyer,
                    credit: user.get('credit')
                };

                next();
            });
    }

    req.history = {
        user  : req.user.id,
        credit: req.user.credit
    };

    next();
});

router.get('/services/manager/history', (req, res) => {
    log.info(`Get history for user ${req.history.user}`, req.details);

    const models = req.app.locals.models;

    // TODO: optimize filters
    const purchaseQuery = () => models.Purchase
        .where({ buyer_id: req.history.user })
        .fetchAll({
            withRelated: [
                'seller',
                'price',
                'price.article',
                'price.promotion',
                'articles',
                'point'
            ],
            withDeleted: true
        });

    const reloadQuery = () => models.Reload
        .where({ buyer_id: req.history.user })
        .fetchAll({
            withRelated: [
                'seller',
                'point'
            ],
            withDeleted: true
        });

    const refundQuery = () => models.Refund
        .where({ buyer_id: req.history.user })
        .fetchAll({
            withRelated: [
                'seller'
            ],
            withDeleted: true
        });

    const transferFromQuery = () => models.Transfer
        .where({ reciever_id: req.history.user })
        .fetchAll({
            withRelated: [
                'sender'
            ],
            withDeleted: true
        });

    const transferToQuery = () => models.Transfer
        .where({ sender_id: req.history.user })
        .fetchAll({
            withRelated: [
                'reciever'
            ],
            withDeleted: true
        });

    let history = [];

    purchaseQuery()
        .then((result) => {
            history = result
                .toJSON()
                .map(purchase => ({
                    id    : purchase.id,
                    type  : purchase.price.promotion ? 'promotion' : 'purchase',
                    date  : purchase.created_at,
                    amount: -1 * purchase.price.amount,
                    point : purchase.point.name,
                    seller: {
                        lastname : purchase.seller.lastname,
                        firstname: purchase.seller.firstname
                    },
                    articles: flatten(purchase.articles.map(article =>
                        Array(article._pivot_count).fill(article.name))),
                    promotion : purchase.price.promotion ? purchase.price.promotion.name : '',
                    isCanceled: !!purchase.deleted_at
                }));

            return reloadQuery();
        })
        .then((result) => {
            const reloads = result.toJSON().map(reload =>
                ({
                    id    : reload.id,
                    type  : 'reload',
                    date  : reload.created_at,
                    amount: reload.credit,
                    point : reload.point.name,
                    mop   : reload.type,
                    seller: {
                        lastname : reload.seller.lastname,
                        firstname: reload.seller.firstname
                    },
                    isCanceled: !!reload.deleted_at
                }));

            history = history.concat(reloads);

            return refundQuery();
        })
        .then((result) => {
            const refunds = result.toJSON().map(refund =>
                ({
                    id    : refund.id,
                    type  : 'refund',
                    date  : refund.created_at,
                    amount: -1 * refund.amount,
                    point : 'Internet',
                    mop   : refund.type,
                    seller: {
                        lastname : refund.seller.lastname,
                        firstname: refund.seller.firstname
                    },
                    isCanceled: !!refund.deleted_at
                }));

            history = history.concat(refunds);

            return transferFromQuery();
        })
        .then((result) => {
            const transfersFrom = result.toJSON().map(transfer =>
                ({
                    id    : transfer.id,
                    type  : 'transfer',
                    date  : transfer.created_at,
                    amount: transfer.amount,
                    point : 'Internet',
                    mop   : '',
                    seller: {
                        lastname : transfer.sender.lastname,
                        firstname: transfer.sender.firstname
                    },
                    isCanceled: !!transfer.deleted_at
                }));

            history = history.concat(transfersFrom);

            return transferToQuery();
        })
        .then((result) => {
            const transfersTo = result.toJSON().map(transfer =>
                ({
                    id    : transfer.id,
                    type  : 'transfer',
                    date  : transfer.created_at,
                    amount: -1 * transfer.amount,
                    point : 'Internet',
                    mop   : '',
                    seller: {
                        lastname : transfer.reciever.lastname,
                        firstname: transfer.reciever.firstname
                    },
                    isCanceled: !!transfer.deleted_at
                }));

            history = history
                .concat(transfersTo)
                .sort((a, b) => b.date - a.date);

            // Offset
            if (req.query.offset) {
                history = history.slice(req.query.offset);
            }

            // Limit
            if (req.query.limit) {
                history = history.slice(0, req.query.limit);
            }

            res
                .status(200)
                .json({
                    credit: req.history.credit,
                    history
                })
                .end();
        });
});

module.exports = router;
