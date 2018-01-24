const fs   = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

fs
    .readdirSync(path.join(__dirname, 'unit'))
    .map(p => require(path.join(__dirname, 'unit', p)));

fs
    .readdirSync(path.join(__dirname, 'integration'))
    .map(p => require(path.join(__dirname, 'integration', p)))

after(() => {
    process.exit(0);
});
