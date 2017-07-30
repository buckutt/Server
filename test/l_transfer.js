/* eslint-disable func-names */

const assert = require('assert');

/* global unirest */

describe('Transfers', () => {
    describe('Correct input', () => {
        it('should transfer from one account to another', (done) => {
            unirest.post('https://localhost:3006/services/manager/transfer')
                .send({
                    Reciever_id: process.env.GJId,
                    amount     : 20,
                    currentPin : '1234'
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal(100, response.body.newCredit);
                    done();
                });
        });

        it('should transfer to the same account', (done) => {
            unirest.post('https://localhost:3006/services/manager/transfer')
                .send({
                    Reciever_id: process.env.LoggedId,
                    amount     : 30,
                    currentPin : '1234'
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal(100, response.body.newCredit);
                    done();
                });
        });
    });

    describe('Incorrect data', () => {
        it('should not transfer if the current Pin is missing', (done) => {
            unirest.post('https://localhost:3006/services/manager/transfer')
                .send({
                    Reciever_id: process.env.GJId,
                    amount     : 150
                })
                .end((response) => {
                    assert.equal(400, response.code);
                    done();
                });
        });

        it('should not transfer if the current Pin is valid but crypted', (done) => {
            unirest.post('https://localhost:3006/services/manager/transfer')
                .send({
                    Reciever_id: process.env.GJId,
                    amount     : 150,
                    currentPin : '$2y$10$TSlguTWRGCPWVMoHoA.IM.DwAZswLojuyx1VUGB4..BTOM72IaqUK'
                })
                .end((response) => {
                    assert.equal(400, response.code);
                    done();
                });
        });

        it('should not transfer if the current Pin is invalid', (done) => {
            unirest.post('https://localhost:3006/services/manager/transfer')
                .send({
                    Reciever_id: process.env.GJId,
                    amount     : 150,
                    currentPin : '1111'
                })
                .end((response) => {
                    assert.equal(400, response.code);
                    done();
                });
        });

        it('should not transfer if the reciever is invalid', (done) => {
            unirest.post('https://localhost:3006/services/manager/transfer')
                .send({
                    amount: 150
                })
                .end((response) => {
                    assert.equal(400, response.code);
                    done();
                });
        });

        it('should not transfer if the reciever does not exists', (done) => {
            unirest.post('https://localhost:3006/services/manager/transfer')
                .send({
                    Reciever_id: '00000000-0000-1000-8000-000000000000',
                    amount     : 150
                })
                .end((response) => {
                    assert.equal(400, response.code);
                    done();
                });
        });

        it('should not transfer if sender has not enough money', (done) => {
            unirest.post('https://localhost:3006/services/manager/transfer')
                .send({
                    Reciever_id: process.env.GJId,
                    amount     : 2000,
                    currentPin : '1234'
                })
                .end((response) => {
                    assert.equal(400, response.code);
                    done();
                });
        });

        it('should not transfer if reciever would have more than 100€', (done) => {
            unirest.post('https://localhost:3006/services/basket')
                .header('Authorization', `Bearer ${process.env.sellerToken}`)
                .send([
                    {
                        credit   : 98.5 * 100,
                        trace    : 'card',
                        Buyer_id : process.env.LoggedId,
                        Seller_id: process.env.GJId,
                        type     : 'reload'
                    }
                ])
                .end(() => {
                    unirest.post('https://localhost:3006/services/manager/transfer')
                        .send({
                            Reciever_id: process.env.GJId,
                            amount     : 9900,
                            currentPin : '1234'
                        })
                        .end((response) => {
                            assert.equal(400, response.code);
                            assert.equal('Too much reciever credit', response.body.message);
                            done();
                        });
                });
        });
    });
});
