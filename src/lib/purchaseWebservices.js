const axios                 = require('axios');
const { models, bookshelf } = require('./bookshelf');
const log                   = require('./log')(module);

function pushToWebservices(rawPurchase) {
    const purchase = rawPurchase.toJSON();

    delete purchase.buyer.pin;
    delete purchase.buyer.password;
    delete purchase.seller.pin;
    delete purchase.seller.password;
    delete purchase.buyer.recoverKey;
    delete purchase.seller.recoverKey;

    return models.Webservice.fetchAll().then(webservices => Promise
        .all(
            webservices.toJSON().map(webservice => axios.post(webservice.url, purchase))
        )
        .catch((err) => {
            log.error('Couldn\'t notify webservice', err.message);
        }));
}

module.exports = () => {
    bookshelf.on('saved', models.Purchase, (p) => {
        models.Purchase
            .where('id', p.id)
            .fetch({
                withRelated: [
                    'price',
                    'point',
                    'buyer',
                    'seller',
                    'articles',
                    'promotion'
                ]
            })
            .then(purchase => pushToWebservices(purchase));
    });
};
