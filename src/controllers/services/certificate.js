const express   = require('express');
const thinky    = require('../../lib/thinky');
const APIError  = require('../../errors/APIError');
const addDevice = require('../../../scripts/addDevice');

/**
 * Certificate controller. Handle ssl certificate generation
 */
const router = new express.Router();

// Get a new certificate
router.get('/services/certificate', (req, res, next) => {
    const models   = req.app.locals.models;
    const deviceId = req.query.deviceId;
    const password = req.query.password;

    let device;
    let fileName;

    models.Device.get(deviceId).run()
        .then((device_) => {
            device = device_;

            return addDevice.genClient({ password, deviceName: device.name });
        })
        .then((result) => {
            device.fingerprint = result.fingerprint;
            fileName = result.fileName;

            return device.save();
        })
        .then(() => res.download(fileName))
        .catch(thinky.Errors.DocumentNotFound, err =>
            next(new APIError(404, 'Document not found', err))
        )
        .catch((err) => {
            /* istanbul ignore next */
            next(new APIError(500, 'Unknown error', err));
        });
});

module.exports = router;
