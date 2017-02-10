const APIError = require('./APIError');

const STATUS_CODE = 404;
const ERROR_CODE  = 2;
const MESSAGE     = 'Sorry, that page does not exist.';

class NotFound extends APIError {
    constructor(status = STATUS_CODE, code = ERROR_CODE, message = MESSAGE, details = {}) {
        super(status, code, message, details);
    }

}

module.exports = NotFound;