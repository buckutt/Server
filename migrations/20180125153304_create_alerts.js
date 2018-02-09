exports.up = function (knex) {
    return knex.schema
        .createTable('alerts', (t) => {
            t.uuid('id').primary();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.uuid('event_id').references('events.id');
            t.text('content').notNullable();
            t.integer('minimumViewTime').notNullable().defaultTo(5);
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('alerts');
};
