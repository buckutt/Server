exports.up = function (knex) {
    return knex.schema
        .createTable('reloads', (t) => {
            t.uuid('id').primary();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.integer('credit').notNullable();
            t.string('type').notNullable();
            t.string('trace').notNullable();
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('reloads');
};
