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

        it('should not add a relation if the submodel does not exists', done => {
            const gid = '00000000-0000-1000-8000-000000000000';

            unirest.post(`https://localhost:3006/groups/${gid}/foo`)
                .send({ id: gid })
                .end(response2 => {
                    assert.equal(404, response2.code);

                    done();
                });
        });

        it('should not add a relation if the document does not exists', done => {
            const gid = '00000000-0000-1000-8000-000000000000';

            unirest.post(`https://localhost:3006/groups/${gid}/users`)
                .send({ id: gid })
                .end(response2 => {
                    assert.equal(404, response2.code);

                    done();
                });
        });

        it('should add a relation', done => {
            unirest.get('https://localhost:3006/groups')
                .end(response => {
                    const gid = response.body[0].id;

                    unirest.post(`https://localhost:3006/groups/${gid}/users`)
                        .send({ id: process.env.GJId })
                        .end(response2 => {
                            assert.equal(200, response2.code);

                            const embed = q({ users: true });

                            unirest.get(`https://localhost:3006/groups/${gid}?embed=${embed}`)
                                .end(response3 => {
                                    assert.equal(1, response3.body.users.length);

                                    done();
                                });
                        });
                });
        });

        it('should not delete a relation if the submodel does not exists', done => {
            const gid = '00000000-0000-1000-8000-000000000000';

            unirest.delete(`https://localhost:3006/groups/${gid}/foo/${gid}`)
                .end(response2 => {
                    assert.equal(404, response2.code);

                    done();
                });
        });

        it('should not delete a relation if the document does not exists', done => {
            const gid = '00000000-0000-1000-8000-000000000000';

            unirest.delete(`https://localhost:3006/groups/${gid}/users/${gid}`)
                .end(response2 => {
                    assert.equal(404, response2.code);

                    done();
                });
        });

        it('should delete a relation', done => {
            unirest.get('https://localhost:3006/groups')
                .end(response => {
                    const gid = response.body[0].id;

                    unirest.delete(`https://localhost:3006/groups/${gid}/users/${process.env.GJId}`)
                        .send({ id: process.env.GJId })
                        .end(response2 => {
                            assert.equal(200, response2.code);

                            const embed = q({ users: true });

                            unirest.get(`https://localhost:3006/groups/${gid}?embed=${embed}`)
                                .end(response3 => {
                                    assert.equal(0, response3.body.users.length);

                                    done();
                                });
                        });
                });
        });
    });
});