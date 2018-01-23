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
            transaction.transactionId = uuid();
            transaction.state         = 'ACCEPTED';

            if (transaction.state === 'ACCEPTED') {
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
        });

    app.locals.makePayment = (data) => {
        const transaction = new Transaction({
            state  : 'pending',
            user_id: data.buyer.id
        });

        return transaction
            .save()
            .then(() => {
                setTimeout(() => validatePayment(transaction.id), 1000);

                return {
                    type: 'url',
                    res : 'https://buckless.com'
                };
            });
    };
};
