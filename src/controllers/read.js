const express     = require('express');
const idParser    = require('../lib/idParser');
const logger      = require('../lib/log');
const modelParser = require('../lib/modelParser');
const requelize   = require('../lib/requelize');
const { pp }      = require('../lib/utils');
const dbCatch     = require('../lib/dbCatch');

const log = logger(module);
const r   = requelize.r;

/**
 * Read controller. Handles reading one element, or multiple.
 */
const router = new express.Router();

router.get('/:model', (req, res, next) => {
    // List instances
    let request = req.Model;
    let queryLog = req.Model._name;

    // Order
    if (req.query.orderBy) {
        if (req.query.sort === 'asc') {
            // Order ASC
            queryLog += `.orderBy({ index: r.asc(${req.query.orderBy}) })`;
            request = request.orderBy({
                index: r.asc(req.query.orderBy)
            });
        } else if (req.query.sort === 'dsc') {
            // Order DSC
            queryLog += `.orderBy({ index: r.desc(${req.query.orderBy})})`;
            request = request.orderBy({
                index: r.desc(req.query.orderBy)
            });
        } else {
            // Order Default
            queryLog += `.orderBy({ index: ${req.query.orderBy} })`;
            request = request.orderBy({
                index: req.query.orderBy
            });
        }
    }

    // Limit
    if (req.query.limit) {
        queryLog += `.limit(${req.query.limit})`;
        request = request.limit(req.query.limit);
    }

    // Skip/Offset
    if (req.query.offset) {
        queryLog += `.skip(${req.query.offset})`;
        request = request.skip(req.query.offset);
    }

    // Embed multiple relatives
    if (req.query.embed) {
        queryLog += `.embed( ${pp(req.query.embed)} )`;
        request = request.embed(req.query.embed);
    }

    queryLog += '.run()';
    log.info(queryLog);
    request
        .run()
        .then(results =>
            res
                .status(200)
                .json(results)
                .end()
        )
        .catch(err => dbCatch(err, next));
});

router.get('/:model/:id?', (req, res, next) => {
    // id === search => next to be used by search controller
    if (req.params.id === 'search') {
        return next();
    }

    let queryLog = `${req.Model._name}.get(${req.params.id})`;

    let request = req.Model
        .get(req.params.id)
        .default(r.error('Document not found'));

    // Embed multiple relatives
    if (req.query.embed) {
        queryLog += `.embed(${pp(req.query.embed)})`;
        request = request.embed(req.query.embed);
    }

    queryLog += '.run()';
    log.info(queryLog);
    request
        .run()
        .then(instance =>
            res
                .status(200)
                .json(instance)
                .end()
        )
        .catch(err => dbCatch(err, next));
});

router.param('model', modelParser);
router.param('id', idParser);

module.exports = router;
