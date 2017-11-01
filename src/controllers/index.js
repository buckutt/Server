const path        = require('path');
const fs          = require('fs');
const express     = require('express');
const middlewares = require('../middlewares');

const { marshal, unmarshal } = require('../middlewares/connectors/http');

const router = new express.Router('/');

/**
 * Use every middlewares
 */
for (const key of Object.keys(middlewares)) {
    router.use(marshal(middlewares[key]));
}

router.use(unmarshal);

router.get('/', (_, res) => res.status(200).json({}).end());

/**
 * Recursively use every subrouters, manager's services first, then app services
 */
fs
    .readdirSync(path.join(__dirname, 'services/manager'))
    .filter(f => f.slice(-3) === '.js' && f.slice(0, -3) !== 'index')
    .forEach(f => router.use(require(path.join(__dirname, 'services', 'manager', f))));

fs
    .readdirSync(path.join(__dirname, 'services'))
    .filter(f => f.slice(-3) === '.js' && f.slice(0, -3) !== 'index')
    .forEach(f => router.use(require(path.join(__dirname, 'services', f))));

fs
    .readdirSync(path.join(__dirname))
    .filter(f => f.slice(-3) === '.js' && f.slice(0, -3) !== 'index')
    .forEach(f => router.use(require(path.join(__dirname, f))));

module.exports = router;
