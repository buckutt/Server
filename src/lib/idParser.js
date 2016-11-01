const APIError = require('../errors/APIError');

const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

/**
 * Check if the id is a correct guid
 * @param  {Request}  req   Express request
 * @param  {Response} res   Express Response
 * @param  {Function} next  Next middleware
 * @param  {String}   value The query value
 * @return {Function} The next middleware
 */
function id(req, res, next, value) {
    if (uuid.test(value) || value === 'search') {
        return next();
    }

    return next(new APIError(400, 'id is not a guid/uuid'));
}

module.exports = id;
