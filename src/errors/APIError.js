class ExtendableError extends Error {
    constructor(message) {
        super(message);

        this.name = this.constructor.name;
        
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else { 
            this.stack = (new Error(message)).stack; 
        }
    }
}    

class APIError extends ExtendableError {
    /**
     * Instantiates a new APIError
     * @param {Number} status  The HTML status code
     * @param {Number} code    Unique code error identifier
     * @param {String} message The error description
     * @param {Mixed}  details Any other relative information
     */
    constructor(status, code, message, details = {}) {
        super(message);

        this.code    = code;
        this.status  = status;
        this.details = details;
    }

    toJSON() {
        return {
            code   : this.code,
            name   : this.name,
            message: this.message,
            details: this.details
        };
    }
}

module.exports = APIError;