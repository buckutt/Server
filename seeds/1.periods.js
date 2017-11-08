const { event_id, period_id, item } = require('./utils/_data');

exports.seed = function (knex) {
    return knex('periods').del()
        .then(() =>
            knex('periods').insert([
                item({
                    id   : period_id,
                    name : 'Défaut',
                    start: new Date(0),
                    end  : new Date(21474000000000),
                    event_id
                })
            ])
        )
        .then(() =>
            knex('events')
                .where('id', event_id)
                .update({
                    defaultPeriod_id: period_id
                })
        );
};
