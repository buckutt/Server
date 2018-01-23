const express   = require('express');
const dbCatch   = require('../../lib/dbCatch');
const APIError  = require('../../errors/APIError');
const addDevice = require('../../../scripts/addDevice');
const logger    = require('../../lib/log');

const log = logger(module);

const regexPassword = /^([a-zA-ZÀ-ÿ0-9$%!#]){8,}$/;

/**
 * Certificate controller. Handle ssl certificate generation
 */
const router = new express.Router();

// Get a new certificate
router.get('/services/certificate', (req, res, next) => {
    const models   = req.app.locals.models;
    const deviceId = req.query.deviceId;
    const password = req.query.password;

    if (!regexPassword.test(password)) {
        return next(new APIError(module, 401, 'Password must contain at least 8 characters (a-zA-ZÀ-ÿ0-9$%!#)'));
    }

    log.info(`Generation certificate for device ${deviceId} password ${password}`, req.details);

    let device;
    let fileName;

    models.Device
        .where({ id: deviceId })
        .fetch()
        .then((device_) => {
            device = device_;

            return addDevice.genClient({ password, deviceName: device.get('name') });
        })
        .then((result) => {
            device.set('fingerprint', result.fingerprint);
            fileName = result.fileName;

            return device.save();
        })
        .then(() => res.download(fileName))
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
