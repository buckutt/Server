const bcrypt_  = require('bcryptjs');
const express  = require('express');
const Promise  = require('bluebird');
const APIError = require('../../../errors/APIError');
const thinky   = require('../../../lib/thinky');

/**
 * ChangePin controller.
 */
const bcrypt = Promise.promisifyAll(bcrypt_);
const router = new express.Router();

router.put('/services/manager/changepin', (req, res, next) => {
    const models = req.app.locals.models;

    if (req.body.currentPin.length !== 4) {
        next(new APIError(401, 'Current PIN has to be clear, not crypted'));
    }

    bcrypt.compareAsync(req.body.currentPin.toString(), req.user.pin)
        .then(match =>
            new Promise((resolve, reject) => {
                if (match) {
                    return resolve();
                }

                reject(new APIError(401, 'PIN is wrong'));
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
        .then(() => {
            const confirm = {
                changed: true
            };

            return res
                .status(200)
                .json(confirm)
                .end();
        })
        .catch(Error, err => next(err))
        .catch(thinky.Errors.InvalidWrite, (err) => {
            /* istanbul ignore next */
            next(new APIError(500, 'Couldn\'t write to disk', err));
        })
        .catch((err) => {
            /* istanbul ignore next */
            next(new APIError(500, 'Unknown error', err));
        });
});

module.exports = router;
