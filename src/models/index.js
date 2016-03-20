import fs           from 'fs';
import thinky       from '../lib/thinky';
import logger       from '../lib/log';
import config       from '../config';

const log = logger(module);

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

let modelsLoaded = 0;

Object.keys(models).forEach((modelName, i, arr) => {
    if (modelName === 'r') {
        return;
    }

    models[modelName].associate(models);

    models[modelName].on('ready', () => {
        ++modelsLoaded;
        log.info(`Model ${modelName} ready`);

        if (modelsLoaded === arr.length - 1) {
            log.info('Models ready');


            if (models.onReady) {
                models.onReady();
            }
        }
    });
});

export default models;
