/* eslint-disable func-names */

const { clone } = require('../src/lib/utils');
const assert    = require('assert');

/* global unirest, q */

let firstArticle;
let totalArticles;

describe('Read', () => {
    describe('Correct id', () => {
        it('should list correctly the model', (done) => {
            unirest.get('https://localhost:3006/articles')
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal(true, response.body.length > 0);

                    firstArticle  = response.body[0].id;
                    totalArticles = response.body.length;

                    done();
                });
        });

        it('should read correctly one model', (done) => {
            unirest.get(`https://localhost:3006/articles/${firstArticle}`)
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);

                    done();
                });
        });

        it('should read correctly the model and its relatives with ?embed={ modelA: true, modelB: true }', (done) => {
            const e = {
                buyer   : true,
                seller  : true,
                articles: true
            };

            unirest.get('https://localhost:3006/purchases/')
                .end((response) => {
                    unirest.get(`https://localhost:3006/purchases/${response.body[0].id}/?embed=${q(e)}`)
                        .end((response2) => {
                            console.log(response2.body);
                            assert.equal('string', typeof response2.body.buyer.id);
                            assert.equal('string', typeof response2.body.seller.id);
                            done();
                        });
                });
        });

        it('should support ordering asc', (done) => {
            unirest.get('https://localhost:3006/articles?orderBy=name&sort=asc')
                .end((response) => {
                    console.log(response.body);
                    const articles = response.body.map(article => article.name);
                    const otherOne = clone(articles);
                    assert.deepEqual(articles.sort(), otherOne);
                    done();
                });
        });

        it('should support ordering dsc', (done) => {
            unirest.get('https://localhost:3006/articles?orderBy=name&sort=dsc')
                .end((response) => {
                    const articles = response.body.map(article => article.name);
                    const otherOne = clone(articles);
                    assert.deepEqual(articles.sort(), otherOne.reverse());
                    done();
                });
        });

        it('should support ordering without order', (done) => {
            unirest.get('https://localhost:3006/articles?orderBy=name')
                .end((response) => {
                    const articles = response.body.map(article => article.name);
                    const otherOne = clone(articles);
                    assert.deepEqual(articles.sort(), otherOne);
                    done();
                });
        });

        it('should support limiting', (done) => {
            unirest.get('https://localhost:3006/articles?limit=1')
                .end((response) => {
                    assert.equal(1, response.body.length);
                    done();
                });
        });

        it('should support skipping', (done) => {
            unirest.get('https://localhost:3006/articles?offset=1')
                .end((response) => {
                    assert.equal(totalArticles - 1, response.body.length);
                    done();
                });
        });
    });

    describe('Incorrect id', () => {
        it('should not read if id is non-existant', (done) => {
            unirest.get('https://localhost:3006/articles/00000000-0000-1000-8000-000000000000')
                .end((response) => {
                    assert.equal(404, response.code);

                    done();
                });
        });

        it('should not read if the id is not a guid', (done) => {
            unirest.get('https://localhost:3006/articles/foo')
                .end((response) => {
                    assert.equal(400, response.code);

                    done();
                });
        });

        it('should not read if the model does not exists', (done) => {
            unirest.get('https://localhost:3006/foo/00000000-0000-1000-8000-000000000000')
                .end((response) => {
                    assert.equal(404, response.code);

                    done();
                });
        });
    });
});
