exports.up = function (knex) {
    return knex.schema
        .createTable('pendingCardUpdates', (t) => {
            t.uuid('id').primary();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.uuid('user_id').references('users.id');
            t.integer('amount').notNullable().defaultTo(0);
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('pendingCardUpdates');
};
