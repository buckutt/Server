const send = (clients, userId, credit, reason, data) => {
    const client = Object.keys(clients)
        .map(id => clients[id])
        .filter(c => c.userCredit)
        .find(c => c.user.id === userId);

    if (client) {
        if (credit) {
            client.client.emit('userCredit', credit);
        }

        if (reason) {
            client.client.emit(`userCredit.${reason}`, data);
        }
    }
};

module.exports = {
    route: 'userCredit',

    setup(app, clients) {
        app.locals.modelChanges.on('data', (action, Model, data) => {
            if (Model !== 'User' && Model !== 'Purchase' && Model !== 'Reload' && Model !== 'Transfer') {
                return;
            }

            if (Model === 'User' && action === 'update' && data.from.credit !== data.to.credit) {
                // Send credit update, without reason (reason will be Purchase, Reload or Transfer)
                send(clients, data.to.id, data.to.credit);
            } else if (Model === 'Purchase' && action === 'create') {
                // Send reason : purchase
                send(clients, data.to.Buyer_id, null, 'purchase', data.to);
            } else if (Model === 'Reload' && action === 'create') {
                // Send reason : reload
                send(clients, data.to.Buyer_id, null, 'reload', data.to);
            } else if (Model === 'Transfer' && action === 'create') {
                // Send reason to both sender and reciever
                send(clients, data.to.Sender_id, null, 'transfer', data.to);
                send(clients, data.to.Reciever_id, null, 'transfer', data.to);
            }
        });
    },

    client(clients, client) {
        clients[client.id].userCredit = true;
    }
};
