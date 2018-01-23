const uuid     = require('uuid');
const { knex } = require('../lib/bookshelf');

module.exports = (app) => {
    const Transaction = app.locals.models.Transaction;
    const User        = app.locals.models.User;
    const Reload      = app.locals.models.Reload;

    const validatePayment = id => Transaction
        .where({ id })
        .fetch()
        .then((transaction) => {
            transaction.set('transactionId', uuid());
            transaction.set('state', 'ACCEPTED');

            if (transaction.get('state') === 'ACCEPTED') {
                const credit = knex.raw(`credit + ${transaction.get('amount')}`);

                const userCredit = User
                    .forge()
                    .where({ id: transaction.get('user_id') })
                    .save({ credit }, { method: 'update' });

                const newReload = new Reload({
                    credit: transaction.get('amount'),
                    type  : 'card-online',
                    trace : transaction.get('id')
                })
                    .save();

                return Promise.all([userCredit, newReload, transaction.save()]);
            }

            return transaction.save();
        });

    app.locals.makePayment = (data) => {
        const transaction = new Transaction({
            state  : 'pending',
            user_id: data.buyer.id
        });

        return transaction
            .save()
            .then(() => {
                setTimeout(() => validatePayment(transaction.get('id')), 1000);

                return {
                    type: 'url',
                    res : 'https://buckless.com'
                };
            });
    };
};
