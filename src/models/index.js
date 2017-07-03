const fs        = require('fs');
const path      = require('path');
const requelize = require('../lib/requelize');

const models = {
    r: requelize.r
};

fs
    .readdirSync(__dirname)
    .filter(file => file.slice(-3) === '.js')
    .filter(file => file !== 'index.js')
    .forEach((file) => {
        const model = require(path.join(__dirname, file));
        models[model._name] = model;
    });


module.exports = models;
