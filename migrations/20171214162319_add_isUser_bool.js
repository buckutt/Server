exports.up = function(knex) {
    return knex.schema.table('devices', (t) => {
        t.boolean('isUser').notNullable().defaultTo(false);
    });
};

exports.down = function(knex) {
    return knex.schema.table('devices', (t) => {
        t.dropColumn('isUser');
    });
};
