const logger                 = require('./lib/log');
const { allModels }          = require('./lib/modelParser');
const APIError               = require('./errors/APIError');
const middlewares            = require('./middlewares');
const { marshal, unmarshal } = require('./middlewares/connectors/socket');

const log = logger(module);

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

const broadcast = (clients, action, model, doc) => {
    Object.keys(clients)
        .map(id => clients[id])
        .filter(client => client.subscriptions.indexOf(model) > -1)
        .forEach((client) => {
            client.emit(action, doc);
        });
};

/**
 * Start a socketio server on an express instance
 * @param {HTTPServer} httpServer The node std http server
 * @param {Express}    app        The express instance
 */
module.exports.ioServer = (httpServer, app) => {
    const io = require('socket.io')(httpServer, {
        path       : '/changes',
        serveClient: false,
        wsEngine   : 'uws'
    });

    app.locals.io = io;

    const clients = {};

    allModels
        .map(modelName => app.locals.models[modelName])
        .forEach(Model => listenForModelChanges(Model, clients));

    io.on('connection', (client) => {
        client.send('bonjour');
        // for (let key of Object.keys(middlewares)) {
        //     const result = marshal(middlewares[key])(client, app);

        //     if (result.err) {
        //         console.log('EMIT ERR', result.err.message);
        //         client.send('APIError', result.err.message);
        //         return;
        //     }
        // }

        client.on('listen', (models) => {
            clients[client.id] = { client };
            clients[client.id].subscriptions = models;
        });

        client.on('disconnect', () => {
            delete clients[client.id];
        });
    });
};
