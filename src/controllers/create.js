const express     = require('express');
const Promise     = require('bluebird');
const logger      = require('../lib/log');
const modelParser = require('../lib/modelParser');
const { pp }      = require('../lib/utils');
const dbCatch     = require('../lib/dbCatch');

const log = logger(module);

/**
 * Create controller. Handles creating one element, or multiple.
 */
const router = new express.Router();

router.post('/:model/', (req, res, next) => {
    let insts;
    let queryLog = '';

    if (Array.isArray(req.body)) {
        // Multiple is
        queryLog += '[';
        insts    = req.body.map(data => new req.Model(data));
        queryLog += req.body.map(data => pp(data)).join(',');
        queryLog += ']';
    } else {
        // Only one instance
        queryLog += pp(req.body);
        insts    = [new req.Model(req.body)];
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
        .catch(err => dbCatch(err, next));
});

router.param('model', modelParser);

module.exports = router;
