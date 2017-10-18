exports.up = function (knex) {
    return knex.schema
        .createTable('transfers', (t) => {
            t.uuid('id').primary();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.integer('amount').notNullable();
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('transfers');
};
