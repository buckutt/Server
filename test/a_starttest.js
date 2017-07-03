/* eslint-disable func-names */

const assert  = require('assert');
const unirest = require('unirest');
const app     = require('../src/app');

const sslConfig     = require('../scripts/sslConfig');
const requelize     = require('../src/lib/requelize');
const seed          = require('../scripts/seed');
const { addDevice } = require('../scripts/addDevice');

// Define models
require('../src/models');

describe('Should start the test application', () => {
    before(function (done) {
        this.timeout(30000);

        sslConfig('test', 'test');

        requelize.sync()
            .then(() => seed())
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
