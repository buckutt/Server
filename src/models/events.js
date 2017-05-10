const requelize = require('../lib/requelize');
const joi       = require('joi');

const Event = requelize.model('Event', {
    name  : joi.string().required(),
    config: {
        minReload    : joi.number().default(100),
        maxPerAccount: joi.number().default(100 * 1000),
        maxAlcohol   : joi.number().default(0)
    },
    createdAt: joi.date().default(new Date()),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Event.on('creating', (inst) => { inst.createdAt = new Date(); });
Event.on('saving', (inst) => { inst.editedAt = new Date(); });

Event.index('name');

Event.hasMany('Period', 'periods');

module.exports = Event;
