const express       = require('express');
const leven         = require('leven');
const { bookshelf } = require('../../../lib/bookshelf');
const logger        = require('../../../lib/log');

const log = logger(module);

/**
 * SearchUser controller.
 */
const router = new express.Router();

router.get('/services/manager/searchuser', (req, res) => {
    log.info(`Search user ${req.query.name}`, req.details);

    const models = req.app.locals.models;
    const name   = req.query.name;

    models.User
        .query(user =>
            user.where(
                bookshelf.knex.raw('concat(lower(firstname), \' \', lower(lastname))'),
                'like',
                `%${name.toLowerCase()}%`
            )
        )
        .fetchAll()
        .then((users) => {
            const cleanedUsers = users.toJSON()
                .map(user => ({
                    id       : user.id,
                    firstname: user.firstname,
                    lastname : user.lastname
                }))
                .sort((a, b) => {
                    const aName = `${a.firstname} ${a.lastname}`;
                    const bName = `${b.firstname} ${b.lastname}`;

                    return leven(name, bName) - leven(name, aName);
                });

            res
                .status(200)
                .json(cleanedUsers)
                .end();
        });
});

module.exports = router;
