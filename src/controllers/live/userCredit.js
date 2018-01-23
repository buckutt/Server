const send = (clients, userId, credit) => {
    const client = Object.keys(clients)
        .map(id => clients[id])
        .filter(c => c.userCredit)
        .find(c => c.user.id === userId);

    if (client && credit) {
        client.client.emit('userCredit', credit);
    }
};

module.exports = {
    route: 'userCredit',

    setup(app, clients) {
        console.log('setting up userCredit')

        app.locals.modelChanges.on('userCreditUpdate', (user) => {
            send(clients, user.id, user.credit);
        });
    },

    client(clients, client) {
        clients[client.id].userCredit = true;
    }
};
