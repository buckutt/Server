const express       = require('express');
const leven         = require('leven');
const { bookshelf } = require('../../../lib/bookshelf');
const rightsDetails = require('../../../lib/rightsDetails');
const logger        = require('../../../lib/log');

const log = logger(module);

/**
 * SearchUser controller.
 */
const router = new express.Router();

router.get('/services/manager/searchuser', (req, res) => {
    log.info(`Search user ${req.query.name}`, req.details);

    const models     = req.app.locals.models;
    const name       = req.query.name;
    const userRights = rightsDetails(req.user, req.point.id);
    let query        = req.query.limit;

    if (!userRights.admin) {
        query = Number.isNaN(parseInt(query, 10)) ? 15 : Math.min(query, 15);
    }

    models.User
        .query(user => {
            let filter = user
                .where(
                    bookshelf.knex.raw('concat(lower(firstname), \' \', lower(lastname))'),
                    'like',
                    `%${name.toLowerCase()}%`
                )

            if (query > 0) {
                filter = filter.limit(req.query.limit);
            }

            return filter;
        })
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
