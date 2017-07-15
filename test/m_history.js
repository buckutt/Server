/* eslint-disable func-names */

const assert = require('assert');

/* global unirest */

describe('History', () => {
    it('should return the correct user history', (done) => {
        unirest.post('https://localhost:3006/services/basket')
            .send([
                // Repeated to not reach the 100€ limit
                {
                    Buyer_id    : process.env.LoggedId,
                    Point_id    : process.env.FoyerId,
                    Promotion_id: process.env.Formule1EuroId,
                    Price_id    : process.env.PromotionPriceId,
                    Seller_id   : process.env.sellerId,
                    cost        : 100,
                    type        : 'purchase',
                    alcohol     : 0,
                    articles    : [
                        {
                            id   : process.env.KinderDeliceId,
                            price: process.env.PriceId,
                            vat  : 0.06
                        },
                        {
                            id   : process.env.IceTeaPecheId,
                            price: process.env.PriceId,
                            vat  : 0.06
                        }
                    ]
                },
                {
                    Buyer_id    : process.env.LoggedId,
                    Point_id    : process.env.FoyerId,
                    Promotion_id: process.env.Formule1EuroId,
                    Price_id    : process.env.PromotionPriceId,
                    Seller_id   : process.env.sellerId,
                    cost        : 100,
                    type        : 'purchase',
                    alcohol     : 0,
                    articles    : [
                        {
                            id   : process.env.KinderDeliceId,
                            price: process.env.PriceId,
                            vat  : 0.06
                        },
                        {
                            id   : process.env.IceTeaPecheId,
                            price: process.env.PriceId,
                            vat  : 0.06
                        }
                    ]
                },
                {
                    Buyer_id    : process.env.LoggedId,
                    Point_id    : process.env.FoyerId,
                    Promotion_id: process.env.Formule1EuroId,
                    Price_id    : process.env.PromotionPriceId,
                    Seller_id   : process.env.sellerId,
                    cost        : 100,
                    type        : 'purchase',
                    alcohol     : 0,
                    articles    : [
                        {
                            id   : process.env.KinderDeliceId,
                            price: process.env.PriceId,
                            vat  : 0.06
                        },
                        {
                            id   : process.env.IceTeaPecheId,
                            price: process.env.PriceId,
                            vat  : 0.06
                        }
                    ]
                },
                {
                    Buyer_id    : process.env.LoggedId,
                    Point_id    : process.env.FoyerId,
                    Promotion_id: process.env.Formule1EuroId,
                    Price_id    : process.env.PromotionPriceId,
                    Seller_id   : process.env.sellerId,
                    cost        : 100,
                    type        : 'purchase',
                    alcohol     : 0,
                    articles    : [
                        {
                            id   : process.env.KinderDeliceId,
                            price: process.env.PriceId,
                            vat  : 0.06
                        },
                        {
                            id   : process.env.IceTeaPecheId,
                            price: process.env.PriceId,
                            vat  : 0.06
                        }
                    ]
                },
                {
                    credit   : 5 * 100,
                    trace    : 'card',
                    Buyer_id : process.env.LoggedId,
                    Seller_id: process.env.sellerId,
                    type     : 'reload'
                },
                {
                    Buyer_id    : process.env.LoggedId,
                    Point_id    : process.env.FoyerId,
                    Promotion_id: null,
                    Seller_id   : process.env.sellerId,
                    Price_id    : process.env.PriceId,
                    cost        : 50,
                    alcohol     : 0,
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
            .end(() => {
                unirest.get('https://localhost:3006/services/manager/history')
                    .end((response2) => {
                        assert.equal(200, response2.code);

                        response2.body = response2.body
                            .map((entry) => {
                                delete entry.date;
                                delete entry.seller;
                                delete entry.articles;

                                return entry;
                            })
                            .sort((a, b) => a.amount - b.amount);

                        // Above + Previous tests
                        assert.deepEqual([
                            { type: 'promotion', amount: -100, point: 'Foyer', promotion: 'Formule 1€' },
                            { type: 'promotion', amount: -100, point: 'Foyer', promotion: 'Formule 1€' },
                            { type: 'promotion', amount: -100, point: 'Foyer', promotion: 'Formule 1€' },
                            { type: 'promotion', amount: -100, point: 'Foyer', promotion: 'Formule 1€' },
                            { type: 'purchase', amount: -60, point: 'Foyer', promotion: '' },
                            { type: 'transfer', amount: -30, point: 'Internet', mop: '' },
                            { type: 'transfer', amount: -20, point: 'Internet', mop: '' },
                            { type: 'transfer', amount: 30, point: 'Internet', mop: '' },
                            { type: 'reload', amount: 500, point: 'Foyer', mop: 'reload' },
                            { type: 'reload', amount: 9850, point: 'Foyer', mop: 'reload' }
                        ], response2.body);

                        done();
                    });
            });
    });
});
