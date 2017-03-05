module.exports.marshal = function (mw) {
    return function (socket, app) {
        let result = {
            err: null,
            headers: {}
        };

        socket.connector = socket.connector || {
            authorized: socket.client.request.client.authorized,

            headers: socket.client.request.headers,

            query: {},

            path: '/changes',

            method: 'GET',

            models: app.locals.models,

            header(name, value) {
                result.headers[name] = value;
            },

            getClientFingerprint() {
                return socket.client.request.connection.getPeerCertificate().fingerprint.replace(/:/g, '').trim();
            },

            next(err) {
                result.err = err;
            }
        };

        mw(socket.connector);

        return result;
    }
};
