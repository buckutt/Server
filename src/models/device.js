const requelize = require('../lib/requelize');
const joi       = require('joi');

const Device = requelize.model('Device', {
    fingerprint     : joi.string().optional(),
    name            : joi.string().required(),
    doubleValidation: joi.boolean().default(false),
    alcohol         : joi.boolean().default(false),
    showPicture     : joi.boolean().default(false),
    defaultGroup    : joi.string().guid(),
    createdAt       : joi.date().default(() => new Date(), 'default date is now'),
    editedAt        : joi.date(),
    isRemoved       : joi.boolean().default(false)
});

Device.on('creating', (inst) => { inst.createdAt = new Date(); });
Device.on('saving', (inst) => { inst.editedAt = new Date(); });

Device.index('name');
Device.index('fingerprint');

Device.belongsToMany('Point', 'points', 'DevicePoint');

module.exports = Device;
