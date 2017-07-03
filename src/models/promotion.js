const requelize = require('../lib/requelize');
const joi       = require('joi');

const Promotion = requelize.model('Promotion', {
    name     : joi.string().required(),
    createdAt: joi.date().default(() => new Date(), 'default date is now'),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Promotion.on('creating', (inst) => { inst.createdAt = new Date(); });
Promotion.on('saving', (inst) => { inst.editedAt = new Date(); });

Promotion.index('name');

Promotion.belongsToMany('Price', 'prices');
// n:n instead of 1:n to allow one promotion containing multiple times the same article
Promotion.belongsToMany('Article', 'articles');
// n:n instead of 1:n to allow one promotion containing multiple times the same set
Promotion.belongsToMany('Set', 'sets');
Promotion.hasMany('Purchase', 'purchases');

module.exports = Promotion;
