const { event_id, item } = require('./utils/_data');

exports.seed = function (knex) {
    return knex('events').del()
        .then(() =>
            knex('events').insert([
                item({
                    id           : event_id,
                    name         : 'Défaut',
                    minReload    : 100,
                    maxPerAccount: 10000
                })
            ])
        );
};
