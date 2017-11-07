const moment = require('moment');

module.exports.marshal = function marshal(mw) {
    return function connectorMiddleware(req, res, next) {
        // Connector should be kept throught middlewares to keep req.user, req.fingerprint, etc.
        // That's why it's set inside req.connector
        req.connector = req.connector || {
            ip: req.ip,

            authorized: req.client.authorized,

            headers: req.headers,

            query: req.query,

            path: req.path,

            method: req.method,

            models: req.app.locals.models,

            get date() {
                const headerDate = moment(req.headers.date);

                return (headerDate.isValid()) ? headerDate.toDate() : new Date();
            },

            header(name, value) {
                res.header(name, value);
            },

            getClientFingerprint() {
                return req.connection.getPeerCertificate().fingerprint.replace(/:/g, '').trim();
            }
        };

        return mw(req.connector)
            .then(() => {
                next();
                return null;
            })
            .catch((err) => {
                next(err);
                return null;
            });
    };
};

module.exports.unmarshal = function unmarshal(req, res, next) {
    req.fingerprint = req.connector.fingerprint;
    req.point_id    = req.connector.point_id;
    req.event_id    = req.connector.event_id;
    req.device      = req.connector.device;
    req.point       = req.connector.point;
    req.event       = req.connector.event;
    req.user        = req.connector.user;
    req.details     = req.connector.details;
    req.connectType = req.connector.connectType;

    next();
};
