/* eslint-disable func-names */

const assert = require('assert');

/* global unirest */

describe('ChangePin', () => {
    describe('Correct input', () => {
        it('should change the logged user PIN when the current PIN sent is correct', (done) => {
            unirest.put('https://localhost:3006/services/manager/changepin')
                .send({
                    currentPin: '1234',
                    pin       : '$2y$10$TSlguTWRGCPWVMoHoA.IM.DwAZswLojuyx1VUGB4..BTOM72IaqUK' // 1111
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal(true, response.body.changed);

                    unirest.post('https://localhost:3006/services/login')
                        .send({
                            meanOfLogin: 'etuMail',
                            data       : 'buck@buckless.fr',
                            pin        : '1111'
                        })
                        .end((response2) => {
                            assert.equal(200, response2.code);

                            done();
                        });
                });
        });
    });

    describe('Incorrect data', () => {
        it('should not change PIN if the current PIN isn\'t clear', (done) => {
            unirest.put('https://localhost:3006/services/manager/changepin')
                .send({
                    currentPin: '$2y$10$TSlguTWRGCPWVMoHoA.IM.DwAZswLojuyx1VUGB4..BTOM72IaqUK',
                    pin       : '$2y$10$TSlguTWRGCPWVMoHoA.IM.DwAZswLojuyx1VUGB4..BTOM72IaqUK'
                })
                .end((response) => {
                    assert.equal(401, response.code);

                    done();
                });
        });

        it('should not change PIN if the current PIN is wrong', (done) => {
            unirest.put('https://localhost:3006/services/manager/changepin')
                .send({
                    currentPin: '1234',
                    pin       : '$2y$10$TSlguTWRGCPWVMoHoA.IM.DwAZswLojuyx1VUGB4..BTOM72IaqUK'
                })
                .end((response) => {
                    assert.equal(401, response.code);

                    done();
                });
        });
    });
});
