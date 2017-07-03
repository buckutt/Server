const requelize = require('../lib/requelize');
const joi       = require('joi');

const Purchase = requelize.model('Purchase', {
    createdAt     : joi.date().default(() => new Date(), 'default date is now'),
    editedAt      : joi.date(),
    articlesAmount: joi.array().items({
        id   : joi.string(),
        price: joi.string(),
        vat  : joi.number()
    }).optional(),
    isRemoved: joi.boolean().default(false)
});

Purchase.on('creating', (inst) => { inst.createdAt = new Date(); });
Purchase.on('saving', (inst) => { inst.editedAt = new Date(); });

Purchase.belongsTo('Price', 'price');
Purchase.belongsTo('Point', 'point');
Purchase.belongsTo('Promotion', 'promotion');
Purchase.belongsTo('User', 'buyer', 'Buyer_id');
Purchase.belongsTo('User', 'seller', 'Seller_id');
Purchase.belongsToMany('Article', 'articles');

module.exports = Purchase;
