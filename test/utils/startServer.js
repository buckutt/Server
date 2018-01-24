const app = require('../../src/app');

const bookshelf     = require('../../src/lib/bookshelf');
const sslConfig     = require('../../scripts/sslConfig');
const { addDevice } = require('../../scripts/addDevice');

let testsInit = false;

function setupTests() {
    sslConfig('test', 'test');

    return bookshelf.knex.seed
        .run()
        .then(() => addDevice({ admin: true, deviceName: 'test', password: 'test' }))
}

module.exports = () => {
    if (testsInit) {
        return Promise.resolve();
    }

    testsInit = true;

    return bookshelf
        .sync()
        .then(() => bookshelf.knex('periods').count())
        .then(count => count === 0 ? setupTests() : Promise.resolve())
        .then(() => app.start())
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
