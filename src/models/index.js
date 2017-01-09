const fs     = require('fs');
const path   = require('path');
const thinky = require('../lib/thinky');

const models = {
    r: thinky.r
};

fs
    .readdirSync(__dirname)
    .filter(file => file.slice(-3) === '.js')
    .filter(file => file !== 'index.js')
    .forEach((file) => {
        const model = require(path.join(__dirname, file));
        models[model.getTableName()] = model;
    });

const loadPromises = [];

Object.keys(models).forEach((modelName) => {
    if (modelName === 'r') {
        return;
    }

    models[modelName].associate(models);

    loadPromises.push(new Promise((resolve) => {
        models[modelName].on('ready', () => {
            resolve();
        });
    }));
});

models.loadModels = () => Promise.all(loadPromises);

module.exports = models;
