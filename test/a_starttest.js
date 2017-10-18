/* eslint-disable func-names */

const assert  = require('assert');
const unirest = require('unirest');
const app     = require('../src/app');

const bookshelf     = require('../src/lib/bookshelf');
const sslConfig     = require('../scripts/sslConfig');
const { addDevice } = require('../scripts/addDevice');

describe('Should start the test application', () => {
    before(function (done) {
        this.timeout(30000);

        sslConfig('test', 'test');

        bookshelf.sync()
            .then(() => bookshelf.knex.seed.run())
            .then(() => addDevice({ admin: true, deviceName: 'test', password: 'test' }))
            .then(() => app.start())
            .then(() => done())
            .catch((err) => {
                console.error(err);
                process.exit(1);
            });
    });

    it('should refuse if no ssl certificate is present', (done) => {
        unirest.request('https://localhost:3006/', {
            cert              : null,
            key               : null,
            ca                : null,
            strictSSL         : false,
            rejectUnauthorized: false
        }, (error, res_) => {
            assert.equal(error, null);

            const res = JSON.parse(res_.body);
            assert.equal(401, res.status);
            assert.equal(res.message, 'Unauthorized : missing client HTTPS certificate');

            done();
        });
    });
});
