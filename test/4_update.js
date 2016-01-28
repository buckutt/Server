import assert from 'assert';

/* global unirest */

describe('Update', () => {
    describe('Correct id/model', () => {
        it('should update correctly the model', done => {
            unirest.get('https://localhost:3006/articles')
                .type('json')
                .end(response => {
                    unirest.put(`https://localhost:3006/articles/${response.body[0].id}/`)
                        .type('json')
                        .send({
                            name: 'Updated name'
                        })
                        .end(response2 => {
                            assert.equal(200, response2.code);
                            assert.equal('Updated name', response2.body.name);
                            done();
                        });
                });
        });

        it('should cut the additionals fields if they are not part of the model', done => {
            unirest.get('https://localhost:3006/articles')
                .type('json')
                .end(response => {
                    unirest.put(`https://localhost:3006/articles/${response.body[0].id}/`)
                        .type('json')
                        .send({
                            name: 'Updated name',
                            foo : 'bar'
                        })
                        .end(response2 => {
                            assert.equal(200, response2.code);
                            assert.equal('Updated name', response2.body.name);
                            assert.equal('undefined', typeof response2.body.foo);
                            done();
                        });
                });
        });
    });

    describe('Incorrect id/model', () => {
        it('should not update if id is non-existant', done => {
            unirest.put('https://localhost:3006/articles/00000000-0000-1000-8000-000000000000')
                .type('json')
                .send({
                    foo: 'bar'
                })
                .end(response => {
                    assert.equal(404, response.code);

                    done();
                });
        });

        it('should not update if the id is not a guid', done => {
            unirest.put('https://localhost:3006/articles/foo')
                .type('json')
                .send({
                    foo: 'bar'
                })
                .end(response => {
                    assert.equal(400, response.code);

                    done();
                });
        });

        it('should not update if the model is invalid', done => {
            unirest.get('https://localhost:3006/articles')
                .type('json')
                .end(response => {
                    unirest.put(`https://localhost:3006/articles/${response.body[0].id}/`)
                        .type('json')
                        .send({
                            name: []
                        })
                        .end(response2 => {
                            assert.equal(400, response2.code);
                            assert.equal('Invalid model', response2.body.message);

                            done();
                        });
                });
        })

        it('should not read if the model does not exists', done => {
            unirest.put('https://localhost:3006/foo/00000000-0000-1000-8000-000000000000')
                .type('json')
                .send({
                    foo: 'bar'
                })
                .end(response => {
                    assert.equal(404, response.code);

                    done();
                });
        });
    });
});
