const APIError = require('../errors/APIError');

/**
 * Enforce client SSL certificate
 * @param {Object} connector HTTP/Socket.IO connector
 */
module.exports = (connector) => {
    if (connector.path === '/socket.io/') {
        // If request is socket io xhr polling, make socketio directly handle it
        return connector.handleSocket();
    }

    /* istanbul ignore next */
    if (connector.headers['x-certificate-fingerprint']) {
        connector.fingerprint = connector.headers['x-certificate-fingerprint'].toUpperCase();
        return Promise.resolve();
    }

    if (!connector.authorized) {
        return Promise.reject(new APIError(401, 'Unauthorized : missing client HTTPS certificate'));
    }

    connector.fingerprint = connector.getClientFingerprint();

    return Promise.resolve();
};
