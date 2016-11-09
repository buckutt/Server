const assert = require('assert');

/* global unirest */

function checkTreasuryResponse(body_) {
    const body = body_
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((a) => { delete a.name; return a; });

    assert.deepEqual([
        {
            count   : 3,
            price   : 100,
            totalVAT: 300,
            totalWT : 283.0188679245283
        },
        {
            count   : 2,
            price   : 60,
            totalVAT: 120,
            totalWT : 120
        }
    ], body);
}

describe('Treasury', () => {
    describe('Purchases', () => {
        describe('Correct input', () => {
            it('should support basic treasury list', (done) => {
                unirest.get('https://localhost:3006/services/treasury/purchases')
                    .end((response) => {
                        checkTreasuryResponse(response.body);
                        done();
                    });
            });

            it('should support basic treasury list with period', (done) => {
                unirest.get(`https://localhost:3006/services/treasury/purchases?period=${process.env.PeriodId}`)
                    .end((response) => {
                        checkTreasuryResponse(response.body);
                        done();
                    });
            });

            it('should support basic treasury list with dates', (done) => {
                const dateIn  = '1995-02-02T00:10:11.450Z';
                const dateOut = '2220-02-02T00:10:11.450Z';
                unirest.get(`https://localhost:3006/services/treasury/purchases?dateIn=${dateIn}&dateOut=${dateOut}`)
                    .end((response) => {
                        checkTreasuryResponse(response.body);
                        done();
                    });
            });

            it('should support basic treasury list with fundation', (done) => {
                unirest.get(`https://localhost:3006/services/treasury/purchases?fundation=${process.env.UNGId}`)
                    .end((response) => {
                        assert.equal(2, response.body.length);
                        done();
                    });
            });

            it('should support basic treasury list with point', (done) => {
                unirest.get(`https://localhost:3006/services/treasury/purchases?point=${process.env.FoyerId}`)
                    .end((response) => {
                        assert.equal(2, response.body.length);
                        done();
                    });
            });

            it('should support basic treasury list with event', (done) => {
                unirest.get(`https://localhost:3006/services/treasury/purchases?event=${process.env.EventFoyerId}`)
                    .end((response) => {
                        assert.equal(2, response.body.length);
                        done();
                    });
            });
        });

        it('should refuse if dates are not parsable', (done) => {
            const dateIn  = 'foo';
            const dateOut = 'bar';
            unirest.get(`https://localhost:3006/services/treasury/purchases?dateIn=${dateIn}&dateOut=${dateOut}`)
                .end((response) => {
                    assert.equal(400, response.code);
                    assert.equal('Invalid dates', response.body.message);
                    done();
                });
        });
    });

    describe('Reloads', () => {
        it('should support basic reloads list', (done) => {
            unirest.get('https://localhost:3006/services/treasury/reloads')
                    .end((response) => {
                        const body = response.body.sort((a, b) => a.group.localeCompare(b.group));

                        assert.equal(2, body.length);
                        assert.equal(50, body[0].reduction);
                        assert.equal(10000, body[1].reduction);

                        done();
                    });
        });

        it('should support basic treasury list with dates', (done) => {
            const dateIn  = '1995-02-02T00:10:11.450Z';
            const dateOut = '2220-02-02T00:10:11.450Z';
            unirest.get(`https://localhost:3006/services/treasury/reloads?dateIn=${dateIn}&dateOut=${dateOut}`)
                    .end((response) => {
                        const body = response.body.sort((a, b) => a.group.localeCompare(b.group));

                        assert.equal(2, body.length);
                        assert.equal(50, body[0].reduction);
                        assert.equal(10000, body[1].reduction);

                        done();
                    });
        });

        it('should support basic treasury list with point', (done) => {
            unirest.get(`https://localhost:3006/services/treasury/reloads?point=${process.env.FoyerId}`)
                    .end((response) => {
                        const body = response.body.sort((a, b) => a.group.localeCompare(b.group));

                        assert.equal(1, body.length);
                        assert.equal(10000, body[0].reduction);

                        done();
                    });
        });

        it('should refuse if dates are not parsable', (done) => {
            const dateIn  = 'foo';
            const dateOut = 'bar';
            unirest.get(`https://localhost:3006/services/treasury/reloads?dateIn=${dateIn}&dateOut=${dateOut}`)
                .end((response) => {
                    assert.equal(400, response.code);
                    done();
                });
        });
    });
});
