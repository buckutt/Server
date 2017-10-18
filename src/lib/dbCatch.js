const APIError      = require('../errors/APIError');
const { bookshelf } = require('./bookshelf');

module.exports = function dbCatch(module_, err, next) {
    console.log(err);
    if (err.constraint && err.constraint.endsWith('_unique')) {
        return next(new APIError(module_, 400, 'Duplicate Entry', err.message));
    }

    /* istanbul ignore next */
    if (err instanceof bookshelf.Model.NotFoundError) {
        return next(new APIError(module_, 404, 'Not Found', err.message));
    }

    /* istanbul ignore next */
    if (err instanceof bookshelf.Model.NoRowsUpdatedError) {
        return next(new APIError(module_, 400, 'Invalid model', err.message));
    }

    if (err instanceof APIError) {
        return next(err);
    }

    /* istanbul ignore next */
    next(err);
};
