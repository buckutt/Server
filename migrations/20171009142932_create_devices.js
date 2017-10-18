exports.up = function (knex) {
    return knex.schema
        .createTable('devices', (t) => {
            t.uuid('id').primary();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.string('name').notNullable();
            t.string('fingerprint').nullable().unique();
            t.boolean('doubleValidation').notNullable().defaultTo(false);
            t.boolean('alcohol').notNullable().defaultTo(false);
            t.boolean('showPicture').notNullable().defaultTo(false);

            t.unique(['name', 'active']);
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('devices');
};
