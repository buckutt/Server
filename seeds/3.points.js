const uuid = require('uuid').v4;

const { item } = require('./utils/_data');

exports.seed = function (knex) {
    return knex('points').del()
        .then(() =>
            knex('points').insert([
                item({ id: uuid(), name: 'Internet' })
            ])
        );
};
