import thinky from 'thinky';
import config from '../config';
import logger from './log';

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

export default conn;
