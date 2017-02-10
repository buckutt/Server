const errors   = require('../errors');

const types = {
    q     : 'object',
    or    : 'object',
    embed : 'object',
    limit : 'number',
    offset: 'number'
};

const interpolate = {
    object: str => JSON.parse(str),
    number: str => parseInt(str, 10)
};

/**
 * Parses the query to build the future rethink call
 * @param  {Request}  req  Express request
 * @param  {Response} res  Express response
 * @param  {Function} next Next middleware
 * @return {Function} The next middleware
 */
module.exports = function query(req, res, next) {
    for (const q of Object.keys(types)) {
        if (req.query.hasOwnProperty(q)) {
            if (typeof req.query[q] !== types[q]) {
                const interpolater = interpolate[types[q]];

                try {
                    req.query[q] = interpolater(req.query[q]);
                } catch (e) {
                    return next(new APIError(400, 'Bad Input', `Invalid query ${q}`));
                }
            }
        }
    }

    return next();
};
