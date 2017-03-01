/* eslint-disable func-names */

const assert = require('assert');

/* global unirest */

describe('generate-client', () => {
    it('should send the generated client', function (done) {
        this.timeout(50000);

        unirest.get('https://localhost:3006/services/client')
            .query({ deviceId: 0, password: 'test' })
            .end((response) => {
                assert.equal(200, response.code);
                assert(response.body.length > 100);
                done();
            });
    });

    it('should regenerate it with ?invalidate', function (done) {
        this.timeout(50000);

        unirest.get('https://localhost:3006/services/client')
            .query({ invalidate: 1 })
            .end((response) => {
                assert.equal(200, response.code);
                assert(response.body.length > 100);
                done();
            });
    });
});
