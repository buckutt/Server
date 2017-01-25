/* eslint-disable func-names */

const assert = require('assert');

/* global unirest, q */

describe('Basket', () => {
    it('should support payment', (done) => {
        unirest.post('https://localhost:3006/services/basket')
            .send([
                {
                    Buyer_id    : process.env.GJId,
                    Point_id    : process.env.FoyerId,
                    Promotion_id: null,
                    Seller_id   : process.env.GJId,
                    Price_id    : process.env.PriceId,
                    cost        : 50,
                    type        : 'purchase',
                    articles    : [
                        {
                            id   : process.env.KinderDeliceId,
                            price: process.env.PriceId,
                            vat  : 0
                        }
                    ]
                }
            ])
            .end((response) => {
                assert.equal(200, response.code);
                assert.equal(100, response.body.newCredit);
                done();
            });
    });

    it('should support reloads', (done) => {
        unirest.post('https://localhost:3006/services/basket')
            .send([
                {
                    credit   : 50 * 100,
                    trace    : 'card',
                    Buyer_id : process.env.GJId,
                    Seller_id: process.env.GJId,
                    type     : 'reload'
                },
                // Without trace
                {
                    credit   : 0,
                    Buyer_id : process.env.GJId,
                    Seller_id: process.env.GJId,
                    type     : 'reload'
                }
            ])
            .end((response) => {
                assert.equal(200, response.code);
                assert.equal(5100, response.body.newCredit);
                done();
            });
    });

    it('should support promotions', (done) => {
        unirest.post('https://localhost:3006/services/basket')
            .send([
                {
                    Buyer_id    : process.env.GJId,
                    Point_id    : process.env.FoyerId,
                    Promotion_id: process.env.Formule1EuroId,
                    Price_id    : process.env.PromotionPriceId,
                    Seller_id   : process.env.GJId,
                    cost        : 100,
                    type        : 'purchase',
                    articles    : [
                        {
                            id   : process.env.KinderDeliceId,
                            price: process.env.PriceId,
                            vat  : 6
                        },
                        {
                            id   : process.env.IceTeaPecheId,
                            price: process.env.PriceId,
                            vat  : 6
                        }
                    ]
                }
            ])
            .end((response) => {
                assert.equal(200, response.code);
                assert.equal(5000, response.body.newCredit);
                done();
            });
    });

    it('should support payment, reloads and promotions', (done) => {
        unirest.post('https://localhost:3006/services/basket')
            .send([
                {
                    Buyer_id    : process.env.GJId,
                    Point_id    : process.env.FoyerId,
                    Promotion_id: process.env.Formule1EuroId,
                    Price_id    : process.env.PromotionPriceId,
                    Seller_id   : process.env.GJId,
                    cost        : 100,
                    type        : 'purchase',
                    articles    : [
                        {
                            id   : process.env.KinderDeliceId,
                            price: process.env.PriceId,
                            vat  : 6
                        },
                        {
                            id   : process.env.IceTeaPecheId,
                            price: process.env.PriceId,
                            vat  : 6
                        }
                    ]
                },
                {
                    credit   : 50 * 101,
                    trace    : 'card',
                    Buyer_id : process.env.GJId,
                    Seller_id: process.env.GJId,
                    type     : 'reload'
                },
                {
                    Buyer_id    : process.env.GJId,
                    Point_id    : process.env.FoyerId,
                    Promotion_id: null,
                    Seller_id   : process.env.GJId,
                    Price_id    : process.env.PriceId,
                    cost        : 50,
                    type        : 'purchase',
                    articles    : [
                        {
                            id   : process.env.KinderDeliceId,
                            price: process.env.PriceId,
                            vat  : 0
                        }
                    ]
                }
            ])
            .end((response) => {
                assert.equal(200, response.code);
                assert.equal(9900, response.body.newCredit);
                done();
            });
    });

    it('should not accept anything else than an array of payments, reloads or promotions', (done) => {
        unirest.post('https://localhost:3006/services/basket')
            .send([
                {}
            ])
            .end((response) => {
                assert.equal(400, response.code);

                unirest.post('https://localhost:3006/services/basket')
                    .send({})
                    .end((response2) => {
                        assert.equal(400, response2.code);
                        done();
                    });
            });
    });

    it('should not accept if the user does not have enough credit', (done) => {
        unirest.post('https://localhost:3006/services/basket')
            .send([
                {
                    Buyer_id    : process.env.GJId,
                    Point_id    : process.env.FoyerId,
                    Promotion_id: null,
                    Seller_id   : process.env.GJId,
                    cost        : 10000,
                    type        : 'purchase',
                    articles    : [
                        process.env.KinderDeliceId
                    ]
                }
            ])
            .end((response) => {
                assert.equal(400, response.code);
                assert.equal('Not enough credit', response.body.message);
                done();
            });
    });

    it('should not accept if the user tries to reload too much', (done) => {
        unirest.post('https://localhost:3006/services/basket')
            .send([
                {
                    credit   : 5000 * 100,
                    trace    : 'card',
                    Buyer_id : process.env.GJId,
                    Seller_id: process.env.GJId,
                    type     : 'reload'
                }
            ])
            .end((response) => {
                assert.equal(400, response.code);
                assert.equal(0, response.body.message.indexOf('Maximum exceeded :'));
                done();
            });
    });

    it('should not accept if the user reload not enough', (done) => {
        unirest.post('https://localhost:3006/services/basket')
            .send([
                {
                    credit   : 1 * 100,
                    trace    : 'card',
                    Buyer_id : process.env.GJId,
                    Seller_id: process.env.GJId,
                    type     : 'reload'
                }
            ])
            .end((response) => {
                assert.equal(400, response.code);
                assert.equal(0, response.body.message.indexOf('Can not reload less than : '));
                done();
            });
    });

    it('should not accept reload when sending invalid credit', (done) => {
        unirest.post('https://localhost:3006/services/basket')
            .send([
                {
                    credit   : {},
                    trace    : 'card',
                    Buyer_id : process.env.GJId,
                    Seller_id: process.env.GJId,
                    type     : 'reload'
                }
            ])
            .end((response) => {
                assert.equal(200, response.code);
                done();
            });
    });

    describe('Update user credit, stocks and purchases after payments and reloads', () => {
        let gj;
        let kinder;

        before((done) => {
            const e = {
                purchases: true,
                reloads  : true
            };
            unirest.get(`https://localhost:3006/users/${process.env.GJId}?embed=${q(e)}`)
                .end((response) => {
                    gj = response.body;

                    unirest.get(`https://localhost:3006/articles/${process.env.KinderDeliceId}`)
                        .end((response2) => {
                            kinder = response2.body;

                            done();
                        });
                });
        });

        it('should update user credit', () => {
            assert.equal(9900, gj.credit);
        });

        it('should update purchases', () => {
            assert.equal(5, gj.purchases.length);
        });

        it('should update stocks', () => {
            assert.equal(-4, kinder.stock);
        });

        it('should update reloads', () => {
            assert.equal(3, gj.reloads.length);
        });
    });
});
