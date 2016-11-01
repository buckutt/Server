const express     = require('express');
const idParser    = require('../lib/idParser');
const logger      = require('../lib/log');
const modelParser = require('../lib/modelParser');
const thinky      = require('../lib/thinky');
const { pp }      = require('../lib/utils');
const APIError    = require('../errors/APIError');

const log = logger(module);
const r   = thinky.r;

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

    const tableJoin = req.Model._joins[submodel].link;
    const leftName  = `${req.Model.getTableName()}_id`;
    const leftId    = req.params.id;
    const rightName = `${req.Model._joins[submodel].model.getTableName()}_id`;
    const rightId   = req.body.id;

    log.info(`r.table(${tableJoin}).insert({
        ['${leftName}'] : ${leftId},
        ['${rightName}']: ${rightId}
    });`);

    r
        // Check left model existence
        .table(req.Model.getTableName())
        .get(leftId)
        .then((leftModel) => {
            if (!leftModel) {
                throw new APIError(404, 'Left document does not exist');
            }

            // Check right model
            return r
                .table(req.Model._joins[submodel].model.getTableName())
                .get(rightId);
        })
        .then((rightModel) => {
            if (!rightModel) {
                throw new APIError(404, 'Right document does not exist');
            }

            return r
                .table(tableJoin)
                .insert({
                    [leftName] : leftId,
                    [rightName]: rightId
                });
        })
        .then(() =>
            res
                .status(200)
                .json({})
                .end()
        )
        .catch(APIError, err => next(err))
        .catch((err) => {
            /* istanbul ignore next */
            next(new APIError(500, 'Unknown error', err));
        });
});

router.delete('/:model/:id/:submodel/:subid', (req, res, next) => {
    const submodel = req.params.submodel;

    if (!req.Model._joins.hasOwnProperty(submodel)) {
        return next(new APIError(404, 'Document not found', `Submodel ${submodel} does not exist`));
    }

    const tableJoin = req.Model._joins[submodel].link;
    const leftName  = `${req.Model.getTableName()}_id`;
    const leftId    = req.params.id;
    const rightName = `${req.Model._joins[submodel].model.getTableName()}_id`;
    const rightId   = req.params.subid;

    log.info(`r.table(${tableJoin})
        .filter({
            ['${leftName}'] : ${leftId},
            ['${rightName}']: ${rightId}
        })
        .nth(0)
        .default(null)`);

    r.table(tableJoin)
        .filter({
            [leftName] : leftId,
            [rightName]: rightId
        })
        .nth(0)
        .default(null)
        .then((rel) => {
            if (!rel) {
                throw new APIError(404, 'Document not found');
            }

            return r.table(tableJoin).get(rel.id).delete();
        })
        .then(() =>
            res
                .status(200)
                .json({})
                .end()
        )
        .catch(APIError, err => next(err))
        .catch((err) => {
            /* istanbul ignore next */
            next(new APIError(500, 'Unknown error', err));
        });
});

router.param('model', modelParser);
router.param('id', idParser);
router.param('subid', idParser);

module.exports = router;
