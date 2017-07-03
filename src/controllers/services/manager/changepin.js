const bcrypt_  = require('bcryptjs');
const express  = require('express');
const Promise  = require('bluebird');
const APIError = require('../../../errors/APIError');
const dbCatch  = require('../../../lib/dbCatch');
const logger   = require('../../../lib/log');

const log = logger(module);

/**
 * ChangePin controller.
 */
const bcrypt = Promise.promisifyAll(bcrypt_);
const router = new express.Router();

router.put('/services/manager/changepin', (req, res, next) => {
    log.info(`Change pin for user ${req.user.id}`, req.details);

    const models = req.app.locals.models;

    if (req.body.currentPin.length !== 4) {
        next(new APIError(module, 401, 'Current PIN has to be clear, not crypted'));
    }

    bcrypt.compareAsync(req.body.currentPin.toString(), req.user.pin)
        .then(match =>
            new Promise((resolve, reject) => {
                if (match) {
                    return resolve();
                }

                reject(new APIError(module, 401, 'PIN is wrong'));
            })
        )
        .then(() =>
            models.User
               .get(req.user.id)
               .run()
        )
        .then((user) => {
            user.pin = req.body.pin;

            return user.save();
        })
        .then(() =>
            res
                .status(200)
                .json({ changed: true })
                .end()
        )
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
