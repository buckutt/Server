const logger          = require('./lib/log');
const { modelsNames } = require('./lib/modelParser');
const middlewares     = require('./middlewares');
const { marshal }     = require('./middlewares/connectors/socket');

const log = logger(module);

const broadcast = (clients, action, model, data) => {
    Object.keys(clients)
        .map(id => clients[id])
        .filter(client => Array.isArray(client.subscriptions))
        .filter(client => client.subscriptions.indexOf(model) > -1)
        .forEach((client) => {
            client.client.emit(action, { model, data });
        });
};

const listenForModelChanges = (Model, clients) => {
    Model.changes().then((feed) => {
        feed.each((err, doc) => {
            /* istanbul ignore if */
            if (err) {
                return;
            }

            if (doc.isSaved() === false) {
                broadcast(clients, 'delete', Model._name, doc);
            } else if (!doc.getOldValue()) {
                broadcast(clients, 'create', Model._name, doc);
            } else {
                broadcast(clients, 'update', Model._name, { from: doc.getOldValue(), to: doc });
            }
        });
    });
};

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

    Object.keys(modelsNames)
        .map(n => modelsNames[n])
        .map(modelName => app.locals.models[modelName])
        .forEach(Model => listenForModelChanges(Model, clients));

    io.on('connection', (client) => {
        let initialPromise = Promise.resolve();

        for (const key of Object.keys(middlewares)) {
            initialPromise = initialPromise
                .then(() => marshal(middlewares[key])(client, app))
                .then((result) => {
                    if (result.err) {
                        return Promise.reject(result.err);
                    }
                });
        }

        initialPromise = initialPromise
            .then(() => {
                client.emit('connected');

                client.on('listen', (models) => {
                    /* istanbul ignore else */
                    if (Array.isArray(models)) {
                        clients[client.id] = { client };
                        clients[client.id].subscriptions = models
                            .map(m => modelsNames[m.toLowerCase()]);

                        client.emit('listening', clients[client.id].subscriptions);
                    }
                });

                client.on('disconnect', () => {
                    delete clients[client.id];
                });
            })
            .catch((err) => {
                client.emit('APIError', err.message);
                log.warn('socket error:', err.message);
            });
    });

    io.on('error', (err) => {
        /* istanbul ignore next */
        log.error(err);
    });
};
