import assert from 'assert';

/* global unirest, q */

describe('Searching', () => {
    describe('Correct search query', () => {
        it('should search correctly', done => {
            const search = {
                field     : 'name',
                startsWith: 'Ice Tea'
            };

            const or1 = {
                field: 'name',
                eq   : 'Mars'
            };

            const or2 = {
                field: 'name',
                eq   : 'Mars'
            };

            const or3 = {
                field   : 'name',
                endsWith: 'Mars'
            };

            const or4 = {
                field  : 'name',
                matches: '^Mars'
            };

            let orQ = '';

            [or1, or2, or3, or4].forEach(or => orQ += `&or[]=${q(or)}`);

            unirest.get(`https://localhost:3006/articles/search?q=${q(search)}${orQ}`)
                .type('json')
                .end(response => {
                    assert.equal(200, response.code);
                    const reg = /^Ice Tea/;
                    response.body.forEach(article => {
                        assert.equal(true, reg.test(article.name) || article.name === 'Mars');
                    });
                    done();
                });
        });

        it('should support numeric conditions (gt, lt, ge, le)', done => {
            const search = {
                field  : 'name',
                matches: '.*'
            };

            const or1 = {
                field: 'alcohol',
                gt: -1
            };

            const or2 = {
                field: 'alcohol',
                lt: 1
            };

            const or3 = {
                field: 'alcohol',
                ge: 0
            };

            const or4 = {
                field: 'alcohol',
                le: 0
            };

            let orQ = '';
            [or1, or2, or3, or4].forEach(or => orQ += `&or[]=${q(or)}`);

            unirest.get(`https://localhost:3006/articles/search?q=${q(search)}${orQ}`)
                .type('json')
                .end(response => {
                    assert.equal(200, response.code);
                    response.body.forEach(article => {
                        assert.equal(0, article.alcohol);
                    });
                    done();
                });
        });

        it('should support limit, embed, etc.', done => {
            const search = {
                field     : 'name',
                startsWith: 'Ice Tea'
            };

            const or = {
                field: 'name',
                eq   : 'Mars'
            };

            const or2 = {
                field: 'name',
                eq   : 'Mars'
            };

            unirest.get(`https://localhost:3006/articles/search?q=${q(search)}&or[]=${q(or)}&or[]=${q(or2)}&limit=1`)
                .type('json')
                .end(response => {
                    assert.equal(200, response.code);
                    const reg = /^Ice Tea/;
                    response.body.forEach(article => {
                        assert.equal(true, reg.test(article.name) || article.name === 'Mars');
                    });
                    done();
                });
        });
    });

    describe('Incorrect search query', () => {
        it('should refuse when no condition is specified', done => {
            unirest.get(`https://localhost:3006/articles/search`)
                .type('json')
                .end(response => {
                    assert.equal(400, response.code);
                    done();
                });
        });

        it('should refuse when a wrong condition is specified', done => {
            // equals is wrong
            const search = {
                field : 'name',
                equals: 'Mars'
            };

            unirest.get(`https://localhost:3006/articles/search?q=${q(search)}`)
                .type('json')
                .end(response => {
                    assert.equal(400, response.code);
                    done();
                });
        });

        it('should refuse when no field is specified', done => {
            const search = {
                eq: 'Mars'
            };

            unirest.get(`https://localhost:3006/articles/search?q=${q(search)}`)
                .type('json')
                .end(response => {
                    assert.equal(400, response.code);
                    done();
                });
        });
    });
});
