const requelize = require('../lib/requelize');
const joi       = require('joi');

const Period = requelize.model('Period', {
    name     : joi.string().required(),
    start    : joi.date().required(),
    end      : joi.date().required(),
    createdAt: joi.date().default(() => new Date(), 'default date is now'),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Period.on('creating', (inst) => { inst.createdAt = new Date(); });
Period.on('saving', (inst) => { inst.editedAt = new Date(); });

Period.index('name');

Period.belongsTo('Event', 'event');
Period.hasMany('Event', 'events');
Period.hasMany('DevicePoint', 'devicePoints');
Period.hasMany('GroupUser', 'groupUsers');
Period.hasMany('Price', 'prices');
Period.hasMany('Right', 'rights');

module.exports = Period;
