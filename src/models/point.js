const requelize = require('../lib/requelize');
const joi       = require('joi');

const Point = requelize.model('Point', {
    name     : joi.string().required(),
    createdAt: joi.date().default(() => new Date(), 'default date is now'),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

Point.on('creating', (inst) => { inst.createdAt = new Date(); });
Point.on('saving', (inst) => { inst.editedAt = new Date(); });

Point.index('name');

Point.hasMany('Price', 'prices');
Point.hasMany('Purchase', 'purchases');
Point.hasMany('Reload', 'reloads');
Point.hasMany('Right', 'rights');
Point.belongsToMany('Device', 'devices', 'DevicePoint');
Point.belongsToMany('Category', 'categories');

module.exports = Point;
