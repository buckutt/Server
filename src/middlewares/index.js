const fs   = require('fs');
const path = require('path');

const middlewares = {};

fs
    .readdirSync(__dirname)
    .filter(f => (f.slice(0, -3) !== 'index' && f.slice(-3) === '.js'))
    .sort()
    .forEach((f, i) => {
        middlewares[i] = require(path.join(__dirname, f));
    });

module.exports = middlewares;
