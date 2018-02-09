const express                      = require('express');
const idParser                     = require('../lib/idParser');
const logger                       = require('../lib/log');
const modelParser                  = require('../lib/modelParser');
const { embedParser, embedFilter } = require('../lib/embedParser');
const dbCatch                      = require('../lib/dbCatch');
const APIError                     = require('../errors/APIError');

const log = logger(module);

/**
 * Read submodel controller. Handles reading the children of one element (based on a relation).
 */
const router = new express.Router();

router.get('/:model/:id/:submodel', (req, res, next) => {
    const info = `Read relatives ${req.params.submodel} of ${req.params.model} ${JSON.stringify(req.query)}`;
    log.info(info, req.details);

    const submodel = req.params.submodel;

    let withRelated = [];
    if (req.query.embed) {
        withRelated = [submodel].concat(embedParser(req.query.embed));
    } else {
        withRelated = [submodel];
    }

    const embedFilters = (req.query.embed) ?
        req.query.embed.filter(rel => rel.required).map(rel => rel.embed) :
        [];

    req.Model
        .where({ id: req.params.id })
        .fetch({ withRelated })
        .then(result => (result ? embedFilter(embedFilters, [result.toJSON()])[0] : null))
        .then((instance) => {
            if (!instance || !instance[submodel]) {
                return next(new APIError(module, 404, 'Document not found'));
            }

            res
                .status(200)
                .json(instance[submodel])
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.post('/:model/:id/:submodel/:subId', (req, res, next) => {
    const info = `Create relative ${req.params.submodel}(${req.params.subId}) of
        ${req.params.model}(${req.params.id}) ${JSON.stringify(req.query)}`;
    log.info(info, req.details);

    const Model                   = req.Model;
    const { id, subId, submodel } = req.params;

    // create empty instance
    const forged = new req.Model();

    if (!forged[submodel] || !forged[submodel]().attach) {
        return next(new APIError(module, 404, 'Document not found: submodel does not exist', { submodel }));
    }

    // get relationship data
    const relationship = forged[submodel]();

    // extract submodel class
    const SubModel = relationship.model;

    let left;

    Model
        .where({ id })
        .fetch()
        .then((left_) => {
            left = left_;

            if (!left) {
                return Promise.reject(new APIError(module, 404, 'Left document does not exist'));
            }

            return SubModel.where({ id: subId }).fetch();
        })
        .then((right) => {
            if (!right) {
                return Promise.reject(new APIError(module, 404, 'Right document does not exist'));
            }

            return left[submodel]().attach(right);
        })
        .then(() =>
            res
                .status(200)
                .json({})
                .end())
        .catch(err => dbCatch(module, err, next));
});

router.delete('/:model/:id/:submodel/:subId', (req, res, next) => {
    const info = `Delete relative ${req.params.submodel}(${req.params.subId}) of
        ${req.params.model}(${req.params.id}) ${JSON.stringify(req.query)}`;
    log.info(info, req.details);

    const Model                   = req.Model;
    const { id, subId, submodel } = req.params;

    // create empty instance
    const forged = new req.Model();

    if (!forged[submodel]) {
        return next(new APIError(module, 404, 'Document not found: submodel does not exist', { submodel }));
    }

    // get relationship data
    const relationship = forged[submodel]();

    // extract submodel class
    const SubModel = relationship.model;

    let left;
    let right;

    Model
        .where({ id })
        .fetch()
        .then((left_) => {
            left = left_;

            if (!left) {
                return Promise.reject(new APIError(module, 404, 'Left document does not exist'));
            }

            return SubModel.where({ id: subId }).fetch();
        })
        .then((right_) => {
            right = right_;

            if (!right) {
                return Promise.reject(new APIError(module, 404, 'Right document does not exist'));
            }

            return left[submodel]().detach(right);
        })
        .then(() => {
            // req.app.locals.modelChanges.emit(
            //     'data',
            //     'create',
            //     modelParser.modelsNames[req.params.model],
            //     { from: null, to: right }
            // );

            res
                .status(200)
                .json({})
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.param('model', modelParser);
router.param('id', idParser);
router.param('subId', idParser);

module.exports = router;
