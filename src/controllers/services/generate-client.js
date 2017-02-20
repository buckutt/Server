const path     = require('path');
const fs       = require('fs');
const express  = require('express');
const glob     = require('glob');
const execSync = require('child_process').execSync;
const logger   = require('../../lib/log');
const APIError = require('../../errors/APIError');

const log = logger(module);

function generateClient() {
    const cwd = path.join(__dirname, 'node_modules', 'buckless-client');

    return new Promise((resolve, reject) => {
        exec('npm run postinstall', { cwd }, (err) => {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
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
            logger.error(`Can't generate client : ${err.toString()}`);
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
