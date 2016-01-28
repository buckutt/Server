import APIError    from '../APIError';
import idParser    from '../lib/idParser';
import logger      from '../log';
import modelParser from '../lib/modelParser';
import thinky      from '../thinky';
import { pp }      from '../lib/utils';
import express     from 'express';

const log = logger(module);

/**
 * Read submodel controller. Handles reading the children of one element (based on a relation).
 * @param {Application} app Express main application
 */
export default app => {
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
            .catch(err =>
                /* istanbul ignore next */
                next(new APIError(500, 'Unknown error', err))
            );
    });

    router.param('model', modelParser);
    router.param('id', idParser);

    app.use(router);
};
