const express  = require('express');
const dbCatch  = require('../lib/dbCatch');
const { knex } = require('../lib/bookshelf');
const config   = require('../../config');

const providerConfig = config.provider.config;

module.exports = (app) => {
    const Transaction = app.locals.models.Transaction;
    const User        = app.locals.models.User;
    const Reload      = app.locals.models.Reload;
    const etupay      = require('node-etupay')(providerConfig);
    const Basket      = etupay.Basket;

    app.locals.makePayment = (data) => {
        console.log(data);

        const transaction = new Transaction({
            state  : 'pending',
            amount : data.amount,
            user_id: data.buyer.id
        });

        return transaction
            .save()
            .then(() => {
                const basket = new Basket(
                    `Rechargement ${providerConfig.merchantName}`,
                    data.buyer.firstname,
                    data.buyer.lastname,
                    data.buyer.email,
                    'checkout',
                    transaction.id
                );

                basket.addItem('Rechargement', data.amount, 1);

                return {
                    type: 'url',
                    res : basket.compute()
                };
            });
    };

    const router = new express.Router();

    router.post('/callback', etupay.router, (req, res, next) => Transaction
        .where({ id: req.etupay.serviceData })
        .fetch()
        .then((transaction) => {
            transaction.transactionId = req.etupay.transactionId;
            transaction.state         = req.etupay.step;

            if (req.etupay.paid) {
                const credit = knex.raw(`credit + ${transaction.amount}`);

                const userCredit = new User({ id: transaction.user_id })
                    .save({ credit }, { patch: true });

                const newReload = new Reload({
                    credit: transaction.amount,
                    type  : 'card-online',
                    trace : transaction.id
                })
                    .save();

                return Promise.all([userCredit, newReload, transaction.save()]);
            }

            return transaction.save();
        })
        .then(() => res.status(200).json({}).end())
        .catch(err => dbCatch(module, err, next)));

    app.use('/provider', router);
};
