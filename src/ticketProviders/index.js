const name = require('../../config').assigner.ticketProvider;

let provider;

try {
    provider = require(`./${name}`);
} catch (err) {
    provider = require('./test');
}

module.exports = provider;
