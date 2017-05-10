/* eslint-disable func-names */

const assert = require('assert');

/* global unirest, q */

describe('Delete', () => {
    describe('Correct id', () => {
        it('should delete correctly the model', (done) => {
            unirest.get('https://localhost:3006/articles')
                .end((response) => {
                    const id = response.body[1].id;
                    unirest.delete(`https://localhost:3006/articles/${id}/`)
                        .end((response2) => {
                            assert.equal(200, response2.code);

                            // Check if the article was really deleted
                            unirest.get(`https://localhost:3006/articles/${id}/`)
                                .end((response3) => {
                                    assert.equal(404, response3.code);

                                    done();
                                });
                        });
                });
        });
    });

    describe('Incorrect id', () => {
        it('should not delete if id is non-existant', (done) => {
            unirest.delete('https://localhost:3006/articles/00000000-0000-1000-8000-000000000000')
                .end((response) => {
                    assert.equal(404, response.code);

                    done();
                });
        });

        it('should not delete if the id is not a guid', (done) => {
            unirest.delete('https://localhost:3006/articles/foo')
                .end((response) => {
                    assert.equal(400, response.code);

                    done();
                });
        });

        it('should not delete if the id is not a guid', (done) => {
            unirest.delete('https://localhost:3006/foo/00000000-0000-1000-8000-000000000000')
                .end((response) => {
                    assert.equal(404, response.code);

                    done();
                });
        });
    });
});
