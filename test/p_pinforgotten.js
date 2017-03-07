/* eslint-disable func-names */

const assert = require('assert');
const models = require('../src/models');

/* global unirest */

describe('PinForgotten', () => {
    const mail = 'seller@buckless.fr';

    describe('Ask pin', () => {
        describe('with correct input', () => {
            it('should send a mail', (done) => {
                unirest.get('https://localhost:3006/services/manager/askpin')
                    .query({ mail })
                    .end((response) => {
                        assert.equal(200, response.code);

                        done();
                    });
            });
        });

        describe('with incorrect input', () => {
            it('should not send a mail', (done) => {
                unirest.get('https://localhost:3006/services/manager/askpin')
                    .query({
                        mail: 'this@is.incorrect'
                    })
                    .end((response) => {
                        assert.equal(404, response.code);
                        assert.equal('Incorrect mail', response.body.message);

                        done();
                    });
            });
        });
    });

    describe('Generate pin', () => {
        let key;

        describe('with correct key and pin', () => {
            let user;

            before(() => models.User.getAll(mail, { index: 'mail' })
                    .then((users) => {
                        if (!users.length) {
                            return Promise.reject(new Error('Mail incorrect'));
                        }

                        user = users[0];
                        key  = user.recoverKey;
                    }));

            it('should change the pin', (done) => {
                unirest.put('https://localhost:3006/services/manager/generatepin')
                    .send({
                        key,
                        pin: '$2a$10$5qaXOxlw5lbZau./uxKPmOgMst67CXfBOi/aCUR8cUhi0Og8QtGHq' // 1111
                    })
                    .end((response) => {
                        assert.equal(200, response.code);

                        models.User.get(user.id)
                            .then((user_) => {
                                assert.notEqual(user.pin, user_.pin);

                                done();
                            })
                            .catch(err => assert.equal(err, null));
                    });
            });
        });

        describe('with incorrect key', () => {
            it('should not change the pin', (done) => {
                unirest.put('https://localhost:3006/services/manager/generatepin')
                    .send({
                        key: 'incorrect',
                        pin: '$2a$10$5qaXOxlw5lbZau./uxKPmOgMst67CXfBOi/aCUR8cUhi0Og8QtGHq' // 1111
                    })
                    .end((response) => {
                        assert.equal(401, response.code);
                        assert.equal('Invalid key', response.body.message);

                        done();
                    });
            });
        });

        describe('with missing key', () => {
            it('should not change the pin', (done) => {
                unirest.put('https://localhost:3006/services/manager/generatepin')
                    .send({
                        pin: '$2a$10$5qaXOxlw5lbZau./uxKPmOgMst67CXfBOi/aCUR8cUhi0Og8QtGHq' // 1111
                    })
                    .end((response) => {
                        assert.equal(401, response.code);
                        assert.equal('Key is missing', response.body.message);

                        done();
                    });
            });
        });

        describe('with missing pin', () => {
            it('should not change the pin', (done) => {
                unirest.put('https://localhost:3006/services/manager/generatepin')
                    .send({
                        key
                    })
                    .end((response) => {
                        assert.equal(401, response.code);
                        assert.equal('PIN is missing', response.body.message);

                        done();
                    });
            });
        });

        describe('with already used key', () => {
            it('should not change the pin', (done) => {
                unirest.put('https://localhost:3006/services/manager/generatepin')
                    .send({
                        key,
                        pin: '$2a$10$5qaXOxlw5lbZau./uxKPmOgMst67CXfBOi/aCUR8cUhi0Og8QtGHq' // 1111
                    })
                    .end((response) => {
                        assert.equal(401, response.code);
                        assert.equal('Invalid key', response.body.message);

                        done();
                    });
            });
        });
    });
});
