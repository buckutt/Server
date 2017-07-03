const express   = require('express');
const dbCatch   = require('../../lib/dbCatch');
const addDevice = require('../../../scripts/addDevice');
const logger          = require('../../lib/log');

const log = logger(module);

/**
 * Certificate controller. Handle ssl certificate generation
 */
const router = new express.Router();

// Get a new certificate
router.get('/services/certificate', (req, res, next) => {
    const models   = req.app.locals.models;
    const deviceId = req.query.deviceId;
    const password = req.query.password;

    log.info(`Generation certificate for device ${deviceId} password ${password}`, req.details);

    let device;
    let fileName;

    models.Device.get(deviceId).run()
        .then((device_) => {
            device = device_;

            return addDevice.genClient({ password, deviceName: device.name });
        })
        .then((result) => {
            device.fingerprint = result.fingerprint;
            fileName           = result.fileName;

            return device.save();
        })
        .then(() => res.download(fileName))
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
