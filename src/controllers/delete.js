const express     = require('express');
const idParser    = require('../lib/idParser');
const logger      = require('../lib/log');
const modelParser = require('../lib/modelParser');
const thinky      = require('../lib/thinky');
const { pp }      = require('../lib/utils');
const errors      = require('../errors');

const log = logger(module);

/**
 * Update controller. Handles updating one element.
 */
const router = new express.Router();

router.delete('/:model/:id', (req, res, next) => {
    const queryLog = `${req.Model}.get(${req.params.id}).getJoin(${req.query.embed})`;
    log.info(queryLog);

    // First, get the model
    req.Model
        .get(req.params.id)
        .getJoin(req.query.embed)
        .run()
        .then((inst) => {
            // Then delete

            // If embed parameter is present, deleteAll() instead of delete()
            if (req.query.embed) {
                log.warn(`${req.params.id}.deleteAll(${pp(req.query.embed)})`);

                return inst.deleteAll(req.query.embed);
            }

            return inst.delete();
        })
        .then(() =>
            res
                .status(200)
                .end()
        )
        .catch(thinky.Errors.DocumentNotFound, err =>
            next(new APIError(404, 'Document not found', err))
        )
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

router.param('model', modelParser);
router.param('id', idParser);

module.exports = router;
