/* eslint-disable func-names */

const assert = require('assert');

/* global unirest, q */

let IceTeaPeche;
let KinderDelice;
let Formule1Euro;
let GJ;
let TC;

process.env.GJId           = '';
process.env.KinderDeliceId = '';
process.env.IceTeaPecheId  = '';
process.env.Formule1EuroId = '';

describe('Create', function () {
    // First request creates the tables
    this.timeout(20 * 1000);

    describe('Correct model', () => {
        it('should support multiple entries', (done) => {
            unirest.post('https://localhost:3006/articles')
                .send([
                    {
                        name : 'Ice Tea Pêche',
                        stock: 0
                    },
                    {
                        name : 'Ice Tea Liptonic',
                        stock: 0
                    }
                ])
                .end((response) => {
                    assert.equal(200, response.code);
                    IceTeaPeche = response.body[0];
                    assert.equal(2, response.body.length);

                    process.env.IceTeaPecheId = IceTeaPeche.id;

                    done();
                });
        });

        it('should support one unique entry', (done) => {
            unirest.post('https://localhost:3006/articles')
                .send({
                    name : 'Ice Tea Mangue',
                    stock: 0
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create Article', (done) => {
            unirest.post('https://localhost:3006/articles')
                .send({
                    name : 'Kinder Delice',
                    stock: 0
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    KinderDelice = response.body;
                    assert.equal('string', typeof response.body.id);

                    process.env.KinderDeliceId = KinderDelice.id;

                    done();
                });
        });

        it('should create Category', (done) => {
            unirest.post('https://localhost:3006/categories')
                .send({
                    name: 'Barres'
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create Device', (done) => {
            unirest.post('https://localhost:3006/devices')
                .send({
                    name       : 'eeetop-1',
                    fingerprint: '43:51:43:a1:b5:fc:8b:b7:0a:3a:a9:b1:0f:66:73:a8'
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create Fundation', (done) => {
            unirest.post('https://localhost:3006/fundations')
                .send({
                    name   : 'Foo',
                    website: 'http://foo.fr',
                    mail   : 'foo@bar.fr'
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create Group', (done) => {
            unirest.post('https://localhost:3006/groups')
                .send({
                    name    : 'Cotisants A2016',
                    isOpen  : true,
                    isPublic: false
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create GroupUser', (done) => {
            unirest.post('https://localhost:3006/groupUsers')
                .send({
                    Group    : '',
                    Period_id: process.env.PeriodId,
                    User     : ''
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create Event', (done) => {
            unirest.post('https://localhost:3006/events')
                .send({
                    name  : 'EventFoo',
                    config: {
                        minReload    : 500,
                        maxPerAccount: 120 * 100
                    }
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create MeanOfLogin', (done) => {
            unirest.post('https://localhost:3006/meansoflogin')
                .send({
                    type: 'etuMail',
                    data: 'gabriel.juchault@gmail.com'
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create MeanOfPayment', (done) => {
            unirest.post('https://localhost:3006/meansofpayment')
                .send({
                    name: 'foo',
                    slug: 'bar'
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create Period', (done) => {
            unirest.post('https://localhost:3006/periods')
                .send({
                    name : 'Just now',
                    start: new Date(),
                    end  : new Date()
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create PeriodPoint', (done) => {
            unirest.post('https://localhost:3006/devicePoints')
                .send({
                    Device   : '',
                    Period_id: process.env.PeriodId,
                    Point    : ''
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create Set', (done) => {
            unirest.post('https://localhost:3006/sets')
                .send({
                    name: 'fooset'
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create Point', (done) => {
            unirest.post('https://localhost:3006/points')
                .send({
                    name: 'Foo'
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);

                    done();
                });
        });

        it('should create Price', (done) => {
            unirest.post('https://localhost:3006/prices')
                .send({
                    amount: 3.141592654
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create Promotions', (done) => {
            unirest.post('https://localhost:3006/promotions')
                .send({
                    name: 'Formule 1€'
                })
                .end((response) => {
                    Formule1Euro = response.body;
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);

                    process.env.Formule1EuroId = Formule1Euro.id;

                    done();
                });
        });

        it('should create Reloads', (done) => {
            unirest.post('https://localhost:3006/reloads')
                .send({
                    type  : 'cash',
                    trace : 'Ticket caisse n°123',
                    credit: 50
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create Right', (done) => {
            unirest.post('https://localhost:3006/rights')
                .send({
                    name   : 'admin',
                    isAdmin: true
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    done();
                });
        });

        it('should create User', (done) => {
            unirest.post('https://localhost:3006/users')
                .send({
                    firstname: 'Gabriel',
                    lastname : 'Juchault',
                    nickname : 'Extaze',
                    pin      : '1234',
                    password : '1234',
                    mail     : 'gabriel.juchault@utt.fr',
                    credit   : 150
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    GJ = response.body;
                    assert.equal('string', typeof response.body.id);

                    process.env.GJId = GJ.id;

                    unirest.post('https://localhost:3006/users')
                        .send({
                            firstname: 'Thomas',
                            lastname : 'Chauchefoin',
                            nickname : 'nashe',
                            pin      : '1234',
                            password : '1234',
                            mail     : 'thomas.chauchefoin@utt.fr',
                            credit   : 150
                        })
                        .end((response2) => {
                            assert.equal(200, response2.code);
                            TC = response2.body;
                            assert.equal('string', typeof response2.body.id);
                            done();
                        });
                });
        });

        it('should create Purchase with relationships', (done) => {
            const e = {
                articles : true,
                promotion: true
            };
            unirest.post(`https://localhost:3006/purchases?embed=${q(e)}`)
                .send({
                    Fundation_id: process.env.UNGId,
                    Point_id    : process.env.FoyerId,
                    Buyer_id    : GJ.id,
                    Seller_id   : TC.id,
                    Promotion_id: Formule1Euro.id,
                    articles    : [
                        IceTeaPeche.id,
                        KinderDelice.id
                    ],
                    articlesAmount: [
                        { id: IceTeaPeche.id, price: process.env.PriceId, vat: 6 },
                        { id: KinderDelice.id, price: process.env.PriceId, vat: 6 }
                    ],
                    Price_id: process.env.PromotionPriceId
                })
                .end((response) => {
                    console.log(response.body);
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    assert.equal(2, response.body.articles.length);
                    assert.equal(Formule1Euro.id, response.body.promotion.id);
                    done();
                });
        });

        it('should cut the additionals fields if they are not part of the model', (done) => {
            unirest.post('https://localhost:3006/articles')
                .send({
                    name : 'Mars',
                    stock: 0,
                    foo  : 'bar'
                })
                .end((response) => {
                    assert.equal(200, response.code);
                    assert.equal('string', typeof response.body.id);
                    assert.equal(false, response.body.hasOwnProperty('foo'));
                    done();
                });
        });
    });

    describe('Invalid model', () => {
        it('should throw an error if there are missing fields', (done) => {
            unirest.post('https://localhost:3006/articles')
                .send({})
                .end((response) => {
                    assert.equal(400, response.code);
                    done();
                });
        });

        it('should throw an error if the model does not exists', (done) => {
            unirest.post('https://localhost:3006/foo')
                .send({})
                .end((response) => {
                    assert.equal(404, response.code);
                    done();
                });
        });
    });
});
