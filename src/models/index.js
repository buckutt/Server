import fs           from 'fs';
import config       from '../config';
import thinky       from '../lib/thinky';

const models = {
    r: thinky.r
};

fs
    .readdirSync(`${config.root}/models/`)
    .filter(file => file.slice(-3) === '.js')
    .filter(file => file !== 'index.js')
    .forEach(file => {
        const model = require(`${config.root}/models/${file}`).default;
        models[model.getTableName()] = model;
    });

const loadPromises = [];

Object.keys(models).forEach(modelName => {
    if (modelName === 'r') {
        return;
    }

    models[modelName].associate(models);

    loadPromises.push(new Promise(resolve => {
        models[modelName].on('ready', () => {
            resolve();
        });
    }));
});

models.loadModels = () => Promise.all(loadPromises);

export default models;
