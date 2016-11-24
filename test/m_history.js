/* eslint-disable func-names */

const assert = require('assert');

/* global unirest */

describe('History', () => {
    it('should return the correct user history', (done) => {
        unirest.post('https://localhost:3006/services/basket')
            .send([
                {
                    Buyer_id    : process.env.LoggedId,
                    Point_id    : process.env.FoyerId,
                    Promotion_id: process.env.Formule1EuroId,
                    Price_id    : process.env.PromotionPriceId,
                    Seller_id   : process.env.LoggedId,
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
                    credit   : 50 * 100,
                    trace    : 'card',
                    Buyer_id : process.env.LoggedId,
                    Seller_id: process.env.LoggedId,
                    type     : 'reload'
                },
                {
                    Buyer_id    : process.env.LoggedId,
                    Point_id    : process.env.FoyerId,
                    Promotion_id: null,
                    Seller_id   : process.env.LoggedId,
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
            .end(() => {
                unirest.get('https://localhost:3006/services/manager/history')
                    .end((response2) => {
                        console.log(response2.body);
                        assert.equal(200, response2.code);

                        response2.body.forEach((history) => {
                            switch (history.type) {
                                case 'transfer':
                                    assert.equal(20, Math.abs(history.amount));
                                    break;
                                case 'reload':
                                    assert.equal(5000, history.amount);
                                    break;
                                case 'purchase':
                                    assert.equal(-60, history.amount);
                                    break;
                                case 'promotion':
                                    assert.equal(-100, history.amount);
                                    break;
                                default:
                                    break;
                            }
                        });

                        done();
                    });
            });
    });
});
