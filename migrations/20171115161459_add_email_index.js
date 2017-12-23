exports.up = function(knex) {
    return knex.raw('CREATE INDEX lower_case_data ON meansoflogin(lower(data))')
        .then(() => knex.raw('CREATE INDEX lower_case_mail ON users(lower(mail))'))
};

exports.down = function(knex) {
    return knex.schema
        .table('meansoflogin', (t) => {
            t.dropIndex('lower_case_data');
        })
        .table('users', (t) => {
            t.dropIndex('lower_case_mail');
        });
};
