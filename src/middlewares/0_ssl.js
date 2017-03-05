const APIError = require('../errors/APIError');

/**
 * Enforce client SSL certificate
 * @param {Object} connector HTTP/Socket.IO connector
 */
module.exports = (connector) => {
    if (connector.path === '/socket.io/') {
        return connector.handleSocket();
    }

    /* istanbul ignore next */
    if (connector.headers['x-certificate-fingerprint']) {
        connector.fingerprint = connector.headers['x-certificate-fingerprint'].toUpperCase();
        return connector.next();
    }

    if (!connector.authorized) {
        return connector.next(new APIError(401, 'Unauthorized : missing client HTTPS certificate'));
    }

    connector.fingerprint = connector.getClientFingerprint();

    return connector.next();
};
