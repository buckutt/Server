const thinky = require('thinky');
const config = require('../../config');

const dbConfig = { host: config.db.host, db: config.db.name, silent: true };

module.exports = thinky(dbConfig);
