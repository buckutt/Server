import APIError    from '../APIError';
import idParser    from '../lib/idParser';
import logger      from '../log';
import modelParser from '../lib/modelParser';
import thinky      from '../thinky';
import express     from 'express';

const log = logger(module);

/**
 * Update controller. Handles updating one element.
 * @param {Application} app Express main application
 */
export default app => {
    const router = new express.Router();

    router.put('/:model/:id', (req, res, next) => {
        const queryLog = `${req.Model}.get(${req.params.id})`;
        log.info(queryLog);

        // First, get the model
        req.Model
            .get(req.params.id)
            .run()
            .then(inst => {
                // Update based on body values
                Object.keys(req.body).forEach(k => {
                    inst[k] = req.body[k];
                });

                log.info(`${req.params.id}.saveAll()`);
                // Save all (including relatives)
                return inst.save();
            })
            .then(result =>
                res
                    .status(200)
                    .json(result)
                    .end()
            )
            .catch(thinky.Errors.DocumentNotFound, err =>
                next(new APIError(404, 'Document not found', err))
            )
            .catch(thinky.Errors.ValidationError, err =>
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

    router.param('model', modelParser);
    router.param('id', idParser);

    app.use(router);
};
