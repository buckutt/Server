/* eslint-disable func-names */

const assert = require('assert');

/* global unirest, q */

describe('Issue #99', () => {
    let rid;
    let initial;

    it('should add 2 same relationships', (done) => {
        const embed = q({ users: true });

        unirest.get(`https://localhost:3006/rights?embed=${embed}`)
            .end((response) => {
                rid = response.body[0].id;

                initial = response.body[0].users.length;

                unirest.post(`https://localhost:3006/rights/${rid}/users/${process.env.GJId}`)
                    .send()
                    .end((response2) => {
                        assert.equal(200, response2.code);

                        unirest.post(`https://localhost:3006/rights/${rid}/users/${process.env.GJId}`)
                            .send()
                            .end((response3) => {
                                assert.equal(200, response3.code);

                                unirest.get(`https://localhost:3006/rights/${rid}?embed=${embed}`)
                                    .end((response4) => {
                                        assert.equal(initial + 2, response4.body.users.length);

                                        done();
                                    });
                            });
                    });
            });
    });

    it('should remove one relationship', (done) => {
        const embed = q({ users: true });

        unirest.delete(`https://localhost:3006/rights/${rid}/users/${process.env.GJId}`)
            .end((response) => {
                assert.equal(200, response.code);

                unirest.get(`https://localhost:3006/rights/${rid}?embed=${embed}`)
                    .end((response2) => {
                        assert.equal(initial + 1, response2.body.users.length);

                        unirest.delete(`https://localhost:3006/rights/${rid}/users/${process.env.GJId}`)
                            .end((response3) => {
                                assert.equal(200, response3.code);

                                unirest.get(`https://localhost:3006/rights/${rid}?embed=${embed}`)
                                    .end((response4) => {
                                        assert.equal(initial, response4.body.users.length);

                                        done();
                                    });
                            });
                    });
            });
    });
});
