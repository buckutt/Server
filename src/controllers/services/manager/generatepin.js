const bcrypt_  = require('bcryptjs');
const express  = require('express');
const Promise  = require('bluebird');
const APIError = require('../../../errors/APIError');
const dbCatch  = require('../../../lib/dbCatch');
const logger   = require('../../../lib/log');

const log = logger(module);

/**
 * GeneratePin controller.
 */
const bcrypt = Promise.promisifyAll(bcrypt_);
const router = new express.Router();


router.put('/services/manager/generatepin', (req, res, next) => {
    log.info(`Generate pin with key ${req.body.key}`, req.details);

    if (!req.body.pin) {
        return next(new APIError(module, 401, 'PIN is missing'));
    }

    if (req.body.pin.length !== 4) {
        next(new APIError(module, 401, 'PIN has to be clear, not crypted'));
    }

    if (!req.body.key) {
        return next(new APIError(module, 401, 'Key is missing'));
    }

    const models     = req.app.locals.models;
    const recoverKey = req.body.key;

    let user;

    models.User
        .where({ recoverKey })
        .fetch()
        .then((user_) => {
            user = user_;

            if (!user) {
                return Promise.reject(new APIError(module, 401, 'Invalid key'));
            }

            return bcrypt.hash(req.body.pin, 10);
        })
        .then((hash) => {
            user.set('pin', hash);
            user.set('recoverKey', '');
            user.set('updated_at', new Date());

            return user.save();
        })
        .then(() => res.status(200).json({ success: true }).end())
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
