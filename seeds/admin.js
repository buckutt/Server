const uuid = require('uuid').v4;

const { user_id, period_id, item } = require('./utils/_data');

exports.seed = function (knex) {
    return knex('users').del()
        .then(() => knex('meansoflogin').del())
        .then(() => knex('rights').del())
        .then(() =>
            knex('users').insert([
                item({
                    id         : user_id,
                    firstname  : 'Admin',
                    lastname   : 'Admin',
                    nickname   : 'Admin',
                    pin        : '$2a$12$zkBo1ZCnnRuGYo6TC7fpgOYb8zACrnSJSTUrFdrPwMKQ/1s4xOauO',
                    password   : '$2a$12$wPVfP2StwfdJ.IfPVdXfZOGCiDvQDYRnTrLzrtE8gDP1mEmrS0lj6',
                    mail       : 'admin@buckless.com',
                    credit     : 0,
                    isTemporary: false
                })
            ])
        )
        .then(() => {
            knex('meansoflogin').insert([
                item({
                    id     : uuid(),
                    type   : 'etuMail',
                    data   : 'admin@buckless.com',
                    blocked: false,
                    user_id
                })
            ]);
        })
        .then(() => {
            knex('rights').insert([
                item({
                    id  : uuid(),
                    name: 'admin',
                    user_id,
                    period_id
                })
            ]);
        });
};
