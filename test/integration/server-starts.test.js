/* eslint-disable func-names */
const path         = require('path');
const fs           = require('fs-extra');
const assert       = require('assert');
const https        = require('https');
const axiosFactory = require('../utils/axios');

const startServer = require('../utils/startServer');

describe('Should start the test application', () => {
    before(function () {
        this.timeout(30 * 1000);
        return startServer();
    });

    it('should have generated test certificates', () => {
        const testDirectory = path.join(__dirname, '..', 'ssl', 'test');
        const crt = path.join(testDirectory,  'test-crt.pem');
        const csr = path.join(testDirectory,  'test-csr.pem');
        const key = path.join(testDirectory,  'test-key.pem');
        const p12 = path.join(testDirectory,  'test.p12');

        return fs.pathExists(testDirectory)
            .then(() => {
                return Promise.all([crt, csr, key, p12].map(p => fs.pathExists(p)));
            });
    });

    it('should listen', () => {
        return axiosFactory().get('/');
    });

    it('should refuse if no ssl certificate is present', () => {
        return axiosFactory()
            .request('/articles', { agent: new https.Agent() })
            .catch((err) => {
                assert.equal(401, err.response.data.status);
                assert.equal(err.response.data.message, 'Unauthorized : missing client HTTPS certificate');

                return Promise.resolve();
            });
    });
});
