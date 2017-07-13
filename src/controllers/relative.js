const express     = require('express');
const idParser    = require('../lib/idParser');
const logger      = require('../lib/log');
const modelParser = require('../lib/modelParser');
const requelize   = require('../lib/requelize');
const dbCatch     = require('../lib/dbCatch');
const APIError    = require('../errors/APIError');

const log = logger(module);
const r   = requelize.r;

/**
 * Read submodel controller. Handles reading the children of one element (based on a relation).
 */
const router = new express.Router();

router.get('/:model/:id/:submodel', (req, res, next) => {
    const info = `Read relatives ${req.params.submodel} of ${req.params.model} ${JSON.stringify(req.query)}`;
    log.info(info, req.details);

    const submodel = req.params.submodel;

    if (!req.Model._joins.hasOwnProperty(submodel)) {
        return next(new APIError(module, 404, 'Document not found: submodel does not exist', { submodel }));
    }

    const embed = {};
    // If embed on the submodel, do something like { submodel: whatever he wants }
    // Else just the submodel, so { submodel: true }
    if (req.query.embed) {
        embed[submodel] = req.query.embed;
    } else {
        embed[submodel] = true;
    }

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
        .catch(err => dbCatch(module, err, next));
});

router.post('/:model/:id/:submodel/:subId', (req, res, next) => {
    const info = `Create relative ${req.params.submodel}(${req.params.subId}) of
        ${req.params.model}(${req.params.id}) ${JSON.stringify(req.query)}`;
    log.info(info, req.details);

    const submodel = req.params.submodel;

    if (!req.Model._joins.hasOwnProperty(submodel)) {
        return next(new APIError(module, 404, 'Document not found: submodel does not exist', { submodel }));
    }

    const through   = req.Model._joins[submodel].tableName;
    const leftName  = req.Model._name;
    const rightName = req.Model._joins[submodel].model;
    const { id, subId } = req.params;

    req.Model
        .get(id)
        .run()
        .then((leftModel) => {
            if (!leftModel) {
                throw new APIError(module, 404, 'Left document does not exist');
            }

            // Check right model
            return r.table(req.Model._joins[submodel].model).get(subId);
        })
        .then((rightModel) => {
            if (!rightModel) {
                throw new APIError(module, 404, 'Right document does not exist');
            }

            return r
                .table(through)
                .insert(Object.assign({
                    [leftName] : id,
                    [rightName]: subId
                }, req.body));
        })
        .then(() =>
            res
                .status(200)
                .json({})
                .end()
        )
        .catch(err => dbCatch(module, err, next));
});

router.delete('/:model/:id/:submodel/:subId', (req, res, next) => {
    const info = `Delete relative ${req.params.submodel}(${req.params.subId}) of
        ${req.params.model}(${req.params.id}) ${JSON.stringify(req.query)}`;
    log.info(info, req.details);

    const submodel = req.params.submodel;

    if (!req.Model._joins.hasOwnProperty(submodel)) {
        return next(new APIError(module, 404, 'Document not found', `Submodel ${submodel} does not exist`));
    }

    const JoinModel = requelize.models[req.Model._joins[submodel].tableName];
    const leftName  = req.Model._name;
    const leftId    = req.params.id;
    const rightName = req.Model._joins[submodel].model;
    const rightId   = req.params.subid;

    const filter = Object.assign({}, {
        [leftName] : leftId,
        [rightName]: rightId
    }, req.query.filter);

    JoinModel
        .filter(filter)
        .nth(0)
        .default(null)
        .then((rel) => {
            if (!rel) {
                throw new APIError(module, 404, 'Document not found');
            }

            return JoinModel.get(rel.id).delete();
        })
        .then(() =>
            res
                .status(200)
                .json({})
                .end()
        )
        .catch(err => dbCatch(module, err, next));
});

router.param('model', modelParser);
router.param('id', idParser);
router.param('subId', idParser);

module.exports = router;
