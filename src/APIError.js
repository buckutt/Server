/**
 * Custom application error
 */
export default class APIError extends Error {
    /**
     * Instantiates a new APIError
     * @param {Number} status  The HTML status code
     * @param {String} message The error description
     * @param {Mixed}  details Any other relative information
     */
    constructor (status, message, details = '') {
        super();
        this.message = message;
        this.status  = status;
        this.details = details;
    }
}
