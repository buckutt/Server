const fs   = require('fs');
const path = require('path');

const errors = {};

fs
    .readdirSync(__dirname)
    .filter(f => (f.slice(0, -3) !== 'index' && f.slice(-3) === '.js'))
    .forEach(f => {
        const Error = require(path.join(__dirname, f));
        errors[(new Error()).constructor.name] = Error;
    });

module.exports = errors;
