/**
 * Custom application error
 */
module.exports = class APIError extends Error {
    /**
     * Instantiates a new APIError
     * @param {Number} status  The HTML status code
     * @param {String} message The error description
     * @param {Mixed}  details Any other relative information
     */
    constructor(status, message, details = '') {
        super(message);
        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);

        this.message = message;
        this.status  = status;
        this.details = details;
    }

    toJSON() {
        return {
            status : this.status,
            message: this.message,
            details: this.details
        };
    }
};
