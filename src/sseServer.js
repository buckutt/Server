import SSE             from 'sse';
import qs              from 'qs';
import { promisify }   from 'bluebird';
import logger          from './lib/log';
import modelParser     from './lib/modelParser';
import middlewares_    from './middlewares';

const log = logger(module);

export function startSSE(httpServer, app) {
    const sse = new SSE(httpServer, {
        path: '/changes',
        CORS: true
    });

    sse.on('connection', client => {
        const { req, res } = client;

        // Create a `request` object in order to pass it through middlewares
        req.query                 = qs.parse(req.url.slice(req.url.indexOf('?') + 1));
        req.headers.authorization = req.query.authorization;
        req.params                = { model: req.query.model };

        const model = req.query.model;

        // Skip function as the headers have already been sent
        // That will disable point/device headers (which are not used by changefeeds)
        res.header = () => {};
        req.app = app;

        // Dynamically resolve middlewares and convert them to Promises
        const middlewares = Object.keys(middlewares_).map(key => promisify(middlewares_[key]));

        // Execute promises in serie
        middlewares.reduce((p, mw) => p.then(() => mw(req, res)), Promise.resolve())
            .then(() => {
                return new Promise((resolve, reject) => {
                    modelParser(req, res, err => {
                        if (err instanceof Error) {
                            return reject(err);
                        }

                        resolve();
                    }, model);
                });
            })
            .then(() => {
                log.info(`A client has connected to watch for changes in ${model}`);
                client.send('ok');

                req.Model.changes().then(feed => {
                    /* istanbul ignore if */
                    feed.each((err, doc) => {
                        if (err) {
                            return;
                        }

                        if (doc.isSaved() === false) {
                            client.send(JSON.stringify({
                                action: 'create',
                                doc
                            }));
                        }
                        else if (!doc.getOldValue()) {
                            client.send(JSON.stringify({
                                action: 'delete',
                                doc
                            }));
                        }
                        else {
                            client.send(JSON.stringify({
                                action: 'update',
                                from  : doc.getOldValue(),
                                doc
                            }));
                        }
                    });
                });
            })
            .catch(err => {
                log.error(err.message);
                return client.send(`Error: ${err.message}`);
            });
    });
};
