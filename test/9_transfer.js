import assert from 'assert';

/* global unirest */

describe('Transfers', () => {
    describe('Correct input', () => {
        it('should transfer from one account to another', done => {
            unirest.post('https://localhost:3006/services/transfer')
                .type('json')
                .send({
                    recieverId: process.env.GJId,
                    amount    : 100
                })
                .end(response => {
                    assert.equal(200, response.code);
                    assert.equal(20, response.body.newCredit);
                    done();
                });
        });
    });

    describe('Incorrect data', () => {
        it('should not transfer if the reciever is invalid', done => {
            unirest.post('https://localhost:3006/services/transfer')
                .type('json')
                .send({
                    amount: 150
                })
                .end(response => {
                    assert.equal(400, response.code);
                    done();
                });
        });

        it('should not transfer if sender has not enough money', done => {
            unirest.post('https://localhost:3006/services/transfer')
                .type('json')
                .send({
                    recieverId: process.env.GJId,
                    amount    : 150
                })
                .end(response => {
                    assert.equal(400, response.code);
                    done();
                });
        });

        it('should not transfer if reciever would have more than 100€', done => {
            unirest.post('https://localhost:3006/services/transfer')
                .type('json')
                .send({
                    recieverId: process.env.GJId,
                    amount    : 120 * 100
                })
                .end(response => {
                    assert.equal(400, response.code);
                    done();
                });
        });
    });
});
