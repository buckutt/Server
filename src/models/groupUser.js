const requelize = require('../lib/requelize');
const joi       = require('joi');

const GroupUser = requelize.model('GroupUser', {
    createdAt: joi.date().default(new Date()),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

GroupUser.customJoinTable('Group', 'User');

GroupUser.on('creating', (inst) => { inst.createdAt = new Date(); });
GroupUser.on('saving', (inst) => { inst.editedAt = new Date(); });

GroupUser.belongsTo('Period', 'period');

module.exports = GroupUser;
