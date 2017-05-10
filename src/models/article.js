const requelize = require('../lib/requelize');
const joi       = require('joi');

const Article = requelize.model('Article', {
    name     : joi.string().required(),
    stock    : joi.number().default(0),
    image    : joi.string().optional(),
    // Alcohol amount (Alcool unit or just article maximum sells)
    alcohol  : joi.number().default(0),
    // Optional VAT tax
    vat      : joi.number().default(0),
    createdAt: joi.date().default(new Date()),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Article.on('creating', (inst) => { inst.createdAt = new Date(); });
Article.on('saving', (inst) => { inst.editedAt = new Date(); });

Article.index('name');

Article.belongsToMany('Category', 'categories');
// n:n instead of 1:n to allow one set containing multiple times the same article
Article.belongsToMany('Set', 'sets');
// n:n instead of 1:n to allow one promotion containing multiple times the same article
Article.belongsToMany('Promotion', 'promotions');
Article.belongsToMany('Purchase', 'purchases');
Article.belongsToMany('Price', 'prices');

module.exports = Article;
