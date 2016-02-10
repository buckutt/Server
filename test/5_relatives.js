import assert from 'assert';

/* global unirest, q */

describe('Relatives', () => {
    describe('Correct id', () => {
        it('should get the submodel correctly', done => {
            unirest.get('https://localhost:3006/purchases')
                .end(response => {
                    const id = response.body[0].id;

                    unirest.get(`https://localhost:3006/purchases/${id}/promotion`)
                        .end(response2 => {
                            assert.equal(200, response2.code);
                            assert.equal('string', typeof response2.body.name);
                            done();
                        });
                });
        });

        it('should get the submodel and its relatives with ?embed={ modelA: true, modelB: true }', done => {
            unirest.get('https://localhost:3006/purchases')
                .end(response => {
                    const id = response.body[0].id;

                    const e = {
                        purchases: true
                    };
                    unirest.get(`https://localhost:3006/purchases/${id}/promotion?embed=${q(e)}`)
                        .end(response2 => {
                            assert.equal(200, response2.code);
                            assert.equal('string', typeof response2.body.name);
                            assert.equal(id, response2.body.purchases[0].id);
                            done();
                        });
                });
        });
    });

    describe('Incorrect id', () => {
        it('should not get any submodel if id is non-existant', done => {
            unirest.get('https://localhost:3006/purchases/00000000-0000-1000-8000-000000000000/promotion')
                .end(response => {
                    assert.equal(404, response.code);

                    done();
                });
        });

        it('should not get any submodel if the submodel doesn\'t exist', done => {
            unirest.get('https://localhost:3006/purchases/00000000-0000-1000-8000-000000000000/foo')
                .end(response => {
                    assert.equal(404, response.code);
                    assert.equal('Document not found', response.body.message);
                    assert.equal('Submodel foo does not exist', response.body.details);

                    done();
                });
        });

        it('should not get any submodel if the id is not a guid', done => {
            unirest.get('https://localhost:3006/purchases/foo/promotion')
                .end(response => {
                    assert.equal(400, response.code);

                    done();
                });
        });
    });
});
