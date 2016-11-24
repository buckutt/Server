const express = require('express');
const thinky  = require('../../../lib/thinky');

/**
 * SearchUser controller.
 */
const router = new express.Router();

router.get('/services/manager/searchuser', (req, res) => {
    const models = req.app.locals.models;
    const r      = thinky.r;
    const name   = req.query.name.split(' ');

    models.User
        .filter(doc =>
             name
                .map(partName => r.or(
                    doc('firstname').match(`(?i).*${partName}.*`),
                    doc('lastname').match(`(?i).*${partName}.*`)
                ))
                .reduce((a, b) => a || b)
        )
        .filter(r.row('isRemoved').eq(false))
        .run()
        .then((users) => {
            const cleanedUsers = users.map(user => ({
                id       : user.id,
                firstname: user.firstname,
                lastname : user.lastname
            }));

            res
                .status(200)
                .json(cleanedUsers)
                .end();
        });
});

module.exports = router;
