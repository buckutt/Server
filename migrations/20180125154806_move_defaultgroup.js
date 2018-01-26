exports.up = function(knex) {
    return knex.schema
        .table('devices', (t) => {
            t.dropForeign('defaultGroup_id');
            t.dropColumn('defaultGroup_id');
        })
        .table('points', (t) => {
            t.uuid('defaultGroup_id').references('groups.id');
        })
        .table('wikets', (t) => {
            t.uuid('defaultGroup_id').references('groups.id');
        });
};

exports.down = function(knex) {
    return knex.schema
        .table('devices', (t) => {
            t.uuid('defaultGroup_id').references('groups.id');
        })
        .table('points', (t) => {
            t.dropForeign('defaultGroup_id');
            t.dropColumn('defaultGroup_id');
        })
        .table('wikets', (t) => {
            t.dropForeign('defaultGroup_id');
            t.dropColumn('defaultGroup_id');
        });
};
