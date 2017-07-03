const APIError = require('../errors/APIError');

const types = {
    q     : 'object',
    or    : 'object',
    embed : 'object',
    filter: 'object',
    limit : 'number',
    offset: 'number'
};

const interpolate = {
    object: str => JSON.parse(str),
    number: str => parseInt(str, 10)
};

/**
 * Parses the query to build the future rethink call
 * @param {Object} connector HTTP/Socket.IO connector
 */
module.exports = function query(connector) {
    for (const q of Object.keys(types)) {
        if (connector.query.hasOwnProperty(q)) {
            if (typeof connector.query[q] !== types[q]) {
                const interpolater = interpolate[types[q]];

                try {
                    connector.query[q] = interpolater(connector.query[q]);
                } catch (e) {
                    return Promise.reject(new APIError(module, 400, 'Bad Input', `Invalid query ${q}`));
                }
            }
        }
    }

    return Promise.resolve();
};
