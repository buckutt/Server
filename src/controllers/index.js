const path         = require('path');
const express      = require('express');
const { walkSync } = require('fs-walk');
const middlewares  = require('../middlewares');

const router = new express.Router('/');

/**
 * Use every middlewares
 */
Object.keys(middlewares).forEach(key => router.use(middlewares[key]));

/**
 * Recursively use every subrouters
 */
walkSync(__dirname, (basedir, f) => {
    if (!(f.slice(0, -3) !== 'index' && f.slice(-3) === '.js')) {
        return;
    }

    router.use(require(path.join(basedir, f)));
});

module.exports = router;
