const express     = require('express');
const { flatten } = require('lodash');
const logger      = require('../../../lib/log');

const log = logger(module);

/**
 * History controller.
 */
const router = new express.Router();

router.get('/services/manager/history', (req, res) => {
    log.info(`Get history for user ${req.user.id}`, req.details);

    const models = req.app.locals.models;

    // TODO: optimize filters
    const purchaseQuery = () => models.Purchase
        .where({ buyer_id: req.user.id })
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
        .where({ buyer_id: req.user.id })
        .fetchAll({
            withRelated: [
                'seller',
                'point'
            ]
        });

    const refundQuery = () => models.Refund
        .where({ buyer_id: req.user.id })
        .fetchAll({
            withRelated: [
                'seller'
            ]
        });

    const transferFromQuery = () => models.Transfer
        .where({ reciever_id: req.user.id })
        .fetchAll({
            withRelated: [
                'sender'
            ]
        });

    const transferToQuery = () => models.Transfer
        .where({ sender_id: req.user.id })
        .fetchAll({
            withRelated: [
                'reciever'
            ]
        });

    let history = [];

    purchaseQuery()
        .then((result) => {
            history = result
                .toJSON()
                .filter(p => !p.deleted_at)
                .map(purchase => ({
                    type  : purchase.price.promotion ? 'promotion' : 'purchase',
                    date  : purchase.created_at,
                    amount: -1 * purchase.price.amount,
                    point : purchase.point.name,
                    seller: {
                        lastname : purchase.seller.lastname,
                        firstname: purchase.seller.firstname
                    },
                    articles: flatten(
                        purchase.articles.map(article =>
                            Array(article._pivot_count).fill(article.name)
                        )
                    ),
                    promotion: purchase.price.promotion ? purchase.price.promotion.name : ''
                }));

            return reloadQuery();
        })
        .then((result) => {
            const reloads = result.toJSON().map(reload =>
                ({
                    type  : 'reload',
                    date  : reload.created_at,
                    amount: reload.credit,
                    point : reload.point.name,
                    mop   : reload.type,
                    seller: {
                        lastname : reload.seller.lastname,
                        firstname: reload.seller.firstname
                    }
                })
            );

            history = history.concat(reloads);

            return refundQuery();
        })
        .then((result) => {
            const refunds = result.toJSON().map(refund =>
                ({
                    type  : 'refund',
                    date  : refund.created_at,
                    amount: -1 * refund.amount,
                    point : 'Internet',
                    mop   : refund.type,
                    seller: {
                        lastname : refund.seller.lastname,
                        firstname: refund.seller.firstname
                    }
                })
            );

            history = history.concat(refunds);

            return transferFromQuery();
        })
        .then((result) => {
            const transfersFrom = result.toJSON().map(transfer =>
                ({
                    type  : 'transfer',
                    date  : transfer.created_at,
                    amount: transfer.amount,
                    point : 'Internet',
                    mop   : '',
                    seller: {
                        lastname : transfer.sender.lastname,
                        firstname: transfer.sender.firstname
                    }
                })
            );

            history = history.concat(transfersFrom);

            return transferToQuery();
        })
        .then((result) => {
            const transfersTo = result.toJSON().map(transfer =>
                ({
                    type  : 'transfer',
                    date  : transfer.created_at,
                    amount: -1 * transfer.amount,
                    point : 'Internet',
                    mop   : '',
                    seller: {
                        lastname : transfer.reciever.lastname,
                        firstname: transfer.reciever.firstname
                    }
                })
            );

            history = history
                .concat(transfersTo)
                .sort((a, b) => b.date - a.date);

            res
                .status(200)
                .json(history)
                .end();
        });
});

module.exports = router;
