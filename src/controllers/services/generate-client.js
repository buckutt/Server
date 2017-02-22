const path     = require('path');
const fs       = require('fs');
const Promise  = require('bluebird');
const express  = require('express');
const glob     = require('glob');
const exec_    = require('child_process').exec;
const logger   = require('../../lib/log');
const APIError = require('../../errors/APIError');

const log = logger(module);

const exec  = Promise.promisify(exec_);
const read  = Promise.promisify(fs.readFile);
const write = Promise.promisify(fs.writeFile);

function generateClient() {
    const cwd = path.join(__dirname, '..', '..', '..', 'node_modules', 'buckless-client');

    const sourceConfig = path.join(__dirname, '..', '..', '..', 'config', 'client.json');
    const targetConfig = path.join(cwd, 'config', 'production.json');

    return read(sourceConfig)
        .then(clientConfig => write(targetConfig, clientConfig))
        .then(() => exec('npm run build:serverPackage', { cwd }));
}

function sendClient(res, p) {
    res
        .status(200)
        .download(p, 'buckless-client.AppImage')
        .end();
}

const appImages = glob.sync(path.join(__dirname, 'node_modules', 'buckless-client', 'out', '**/*.AppImage'));

if (appImages.length === 0) {
    generateClient()
        .catch((err) => {
            log.error(`Can't generate client : ${err.toString()}`);
            process.exit(1);
        });
}

const APP = appImages[0];

/**
 * Client controller. Create a client bundle
 */
const router = new express.Router();

// Generate a client app
router.get('/services/client', (req, res, next) => {
    if (!fs.fileExistsSync(APP) || req.query.invalidate || invalidate) {
        return generateClient()
            .then(() => sendClient(res, APP))
            .catch((err) => next(new APIError(400, 'Can\'t generate client', err)));
    }

    return sendClient(res, APP);
});

module.exports = router;
