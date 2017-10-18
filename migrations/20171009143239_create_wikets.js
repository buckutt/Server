exports.up = function (knex) {
    return knex.schema
        .createTable('wikets', (t) => {
            t.uuid('id').primary();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('wikets');
};
