const logger                 = require('./lib/log');
const { allModels }          = require('./lib/modelParser');
const APIError               = require('./errors/APIError');
const middlewares            = require('./middlewares');
const { marshal, unmarshal } = require('./middlewares/connectors/socket');

const log = logger(module);

/**
 * Start a socketio server on an express instance
 * @param {HTTPServer} httpServer The node std http server
 * @param {Express}    app        The express instance
 */
module.exports.ioServer = (httpServer, app) => {
    const io = require('socket.io')(httpServer, {
        path: '/changes',
        serveClient: false
    });

    const clients = {};

    allModels
        .map(modelName => app.locals.models[modelName])
        .forEach(Model => listenForModelChanges(Model));

    const listenForModelChanges = (Model) => {
        Model.changes().then((feed) => {
            feed.each((err, doc) => {
                /* istanbul ignore if */
                if (err) {
                    return;
                }

                if (doc.isSaved() === false) {
                    broadcast('delete', Model._name, doc);
                } else if (!doc.getOldValue()) {
                    broadcast('create', Model._name, doc);
                } else {
                    broadcast('update', Model._name, { from: doc.getOldValue(), to: doc });
                }
            });
        });
    };

    const broadcast = (action, model, doc) => {
        clients
            .filter(client => client.subscriptions.indexOf(model) > -1)
            .forEach((client) => {
                client.emit(action, doc);
            });
    };

    io.on('connection', (client) => {
        for (let key of Object.keys(middlewares)) {
            const result = marshal(middlewares[key])(client, app);

            if (result.err) {
                client.emit('error', result);
                client.disconnect();
                return;
            }
        }

        client.on('listen', (models) => {
            clients[client.id] = { client };
            clients[client.id].subscriptions = models;
        });

        client.on('disconnect', () => {
            delete clients[client.id];
        });
    });
};
