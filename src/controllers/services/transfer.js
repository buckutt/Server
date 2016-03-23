import express  from 'express';
import logger   from '../../lib/log';
import thinky   from '../../lib/thinky';
import APIError from '../../errors/APIError';

const log = logger(module);

/**
 * Transfer controller. Handles transfer between accounts
 */
const router = new express.Router();

// Get the reciever user
router.post('/services/transfer', (req, res, next) => {
    req.Reciever_id = req.body.Reciever_id;

    if (!req.Reciever_id) {
        return next(new APIError(400, 'Invalid reciever'));
    }

    req.app.locals.models.User
        .get(req.Reciever_id)
        .then(user => {
            req.recieverUser = user;
            next();
        });
});

router.post('/services/transfer', (req, res, next) => {
    const models = req.app.locals.models;

    const amount = req.body.amount;

    if (req.recieverUser.credit + amount > 100 * 100) {
        return next(new APIError(400, 'Too much reciever credit'));
    }

    if (req.user.credit - amount < 0) {
        return next(new APIError(400, 'Not enough sender credit', `Credit: ${req.user.credit} Amount: ${amount}`));
    }

    let queryLog = `User ${req.user.firstname} ${req.user.lastname} sends ${amount / 100}€ to `;
    queryLog    += `${req.recieverUser.firstname} ${req.recieverUser.lastname}`;

    const newTransfer = new models.Transfer({
        amount
    });

    newTransfer.Sender_id   = req.user.id;
    newTransfer.Reciever_id = req.recieverUser.id;

    log.info(queryLog);

    newTransfer
        .save()
        .then(() =>
            res
                .status(200)
                .json({
                    newCredit: req.user.credit - amount
                })
                .end()
        )
        .catch(thinky.Errors.ValidationError, err =>
            /* istanbul ignore next */
            next(new APIError(400, 'Invalid model', err))
        )
        .catch(thinky.Errors.InvalidWrite, err =>
            /* istanbul ignore next */
            next(new APIError(500, 'Couldn\'t write to disk', err))
        )
        .catch(err =>
            /* istanbul ignore next */
            next(new APIError(500, 'Unknown error', err))
        );
});

export default router;
