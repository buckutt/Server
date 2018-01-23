exports.up = function (knex) {
    return knex.schema
        .createTable('transactions', (t) => {
            t.uuid('id').primary();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.uuid('user_id').references('users.id');
            t.integer('amount').notNullable();
            t.string('transactionId');
            t.string('state').notNullable();
            t.string('longState');
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('transactions');
};
