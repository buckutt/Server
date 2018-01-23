exports.up = function (knex) {
    return knex.schema
        .createTable('webservices', (t) => {
            t.uuid('id').primary();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.string('url').notNullable();
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('webservices');
};
