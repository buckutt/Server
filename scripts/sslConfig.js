import fs            from 'fs-extra';
import inquirer      from 'inquirer';
import childProcess  from 'child_process';
import Promise       from 'bluebird';
import status        from 'elegant-status';

Promise.promisifyAll(childProcess);
const exec = childProcess.execAsync;

// status
const copy = status('Copy files...');
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
    write = status('Update files...');

    try {
        const server = fs.readFileSync('./ssl/server.cnf', 'utf8');
        const ca     = fs.readFileSync('./ssl/ca.cnf', 'utf8');

        fs.writeFileSync('./ssl/server.cnf', server.replace(/(challengePassword\s*= )(\w*)/,
            `$1${answer.chalPassword}`), 'utf8');
        fs.writeFileSync('./ssl/ca.cnf', ca.replace(/(output_password\s*= )(\w*)/, `$1${answer.outPassword}`), 'utf8');
        write(true);
    } catch (e) {
        write(false);
        return Promise.reject(new Error(e));
    }

    generate = status('Generate certificates...');

    /* eslint-disable max-len */
    return exec(`cd ssl &&
        openssl req -new -x509 -days 9999 -config ca.cnf -keyout ca-key.pem -out ca-crt.pem

        openssl genrsa -out server-key.pem 4096 &&
        openssl req -new -config server.cnf -key server-key.pem -out server-csr.pem &&
        openssl x509 -req -extfile server.cnf -days 999 -passin "pass:${answer.outPassword}" -in server-csr.pem -CA ca-crt.pem -CAkey ca-key.pem -CAcreateserial -out server-crt.pem
    `);
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
