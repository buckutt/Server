const requelize = require('../lib/requelize');
const joi       = require('joi');

const Group = requelize.model('Group', {
    name     : joi.string().required(),
    createdAt: joi.date().default(() => new Date(), 'default date is now'),
    editedAt : joi.date(),
    isOpen   : joi.boolean().default(true),
    isPublic : joi.boolean().default(false),
    isRemoved: joi.boolean().default(false)
});

Group.on('creating', (inst) => { inst.createdAt = new Date(); });
Group.on('saving', (inst) => { inst.editedAt = new Date(); });

Group.index('name');

Group.hasMany('Event', 'events');
Group.hasMany('Price', 'prices');
Group.belongsToMany('User', 'users', 'GroupUser');

module.exports = Group;
