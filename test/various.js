/* eslint-disable func-names */

const assert = require('assert');
const moment = require('moment');

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

    it('should handle custom request date for offline', (done) => {
        const outOfPeriodDate = moment('1995-10-10').toISOString();

        unirest.get('https://localhost:3006/articles')
            .header('date', outOfPeriodDate)
            .end((response) => {
                assert.equal(404, response.code);
                assert.equal('No assigned points', response.body.message);
                done();
            });
    });
});
