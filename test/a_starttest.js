/* eslint-disable func-names */

const assert   = require('assert');
const unirest  = require('unirest');
const syncExec = require('sync-exec');
const moment   = require('moment');
const app      = require('../src/app');

describe('Should start the test application', () => {
    before(function (done) {
        this.timeout(10000);

        let sslDateResult = syncExec('openssl x509 -noout -enddate -in ssl/templates//test-crt.pem').stdout;
        sslDateResult = sslDateResult.split('=').pop();

        let date = moment(sslDateResult, ['MMM D HH:mm:ss YYYY', 'MMM  D HH:mm:ss YYYY']);

        // Remove GMT
        date = date
            .add(moment().utcOffset(), 'minutes')
            .utcOffset(0);

        if (date.isBefore(moment())) {
            throw new Error('Test SSL certificates are outdated');
        }

        app
            .start()
            .then(() => done());
    });

    it('should refuse if no ssl certificate is present', (done) => {
        unirest.request('https://localhost:3006/', {
            cert              : null,
            key               : null,
            ca                : null,
            strictSSL         : false,
            rejectUnauthorized: false
        }, (error, res) => {
            assert.equal(error, null);
            assert.equal(401, res.statusCode);
            assert.equal('Unauthorized : missing client HTTPS certificate', res.body);

            done();
        });
    });
});
