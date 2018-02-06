const express  = require('express');
const logger   = require('../../../lib/log');
const dbCatch  = require('../../../lib/dbCatch');
const APIError = require('../../../errors/APIError');

const log = logger(module);

/**
 * Reload controller. Handles online reload
 */
const router = new express.Router();

// Get the reciever user
router.post('/services/manager/reload', (req, res, next) => {
    log.info(`Reload ${req.user.id} ${req.body.amount}`);

    if (!req.body.amount || !parseInt(req.body.amount, 10)) {
        return next(new APIError(module, 400, 'Invalid amount', { receiver: req.reciever_id }));
    }

    req.app.locals
        .makePayment({
            buyer : req.user,
            amount: parseInt(req.body.amount, 10),
            // Used by test reloadProvider
            point : req.point_id
        })
        .then((result) => {
            res
                .status(200)
                .json(result)
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
