const requelize = require('../lib/requelize');
const joi       = require('joi');

const Reload = requelize.model('Reload', {
    credit   : joi.number().required(),
    type     : joi.string().required(),
    trace    : joi.string().allow('').required(),
    createdAt: joi.date().default(() => new Date(), 'default date is now'),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Reload.on('creating', (inst) => { inst.createdAt = new Date(); });
Reload.on('saving', (inst) => { inst.editedAt = new Date(); });

Reload.index('type');

Reload.belongsTo('Point', 'point');
Reload.belongsTo('User', 'buyer', 'Buyer_id');
Reload.belongsTo('User', 'seller', 'Seller_id');

module.exports = Reload;
