global.models = require('../build/models').default; // eslint-disable-line import/no-unresolved

global.log = (r) => {
    console.log(r);
};

global.models.loadModels().then(() => {
    console.log('Models ready! Use models (autocompletion works!). You can use .then(log) to log promises\' results');
});
