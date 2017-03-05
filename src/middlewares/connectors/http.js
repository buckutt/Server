module.exports.marshal = function (mw) {
    return function (req, res, next) {
        // Connector should be kept throught middlesares to keep req.user, req.fingerprint, etc.
        // That's why it's set inside req.connector
        req.connector = req.connector || {
            authorized: req.client.authorized,

            headers: req.headers,

            query: req.query,

            path: req.path,

            method: req.method,

            models: req.app.locals.models,

            handleSocket() {
                req.app.locals.io.eio.handleRequest(req, res);
            },

            header(name, value) {
                res.header(name, value);
            },

            getClientFingerprint() {
                return req.connection.getPeerCertificate().fingerprint.replace(/:/g, '').trim()
            },

            next(err) {
                next(err);
            }
        };

        return mw(req.connector);
    };
};

module.exports.unmarshal = function (req, res, next) {
    req.fingerprint = req.connector.fingerprint;
    req.Point_id    = req.connector.Point_id;
    req.Event_id    = req.connector.Event_id;
    req.device      = req.connector.device;
    req.point       = req.connector.point;
    req.event       = req.connector.event;
    req.user        = req.connector.user;

    next();
};
