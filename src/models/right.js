const requelize = require('../lib/requelize');
const joi       = require('joi');

const Right = requelize.model('Right', {
    name     : joi.string().required(),
    createdAt: joi.date().default(() => new Date(), 'default date is now'),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Right.on('creating', (inst) => { inst.createdAt = new Date(); });
Right.on('saving', (inst) => { inst.editedAt = new Date(); });

Right.index('name');

Right.belongsTo('Period', 'period');
Right.belongsTo('Point', 'point');
Right.belongsToMany('User', 'users');

module.exports = Right;
