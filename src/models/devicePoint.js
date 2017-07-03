const requelize = require('../lib/requelize');
const joi       = require('joi');

const DevicePoint = requelize.model('DevicePoint', {
    createdAt: joi.date().default(() => new Date(), 'default date is now'),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

DevicePoint.customJoinTable('Device', 'Point');

DevicePoint.on('creating', (inst) => { inst.createdAt = new Date(); });
DevicePoint.on('saving', (inst) => { inst.editedAt = new Date(); });

DevicePoint.belongsTo('Period', 'period');

module.exports = DevicePoint;
