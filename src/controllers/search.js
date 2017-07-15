const express     = require('express');
const qs          = require('qs');
const url         = require('url');
const logger      = require('../lib/log');
const modelParser = require('../lib/modelParser');
const requelize   = require('../lib/requelize');
const dbCatch     = require('../lib/dbCatch');
const APIError    = require('../errors/APIError');

const log = logger(module);
const r   = requelize.r;

/**
 * Converts a JSON object to a RethinkDB call
 * @param  {Object}   obj The RethinkDB model
 * @param  {Function} onFail Called if any search object is malformed
 * @return {Array<Object>} The AST generated by RethinkDB
 */
function objToRethinkDBSearch(obj, onFail) {
    if (!obj.hasOwnProperty('field')) {
        onFail();

        return [null, null];
    }

    if (!(obj.hasOwnProperty('startsWith') || obj.hasOwnProperty('endsWith') || obj.hasOwnProperty('matches') ||
        obj.hasOwnProperty('gt') || obj.hasOwnProperty('ne') || obj.hasOwnProperty('lt') ||
        obj.hasOwnProperty('ge') || obj.hasOwnProperty('le') || obj.hasOwnProperty('eq'))) {
        onFail();

        return [null, null];
    }

    let rethinkSearch = r.row(obj.field.toString());

    if (obj.hasOwnProperty('startsWith')) {
        rethinkSearch = rethinkSearch.match(`^${obj.startsWith.toString()}`);
    }

    if (obj.hasOwnProperty('endsWith')) {
        rethinkSearch = rethinkSearch.match(`${obj.endsWith.toString()}$`);
    }

    if (obj.hasOwnProperty('matches')) {
        rethinkSearch = rethinkSearch.match(obj.matches.toString());
    }

    if (obj.date) {
        for (const op of ['gt', 'ne', 'lt', 'ge', 'le', 'eq']) {
            if (obj.hasOwnProperty(op)) {
                obj[op] = new Date(obj[op]);
            }
        }
    }

    if (obj.hasOwnProperty('gt')) {
        rethinkSearch = rethinkSearch.gt(obj.gt);
    }

    if (obj.hasOwnProperty('ne')) {
        rethinkSearch = rethinkSearch.ne(obj.ne);
    }

    if (obj.hasOwnProperty('lt')) {
        rethinkSearch = rethinkSearch.lt(obj.lt);
    }

    if (obj.hasOwnProperty('ge')) {
        rethinkSearch = rethinkSearch.ge(obj.ge);
    }

    if (obj.hasOwnProperty('le')) {
        rethinkSearch = rethinkSearch.le(obj.le);
    }

    if (obj.hasOwnProperty('eq')) {
        rethinkSearch = rethinkSearch.eq(obj.eq);
    }

    return rethinkSearch;
}

/**
 * Matches an array of search objects to a filter using « and » operator
 * @param  {Array<Object>} array  The search object
 * @param  {Function} onFail Called if any search object is malformed
 * @return {Array<Object>} The AST generated by RethinkDB
 */
function arrayToRethinkFilters(array, onFail) {
    let rethinkSearch = r;

    array.forEach((searchObj, i) => {
        // First call, do not call and
        const subSearch = objToRethinkDBSearch(searchObj, onFail);

        if (subSearch === null) {
            return [null, null];
        }

        if (i !== 0) {
            rethinkSearch = rethinkSearch.and(subSearch);
        } else {
            rethinkSearch = subSearch;
        }
    });

    return rethinkSearch;
}

/**
 * Match an array of array of search objects to a filter using « or » operator
 * @param  {Array<Array<Object>>} array  The search object
 * @param  {Function}   onFail Called if any search object is malformed
 * @return {Array<Object>} The AST generated by RethinkDB
 */
function arrayOfArrayToRethinkFilters(array, onFail) {
    let rethinkSearch = r;

    array.forEach((searchObj, i) => {
        // First call, do not call or
        const subSearch = arrayToRethinkFilters(searchObj, onFail);

        /* istanbul ignore next */
        if (subSearch === null) {
            return [null, null];
        }

        if (i !== 0) {
            rethinkSearch = rethinkSearch.or(subSearch);
        } else {
            rethinkSearch = subSearch;
        }
    });

    return rethinkSearch;
}

/**
 * Search among all documents of a model.
 */
const router = new express.Router();

router.get('/:model/search', (req, res, next) => {
    log.info(`Search ${req.params.model} ${JSON.stringify(req.query) || ''}`, req.details);

    // Support encoded JSON (express doesn't)
    const q = qs.parse(url.parse(req.url).query).q;

    if (!q) {
        return next(new APIError(module, 400, 'Missing q parameter'));
    }

    let searchQuery;

    try {
        searchQuery = (Array.isArray(q)) ? q.map(subQ => JSON.parse(subQ)) : JSON.parse(q);
    } catch (e) {
        /* istanbul ignore next */
        return next(new APIError(module, 400, 'Invalid search object', e));
    }

    if (!Array.isArray(searchQuery)) {
        searchQuery = [searchQuery];
    }

    let orQuery     = qs.parse(url.parse(req.url).query).or || [];
    orQuery = orQuery.map(orItem => [JSON.parse(orItem)]);

    searchQuery = [searchQuery];
    searchQuery.push(...orQuery);

    // Must use a boolean variable because we want to stop the request if failed
    let failed = false;

    const filterResult = arrayOfArrayToRethinkFilters(searchQuery, () => {
        failed = true;
    });

    if (failed) {
        return next(new APIError(module, 400, 'Invalid search object'));
    }

    let request = req.Model;

    // Order
    if (req.query.orderBy) {
        if (req.query.sort === 'asc') {
            // Order ASC
            request = request.orderBy({
                index: r.asc(req.query.orderBy)
            });
        } else if (req.query.sort === 'dsc') {
            // Order DSC
            request = request.orderBy({
                index: r.desc(req.query.orderBy)
            });
        } else {
            // Order Default
            request = request.orderBy({
                index: req.query.orderBy
            });
        }
    }

    request = request.filter(filterResult);

    // Limit
    if (req.query.limit) {
        request = request.limit(req.query.limit);
    }

    // Skip/Offset
    if (req.query.offset) {
        request = request.skip(req.query.offset);
    }

    // Embed multiple relatives
    if (req.query.embed) {
        request = request.embed(req.query.embed);
    }

    request
        .run()
        .then((result) => {
            res
                .status(200)
                .json(result)
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.param('model', modelParser);

module.exports = router;
