exports.up = function (knex) {
    return knex.schema
        .createTable('points', (t) => {
            t.uuid('id').primary();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.string('name').notNullable();

            t.unique(['name', 'active']);
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('points');
};
