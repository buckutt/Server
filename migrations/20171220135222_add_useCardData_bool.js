exports.up = function(knex) {
    return knex.schema.table('events', (t) => {
        t.boolean('useCardData').notNullable().defaultTo(true);
    });
};

exports.down = function(knex) {
    return knex.schema.table('events', (t) => {
        t.dropColumn('useCardData');
    });
};
