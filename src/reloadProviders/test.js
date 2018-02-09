const uuid     = require('uuid');
const { knex } = require('../lib/bookshelf');
const config   = require('../../config');

module.exports = (app) => {
    const Transaction       = app.locals.models.Transaction;
    const Reload            = app.locals.models.Reload;
    const PendingCardUpdate = app.locals.models.PendingCardUpdate;

    const validatePayment = (id, data) => Transaction
        .where({ id })
        .fetch()
        .then((transaction) => {
            transaction.set('transactionId', uuid());
            transaction.set('state', 'ACCEPTED');

            if (transaction.get('state') === 'ACCEPTED') {
                const userCredit = knex('users')
                    .where({ id: transaction.get('user_id') })
                    .increment('credit', transaction.get('amount'))
                    .returning('credit');

                const newReload = new Reload({
                    credit   : transaction.get('amount'),
                    type     : 'card',
                    trace    : transaction.get('id'),
                    point_id : data.point,
                    buyer_id : transaction.get('user_id'),
                    seller_id: transaction.get('user_id')
                });

                const pendingCardUpdate = new PendingCardUpdate({
                    user_id: transaction.get('user_id'),
                    amount : -1 * transaction.get('amount')
                });

                return Promise
                    .all([userCredit, newReload.save(), transaction.save(), pendingCardUpdate.save()])
                    .then((res) => {
                        // First [0] : userCredit promise
                        // Second [0] : returning credit column
                        const newUserCredit = res[0][0];

                        app.locals.modelChanges.emit('userCreditUpdate', {
                            id    : transaction.get('user_id'),
                            credit: newUserCredit
                        });
                    });
            }

            return transaction.save();
        });

    app.locals.makePayment = (data) => {
        const transaction = new Transaction({
            state  : 'pending',
            amount : data.amount,
            user_id: data.buyer.id
        });

        return transaction
            .save()
            .then(() => {
                setTimeout(() => validatePayment(transaction.get('id'), data), 1000);

                return {
                    type: 'url',
                    res : `${config.urls.managerUrl}/#/reload/success`
                };
            });
    };
};
