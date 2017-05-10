const requelize = require('../lib/requelize');
const joi       = require('joi');

const User = requelize.model('User', {
    firstname  : joi.string().required(),
    lastname   : joi.string().required(),
    nickname   : joi.string().required(),
    pin        : joi.string().required(),
    password   : joi.string().required(),
    recoverKey : joi.string().allow('').default(''),
    mail       : joi.string().required(),
    credit     : joi.number().default(0),
    isTemporary: joi.boolean().default(false),
    createdAt  : joi.date().default(new Date()),
    editedAt   : joi.date(),
    isRemoved  : joi.boolean().default(false)
});

User.on('creating', (inst) => { inst.createdAt = new Date(); });

User.on('saving', (inst) => {
    inst.editedAt  = new Date();
    inst.firstname = inst.firstname.toLowerCase();
    inst.lastname  = inst.lastname.toLowerCase();
    inst.nickname  = inst.nickname.toLowerCase();
});

User.index('firstname');
User.index('lastname');
User.index('nickname');
User.index('mail');
User.index('recoverKey');

User.belongsToMany('Group', 'groups', 'GroupUser');
User.belongsToMany('Right', 'rights');
User.hasMany('MeanOfLogin', 'meansOfLogin');

User.hasMany('Purchase', 'purchases', 'Buyer_id');
User.hasMany('Purchase', 'sells', 'Seller_id');

User.hasMany('Reload', 'reloads', 'Buyer_id');
User.hasMany('Reload', 'reloadsMade', 'Seller_id');

User.hasMany('Transfer', 'transfers', 'Reciever_id');
User.hasMany('Transfer', 'transfersMade', 'Sender_id');

module.exports = User;
