const bcrypt_  = require('bcryptjs');
const express  = require('express');
const Promise  = require('bluebird');
const logger   = require('../../../lib/log');
const thinky   = require('../../../lib/thinky');
const APIError = require('../../../errors/APIError');

const log = logger(module);

/**
 * Transfer controller. Handles transfer between accounts
 */
const bcrypt = Promise.promisifyAll(bcrypt_);
const router = new express.Router();

// Get the reciever user
router.post('/services/manager/transfer', (req, res, next) => {
    req.Reciever_id = req.body.Reciever_id;

    if (!req.Reciever_id) {
        return next(new APIError(400, 'Invalid reciever'));
    }

    req.app.locals.models.User
        .filter(thinky.r.row('isRemoved').eq(false))
        .filter(thinky.r.row('id').eq(req.Reciever_id))
        .nth(0)
        .default(null)
        .execute()
        .then((user) => {
            if (!user) {
                return next(new APIError(400, 'Invalid reciever'));
            }

            req.recieverUser = user;
            next();
        });
});

router.post('/services/manager/transfer', (req, res, next) => {
    if (!req.body.currentPin) {
        return next(new APIError(400, 'Current PIN has to be sent'));
    }

    if (req.body.currentPin.length !== 4) {
        return next(new APIError(400, 'Current PIN has to be clear, not crypted'));
    }

    bcrypt.compareAsync(req.body.currentPin.toString(), req.user.pin)
        .then((match) => {
            if (match) {
                next();
            } else {
                next(new APIError(400, 'Current PIN is wrong'));
            }
        });
});

router.post('/services/manager/transfer', (req, res, next) => {
    const models = req.app.locals.models;

    let amount = parseInt(req.body.amount, 10);

    if (req.user.credit - amount < 0) {
        return next(new APIError(400, 'Not enough sender credit', `Credit: ${req.user.credit} Amount: ${amount}`));
    }

    if (req.recieverUser.credit + amount > 100 * 100) {
        return next(new APIError(400, 'Too much reciever credit'));
    }

    let queryLog = `User ${req.user.firstname} ${req.user.lastname} sends ${amount / 100}€ to `;
    queryLog    += `${req.recieverUser.firstname} ${req.recieverUser.lastname}`;

    const newTransfer = new models.Transfer({
        amount
    });

    newTransfer.Sender_id   = req.user.id;
    newTransfer.Reciever_id = req.recieverUser.id;

    log.info(queryLog);

    req.app.locals.models.User
        .get(newTransfer.Reciever_id)
        .run()
        .then((reciever) => {
            reciever.credit += amount;

            return reciever.save();
        })
        .then(() =>
            req.app.locals.models.User
                .get(newTransfer.Sender_id)
                .run()
        )
        .then((sender) => {
            sender.credit -= amount;

            return sender.save();
        })
        .then(() =>
            newTransfer.save()
        )
        .then(() => {
            if (newTransfer.Reciever_id === newTransfer.Sender_id) {
                amount = 0;
            }

            return res
                .status(200)
                .json({
                    newCredit: req.user.credit - amount
                })
                .end();
        })
        .catch(thinky.Errors.ValidationError, (err) => {
            /* istanbul ignore next */
            next(new APIError(400, 'Invalid model', err));
        })
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
