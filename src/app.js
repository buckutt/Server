const fs           = require('fs');
const cors         = require('cors');
const bodyParser   = require('body-parser');
const compression  = require('compression');
const cookieParser = require('cookie-parser');
const express      = require('express');
const https        = require('https');
const morgan       = require('morgan');
const config       = require('./config');
const controllers  = require('./controllers');
const models       = require('./models');
const startSSE     = require('./sseServer');
const logger       = require('./lib/log');
const { pp }       = require('./lib/utils');
const APIError     = require('./errors/APIError');

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
app.use(morgan('dev'));
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
        console.log(err.stack);
    } else {
        log.error(pp(err));
    }

    res
        .status(err.status || 500)
        .send(err.toJSON ? err.toJSON() : JSON.stringify(err))
        .end();
});

app.start = () => {
    let key;
    let cert;
    let ca;

    /* istanbul ignore else */
    if (process.env.NODE_ENV === 'test') {
        key  = './ssl/test/server-key.pem';
        cert = './ssl/test/server-crt.pem';
        ca   = './ssl/test/ca-crt.pem';
    } else {
        key  = './ssl/server-key.pem';
        cert = './ssl/server-crt.pem';
        ca   = './ssl/ca-crt.pem';
    }

    const server = https.createServer({
        key               : fs.readFileSync(key),
        cert              : fs.readFileSync(cert),
        ca                : fs.readFileSync(ca),
        requestCert       : true,
        rejectUnauthorized: false
    }, app);

    return new Promise((resolve, reject) => {
        models.loadModels().then(() => {
            log.info('Models loaded');

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
