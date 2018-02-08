module.exports = (/* ticketId */) => {
    return Promise.resolve({
        firstname: 'Foo',
        lastname: 'Bar',
        mail: 'foo@bar.com',
        credit: 500
    });
}
