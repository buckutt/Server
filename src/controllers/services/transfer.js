import APIError from '../../APIError';
import logger   from '../../log';
import thinky   from '../../thinky';
import express  from 'express';

const log = logger(module);

/**
 * Transfer controller. Handles transfer between accounts
 * @param {Application} app Express main application
 */
export default app => {
    const models = app.locals.models;
    const router = new express.Router();

    // Get the reciever user
    router.post('/services/transfer', (req, res, next) => {
        req.recieverId = req.body.recieverId;

        if (!req.recieverId) {
            return next(new APIError(400, 'Invalid reciever'));
        }

        models.User
            .get(req.recieverId)
            .then(user => {
                req.recieverUser = user;
                next();
            });
    });

    router.post('/services/transfer', (req, res, next) => {
        const amount = req.body.amount;

        const date   = new Date();

        if (req.recieverUser.credit + amount > 100 * 100) {
            return next(new APIError(400, 'Too much reciever credit'));
        }

        if (req.user.credit - amount < 0) {
            return next(new APIError(400, 'Not enough sender credit', `Credit: ${req.user.credit} Amount: ${amount}`));
        }

        let queryLog = `User ${req.user.firstname} ${req.user.lastname} sends ${amount / 100}€ to `;
        queryLog    += `${req.recieverUser.firstname} ${req.recieverUser.lastname}`;

        const newTransfer = new models.Transfer({
            amount,
            date
        });

        newTransfer.senderId   = req.user.id;
        newTransfer.recieverId = req.recieverUser.id;

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

    app.use(router);
};
