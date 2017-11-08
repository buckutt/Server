const uuid = require('uuid').v4;

const { item } = require('./utils/_data');

exports.seed = function (knex) {
    return knex('meansofpayment').del()
        .then(() =>
            knex('meansofpayment').insert([
                item({ id: uuid(), slug: 'card', name: 'Carte' }),
                item({ id: uuid(), slug: 'cash', name: 'Liquide' }),
                item({ id: uuid(), slug: 'check', name: 'Chèque' }),
                item({ id: uuid(), slug: 'gift', name: 'Offert' })
            ])
        );
};
