import fs           from 'fs';
import path         from 'path';
import APIError     from './APIError';
import config       from './config';
import logger       from './log';
import { pp }       from './lib/utils';
import models       from './models';
import bodyParser   from 'body-parser';
import compression  from 'compression';
import consoleTitle from 'console-title';
import cookieParser from 'cookie-parser';
import cors         from 'cors';
import express      from 'express';
import https        from 'https';
import morgan       from 'morgan';

const log = logger(module);

consoleTitle('Buckutt Server **');

const app = express();

app.locals.config = config;
app.locals.models = models;

// Some middlewares
app.use(cors({
    exposedHeaders: ['device', 'point']
}));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(compression());

// Set application into the request
app.use((req, res, next) => {
    req.app = app;

    if (!req.client.authorized) {
        return res
            .status(401)
            .end('Unauthorized : missing client HTTPS certificate');
    }

    return next();
});

// Application middlewares
const middlewares = fs
    .readdirSync(path.join(config.root, 'middlewares/'))
    .filter(f => f.slice(-3) === '.js')
    .sort()
    .map(f => require(path.join(config.root, 'middlewares/', f)).default);

middlewares.forEach(middleware => {
    app.use(middleware);
});

// Controllers subrouters
const controllers = fs
    .readdirSync(path.join(config.root, 'controllers/'))
    .filter(f => f.slice(-3) === '.js')
    .sort()
    .map(f => require(path.join(config.root, 'controllers/', f)).default);

controllers.forEach(controller => {
    controller(app);
});

// Service controllers subrouters
const services = fs
    .readdirSync(path.join(config.root, 'controllers/', 'services/'))
    .filter(f => f.slice(-3) === '.js')
    .sort()
    .map(f => require(path.join(config.root, 'controllers/', 'services/', f)).default);

services.forEach(service => {
    service(app);
});

// 404 Handling
app.use((req, res, next) => {
    next(new APIError(404, 'Not Found'));
});

// Other errors (req is not used, but four arguments must be detected by express to recognize error middleware)
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    let newErr = err;

    if (!(err.isAPIError)) {
        // Classic errors
        if (err instanceof Error) {
            newErr = {
                status : 500,
                message: err.message,
                details: err
            };
        } else {
            // Unknown errors
            newErr = {
                status : 500,
                message: err.toString(),
                details: err
            };
        }
    }

    log.error(newErr.message);
    console.log(newErr.details);
    if (err instanceof APIError) { log.error(newErr.details); }

    if (newErr.message === 'Unknown error') {
        console.log(pp(newErr));
    }

    res
        .status(newErr.status || 500)
        .json(newErr)
        .end();
});

app.start = () => {
    let key;
    let cert;
    let ca;

    if (process.env.NODE_ENV === 'test') {
        key  = `./ssl/test/server.key`;
        cert = `./ssl/test/server.crt`;
        ca   = `./ssl/test/ca.crt`;
    } else {
        key  = `./ssl/server-key.pem`;
        cert = `./ssl/server-crt.pem`;
        ca   = `./ssl/ca-crt.pem`;
    }

    const server = https.createServer({
        key               : fs.readFileSync(key),
        cert              : fs.readFileSync(cert),
        ca                : fs.readFileSync(ca),
        requestCert       : true,
        rejectUnauthorized: false
    }, app);

    server.listen(config.port, () => {
        log.info('Server is listening on port %d', config.port);
        log.warn('Please wait for models to be ready...');
        consoleTitle('Buckutt Server *');
    });
};

// Start the application
if (require.main === module) {
    app.start();
}

export default app;
