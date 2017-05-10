const requelize = require('../lib/requelize');
const joi       = require('joi');

const Price = requelize.model('Price', {
    amount   : joi.number().required(),
    createdAt: joi.date().default(new Date()),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Price.on('creating', (inst) => { inst.createdAt = new Date(); });
Price.on('saving', (inst) => { inst.editedAt = new Date(); });

Price.belongsTo('Fundation', 'fundation');
Price.belongsTo('Group', 'group');
Price.belongsTo('Period', 'period');
Price.belongsTo('Point', 'point');
Price.hasMany('Purchase', 'purchases');
Price.belongsToMany('Promotion', 'promotions');
Price.belongsToMany('Article', 'articles');

module.exports = Price;
