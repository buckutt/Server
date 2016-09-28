import path          from 'path';
import fs            from 'fs-extra';
import inquirer      from 'inquirer';
import childProcess  from 'child_process';
import Promise       from 'bluebird';
import status        from 'elegant-status';

Promise.promisifyAll(childProcess);
const exec = childProcess.execAsync;

// status
const copy = status('Copying files...');
let generate;
let write;

try {
    fs.copySync('./ssl/example/ca.cnf', './ssl/ca.cnf');
    fs.copySync('./ssl/example/server.cnf', './ssl/server.cnf');
    copy(true);
} catch (e) {
    copy(false);
    throw new Error(e);
}

inquirer.prompt([
    {
        type   : 'password',
        name   : 'chalPassword',
        message: 'Define challenge password :'
    },
    {
        type   : 'password',
        name   : 'outPassword',
        message: 'Define output password :'
    }
])
.then(answer => {
    write = status('Updating files...');

    try {
        const server = fs.readFileSync('./ssl/server.cnf', 'utf8')
            .replace(/(challengePassword\s*= )(\w*)/, `$1${answer.chalPassword}`);
        const ca     = fs.readFileSync('./ssl/ca.cnf', 'utf8')
            .replace(/(challengePassword\s*= )(\w*)/, `$1${answer.chalPassword}`)
            .replace(/(output_password\s*= )(\w*)/, `$1${answer.outPassword}`);

        fs.writeFileSync('./ssl/server.cnf', server, 'utf8');
        fs.writeFileSync('./ssl/ca.cnf', ca, 'utf8');
        write(true);
    } catch (e) {
        write(false);
        return Promise.reject(new Error(e));
    }

    generate = status('Generating certificates...');

    const cwd = path.join(__dirname, '..', 'ssl');

    /* eslint-disable max-len */
    return exec('openssl req -new -x509 -days 9999 -config ca.cnf -keyout ca-key.pem -out ca-crt.pem', { cwd })
        .then(() => exec('openssl genrsa -out server-key.pem 4096', { cwd }))
        .then(() => exec('openssl req -new -config server.cnf -key server-key.pem -out server-csr.pem', { cwd }))
        .then(() => exec(`openssl x509 -req -extfile server.cnf -days 999 -passin "pass:${answer.outPassword}" -in server-csr.pem -CA ca-crt.pem -CAkey ca-key.pem -CAcreateserial -out server-crt.pem`, { cwd }));
    /* eslint-enable max-len */
})
.then(() => {
    generate(true);
    process.exit(0);
})
.catch(err => {
    generate(false);
    console.log(err.stack);
    process.exit(1);
});
