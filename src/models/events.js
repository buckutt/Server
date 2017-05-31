const requelize = require('../lib/requelize');
const joi       = require('joi');

const Event = requelize.model('Event', {
    name  : joi.string().required(),
    config: {
        minReload    : joi.number().default(100),
        maxPerAccount: joi.number().default(100 * 1000),
        maxAlcohol   : joi.number().default(0),
        hasGroups    : joi.boolean().allow(null).default(null),
        hasFundations: joi.boolean().allow(null).default(null),
        hasPeriods   : joi.boolean().allow(null).default(null)
    },
    createdAt: joi.date().default(new Date()),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Event.on('creating', (inst) => { inst.createdAt = new Date(); });
Event.on('saving', (inst) => { inst.editedAt = new Date(); });

Event.index('name');

Event.belongsTo('Group', 'defaultGroup', 'DefaultGroup_id');
Event.belongsTo('Fundation', 'defaultFundation', 'DefaultFundation_id');
Event.belongsTo('Period', 'defaultPeriod', 'DefaultPeriod_id');
Event.hasMany('Period', 'periods');

module.exports = Event;
