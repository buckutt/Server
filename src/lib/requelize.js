const requelize = require('requelize');
const config = require('../../config');

const dbConfig = { host: config.db.host, db: config.db.name };

module.exports = requelize(dbConfig);
