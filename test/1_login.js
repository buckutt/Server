import assert from 'assert';
import jwt    from 'jsonwebtoken';

/* global unirest */

// Prepare global token (passed to other tests)
process.env.TOKEN = '';

describe('Login', () => {
    it('should refuse requests before auth', done => {
        unirest.post('https://localhost:3006/articles')
            .type('json')
            .send([])
            .end(response => {
                assert.equal(401, response.code);
                done();
            });
    });

    it('should refuse paths when the user does not have the right to', done => {
        unirest.post('https://localhost:3006/services/login')
            .type('json')
            .send({
                meanOfLogin: 'etuMail',
                data       : 'norights@buckless.fr',
                password   : 'buckless'
            })
            .end(response => {
                assert.equal(200, response.code);

                unirest.get('https://localhost:3006/articles')
                    .header('Authorization', `Bearer ${response.body.token}`)
                    .type('json')
                    .end(response2 => {
                        assert.equal(401, response2.code);
                        done();
                    });
            });
    });

    let sellerToken;
    it('should allow user when they have specific (not admin) rights', done => {
        unirest.post('https://localhost:3006/services/login')
            .type('json')
            .send({
                meanOfLogin: 'etuMail',
                data       : 'seller@buckless.fr',
                password   : 'buckless'
            })
            .end(response => {
                assert.equal(200, response.code);
                sellerToken = response.body.token;

                unirest.get('https://localhost:3006/articles')
                    .header('Authorization', `Bearer ${sellerToken}`)
                    .type('json')
                    .end(response2 => {
                        assert.equal(200, response2.code);
                        done();
                    });
            });
    });

    it('should also works when requesting an allowed url containing an id', done => {
        unirest.get('https://localhost:3006/articles/3f2504e0-4f89-11d3-9a0c-0305e82c3301')
            .header('Authorization', `Bearer ${sellerToken}`)
            .type('json')
            .end(response => {
                // No result but allowed
                assert.equal(404, response.code);
                done();
            });
    });

    it('should also works when making an allowed post request', done => {
        unirest.post('https://localhost:3006/services/basket')
            .header('Authorization', `Bearer ${sellerToken}`)
            .type('json')
            .end(response => {
                // Invalid input but allowed
                assert.equal(400, response.code);
                done();
            });
    });

    it('should login with mail', done => {
        unirest.post('https://localhost:3006/services/login')
            .type('json')
            .send({
                meanOfLogin: 'etuMail',
                data       : 'buck@buckless.fr',
                password   : 'buckless'
            })
            .end(response => {
                assert.equal(200, response.code);
                assert.equal(true, response.body.hasOwnProperty('user'));

                const user  = response.body.user;
                const token = response.body.token;

                assert.equal('string', typeof user.id);
                assert.equal('string', typeof token);

                // Set token globally
                process.env.TOKEN = token;

                const rightsDecoded = jwt.decode(token);

                assert.notEqual(null, rightsDecoded);

                done();
            });
    });

    it('should login with another mean of login', done => {
        unirest.post('https://localhost:3006/services/login')
            .type('json')
            .send({
                meanOfLogin: 'etuId',
                data       : '22000000353423',
                password   : 'buckless'
            })
            .end(response => {
                assert.equal(200, response.code);
                assert.equal(true, response.body.hasOwnProperty('user'));

                const user  = response.body.user;
                const token = response.body.token;

                assert.equal('string', typeof user.id);
                assert.equal('string', typeof token);

                const rightsDecoded = jwt.decode(token);

                assert.notEqual(null, rightsDecoded);

                done();
            });
    });

    it('should login with pin', done => {
        unirest.post('https://localhost:3006/services/login')
            .type('json')
            .send({
                meanOfLogin: 'etuId',
                data       : '22000000353423',
                pin        : 1234
            })
            .end(response => {
                assert.equal(200, response.code);
                assert.equal(true, response.body.hasOwnProperty('user'));

                const user  = response.body.user;
                const token = response.body.token;

                assert.equal('string', typeof user.id);
                assert.equal('string', typeof token);

                const rightsDecoded = jwt.decode(token);

                assert.notEqual(null, rightsDecoded);

                done();
            });
    });

    it('should not log a non-existant user', done => {
        unirest.post('https://localhost:3006/services/login')
            .type('json')
            .send({
                meanOfLogin: 'etuId',
                data       : 35427,
                pin        : 1234
            })
            .end(response => {
                assert.equal(404, response.code);

                done();
            });
    });

    it('should not log a user without mol, data or pin/password', done => {
        unirest.post('https://localhost:3006/services/login')
            .type('json')
            .send({})
            .end(response => {
                assert.equal(401, response.code);

                unirest.post('https://localhost:3006/services/login')
                    .type('json')
                    .send({
                        meanOfLogin: 'etuId'
                    })
                    .end(response2 => {
                        assert.equal(401, response2.code);

                        unirest.post('https://localhost:3006/services/login')
                            .type('json')
                            .send({
                                meanOfLogin: 'etuId',
                                data       : 35427
                            })
                            .end(response3 => {
                                assert.equal(401, response3.code);

                                done();
                            });
                    });
            });
    });

    it('should not log a user submitting both pin and password', done => {
        unirest.post('https://localhost:3006/services/login')
            .type('json')
            .send({
                meanOfLogin: 'etuId',
                data       : 35427,
                pin        : 1234,
                password   : 'buckless'
            })
            .end(response => {
                assert.equal(401, response.code);

                done();
            });
    });

    it('should not log a user with wrong mol', done => {
        unirest.post('https://localhost:3006/services/login')
            .type('json')
            .send({
                meanOfLogin: 'foo',
                data       : 35427,
                pin        : 1258
            })
            .end(response => {
                assert.equal(404, response.code);

                done();
            });
    });

    it('should not log a user with wrong pin', done => {
        unirest.post('https://localhost:3006/services/login')
            .type('json')
            .send({
                meanOfLogin: 'etuId',
                data       : '22000000353423',
                pin        : 1258
            })
            .end(response => {
                assert.equal(401, response.code);

                done();
            });
    });

    it('should not log a user with wrong password', done => {
        unirest.post('https://localhost:3006/services/login')
            .type('json')
            .send({
                meanOfLogin: 'etuId',
                data       : '22000000353423',
                password   : 'foo'
            })
            .end(response => {
                assert.equal(401, response.code);

                done();
            });
    });
});
