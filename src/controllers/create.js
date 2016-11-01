const express         = require('express');
const Promise         = require('bluebird');
const logger          = require('../lib/log');
const modelParser     = require('../lib/modelParser');
const relationsHelper = require('../lib/relationsHelper');
const thinky          = require('../lib/thinky');
const { pp }          = require('../lib/utils');
const APIError        = require('../errors/APIError');

const log = logger(module);

/**
 * Create controller. Handles creating one element, or multiple.
 */
const router = new express.Router();

router.post('/:model/', (req, res, next) => {
    let insts;
    let queryLog = '';

    if (Array.isArray(req.body)) {
        // Multiple instances
        queryLog += '[';
        insts = req.body.map((data) => {
            const [instData, leftKeysExtracted] = relationsHelper.sanitize(req.Model, data);

            const newInst = new req.Model(instData);
            relationsHelper.restore(newInst, leftKeysExtracted);

            return newInst;
        });
        queryLog += req.body.map(data => pp(data)).join(',');
        queryLog += ']';
    } else {
        // Only one instance
        queryLog += pp(req.body);
        const [data, leftKeysExtracted] = relationsHelper.sanitize(req.Model, req.body);

        const newInst = new req.Model(data);
        relationsHelper.restore(newInst, leftKeysExtracted);
        insts = [newInst];
    }

    let allDone;

    if (req.query.embed) {
        allDone = insts.map(inst => inst.saveAll(req.query.embed));
        queryLog += `.saveAll(${pp(req.query.embed)}) (length: ${allDone.length})`;
    } else {
        allDone = insts.map(inst => inst.save());
        queryLog += `.save() (length: ${allDone.length})`;
    }

    log.info(queryLog);
    Promise.all(allDone)
        .then((results_) => {
            // Retrieve the element anyway (to ensure n:n relations are present)
            // See https://github.com/neumino/thinky/issues/291#issuecomment-125024658

            // Use only ids
            const results = results_.map(instance => instance.id);

            // Get all ideas and the embed wanted
            return req.Model.getAll(...results).getJoin(req.query.embed).run();
        })
        .then((results_) => {
            const results = (results_.length === 1) ? results_[0] : results_;

            res
                .status(200)
                .json(results)
                .end();
        })
        .catch(thinky.Errors.ValidationError, err =>
            next(new APIError(400, 'Invalid model', err))
        )
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

module.exports = router;
