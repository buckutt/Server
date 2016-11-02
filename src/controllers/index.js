const path        = require('path');
const fs          = require('fs');
const express     = require('express');
const middlewares = require('../middlewares');

const router = new express.Router('/');

/**
 * Use every middlewares
 */
Object.keys(middlewares).forEach(key => router.use(middlewares[key]));

/**
 * Recursively use every subrouters, services first
 */
fs
    .readdirSync(path.join(__dirname, 'services'))
    .filter(f => f.slice(-3) === '.js' && f.slice(0, -3) !== 'index')
    .forEach(f => router.use(require(path.join(__dirname, 'services', f))));

fs
    .readdirSync(path.join(__dirname))
    .filter(f => f.slice(-3) === '.js' && f.slice(0, -3) !== 'index')
    .forEach(f => router.use(require(path.join(__dirname, f))));

module.exports = router;
