const APIError = require('../errors/APIError');
const config   = require('../../config');

/**
 * Check for the current user wether he can do what he wants
 * @param {Object} connector HTTP/Socket.IO connector
 */
module.exports = (connector) => {
    const authorize = config.rights;

    if (config.rights.openUrls.indexOf(connector.path) > -1 || config.disableAuth) {
        return Promise.resolve();
    }

    if ((connector.user && config.rights.loggedUrls.indexOf(connector.path) > -1) || config.disableAuth) {
        return Promise.resolve();
    }

    const rights = connector.user.rights || [];
    let url      = connector.path;
    const method = connector.method;

    let handled = false;

    for (const right of rights) {
        // Admin/Treasurer : he does whatever he wants
        if (authorize.all.indexOf(right.name) > -1) {
            handled = true;

            return Promise.resolve();
        }

        const uuid = /[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

        if (uuid.test(url)) {
            url = url.slice(0, -37);
        }

        // Get : check for read authorizations
        // Post/Put/Delete : check for write authorizations
        if (method.toLowerCase() === 'get' && authorize[right.name].read.indexOf(url) > -1) {
            handled = true;

            return Promise.resolve();
        } else if (authorize[right.name].write.indexOf(url) > -1) {
            handled = true;

            return Promise.resolve();
        }
    }

    if (!handled) {
        return Promise.reject(new APIError(401, 'Unauthorized', 'No right to do that'));
    }
};
