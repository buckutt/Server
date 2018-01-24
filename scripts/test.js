const path         = require('path');
const fs           = require('fs');
const childProcess = require('child_process');
const Mocha        = require('mocha');

process.env.NODE_ENV = 'test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

if (process.argv.indexOf('--coverage') > -1) {
    const cwd = path.join(__dirname, '..');
    const istanbul = './node_modules/.bin/istanbul';

    // TODO: use glob pattern (https://github.com/gotwarlost/istanbul/issues/800)
    const excludes = fs.readdirSync(__dirname)
        .map(file => `-x scripts/${file}`)
        .join(' ')
        .split(' ');

    console.log(istanbul, 'cover', './scripts/test.js', ...excludes);

    const spawn = childProcess.spawn(istanbul, ['cover', './scripts/test.js', ...excludes], {
        cwd,
        stdio: 'inherit'
    });

    spawn.on('close', code => process.exit(code));
} else {
    const files = Mocha.utils
        .lookupFiles('test/', ['js'], false)
        .map(file => path.resolve(file))
        .filter(file => file.endsWith('.test.js'))
        .sort();

    const mocha = new Mocha({
        bail   : true,
        timeout: 5000
    });

    mocha.files = files;

    mocha.run(code => process.exit(code));
}
