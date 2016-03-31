import nconf  from 'nconf';
import path   from 'path';
import _      from 'lodash';
import { pp } from '../lib/utils';

nconf
    .argv()
    .env()
    .file({ file: 'process.env.json' });

const env    = require(path.join(__dirname, nconf.get('NODE_ENV') || 'common'));
const common = require(path.join(__dirname, 'common'));
const config = _.merge(common, env);

config.root  = path.join(__dirname, '..');

if (config.log.level === 'debug') {
    console.log('Config loaded: ');
    console.log('%s \n\n', pp(config));
}

export default config;
