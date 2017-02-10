const APIError = require('./APIError');

const STATUS_CODE = 400;
const ERROR_CODE  = 0;
const MESSAGE     = 'Only SSL connections are allowed in the API.';

class SSLRequired extends APIError {
    constructor(details, status = STATUS_CODE, code = ERROR_CODE, message = MESSAGE) {
        super(status, code, message, details);
    }

}

module.exports = SSLRequired;