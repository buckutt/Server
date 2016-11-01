/**
 * Enforce client SSL certificate
 * @param  {Request}  req  Express request
 * @param  {Response} res  Express response
 * @param  {Function} next Next middleware
 * @return {Function} The next middleware
 */
module.exports = (req, res, next) => {
    if (!req.client.authorized) {
        return res
            .status(401)
            .end('Unauthorized : missing client HTTPS certificate');
    }

    return next();
};
