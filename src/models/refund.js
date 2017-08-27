const requelize = require('../lib/requelize');
const joi       = require('joi');

const Refund = requelize.model('Refund', {
    amount   : joi.number().required(),
    type     : joi.string().required(),
    trace    : joi.string().allow('').required(),
    createdAt: joi.date().default(() => new Date(), 'default date is now'),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Refund.on('creating', (inst) => { inst.createdAt = new Date(); });
Refund.on('saving', (inst) => { inst.editedAt = new Date(); });

Refund.index('type');

Refund.belongsTo('User', 'buyer', 'Buyer_id');
Refund.belongsTo('User', 'seller', 'Seller_id');

module.exports = Refund;
