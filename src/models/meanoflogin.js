const requelize = require('../lib/requelize');
const joi       = require('joi');

const MeanOfLogin = requelize.model('MeanOfLogin', {
    type     : joi.string().required(),
    data     : joi.alternatives(joi.number(), joi.string()).required(),
    blocked  : joi.boolean().default(false),
    createdAt: joi.date().default(() => new Date(), 'default date is now'),
    editedAt : joi.date(),
    isRemoved: joi.boolean().default(false)
});

MeanOfLogin.on('creating', (inst) => { inst.createdAt = new Date(); });
MeanOfLogin.on('saving', (inst) => { inst.editedAt = new Date(); });

MeanOfLogin.index('type');

// performance in login
MeanOfLogin.index('login', (row) => ([
    row('type'),
    row('data'),
    row('blocked'),
    row('isRemoved')
]));

MeanOfLogin.belongsTo('User', 'user');

module.exports = MeanOfLogin;
