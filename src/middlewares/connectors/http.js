module.exports.marshal = function marshal(mw) {
    return function connectorMiddleware(req, res, next) {
        // Connector should be kept throught middlesares to keep req.user, req.fingerprint, etc.
        // That's why it's set inside req.connector
        req.connector = req.connector || {
            authorized: req.client.authorized,

            headers: req.headers,

            query: req.query,

            path: req.path,

            method: req.method,

            models: req.app.locals.models,

            header(name, value) {
                res.header(name, value);
            },

            getClientFingerprint() {
                return req.connection.getPeerCertificate().fingerprint.replace(/:/g, '').trim();
            }
        };

        mw(req.connector)
            .then(() => {
                return next();
            })
            .catch((err) => {
                next(err);
            });
    };
};

module.exports.unmarshal = function unmarshal(req, res, next) {
    req.fingerprint = req.connector.fingerprint;
    req.Point_id    = req.connector.Point_id;
    req.Event_id    = req.connector.Event_id;
    req.device      = req.connector.device;
    req.point       = req.connector.point;
    req.event       = req.connector.event;
    req.user        = req.connector.user;

    next();
};
