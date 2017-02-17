/* eslint-disable func-names */

const assert = require('assert');
const fs     = require('fs');

/* global unirest */

describe('addDevice', () => {
    it('should not return a .p12', function (done) {
        this.timeout(50000);

        unirest.get('https://localhost:3006/services/certificate')
            .query({ deviceId: 0, password: 'test' })
            .end((response) => {
                assert.equal(404, response.code);
                done();
            });
    });

    it('should return a .p12', function (done) {
        this.timeout(50000);

        unirest.get('https://localhost:3006/services/certificate')
            .query({ deviceId: process.env.deviceId, password: 'test' })
            .end((response) => {
                assert.equal(200, response.code);
                done();
            });
    });

    it('should be a valid p12', (done) => {
        const p12File = fs.readFileSync('ssl/certificates/test/test.p12');
        const caFile  = fs.readFileSync('ssl/certificates/ca/ca-crt.pem');

        const options = {
            pfx               : p12File,
            passphrase        : 'test',
            ca                : caFile,
            strictSSL         : false,
            rejectUnauthorized: false
        };

        unirest.request = unirest.request.defaults(options);

        unirest
            .get('https://localhost:3006/articles')
            .end((response) => {
                assert.equal(200, response.code);
                done();
            });
    });
});
