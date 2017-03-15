const jwt      = require('jsonwebtoken');
const Promise  = require('bluebird');
const APIError = require('../errors/APIError');
const config   = require('../../config');

Promise.promisifyAll(jwt);

/**
 * Parses the client token
 * @param {Object} connector HTTP/Socket.IO connector
 */
module.exports = function token(connector) {
    const secret = config.app.secret;

    // OpenUrls : no token required
    if (config.rights.openUrls.indexOf(connector.path) > -1 || config.disableAuth) {
        return Promise.resolve();
    }

    // Config is invalid
    /* istanbul ignore if */
    if (!secret) {
        throw new Error('config.app.secret must be set');
    }

    // Missing header or querystring
    if (!(connector.headers && connector.headers.authorization) && !connector.query.authorization) {
        const err = new APIError(400, 'No token or scheme provided. Header format is Authorization: Bearer [token]');
        return Promise.reject(err);
    }

    let parts = connector.headers.authorization || connector.query.authorization;
    parts     = parts.split(' ');

    // Invalid format (`Bearer Token`)
    if (parts.length !== 2) {
        const err = new APIError(400, 'No token or scheme provided. Header format is Authorization: Bearer [token]');
        return Promise.reject(err);
    }

    const scheme = parts[0];
    const bearer = parts[1];
    // Invalid format (`Bearer Token`)
    if (scheme.toLowerCase() !== 'bearer') {
        return Promise.reject(new APIError(400, 'Scheme is `Bearer`. Header format is Authorization: Bearer [token]'));
    }

    let connectType;

    const pinLoggingAllowed = config.rights.pinLoggingAllowed;
    const now               = Date.now();

    return jwt
        .verifyAsync(bearer, secret)
        .then((decoded) => {
            const userId = decoded.id;
            connectType  = decoded.connectType;

            return connector.models.User.get(userId).getJoin({
                rights: {
                    period: true,
                    point : true
                }
            });
        })
        .then((user) => {
            connector.user = user;

            connector.user.rights = connector.user.rights
                .filter((right) => {
                    // If pin is not allowed with this right, pass
                    if (connectType === 'pin' && pinLoggingAllowed.indexOf(right.name) === -1) {
                        return false;
                    }

                    if (right.period.start <= now && right.period.end > now) {
                        if (right.name !== 'admin' && right.point) {
                            return (right.point.id === connector.Point_id);
                        }

                        return true;
                    }

                    // This right should not be added as it is over
                    return false;
                });

            connector.jwtChecked = true;
            return Promise.resolve();
        })
        .catch(jwt.TokenExpiredError, err =>
            Promise.reject(new APIError(401, 'Token expired', err))
        )
        .catch(jwt.JsonWebTokenError, err =>
            Promise.reject(new APIError(401, 'Invalid token', err))
        );
};
