module.exports.marshal = function marshal(mw) {
    return function connectorMiddleware(socket, app) {
        socket.connector = socket.connector || {
            authorized: socket.client.request.client.authorized,

            headers: socket.client.request.headers,

            query: {},

            path: '/changes',

            method: 'GET',

            models: app.locals.models,

            result: {
                err    : null,
                headers: {}
            },

            header(name, value) {
                socket.connector.result.headers[name] = value;
            },

            getClientFingerprint() {
                return socket.client.request.connection.getPeerCertificate().fingerprint.replace(/:/g, '').trim();
            }
        };

        return mw(socket.connector)
            .catch((err) => {
                socket.connector.result.err = err;

                return Promise.resolve();
            })
            .then(() => socket.connector.result);
    };
};
