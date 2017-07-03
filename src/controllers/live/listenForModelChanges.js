const { modelsNames } = require('../../lib/modelParser');

const broadcast = (clients, action, model, data) => {
    Object.keys(clients)
        .map(id => clients[id])
        .filter(client => Array.isArray(client.listenForModelChanges))
        .filter(client => client.listenForModelChanges.indexOf(model) > -1)
        .forEach((client) => {
            client.client.emit(action, { model, data });
        });
};

module.exports = {
    route: 'listen',

    setup(app, clients) {
        app.locals.modelChanges.on('data', (action, model, data) => {
            broadcast(clients, action, model, data);
        });
    },

    client(clients, client, models) {
        /* istanbul ignore else */
        if (Array.isArray(models)) {
            clients[client.id].listenForModelChanges = models
                .map(m => modelsNames[m.toLowerCase()]);

            client.emit('listening', clients[client.id].listenForModelChanges);
        }
    }
};
