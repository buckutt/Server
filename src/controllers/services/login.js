const bcrypt_         = require('bcryptjs');
const express         = require('express');
const jwt             = require('jsonwebtoken');
const Promise         = require('bluebird');
const config          = require('../../../config');
const logger          = require('../../lib/log');
const canSellOrReload = require('../../lib/canSellOrReload');
const dbCatch         = require('../../lib/dbCatch');
const APIError        = require('../../errors/APIError');

const log = logger(module);

const bcrypt = Promise.promisifyAll(bcrypt_);

/**
 * Login controller. Connects a user
 */
const router = new express.Router();

const tokenOptions = {
    expiresIn: '30d' // 30 days token
};

router.post('/services/login', (req, res, next) => {
    const secret = config.app.secret;
    const models = req.app.locals.models;

    if (!req.body.meanOfLogin) {
        return next(new APIError(module, 401, 'No meanOfLogin provided'));
    }

    if (!req.body.data) {
        return next(new APIError(module, 401, 'No (meanOfLogin) data provided'));
    }

    if (!req.body.password && !req.body.pin) {
        return next(new APIError(module, 401, 'No password nor pin provided'));
    }

    if (req.body.password && req.body.pin) {
        return next(new APIError(module, 401, 'Password and pin provided'));
    }

    const connectType = (req.body.hasOwnProperty('pin')) ? 'pin' : 'password';
    let user;

    const infos = { type: req.body.meanOfLogin.toString(), data: req.body.data.toString() };
    log.info(`Login with mol ${infos.type}(${infos.data})`, infos);

    models.MeanOfLogin
        .where({
            type   : infos.type,
            data   : infos.data,
            blocked: false
        })
        .fetch({
            withRelated: [
                'user',
                'user.rights',
                'user.rights.period'
            ]
        })
        .then(mol => ((mol) ? mol.toJSON() : null))
        .then((mol) => {
            if (!mol || !mol.user.id) {
                const errDetails = {
                    mol  : infos.type,
                    point: req.Point_id
                };

                return next(new APIError(module, 401, 'User not found', errDetails));
            }

            user = mol.user;

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
                    mol  : infos.type,
                    point: req.Point_id
                };

                reject(new APIError(module, 401, 'User not found', errDetails));
            })
        )
        .then(() => {
            user.pin      = '';
            user.password = '';

            const userRights = canSellOrReload(user, req.point_id);

            user.canSell   = userRights.canSell;
            user.canReload = userRights.canReload;

            return res
                .status(200)
                .json({
                    user,
                    token: jwt.sign({
                        id   : user.id,
                        point: req.point,
                        event: req.event,
                        // Will be used by middleware (else how could middleware know if pin or password ?)
                        connectType
                    }, secret, tokenOptions)
                })
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
