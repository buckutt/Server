const nconf  = require('nconf');
const path   = require('path');
const _      = require('lodash');
const { pp } = require('../lib/utils');

nconf
    .argv()
    .env()
    .file({ file: path.join(__dirname, 'process.env.json') });

const env    = require(path.join(__dirname, nconf.get('NODE_ENV') || 'common'));
const common = require(path.join(__dirname, 'common'));
const config = _.merge(common, env);

config.root  = path.join(__dirname, '..');

if (config.log.console === 'debug') {
    console.log('Config loaded: ');
    console.log('%s \n\n', pp(config));
}

module.exports = config;
