/* eslint-disable func-names */

const assert = require('assert');

/* global unirest, q */

describe('Issue #99', () => {
    it('should allow search endpoint', (done) => {
        unirest.post('https://localhost:3006/services/login')
            .send({
                meanOfLogin: 'etuMail',
                data       : 'seller@buckless.fr',
                password   : 'buckless'
            })
            .end((response) => {
                console.log(response.body);
                assert.equal(200, response.code);
                assert.equal(true, response.body.hasOwnProperty('user'));

                const token = response.body.token;

                const q1 = q({
                    field  : 'name',
                    matches: '^Ice'
                });

                unirest.get(`https://localhost:3006/articles/search?q[]=${q1}`)
                    .header('Authorization', `Bearer ${token}`)
                    .end((response2) => {
                        assert.equal(200, response2.code);
                        done();
                    });
            });
    });
});
