const express  = require('express');
const Promise  = require('bluebird');
const APIError = require('../../../errors/APIError');
const dbCatch  = require('../../../lib/dbCatch');
const logger   = require('../../../lib/log');

const log = logger(module);

/**
 * GeneratePin controller.
 */
const router = new express.Router();


router.put('/services/manager/generatepin', (req, res, next) => {
    log.info(`Generate pin with key ${req.body.key}`, req.details);

    if (!req.body.pin) {
        return next(new APIError(module, 401, 'PIN is missing'));
    }

    if (!req.body.key) {
        return next(new APIError(module, 401, 'Key is missing'));
    }

    const models     = req.app.locals.models;
    const recoverKey = req.body.key;

    let user;

    models.User.getAll(recoverKey, { index: 'recoverKey' })
        .then((users) => {
            if (!users.length) {
                return Promise.reject(new APIError(module, 401, 'Invalid key'));
            }

            user            = users[0];
            user.pin        = req.body.pin;
            user.recoverKey = '';

            return user.save();
        })
        .then(() => res.status(200).json({ success: true }).end())
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
