const thinky = require('thinky');
const config = require('../config');
const logger = require('./log');

const log = logger(module);

const conn = thinky({ db: config.db, silent: true });

/* istanbul ignore next */
conn.r
    .getPoolMaster()
    .getConnection()
    .catch(() => {
        log.error('Connection to DB failed.');
        process.exit(1);
    });

module.exports = conn;
