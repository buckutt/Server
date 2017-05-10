const { ReqlRuntimeError } = require('rethinkdbdash/lib/error');
const APIError             = require('../errors/APIError');

module.exports = function dbCatch(err, next) {
    if (err.message === 'DocumentNotFound' || err === 'Document not found' || err.msg === 'Document not found') {
        return next(new APIError(404, 'Document not found', err));
    }

    /* istanbul ignore next */
    if (err.message === 'ValidationError') {
        return next(new APIError(400, 'Invalid model', err));
    }

    /* istanbul ignore next */
    if (err.message === 'InvalidWrite') {
        return next(new APIError(500, 'Couldn\'t write to disk', err));
    }

    if (err instanceof APIError || err instanceof ReqlRuntimeError) {
        return next(err);
    }

    /* istanbul ignore next */
    next(new APIError(500, 'Unknown error', err));
};
