import express     from 'express';
import idParser    from '../lib/idParser';
import logger      from '../lib/log';
import modelParser from '../lib/modelParser';
import thinky      from '../lib/thinky';
import { pp }      from '../lib/utils';
import APIError    from '../errors/APIError';

const log = logger(module);

/**
 * Read submodel controller. Handles reading the children of one element (based on a relation).
 */
const router = new express.Router();

router.get('/:model/:id/:submodel', (req, res, next) => {
    const submodel = req.params.submodel;

    if (!req.Model._joins.hasOwnProperty(submodel)) {
        return next(new APIError(404, 'Document not found', `Submodel ${submodel} does not exist`));
    }

    const embed = {};
    // If embed on the submodel, do something like { submodel: whatever he wants }
    // Else just the submodel, so { submodel: true }
    if (req.query.embed) {
        embed[submodel] = req.query.embed;
    } else {
        embed[submodel] = true;
    }

    const queryLog = `${req.Model}.get(${req.params.id}).getJoin(${pp(embed)}).run()`;
    log.info(queryLog);

    req.Model
        .get(req.params.id)
        .getJoin(embed)
        .run()
        .then(instance =>
            res
                .status(200)
                .json(instance[submodel])
                .end()
        )
        .catch(thinky.Errors.DocumentNotFound, err =>
            next(new APIError(404, 'Document not found', err))
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

router.post('/:model/:id/:submodel', (req, res, next) => {
    const submodel = req.params.submodel;

    if (!req.Model._joins.hasOwnProperty(submodel)) {
        return next(new APIError(404, 'Document not found', `Submodel ${submodel} does not exist`));
    }

    const queryLog = `${req.Model}
        .get(${req.params.id})
        .addRelation(${req.params.submodel}, { id: ${req.body.id} })
        .run()`;
    log.info(queryLog);

    req.Model
        .get(req.params.id)
        .addRelation(req.params.submodel, { id: req.body.id })
        .then(status =>
            res
                .status(200)
                .json({ status })
                .end()
        )
        .catch(thinky.Errors.DocumentNotFound, err =>
            next(new APIError(404, 'Document not found', err))
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

router.delete('/:model/:id/:submodel/:subid', (req, res, next) => {
    const submodel = req.params.submodel;

    if (!req.Model._joins.hasOwnProperty(submodel)) {
        return next(new APIError(404, 'Document not found', `Submodel ${submodel} does not exist`));
    }

    const queryLog = `${req.Model}
        .get(${req.params.id})
        .removeRelation(${req.params.submodel}, { id: ${req.params.subid} })
        .run()`;
    log.info(queryLog);

    req.Model
        .get(req.params.id)
        .removeRelation(req.params.submodel, { id: req.params.subid })
        .then(status =>
            res
                .status(200)
                .json({ status })
                .end()
        )
        .catch(thinky.Errors.DocumentNotFound, err =>
            // Ignore this one for now as the error is catch by ReqlUserError
            // https://github.com/neumino/thinky/issues/487
            /* istanbul ignore next */
            next(new APIError(404, 'Document not found', err))
        )
        .catch(thinky.Errors.ValidationError, err =>
            /* istanbul ignore next */
            next(new APIError(400, 'Invalid model', err))
        )
        .catch(thinky.Errors.InvalidWrite, err =>
            /* istanbul ignore next */
            next(new APIError(500, 'Couldn\'t write to disk', err))
        )
        .catch(err => {
            if (err.name === 'ReqlUserError') {
                return next(new APIError(404, 'Document not found', err));
            }

            /* istanbul ignore next */
            return next(new APIError(500, 'Unknown error', err));
        });
});

router.param('model', modelParser);
router.param('id', idParser);
router.param('subid', idParser);

export default router;
