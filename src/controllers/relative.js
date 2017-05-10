const express     = require('express');
const idParser    = require('../lib/idParser');
const logger      = require('../lib/log');
const modelParser = require('../lib/modelParser');
const requelize   = require('../lib/requelize');
const { pp }      = require('../lib/utils');
const dbCatch     = require('../lib/dbCatch');
const APIError    = require('../errors/APIError');

const log = logger(module);
const r   = requelize.r;

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

    const queryLog = `${req.Model._name}.get(${req.params.id}).embed(${pp(embed)}).run()`;
    log.info(queryLog);

    req.Model
        .get(req.params.id)
        .default(r.error('Document not found'))
        .embed(embed)
        .run()
        .then(instance =>
            res
                .status(200)
                .json(instance[submodel])
                .end()
        )
        .catch(err => dbCatch(err, next));
});

router.post('/:model/:leftId/:submodel/:rightId', (req, res, next) => {
    const submodel = req.params.submodel;

    if (!req.Model._joins.hasOwnProperty(submodel)) {
        return next(new APIError(404, 'Document not found', `Submodel ${submodel} does not exist`));
    }

    const through   = req.Model._joins[submodel].tableName;
    const leftName  = req.Model._name;
    const rightName = req.Model._joins[submodel].model;

    const { leftId, rightId } = req.params;

    log.info(`r.table(${through}).insert({
        ['${leftName}'] : ${leftId},
        ['${rightName}']: ${rightId}
    });`);

    req.Model
        .get(leftId)
        .run()
        .then((leftModel) => {
            if (!leftModel) {
                throw new APIError(404, 'Left document does not exist');
            }

            // Check right model
            return r.table(req.Model._joins[submodel].model).get(rightId);
        })
        .then((rightModel) => {
            if (!rightModel) {
                throw new APIError(404, 'Right document does not exist');
            }

            return r
                .table(through)
                .insert(Object.assign({
                    [leftName] : leftId,
                    [rightName]: rightId
                }, req.body));
        })
        .then(() =>
            res
                .status(200)
                .json({})
                .end()
        )
        .catch(err => dbCatch(err, next));
});

router.delete('/:model/:id/:submodel/:subid', (req, res, next) => {
    const submodel = req.params.submodel;

    if (!req.Model._joins.hasOwnProperty(submodel)) {
        return next(new APIError(404, 'Document not found', `Submodel ${submodel} does not exist`));
    }

    const JoinModel = requelize.models[req.Model._joins[submodel].tableName];
    const leftName  = req.Model._name;
    const leftId    = req.params.id;
    const rightName = req.Model._joins[submodel].model;
    const rightId   = req.params.subid;

    log.info(`${JoinModel._name}
        .filter({
            ${leftName} : ${leftId},
            ${rightName}: ${rightId}
        })
        .nth(0)
        .default(null)`);

    JoinModel
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

            return JoinModel.get(rel.id).delete();
        })
        .then(() =>
            res
                .status(200)
                .json({})
                .end()
        )
        .catch(err => dbCatch(err, next));
});

router.param('model', modelParser);
router.param('id', idParser);
router.param('subid', idParser);

module.exports = router;
