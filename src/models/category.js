const requelize = require('../lib/requelize');
const joi       = require('joi');

const Category = requelize.model('Category', {
    name     : joi.string().required(),
    priority : joi.number().default(0),
    createdAt: joi.date().default(() => new Date(), 'default date is now'),
    editedAt : joi.string(),
    isRemoved: joi.boolean().default(false)
});

Category.on('creating', (inst) => { inst.createdAt = new Date(); });
Category.on('saving', (inst) => { inst.editedAt = new Date(); });

Category.index('name');

Category.belongsToMany('Article', 'articles');
Category.belongsToMany('Point', 'points');

module.exports = Category;
