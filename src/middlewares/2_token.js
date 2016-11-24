const jwt      = require('jsonwebtoken');
const Promise  = require('bluebird');
const APIError = require('../errors/APIError');
const config   = require('../config');

Promise.promisifyAll(jwt);

const disableAuth = false;

/**
 * Parses the client token
 * @param  {Request}  req  Express request
 * @param  {Response} res  Express response
 * @param  {Function} next Next middleware
 * @return {Function} The next middleware
 */
module.exports = function token(req, res, next) {
    const secret = config.app.secret;

    // OpenUrls : no token required
    if (config.rights.openUrls.indexOf(req.path) > -1 || disableAuth) {
        return next();
    }

    // Config is invalid
    /* istanbul ignore if */
    if (!secret) {
        throw new Error('config.app.secret must be set');
    }

    // Missing header
    if (!(req.headers && req.headers.authorization)) {
        return next(new APIError(400, 'No token or scheme provided. Header format is Authorization: Bearer [token]'));
    }

    const parts = req.headers.authorization.split(' ');
    // Invalid format (`Bearer Token`)
    if (parts.length !== 2) {
        return next(new APIError(400, 'No token or scheme provided. Header format is Authorization: Bearer [token]'));
    }

    const scheme = parts[0];
    const bearer = parts[1];
    // Invalid format (`Bearer Token`)
    if (scheme.toLowerCase() !== 'bearer') {
        return next(new APIError(400, 'Scheme is `Bearer`. Header format is Authorization: Bearer [token]'));
    }

    let connectType;

    const pinLoggingAllowed = config.rights.pinLoggingAllowed;
    const now               = Date.now();

    jwt
        .verifyAsync(bearer, secret)
        .then((decoded) => {
            const userId = decoded.id;
            connectType  = decoded.connectType;

            return req.app.locals.models.User.get(userId).getJoin({
                rights: {
                    period: true,
                    point : true
                }
            });
        })
        .then((user) => {
            req.user = user;

            req.user.rights = req.user.rights
                .filter((right) => {
                    // If pin is not allowed with this right, pass
                    if (connectType === 'pin' && pinLoggingAllowed.indexOf(right.name) === -1) {
                        return false;
                    }

                    if (right.period.start <= now && right.period.end > now) {
                        if (right.name !== 'admin' && right.point) {
                            return (right.point.id === req.Point_id);
                        }

                        return true;
                    }

                    // This right should not be added as it is over
                    return false;
                });

            return next();
        })
        .catch(jwt.TokenExpiredError, err =>
            next(new APIError(401, 'Token expired', err))
        )
        .catch(jwt.JsonWebTokenError, err =>
            next(new APIError(401, 'Invalid token', err))
        );
};
