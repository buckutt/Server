const bcrypt_  = require('bcryptjs');
const express  = require('express');
const Promise  = require('bluebird');
const logger   = require('../../../lib/log');
const dbCatch  = require('../../../lib/dbCatch');
const APIError = require('../../../errors/APIError');

const log = logger(module);

/**
 * Transfer controller. Handles transfer between accounts
 */
const bcrypt = Promise.promisifyAll(bcrypt_);
const router = new express.Router();

// Get the reciever user
router.post('/services/manager/transfer', (req, res, next) => {
    log.info(`Transfer from ${req.user.id} to ${req.body.reciever_id} by ${req.body.amount}`);

    req.reciever_id = req.body.reciever_id;

    if (!req.reciever_id) {
        return next(new APIError(module, 400, 'Invalid reciever', { receiver: req.reciever_id }));
    }

    req.app.locals.models.User
        .where({ id: req.reciever_id })
        .fetch()
        .then((user) => {
            if (!user) {
                return next(new APIError(module, 400, 'Invalid reciever'));
            }

            req.recieverUser = user.toJSON();
            next();
        })
        .catch(() => next(new APIError(400, 'Invalid reciever')));
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
            sender: req.sender_id,
            credit: req.user.credit,
            amount
        }));
    }

    if (req.recieverUser.credit + amount > 100 * 100) {
        return next(new APIError(module, 400, 'Too much reciever credit', {
            receiver: req.reciever_id,
            credit  : req.user.credit,
            amount
        }));
    }

    const newTransfer = new models.Transfer({
        amount
    });

    newTransfer.set('sender_id', req.user.id);
    newTransfer.set('reciever_id', req.recieverUser.id);

    models.User
        .where({ id: newTransfer.get('reciever_id') })
        .fetch()
        .then((reciever) => {
            reciever.set('credit', reciever.get('credit') + amount);
            reciever.set('updated_at', new Date());

            return reciever.save();
        })
        .then(() =>
            models.User
                .where({ id: newTransfer.get('sender_id') })
                .fetch())
        .then((sender) => {
            sender.set('credit', sender.get('credit') - amount);
            sender.set('updated_at', new Date());

            return sender.save();
        })
        .then(() => newTransfer.save())
        .then(() => {
            const PendingCardUpdate = req.app.locals.models.PendingCardUpdate;

            const pendingCardUpdateSender = new PendingCardUpdate({
                user_id: req.user.id,
                amount : -1 * amount
            });

            const pendingCardUpdateReciever = new PendingCardUpdate({
                user_id: req.recieverUser.id,
                amount
            });

            return Promise.all([pendingCardUpdateSender.save(), pendingCardUpdateReciever.save()]);
        })
        .then(() => {
            if (newTransfer.get('reciever_id') === newTransfer.get('sender_id')) {
                amount = 0;
            }

            // Only useful for modelChanges
            req.user.credit -= amount;
            req.recieverUser.credit += amount;

            req.app.locals.modelChanges.emit('userCreditUpdate', req.user);
            req.app.locals.modelChanges.emit('userCreditUpdate', req.recieverUser);

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
