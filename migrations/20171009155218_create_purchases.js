exports.up = function (knex) {
    return knex.schema
        .createTable('purchases', (t) => {
            t.uuid('id').primary();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.integer('vat').notNullable().defaultTo(0);
            t.integer('alcohol').notNullable().defaultTo(0);
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('purchases');
};
