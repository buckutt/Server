const fs             = require('fs');
const cors           = require('cors');
const bodyParser     = require('body-parser');
const compression    = require('compression');
const cookieParser   = require('cookie-parser');
const express        = require('express');
const https          = require('https');
const morgan         = require('morgan');
const config         = require('../config');
const controllers    = require('./controllers');
const models         = require('./models');
const startSSE       = require('./sseServer');
const logger         = require('./lib/log');
const thinky         = require('./lib/thinky');
const APIError       = require('./errors/APIError');
const sslConfig      = require('../scripts/sslConfig');
const baseSeed       = require('../scripts/seed');
const addAdminDevice = require('../scripts/addAdminDevice');

const log = logger(module);

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
app.use(bodyParser.json());
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
        log.error(err.stack);
    } else {
        log.error(err.message);
    }

    res
        .status(err.status || 500)
        .send(err.toJSON ? err.toJSON() : JSON.stringify(err))
        .end();
});

app.start = () => {
    const sslFilesPath = {
        key : './ssl/certificates/server-key.pem',
        cert: './ssl/certificates/server-crt.pem',
        ca  : './ssl/certificates/ca-crt.pem'
    };

    const startingQueue = thinky.dbReady()
        .then(() => models.loadModels());

    /* istanbul ignore if */
    if (!fs.existsSync('./ssl/certificates/server-key.pem') ||
        !fs.existsSync('./ssl/certificates/server-crt.pem') ||
        !fs.existsSync('./ssl/certificates/ca-crt.pem')) {
        startingQueue
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
                return addAdminDevice();
            })
            .then((adminPassword) => {
                log.info(`[ admin .p12 password ] ${adminPassword}`);
            });
    }

    return startingQueue.then(() => {
        if (config.env === 'test') {
            sslFilesPath.key  = sslFilesPath.key.replace('certificates', 'templates');
            sslFilesPath.cert = sslFilesPath.cert.replace('certificates', 'templates');
            sslFilesPath.ca   = sslFilesPath.ca.replace('certificates', 'templates');
        }

        const server = https.createServer({
            key               : fs.readFileSync(sslFilesPath.key),
            cert              : fs.readFileSync(sslFilesPath.cert),
            ca                : fs.readFileSync(sslFilesPath.ca),
            requestCert       : true,
            rejectUnauthorized: false
        }, app);

        return new Promise((resolve, reject) => {
            server.listen(config.http.port, config.http.hostname, (err) => {
                    /* istanbul ignore if */
                if (err) {
                    return reject(err);
                }

                log.info('Server is listening %s:%d', config.http.host, config.http.port);
                startSSE(server, app);

                resolve();
            });
        });
    });
};

// Start the application
/* istanbul ignore if */
if (require.main === module) {
    app
        .start()
        .catch(err => log.error(err));
}

module.exports = app;
