import fs           from 'fs';
import path         from 'path';
import bodyParser   from 'body-parser';
import compression  from 'compression';
import consoleTitle from 'console-title';
import cookieParser from 'cookie-parser';
import express      from 'express';
import https        from 'https';
import morgan       from 'morgan';
import APIError     from './APIError';
import config       from './config';
import logger       from './log';
import { pp }       from './lib/utils';
import middlewares  from './middlewares';
import controllers  from './controllers';
import models       from './models';
import changes      from './changes';

const log = logger(module);

consoleTitle('Buckless Server');

const app = express();

changes(app);

app.locals.config = config;
app.locals.models = models;

/**
 * Middlewares
 */

app.use((req, res, next) => {
    // CORS
    res.header('Access-Control-Allow-Headers', 'accept, content-type');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'device,point');
    next();
});
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

Object.keys(middlewares).forEach(key => app.use(middlewares[key]));

app.use(controllers);

// 404 Handling
app.use((req, res, next) => {
    next(new APIError(404, 'Not Found'));
});

// Other errors (req is not used, but four arguments must be detected by express to recognize error middleware)
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    const newErr = err;

    log.error(newErr.message);

    if (err instanceof APIError) { log.error(newErr.details); }

    /* istanbul ignore if */
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

    /* istanbul ignore else */
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
        consoleTitle('Buckless Server *');
    });

    if (typeof app.locals.serverReady === 'function') {
        app.locals.serverReady(server);
    }
};

// Start the application
/* istanbul ignore if */
if (require.main === module) {
    app.start();
}

export default app;
