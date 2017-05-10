const requelize = require('../lib/requelize');
const joi       = require('joi');

const Transfer = requelize.model('Transfer', {
    amount   : joi.number().required(),
    createdAt: joi.date().default(new Date()),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Transfer.on('creating', (inst) => { inst.createdAt = new Date(); });
Transfer.on('saving', (inst) => { inst.editedAt = new Date(); });

Transfer.belongsTo('User', 'sender', 'Sender_id');
Transfer.belongsTo('User', 'reciever', 'Reciever_id');

module.exports = Transfer;
