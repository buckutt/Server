const express  = require('express');

/**
 * History controller.
 */
const router = new express.Router();

router.get('/services/manager/history', (req, res) => {
    const models = req.app.locals.models;

    // TODO: optimize filters
    const purchaseQuery = models.Purchase
        .filter({
            Buyer_id : req.user.id,
            isRemoved: false
        })
        .embed({
            seller   : true,
            price    : true,
            articles : true,
            promotion: true,
            point    : true
        });

    const reloadQuery = models.Reload
        .filter({
            Buyer_id : req.user.id,
            isRemoved: false
        })
        .embed({
            seller: true,
            point : true
        });

    const transferFromQuery = models.Transfer
        .filter({
            Reciever_id: req.user.id,
            isRemoved  : false
        })
        .embed({
            sender: true
        });

    const transferToQuery = models.Transfer
        .filter({
            Sender_id: req.user.id,
            isRemoved: false
        })
        .embed({
            reciever: true
        });

    let history = [];

    purchaseQuery.run()
        .then((result) => {
            history = result.map(purchase =>
                 ({
                     type  : purchase.promotion ? 'promotion' : 'purchase',
                     date  : purchase.createdAt,
                     amount: -1 * purchase.price.amount,
                     point : purchase.point.name,
                     seller: {
                         lastname : purchase.seller.lastname,
                         firstname: purchase.seller.firstname
                     },
                     articles : purchase.articles.map(article => article.name),
                     promotion: purchase.promotion ? purchase.promotion.name : ''
                 })
            );

            return reloadQuery.run();
        })
        .then((result) => {
            const reloads = result.map(reload =>
                 ({
                     type  : 'reload',
                     date  : reload.createdAt,
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

            return transferFromQuery.run();
        })
        .then((result) => {
            const transfersFrom = result.map(transfer =>
                 ({
                     type  : 'transfer',
                     date  : transfer.createdAt,
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

            return transferToQuery.run();
        })
        .then((result) => {
            const transfersTo = result.map(transfer =>
                 ({
                     type  : 'transfer',
                     date  : transfer.createdAt,
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
