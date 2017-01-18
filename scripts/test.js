const path         = require('path');
const childProcess = require('child_process');
const Promise      = require('bluebird');

Promise.promisifyAll(childProcess);

const cwd          = path.join(__dirname, '..');
const withCoverage = process.argv.slice(2).indexOf('--coverage') > -1;
const istanbul     = './node_modules/istanbul/lib/cli';
const mocha        = './node_modules/mocha/bin/_mocha';

const start = (p, cb) => {
    const proc = childProcess.spawn(p, { cwd, shell: true });

    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);

    if (cb) {
        proc.on('exit', cb);
    }
};

const cmd = (withCoverage) ?
    `cross-env NODE_ENV=test node ${istanbul} cover ${mocha} -x "scripts/**" -- --sort --bail --timeout 5000` :
    `cross-env NODE_ENV=test node ${mocha} --sort --bail --timeout 5000`;

start(cmd, (testCode) => {
    process.exit(testCode);
});
