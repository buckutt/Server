import config   from '../config';
import { pad2 } from './utils';
import winston  from 'winston';

/**
 * Logs application out stream
 * @param  {Module} moduleToUse The current module (accessible with `module`)
 * @return {Object} A winston logger
 */
export default moduleToUse => {
    const path = moduleToUse.filename.split('/').slice(-2).join('/').split('.js')[0];

    return new winston.Logger({
        transports: [
            new winston.transports.Console({
                prettyPrint: true,
                colorize   : true,
                level      : config.log.level || "debug",
                label      : path,
                timestamp  : () => {
                    const now = new Date();
                    const date = `${pad2(now.getFullYear())}/${pad2(now.getMonth())}/${pad2(now.getDate())}`;
                    const time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

                    return `[${date} ${time}]`;
                }
            })
        ]
    });
};
