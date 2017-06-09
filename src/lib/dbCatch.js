const { ReqlRuntimeError } = require('rethinkdbdash/lib/error');
const APIError             = require('../errors/APIError');

module.exports = function dbCatch(module_, err, next) {
    if (err.message === 'DocumentNotFound' || err === 'Document not found' || err.msg === 'Document not found') {
        return next(new APIError(module_, 404, 'Document not found'));
    }

    /* istanbul ignore next */
    if (err.message === 'ValidationError') {
        return next(new APIError(module_, 400, 'Invalid model', err.message));
    }

    /* istanbul ignore next */
    if (err.message === 'InvalidWrite') {
        return next(new APIError(module_, 500, 'Couldn\'t write to disk', err));
    }

    if (err instanceof APIError || err instanceof ReqlRuntimeError) {
        return next(err);
    }

    /* istanbul ignore next */
    next(err);
};
