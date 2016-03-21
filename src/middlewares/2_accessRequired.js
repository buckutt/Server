import APIError from '../errors/APIError';

const disableAuth = false;

/**
 * Check for the current user wether he can do what he wants
 * @param  {Request}  req  Express request
 * @param  {Response} res  Express response
 * @param  {Function} next Next middleware
 * @return {Function} The next middleware
 */
export default function accessRequired (req, res, next) {
    const authorize = req.app.locals.config.rightsManagement;

    if (req.url === '/services/login' || disableAuth) {
        return next();
    }

    const rights = req.user.rights || [];
    let url    = req.path;
    const method = req.method;

    let handled = false;

    rights.forEach(right => {
        // Admin/Treasurer : he does whatever he wants
        if (authorize.all.indexOf(right.name) > -1) {
            handled = true;

            return next();
        }

        const uuid = /[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

        if (uuid.test(url)) {
            url = url.slice(0, -37);
        }

        // Get : check for read authorizations
        // Post/Put/Delete : check for write authorizations
        if (method.toLowerCase() === 'get' && authorize[right.name].read.indexOf(url) > -1) {
            handled = true;

            return next();
        } else if (authorize[right.name].write.indexOf(url) > -1) {
            handled = true;

            return next();
        }
    });

    if (!handled) {
        return next(new APIError(401, 'Unauthorized', 'No right to do that'));
    }
}
