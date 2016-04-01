import jwt      from 'jsonwebtoken';
import Promise  from 'bluebird';
import APIError from '../errors/APIError';
import config   from '../config';

Promise.promisifyAll(jwt);

const disableAuth = false;

/**
 * Parses the client token
 * @param  {Request}  req  Express request
 * @param  {Response} res  Express response
 * @param  {Function} next Next middleware
 * @return {Function} The next middleware
 */
export default function token (req, res, next) {
    const secret = config.app.secret;

    // Login : no token required
    if (req.url === '/services/login' || disableAuth) {
        return next();
    }

    // Config is invalid
    /* istanbul ignore if */
    if (!secret) {
        throw new Error('config.secret must be set');
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
        .then(decoded => {
            const userId = decoded.id;
            connectType  = decoded.connectType;

            return req.app.locals.models.User.get(userId).getJoin({
                rights: {
                    period: true,
                    point : true 
                }
            });
        })
        .then(user => {
            req.user = user;

            req.user.rights = req.user.rights
                .map(right => {
                    // If pin is not allowed with this right, pass
                    if (connectType === 'pin' && pinLoggingAllowed.indexOf(right.name) === -1) {
                        return null;
                    }

                    if (right.period.start <= now && right.period.end > now && right.point.id === req.Point_id) {
                        return right;
                    }

                    // This right should not be added as it is over
                    return null;
                })
                .filter(right => right !== null);

            return next();
        })
        .catch(jwt.TokenExpiredError, err =>
            next(new APIError(401, 'Token expired', err))
        )
        .catch(jwt.JsonWebTokenError, err =>
            next(new APIError(401, 'Invalid token', err))
        );
}
