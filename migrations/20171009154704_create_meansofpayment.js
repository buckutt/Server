exports.up = function (knex) {
    return knex.schema
        .createTable('meansofpayment', (t) => {
            t.uuid('id').primary();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.string('name').notNullable();
            t.string('slug').notNullable();
            t.integer('step').notNullable().defaultTo(100);

            t.unique(['name', 'active']);
            t.unique(['slug', 'active']);
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('meansofpayment');
};
