const { clone } = require('./utils');

/**
 * Extracts relations from JSON data. Useful to insert them later (with restore) to user Thinky's setters
 * @param  {Function} Model     The Model to treat
 * @param  {Object}   modelData The model data
 * @return {Array<Object>} First item is data without left keys, second item will be leftkeys only
 */
const sanitize = (Model, modelData) => {
    const leftKeys  = Object.keys(Model._joins);
    const saved     = {};

    leftKeys.forEach((key) => {
        if (modelData[key]) {
            // Save the relation
            saved[key] = clone(modelData[key], false);
            // And deletes the relation from the result object
            delete modelData[key];
        }
    });

    return [modelData, saved];
};

/**
 * Restores left keys to item using Thinky's setters
 * @param {Object} instance          Instance of a model
 * @param {Object} leftKeysExtracted Left keys extracted by sanitize
 */
const restore = (instance, leftKeysExtracted) => {
    Object.keys(leftKeysExtracted).forEach((leftKey) => {
        instance[leftKey] = leftKeysExtracted[leftKey];
    });
};

module.exports = { sanitize, restore };
