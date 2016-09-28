import path         from 'path';
import childProcess from 'child_process';
import Promise      from 'bluebird';

Promise.promisifyAll(childProcess);

const cwd          = path.join(__dirname, '..');
const withCoverage = process.argv.slice(2).indexOf('--coverage') > -1;
const istanbul     = './node_modules/babel-istanbul/lib/cli';
const mocha        = './node_modules/mocha/bin/_mocha';

const start = (p, cb) => {
    const proc = childProcess.spawn(p, { cwd, shell: true });

    proc.stdout.on('data', data => {
        console.log(data.toString());
    });

    proc.stderr.on('data', data => {
        console.error(data.toString());
    });

    if (cb) {
        proc.on('exit', cb);
    }
};

start('npm run build', code => {
    if (code === 0) {
        let cmd;

        if (withCoverage) {
            cmd = `cross-env NODE_ENV=test babel-node ${istanbul} cover ${mocha} -- --sort --bail`;
        } else {
            cmd = `cross-env NODE_ENV=test babel-node ${mocha} --sort --bail`;
        }

        start(cmd);
    }
});
