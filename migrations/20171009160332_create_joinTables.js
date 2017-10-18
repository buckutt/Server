exports.up = function (knex) {
    return knex.schema
        .createTable('articles_categories', (t) => {
            t.increments();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.uuid('article_id').references('id').inTable('articles');
            t.uuid('category_id').references('id').inTable('categories');
        })
        .createTable('articles_sets', (t) => {
            t.increments();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.uuid('article_id').references('id').inTable('articles');
            t.uuid('set_id').references('id').inTable('sets');
        })
        .createTable('articles_purchases', (t) => {
            t.increments();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();
            t.integer('count').defaultTo(1);

            t.uuid('article_id').references('id').inTable('articles');
            t.uuid('purchase_id').references('id').inTable('purchases');
        })
        .createTable('categories_points', (t) => {
            t.increments();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.uuid('category_id').references('id').inTable('categories');
            t.uuid('point_id').references('id').inTable('points');
        })
        .createTable('promotions_sets', (t) => {
            t.increments();
            t.timestamps(false, true);
            t.dateTime('deleted_at').nullable();
            t.boolean('active').nullable();

            t.uuid('promotion_id').references('id').inTable('promotions');
            t.uuid('set_id').references('id').inTable('sets');
        });
};

exports.down = function (knex) {
    return knex.schema.dropTable('articles_categories')
        .dropTable('articles_sets')
        .dropTable('articles_purchases')
        .dropTable('categories_points')
        .dropTable('promotions_sets');
};
