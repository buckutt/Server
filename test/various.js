/* eslint-disable func-names */

const assert = require('assert');

/* global unirest */

describe('Various', () => {
    it('should handle 404s', (done) => {
        unirest.get('https://localhost:3006/abcd/efgh/foo/bar')
            .type('json')
            .end((response) => {
                assert.equal(404, response.code);
                assert.equal('Not Found', response.body.message);

                done();
            });
    });
});
