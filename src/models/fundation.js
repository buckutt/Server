const requelize = require('../lib/requelize');
const joi       = require('joi');

const Fundation = requelize.model('Fundation', {
    name     : joi.string(),
    website  : joi.string().optional(),
    mail     : joi.string().optional(),
    createdAt: joi.date().default(new Date()),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Fundation.on('creating', (inst) => { inst.createdAt = new Date(); });
Fundation.on('saving', (inst) => { inst.editedAt = new Date(); });

Fundation.index('name');

Fundation.hasMany('Event', 'events');
Fundation.hasMany('Price', 'prices');

module.exports = Fundation;
