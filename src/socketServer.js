const fs          = require('fs');
const path        = require('path');
const logger      = require('./lib/log');
const middlewares = require('./middlewares');
const { marshal } = require('./middlewares/connectors/socket');

const controllers = fs
    .readdirSync(path.join(__dirname, 'controllers/live'))
    .filter(f => f.slice(-3) === '.js')
    .map(f => require(path.join(__dirname, 'controllers', 'live', f)));

const log = logger(module);

/**
 * Start a socketio server on an express instance
 * @param {HTTPServer} httpServer The node std http server
 * @param {Express}    app        The express instance
 */
module.exports.ioServer = (httpServer, app) => {
    const io = require('socket.io')(httpServer, {
        serveClient           : false,
        engine                : 'uws',
        handlePreflightRequest: false
    });

    app.locals.io = io;

    const clients = {};

    // Setup all controllers
    controllers.forEach(controller => controller.setup(app, clients));

    io.on('connection', (client) => {
        const socket = client;
        client.emit('connected');

        if (process.env.SERVER_PROTOCOL === 'http') {
            client.fingerprint = socket.client.request.headers['x-certificate-fingerprint'];
        } else if (socket.client.request.connection.getPeerCertificate().fingerprint) {
            client.fingerprint = socket.client.request.connection.getPeerCertificate()
                .fingerprint
                .replace(/:/g, '')
                .trim();
        } else {
            return;
        }

        controllers.forEach((controller) => {
            client.on(controller.route, (...args) => {
                let initialPromise = Promise.resolve();

                // Make client go through middlewares
                for (const key of Object.keys(middlewares)) {
                    initialPromise = initialPromise
                        .then(() => marshal(middlewares[key])(controller.route, client, app))
                        .then((result) => {
                            if (result.err) {
                                return Promise.reject(result.err);
                            }

                            return result.user;
                        });
                }

                initialPromise = initialPromise
                    .then((user) => {
                        clients[client.id] = { client, user };

                        // Make controllers aware of clients
                        controllers.forEach(c => c.client(clients, client, ...args));

                        client.on('disconnect', () => {
                            delete clients[client.id];
                        });
                    })
                    .catch((err) => {
                        client.emit('APIError', err.message);
                        log.warn('socket error:', err.message);
                    });
            });
        });
    });

    io.on('error', (err) => {
        /* istanbul ignore next */
        log.error(err);
    });
};
