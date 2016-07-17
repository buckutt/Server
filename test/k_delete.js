import assert from 'assert';

/* global unirest, q */

describe('Delete', () => {
    describe('Correct id', () => {
        it('should delete correctly the model', done => {
            unirest.get('https://localhost:3006/articles')
                .end(response => {
                    const id = response.body[1].id;
                    unirest.delete(`https://localhost:3006/articles/${id}/`)
                        .end(response2 => {
                            assert.equal(200, response2.code);

                            // Check if the article was really deleted
                            unirest.get(`https://localhost:3006/articles/${id}/`)
                                .end(response3 => {
                                    assert.equal(404, response3.code);

                                    done();
                                });
                        });
                });
        });

        it('should delete correctly the model and its relatives with ?embed={ modelA: true, modelB: true }', done => {
            const e = {
                promotion: true
            };
            unirest.get(`https://localhost:3006/purchases?embed=${q(e)}`)
                .end(response => {
                    response.body = response.body.filter(purchase => purchase.hasOwnProperty('promotion'));

                    const id          = response.body[0].id;
                    const promotionId = response.body[0].promotion.id;

                    const e2 = {
                        promotion: true
                    };
                    unirest.delete(`https://localhost:3006/purchases/${id}/?embed=${q(e2)}`)
                        .end(response2 => {
                            assert.equal(200, response2.code);

                            // Check if the purchase was really deleted
                            unirest.get(`https://localhost:3006/purchases/${id}/`)
                                .end(response3 => {
                                    assert.equal(404, response3.code);

                                    // Check if the promotion was really deleted
                                    unirest.get(`https://localhost:3006/promotions/${promotionId}/`)
                                        .end(response4 => {
                                            assert.equal(404, response4.code);
                                            done();
                                        });
                                });
                        });
                });
        });
    });

    describe('Incorrect id', () => {
        it('should not delete if id is non-existant', done => {
            unirest.delete('https://localhost:3006/articles/00000000-0000-1000-8000-000000000000')
                .end(response => {
                    assert.equal(404, response.code);

                    done();
                });
        });

        it('should not delete if the id is not a guid', done => {
            unirest.delete('https://localhost:3006/articles/foo')
                .end(response => {
                    assert.equal(400, response.code);

                    done();
                });
        });

        it('should not delete if the id is not a guid', done => {
            unirest.delete('https://localhost:3006/foo/00000000-0000-1000-8000-000000000000')
                .end(response => {
                    assert.equal(404, response.code);

                    done();
                });
        });
    });
});
