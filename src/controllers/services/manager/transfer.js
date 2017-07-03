const bcrypt_   = require('bcryptjs');
const express   = require('express');
const Promise   = require('bluebird');
const logger    = require('../../../lib/log');
const dbCatch   = require('../../../lib/dbCatch');
const requelize = require('../../../lib/requelize');
const APIError  = require('../../../errors/APIError');

const log = logger(module);

/**
 * Transfer controller. Handles transfer between accounts
 */
const bcrypt = Promise.promisifyAll(bcrypt_);
const router = new express.Router();

// Get the reciever user
router.post('/services/manager/transfer', (req, res, next) => {
    log.info(`Transfer from ${req.user.id} to ${req.body.Reciever_id} by ${req.body.amount}`);

    req.Reciever_id = req.body.Reciever_id;

    if (!req.Reciever_id) {
        return next(new APIError(module, 400, 'Invalid reciever', { receiver: req.Reciever_id }));
    }

    req.app.locals.models.User
        .parse(false)
        .filter(requelize.r.row('isRemoved').eq(false))
        .filter(requelize.r.row('id').eq(req.Reciever_id))
        .nth(0)
        .default(null)
        .then((user) => {
            if (!user) {
                return next(new APIError(module, 400, 'Invalid reciever'));
            }

            req.recieverUser = user;
            next();
        });
});

router.post('/services/manager/transfer', (req, res, next) => {
    if (!req.body.currentPin) {
        return next(new APIError(module, 400, 'Current PIN has to be sent'));
    }

    if (req.body.currentPin.length !== 4) {
        return next(new APIError(module, 400, 'Current PIN has to be clear, not crypted'));
    }

    bcrypt.compareAsync(req.body.currentPin.toString(), req.user.pin)
        .then((match) => {
            if (match) {
                next();
            } else {
                next(new APIError(module, 400, 'Current PIN is wrong'));
            }
        });
});

router.post('/services/manager/transfer', (req, res, next) => {
    const models = req.app.locals.models;

    let amount = parseInt(req.body.amount, 10);

    if (req.user.credit - amount < 0) {
        return next(new APIError(module, 400, 'Not enough sender credit', { 
            sender: req.Sender_id,
            credit: req.user.credit, 
            amount 
        }));
    }

    if (req.recieverUser.credit + amount > 100 * 100) {
        return next(new APIError(module, 400, 'Too much reciever credit', { 
            receiver: req.Reciever_id,
            credit: req.user.credit, 
            amount 
        }));
    }

    const newTransfer = new models.Transfer({
        amount
    });

    newTransfer.Sender_id   = req.user.id;
    newTransfer.Reciever_id = req.recieverUser.id;

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
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
