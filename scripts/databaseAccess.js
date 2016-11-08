global.models = require('../src/models');

global.log = (r) => {
    console.log(r);
};

global.models.loadModels().then(() => {
    console.log('Models ready! Use models (autocompletion works!). You can use .then(log) to log promises\' results');
});
