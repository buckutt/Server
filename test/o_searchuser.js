/* eslint-disable func-names */

const assert = require('assert');

/* global unirest */

describe('SearchUser', () => {
    it('should return the requested list of user', (done) => {
        unirest.get('https://localhost:3006/services/manager/searchuser?name=gab juc')
            .end((response) => {
                assert.equal(200, response.code);
                assert.equal(1, response.body.length);
                assert.equal('gabriel', response.body[0].firstname);

                done();
            });
    });
});
