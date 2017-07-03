const EventEmitter    = require('events');
const { modelsNames } = require('./lib/modelParser');

module.exports = (app) => {
    class ModelEmitter extends EventEmitter {}

    const emitter = new ModelEmitter();

    const listenForModelChanges = (Model) => {
        const feed = Model.feed()

        feed.subscribe(
            (event) => emitter.emit('data', event.type, Model._name, { from: event.from, to: event.to })
        )
    };

    Object.keys(modelsNames)
        .map(n => modelsNames[n])
        .map(modelName => app.locals.models[modelName])
        .forEach(Model => listenForModelChanges(Model));

    return emitter;
};
