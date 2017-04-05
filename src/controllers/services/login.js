const bcrypt_         = require('bcryptjs');
const express         = require('express');
const jwt             = require('jsonwebtoken');
const Promise         = require('bluebird');
const config          = require('../../../config');
const logger          = require('../../lib/log');
const thinky          = require('../../lib/thinky');
const { pp }          = require('../../lib/utils');
const canSellOrReload = require('../../lib/canSellOrReload');
const APIError        = require('../../errors/APIError');

const bcrypt = Promise.promisifyAll(bcrypt_);
const log    = logger(module);

/**
 * Login controller. Connects a user
 */
const router = new express.Router();

const tokenOptions = {
    expiresIn: '1m' // 1 month token
};

router.post('/services/login', (req, res, next) => {
    const secret = config.app.secret;
    const models = req.app.locals.models;

    if (!req.body.meanOfLogin) {
        return next(new APIError(401, 'No meanOfLogin provided'));
    }

    if (!req.body.data) {
        return next(new APIError(401, 'No (meanOfLogin) data provided'));
    }

    if (!req.body.password && !req.body.pin) {
        return next(new APIError(401, 'No password nor pin provided'));
    }

    if (req.body.password && req.body.pin) {
        return next(new APIError(401, 'Password and pin provided'));
    }

    const connectType = (req.body.hasOwnProperty('pin')) ? 'pin' : 'password';
    let user;

    const queryLog = `${models.MeanOfLogin}
        .filter({
            type     : ${req.body.meanOfLogin},
            data     : ${req.body.data},
            isRemoved: false,
            blocked  : false
        })
        .limit(1).getJoin(${pp({
            user: {
                rights: {
                    period: true
                }
            }
        })})`;
    log.info(queryLog);

    models.MeanOfLogin
        .filter({
            type     : req.body.meanOfLogin.toString(),
            data     : req.body.data.toString(),
            isRemoved: false,
            blocked  : false
        })
        .limit(1)
        .getJoin({
            user: {
                rights: {
                    period: true
                }
            }
        })
        .then((mol) => {
            if (mol.length === 0) {
                const errDetails = {
                    mol  : req.body.meanOfLogin.toString(),
                    point: req.Point_id
                };

                return next(new APIError(404, 'User not found', errDetails));
            }

            user = mol[0].user;

            if (connectType === 'pin') {
                return bcrypt.compareAsync(req.body.pin.toString(), user.pin);
            }

            return bcrypt.compareAsync(req.body.password, user.password);
        })
        .then(match =>
            new Promise((resolve, reject) => {
                if (match) {
                    return resolve();
                }

                const errDetails = {
                    mol  : req.body.meanOfLogin.toString(),
                    point: req.Point_id
                };

                reject(new APIError(401, 'User not found', errDetails));
            })
        )
        .then(() => {
            delete user.pin;
            delete user.password;

            const userRights = canSellOrReload(user);

            user.canSell   = userRights.canSell;
            user.canReload = userRights.canReload;

            return res
                .status(200)
                .json({
                    user,
                    token: jwt.sign({
                        id: user.id,
                        // Will be used by middleware (else how could middleware know if pin or password ?)
                        connectType
                    }, secret, tokenOptions)
                })
                .end();
        })
        .catch(Error, err => next(err))
        .catch(thinky.Errors.DocumentNotFound, (err) => {
            /* istanbul ignore next */
            next(new APIError(404, 'User not found', err));
        })
        .catch((err) => {
            /* istanbul ignore next */
            next(new APIError(500, 'Unknown error', err));
        });
});

module.exports = router;
