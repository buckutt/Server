const SSE          = require('sse');
const qs           = require('qs');
const bluebird     = require('bluebird');
const logger       = require('./lib/log');
const modelParser  = require('./lib/modelParser');
const middlewares_ = require('./middlewares');
const APIError     = require('./errors/APIError');

const log = logger(module);

/**
 * Start a SSE server on an express instance
 * @param {HTTPServer} httpServer The node std http server
 * @param {Express}    app        The express instance
 */
module.exports = (httpServer, app) => {
    const sse = new SSE(httpServer, {
        path: '/changes',
        CORS: true
    });

    sse.on('connection', (client) => {
        const { req, res } = client;

        // Create a `request` object in order to pass it through middlewares
        req.query                 = qs.parse(req.url.slice(req.url.indexOf('?') + 1));
        req.headers.authorization = req.query.authorization;
        let models                = [];

        if (req.query.models) {
            models = req.query.models.split(',');
        }

        // Skip function as the headers have already been sent
        // That will disable point/device headers (which are not used by changefeeds)
        res.header = () => res;
        /* istanbul ignore next */
        res.status = () => res;
        /* istanbul ignore next */
        res.end    = msg => client.send(msg);
        req.app    = app;

        // Dynamically resolve middlewares and convert them to Promises
        const middlewares = Object.keys(middlewares_).map(key => bluebird.promisify(middlewares_[key]));

        // Execute promises in serie
        middlewares.reduce((p, mw) => p.then(() => mw(req, res)), Promise.resolve())
            .then(() => {
                if (models.length < 1) {
                    throw new APIError(404, 'No model required');
                }

                models.forEach((model) => {
                    const Model = modelParser.modelFromName(req, res, model);

                    if (Model instanceof Error) {
                        throw Model;
                    }

                    log.info(`A client has connected to watch for changes in ${model}`);
                    client.send(JSON.stringify({
                        model,
                        action: 'listen'
                    }));

                    Model.changes().then((feed) => {
                        feed.each((err, doc) => {
                            /* istanbul ignore if */
                            if (err) {
                                return;
                            }

                            if (doc.isSaved() === false) {
                                client.send(JSON.stringify({
                                    model,
                                    action: 'delete',
                                    doc
                                }));
                            } else if (!doc.getOldValue()) {
                                client.send(JSON.stringify({
                                    model,
                                    action: 'create',
                                    doc
                                }));
                            } else {
                                client.send(JSON.stringify({
                                    model,
                                    action: 'update',
                                    from  : doc.getOldValue(),
                                    doc
                                }));
                            }
                        });
                    });
                });
            })
            .catch((err) => {
                /* istanbul ignore if */
                if (!(err instanceof APIError)) {
                    // Internal error
                    log.error(err.stack);
                } else {
                    log.error(err.message);
                }

                return client.send(`Error: ${err.message}`);
            });
    });

    log.info('SSE server is listening on /changes');
};
