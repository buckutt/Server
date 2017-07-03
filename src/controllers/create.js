const express     = require('express');
const Promise     = require('bluebird');
const logger      = require('../lib/log');
const modelParser = require('../lib/modelParser');
const dbCatch     = require('../lib/dbCatch');

const log = logger(module);

/**
 * Create controller. Handles creating one element, or multiple.
 */
const router = new express.Router();

router.post('/:model/', (req, res, next) => {
    log.info(`Create ${req.params.model} ${JSON.stringify(req.body)}`, req.details);

    let insts;

    if (Array.isArray(req.body)) {
        // Multiple is
        insts    = req.body.map(data => new req.Model(data));
    } else {
        // Only one instance
        insts    = [new req.Model(req.body)];
    }

    let allDone;

    if (req.query.embed) {
        allDone = insts.map(inst => inst.saveAll(req.query.embed));
    } else {
        allDone = insts.map(inst => inst.save());
    }

    Promise.all(allDone)
        .then(results => req.Model
                .getAll(...results.map(i => i.id))
                .embed(req.query.embed)
                .run())
        .then((results) => {
            res
                .status(200)
                .json((results.length === 1) ? results[0] : results)
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.param('model', modelParser);

module.exports = router;
