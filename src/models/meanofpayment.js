const requelize = require('../lib/requelize');
const joi       = require('joi');

const MeanOfPayment = requelize.model('MeanOfPayment', {
    slug     : joi.string().required(),
    name     : joi.string().required(),
    step     : joi.number().default(100),
    createdAt: joi.date().default(new Date()),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

MeanOfPayment.on('creating', (inst) => { inst.createdAt = new Date(); });
MeanOfPayment.on('saving', (inst) => { inst.editedAt = new Date(); });

module.exports = MeanOfPayment;
