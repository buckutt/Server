const fs           = require('fs');
const path         = require('path');
const cors         = require('cors');
const bodyParser   = require('body-parser');
const compression  = require('compression');
const cookieParser = require('cookie-parser');
const express      = require('express');
const http         = require('http');
const https        = require('https');
const morgan       = require('morgan');
const randomstring = require('randomstring');
const config       = require('../config');
const controllers  = require('./controllers');
const models       = require('./models');
const socketServer = require('./socketServer');
const logger       = require('./lib/log');
const thinky       = require('./lib/thinky');
const APIError     = require('./errors/APIError');
const sslConfig    = require('../scripts/sslConfig');
const baseSeed     = require('../scripts/seed');
const addDevice    = require('../scripts/addDevice').addDevice;

const log = logger(module);

const LOCK_FILE = path.join(__dirname, '..', 'ready.lock');

const app = express();

app.locals.config = config;
app.locals.models = models;

/**
 * Middlewares
 */
app.use(cors({
    allowedHeaders: ['content-type', 'Authorization'],
    credentials   : true,
    exposedHeaders: ['device', 'point', 'pointName', 'event', 'eventName'],
    origin        : true
}));
app.use(morgan(config.log.morganStyle, { stream: logger.stream }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(compression());

/**
 * Routes
 */
app.use(controllers);

/**
 * Error handling
 */
// 404
app.use((req, res, next) => {
    next(new APIError(404, 'Not Found'));
});

// Internal error
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    /* istanbul ignore next */
    if (!(err instanceof APIError)) {
        log.error(err);
    } else {
        log.error(err.message, err.details);
    }

    res
        .status(err.status || 500)
        .send(err.toJSON ? err.toJSON() : JSON.stringify(err))
        .end();
});

app.start = () => {
    const sslFilesPath = {
        key : './ssl/certificates/server/server-key.pem',
        cert: './ssl/certificates/server/server-crt.pem',
        ca  : './ssl/certificates/ca/ca-crt.pem'
    };

    let startingQueue = thinky.dbReady()
        .then(() => models.loadModels());

    /* istanbul ignore if */
    if (!fs.existsSync(sslFilesPath.key) ||
        !fs.existsSync(sslFilesPath.cert) ||
        !fs.existsSync(sslFilesPath.ca)) {
        startingQueue = startingQueue
            .then(() => {
                log.info('No SSL certificates found, generating new ones...');
                const result = sslConfig(null, null, true);
                log.info(`[ chalPassword ] ${result.chalPassword}`);
                log.info(`[ outPassword ] ${result.outPassword}`);
            })
            .then(() => {
                log.info('Seeding database...');

                return baseSeed();
            })
            .then(() => {
                log.info('Creating admin device...');

                const password = process.env.NODE_ENV === 'development' ? 'development' : randomstring.generate();

                return addDevice({ admin: true, deviceName: 'admin', password });
            })
            .then((adminPassword) => {
                log.info(`[ admin .p12 password ] ${adminPassword}`);
            })
            .then(() => {
                log.info('Creating manager certificate...');

                return addDevice({ admin: true, deviceName: 'manager', password: 'manager' });
            });
    }

    return startingQueue.then(() => {
        const server = process.env.SERVER_PROTOCOL === 'http' ? http.createServer(app) : https.createServer({
            key               : fs.readFileSync(sslFilesPath.key),
            cert              : fs.readFileSync(sslFilesPath.cert),
            ca                : fs.readFileSync(sslFilesPath.ca),
            requestCert       : true,
            rejectUnauthorized: false
        }, app);

        socketServer.ioServer(server, app);

        return new Promise((resolve, reject) => {
            server.listen(config.http.port, config.http.hostname, (err) => {
                    /* istanbul ignore if */
                if (err) {
                    return reject(err);
                }

                log.info('Server is listening %s:%d', config.http.host, config.http.port);

                fs.writeFileSync(LOCK_FILE, '1');

                resolve();
            });
        });
    });
};

/* istanbul ignore next */
const clearLock = (status) => {
    if (status instanceof Error) {
        log.error(status);
    }

    try {
        fs.unlinkSync(LOCK_FILE);
    } catch (e) {
        process.exit(1);
    }

    process.exit(status || 0);
};

module.exports = app;

// Start the application
/* istanbul ignore if */
if (require.main === module) {
    process.on('exit', clearLock);
    process.on('SIGINT', clearLock);
    process.on('SIGTERM', clearLock);
    process.on('uncaughtException', clearLock);

    app
        .start()
        .catch(err => log.error(err));
}
