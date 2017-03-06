module.exports.marshal = function (mw) {
    return function (socket, app) {
        socket.connector = socket.connector || {
            authorized: socket.client.request.client.authorized,

            headers: socket.client.request.headers,

            query: {},

            path: '/changes',

            method: 'GET',

            models: app.locals.models,

            result: {
                err: null,
                headers: {}
            },

            header(name, value) {
                result.headers[name] = value;
            },

            getClientFingerprint() {
                return socket.client.request.connection.getPeerCertificate().fingerprint.replace(/:/g, '').trim();
            },

            next(err) {
                socket.connector.result.err = err || null;
                socket.connector.result.foo = 'bar';
            }
        };

        mw(socket.connector);

        return socket.connector.result;
    }
};
