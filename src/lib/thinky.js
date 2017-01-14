const thinky = require('thinky');
const config = require('../../config');
const logger = require('./log');
const retry  = require('./retry');

const log = logger(module);

const conn = thinky({ host: config.db.host, db: config.db.name, silent: true });

const allowUnhandled = () => {};
process.on('unhandledRejection', allowUnhandled);

const pool = conn.r.getPoolMaster();

/* istanbul ignore next */
retry(() => pool.getConnection(), 10, 3000, () => log.debug('Retrying DB connection...'))
    .then(() => {
        log.info('Connected to DB.');
        process.removeListener('unhandledRejection', allowUnhandled);
    })
    .catch(() => {
        log.error('Connection to DB failed.');
        process.exit(1);
    });

module.exports = conn;
