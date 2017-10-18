exports.up = function (knex) {
    return knex.schema
        .createTable('users', (t) => {
            t.uuid('id').primary();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.string('firstname').notNullable();
            t.string('lastname').notNullable();
            t.string('nickname').notNullable().defaultTo('');
            t.string('pin').notNullable();
            t.string('password').notNullable();
            t.string('recoverKey');
            t.string('mail').notNullable();
            t.integer('credit').notNullable().defaultTo(0);
            t.boolean('isTemporary').notNullable().defaultTo(false);
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('users');
};
