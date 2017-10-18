exports.up = function (knex) {
    return knex.schema
        .table('devices', (t) => {
            t.uuid('defaultGroup_id').references('groups.id');
        })
        .table('wikets', (t) => {
            t.uuid('device_id').references('devices.id');
            t.uuid('point_id').references('points.id');
            t.uuid('period_id').references('periods.id');
        })
        .table('events', (t) => {
            t.uuid('defaultGroup_id').references('groups.id');
            t.uuid('defaultFundation_id').references('fundations.id');
            t.uuid('defaultPeriod_id').references('periods.id');
        })
        .table('memberships', (t) => {
            t.uuid('user_id').references('users.id');
            t.uuid('group_id').references('groups.id');
            t.uuid('period_id').references('periods.id');
        })
        .table('meansoflogin', (t) => {
            t.uuid('user_id').references('users.id');
        })
        .table('periods', (t) => {
            t.uuid('event_id').references('events.id');
        })
        .table('prices', (t) => {
            t.uuid('article_id').references('articles.id');
            t.uuid('fundation_id').references('fundations.id');
            t.uuid('group_id').references('groups.id');
            t.uuid('period_id').references('periods.id');
            t.uuid('point_id').references('points.id');
            t.uuid('promotion_id').references('promotions.id');
        })
        .table('purchases', (t) => {
            t.uuid('price_id').references('prices.id');
            t.uuid('point_id').references('points.id');
            t.uuid('promotion_id').references('promotions.id');
            t.uuid('buyer_id').references('users.id');
            t.uuid('seller_id').references('users.id');
        })
        .table('refunds', (t) => {
            t.uuid('buyer_id').references('users.id');
            t.uuid('seller_id').references('users.id');
        })
        .table('reloads', (t) => {
            t.uuid('point_id').references('points.id');
            t.uuid('buyer_id').references('users.id');
            t.uuid('seller_id').references('users.id');
        })
        .table('rights', (t) => {
            t.uuid('point_id').references('points.id');
            t.uuid('period_id').references('periods.id');
            t.uuid('user_id').references('users.id');
        })
        .table('transfers', (t) => {
            t.uuid('sender_id').references('users.id');
            t.uuid('reciever_id').references('users.id');
        });
};

exports.down = function (knex) {
    return knex.schema
        .table('devices', (t) => {
            t.dropForeign('defaultGroup_id');
            t.dropColumn('defaultGroup_id');
        })
        .table('wikets', (t) => {
            t.dropForeign('device_id');
            t.dropForeign('point_id');
            t.dropForeign('period_id');
            t.dropColumn('device_id');
            t.dropColumn('point_id');
            t.dropColumn('period_id');
        })
        .table('events', (t) => {
            t.dropForeign('defaultGroup_id');
            t.dropForeign('defaultFundation_id');
            t.dropForeign('defaultPeriod_id');
            t.dropColumn('defaultGroup_id');
            t.dropColumn('defaultFundation_id');
            t.dropColumn('defaultPeriod_id');
        })
        .table('memberships', (t) => {
            t.dropForeign('user_id');
            t.dropForeign('group_id');
            t.dropForeign('defaultPeriod_id');
            t.dropColumn('period_id');
            t.dropColumn('group_id');
            t.dropColumn('period_id');
        })
        .table('meansoflogin', (t) => {
            t.dropForeign('user_id');
            t.dropColumn('user_id');
        })
        .table('periods', (t) => {
            t.dropForeign('event_id');
            t.dropColumn('event_id');
        })
        .table('prices', (t) => {
            t.dropForeign('article_id');
            t.dropForeign('fundation_id');
            t.dropForeign('group_id');
            t.dropForeign('period_id');
            t.dropForeign('point_id');
            t.dropForeign('promotion_id');
            t.dropColumn('article_id');
            t.dropColumn('fundation_id');
            t.dropColumn('group_id');
            t.dropColumn('period_id');
            t.dropColumn('point_id');
            t.dropColumn('promotion_id');
        })
        .table('purchases', (t) => {
            t.dropForeign('price_id');
            t.dropForeign('point_id');
            t.dropForeign('promotion_id');
            t.dropForeign('buyer_id');
            t.dropForeign('seller_id');
            t.dropColumn('price_id');
            t.dropColumn('point_id');
            t.dropColumn('promotion_id');
            t.dropColumn('buyer_id');
            t.dropColumn('seller_id');
        })
        .table('refunds', (t) => {
            t.dropForeign('buyer_id');
            t.dropForeign('seller_id');
            t.dropColumn('buyer_id');
            t.dropColumn('seller_id');
        })
        .table('reloads', (t) => {
            t.dropForeign('point_id');
            t.dropForeign('buyer_id');
            t.dropForeign('seller_id');
            t.dropColumn('point_id');
            t.dropColumn('buyer_id');
            t.dropColumn('seller_id');
        })
        .table('rights', (t) => {
            t.dropForeign('point_id');
            t.dropForeign('period_id');
            t.dropForeign('user_id');
            t.dropColumn('point_id');
            t.dropColumn('period_id');
            t.dropColumn('user_id');
        })
        .table('transfers', (t) => {
            t.dropForeign('sender_id');
            t.dropForeign('reciever_id');
            t.dropColumn('sender_id');
            t.dropColumn('reciever_id');
        });
};
