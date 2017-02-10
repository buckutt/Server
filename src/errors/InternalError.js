const APIError = require('./APIError');

const STATUS_CODE = 500;
const ERROR_CODE  = 1;
const MESSAGE     = 'Something went long. Please contact the administrator or try again later.';

class InternalError extends APIError {
    constructor(details, status = STATUS_CODE, code = ERROR_CODE, message = MESSAGE) {
        super(status, code, message, details);
    }

}

module.exports = InternalError;