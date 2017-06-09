const mkdirp            = require('mkdirp');
const winston           = require('winston');
const WinstonTcpGraylog = require('winston-tcp-graylog');
const config            = require('../../config');
const { pad2 }          = require('./utils');

const MAX_LOG_FILE_SIZE = 10 * 1000 * 1000;

/**
 * Create a log timestamp
 * @return {String} Current datetime
 */
function timestamp() {
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
module.exports = (moduleToUse) => {
    let path;

    if (typeof moduleToUse === 'string') {
        path = moduleToUse;
    } else {
        path = moduleToUse.filename
            .split('/')
            .slice(-2)
            .join('/')
            .split('.js')[0];
    }

    const transports = [];

    if (config.log.console !== 'none') {
        const consoleTransport = new winston.transports.Console({
            timestamp,
            level      : config.log.console.level,
            name       : 'console',
            prettyPrint: true,
            colorize   : true,
            label      : path
        });

        transports.push(consoleTransport);
    }

    /* istanbul ignore if */
    if (config.log.file !== 'none') {
        mkdirp.sync('./log');

        const fileTransport = new winston.transports.File({
            timestamp,
            name       : 'file',
            level      : config.log.file.level,
            filename   : './log/server.log',
            maxsize    : MAX_LOG_FILE_SIZE,
            prettyPrint: false,
            colorize   : false,
            label      : path
        });

        transports.push(fileTransport);
    }

    // Graylog2
    /* istanbul ignore if */
    if (config.log.graylog && config.log.graylog.gelfPro) {
        const graylogTransport = new WinstonTcpGraylog(config.log.graylog);

        transports.push(graylogTransport);
    }

    const logger = new winston.Logger({ transports });

    return logger;
};

module.exports.stream = {
    write(message) {
        module.exports('express').info(message);
    }
};
