const requelize = require('../lib/requelize');
const joi       = require('joi');

// `Set` already exists.
const Set_ = requelize.model('Set', {
    name     : joi.string().required(),
    createdAt: joi.date().default(() => new Date(), 'default date is now'),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Set_.on('creating', (inst) => { inst.createdAt = new Date(); });
Set_.on('saving', (inst) => { inst.editedAt = new Date(); });

Set_.index('name');

// n:n instead of 1:n to allow one promotion containing multiple times the same set
Set_.belongsToMany('Promotion', 'promotions');
Set_.belongsToMany('Article', 'articles');

module.exports = Set_;
