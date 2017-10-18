const express       = require('express');
const qs            = require('qs');
const url           = require('url');
const idParser      = require('../lib/idParser');
const logger        = require('../lib/log');
const modelParser   = require('../lib/modelParser');
const queryFilterer = require('../lib/queryFilterer');
const dbCatch       = require('../lib/dbCatch');
const APIError      = require('../errors/APIError');

const log = logger(module);

/**
 * Read controller. Handles reading one element, or multiple.
 */
const router = new express.Router();

router.get('/:model', (req, res, next) => {
    // List instances
    let request = req.Model;

    const info = `Read ${req.params.model} ${JSON.stringify(req.query) || ''}`;
    log.info(info, req.details);

    // Order
    if (req.query.orderBy) {
        request = request.orderBy(req.query.orderBy, req.query.sort || 'asc');
    }

    // Limit
    if (req.query.limit) {
        request = request.limit(req.query.limit);
    }

    // Offset
    if (req.query.offset) {
        request = request.offset(req.query.offset);
    }

    // Support encoded JSON (express doesn't)
    const q = qs.parse(url.parse(req.url).query).q;
    let filters;

    if (q) {
        try {
            filters = (Array.isArray(q)) ? q.map(subQ => JSON.parse(subQ)) : JSON.parse(q);
        } catch (e) {
            /* istanbul ignore next */
            return next(new APIError(module, 400, 'Invalid search object', e));
        }

        request = queryFilterer(request, filters);
    }

    // Embed multiple relatives
    const withRelated = (req.query.embed) ? req.query.embed : [];

    request
        .fetchAll({ withRelated })
        .then(results =>
            res
                .status(200)
                .json(results.toJSON())
                .end()
        )
        .catch(err => dbCatch(module, err, next));
});

router.get('/:model/:id?', (req, res, next) => {
    let request = req.Model.where({ id: req.params.id });

    // Support encoded JSON (express doesn't)
    const q = qs.parse(url.parse(req.url).query).q;
    let filters;

    if (q) {
        try {
            filters = (Array.isArray(q)) ? q.map(subQ => JSON.parse(subQ)) : JSON.parse(q);
        } catch (e) {
            /* istanbul ignore next */
            return next(new APIError(module, 400, 'Invalid search object', e));
        }

        request = queryFilterer(request, filters);
    }

    // Embed multiple relatives
    const withRelated = (req.query.embed) ? req.query.embed : [];

    request
        .fetch({ withRelated })
        .then(result => (result ? result.toJSON() : null))
        .then((instance) => {
            if (!instance) {
                return next(new APIError(module, 404, 'Document not found'));
            }

            res
                .status(200)
                .json(instance)
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.param('model', modelParser);
router.param('id', idParser);

module.exports = router;
