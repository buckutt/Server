import config   from '../config';
import { pad2 } from './utils';
import winston  from 'winston';

const MAX_LOG_FILE_SIZE = 10 * 1000 * 1000;

/**
 * Create a log timestamp
 * @return {String} Current datetime
 */
function timestamp () {
    const now = new Date();
    const date = `${pad2(now.getFullYear())}/${pad2(now.getMonth())}/${pad2(now.getDate())}`;
    const time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

    return `[${date} ${time}]`;
}

/**
 * Logs application out stream
 * @param  {Module} moduleToUse The current module (accessible with `module`)
 * @return {Object} A winston logger
 */
export default moduleToUse => {
    const path = moduleToUse.filename.split('/').slice(-2).join('/').split('.js')[0];

    const logger = new winston.Logger({ transports: [] });

    if (config.log.console !== 'none') {
        logger.add(winston.transports.Console, {
            timestamp,
            level      : config.log.console,
            name       : 'console',
            prettyPrint: true,
            colorize   : true,
            label      : path
        });
    }

    if (config.log.file !== 'none') {
        logger.add(winston.transports.File, {
            timestamp,
            name       : 'file',
            level      : config.log.file,
            filename   : 'server.log',
            maxsize    : MAX_LOG_FILE_SIZE,
            prettyPrint: false,
            colorize   : false,
            label      : path
        });
    }

    return logger;
};
