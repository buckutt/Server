const name = require('../../config').provider.name;

module.exports = (app) => {
    let provider;

    try {
        provider = require(`./${name}`);
    } catch (err) {
        return Promise.reject(err);
    }

    provider(app);

    return Promise.resolve();
};
