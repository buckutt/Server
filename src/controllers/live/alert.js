const send = (clients, alert) => {
    Object.keys(clients)
        .map(id => clients[id])
        .filter(client => client.client.connector.event.id === alert.event_id)
        .forEach((client) => {
            client.client.emit('alert', alert);
        });
};

module.exports = {
    route: 'alert',

    setup(app, clients) {
        app.locals.modelChanges.on('data', (action, model, data) => {
            if (action !== 'create' || model !== 'Alert') {
                return;
            }

            send(clients, data.to[0]);
        });
    },

    client() {

    }
};
