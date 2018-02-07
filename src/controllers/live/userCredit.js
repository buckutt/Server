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
        app.locals.modelChanges.on('userCreditUpdate', (user) => {
            const credit = (typeof user.get === 'function')
                ? user.get('credit')
                : user.credit;

            send(clients, user.id, credit);
        });
    },

    client(clients, client) {
        clients[client.id].userCredit = true;
    }
};
