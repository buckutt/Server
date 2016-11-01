const fs           = require('fs-extra');
const path         = require('path');
const childProcess = require('child_process');
const Promise      = require('bluebird');
const status       = require('elegant-status');

Promise.promisifyAll(childProcess);
const exec = childProcess.execAsync;

const testPassword = 'test';

// Create directory
const cwd = path.join(__dirname, '..', 'ssl', 'test');

try {
    fs.mkdirsSync('./ssl/test');
} catch (e) {
    console.error(e);
    process.exit(1);
}

// Copy server files
function copyServer() {
    const write = status('Copying server config files...');

    try {
        const server = fs.readFileSync('./ssl/example/server.cnf', 'utf8')
            .replace(/(challengePassword\s*= )(\w*)/, `$1${testPassword}`);
        const ca     = fs.readFileSync('./ssl/example/ca.cnf', 'utf8')
            .replace(/(challengePassword\s*= )(\w*)/, `$1${testPassword}`)
            .replace(/(output_password\s*= )(\w*)/, `$1${testPassword}`);

        fs.writeFileSync('./ssl/test/server.cnf', server, 'utf8');
        fs.writeFileSync('./ssl/test/ca.cnf', ca, 'utf8');
        write(true);
    } catch (e) {
        write(false);
        console.error(e);
        process.exit(1);
    }
}

// Generating server key files
function genServer() {
    const genServ = status('Generating server certificates...');

    /* eslint-disable max-len */
    return exec('openssl req -new -x509 -days 9999 -config ca.cnf -keyout ca-key.pem -out ca-crt.pem', { cwd })
        .then(() => exec('openssl genrsa -out server-key.pem 4096', { cwd }))
        .then(() => exec('openssl req -new -config server.cnf -key server-key.pem -out server-csr.pemver.cnf -key server-key.pem -out server-csr.pem', { cwd }))
        .then(() => exec(`openssl x509 -req -extfile server.cnf -days 999 -passin "pass:${testPassword}" -in server-csr.pem -CA ca-crt.pem -CAkey ca-key.pem -CAcreateserial -out server-crt.pem`, { cwd }))
        .then(() => {
            genServ(true);
        })
        .catch((e) => {
            genServ(false);
            console.error(e);
            process.exit(1);
        });
}

function copyClient() {
    const copy = status('Copying client files...');

    try {
        const client = fs.readFileSync('./ssl/example/client1.cnf', 'utf8')
            .replace(/(challengePassword\s*= )(\w*)/, `$1${testPassword}`)
            .replace(/(CN\s*= )(\w*)/, '$1test');

        fs.writeFileSync('./ssl/test/test.cnf', client, 'utf8');
        copy(true);
    } catch (e) {
        copy(false);
        console.error(e);
        process.exit(1);
    }
}

function genClient() {
    const gen = status('Generating client certificates...');

    return exec('openssl genrsa -out test-key.pem 4096', { cwd })
        .then(() => exec('openssl req -new -config test.cnf -key test-key.pem -out test-csr.pem', { cwd }))
        .then(() => exec(`openssl x509 -req -extfile test.cnf -days 999 -passin "pass:${testPassword}" -in test-csr.pem -CA ./ca-crt.pem -CAkey ./ca-key.pem -CAcreateserial -out test-crt.pem`, { cwd }))
        .then(() => exec('openssl verify -CAfile ./ca-crt.pem test-crt.pem', { cwd }))
        .then(() => exec(`openssl pkcs12 -export -clcerts -in test-crt.pem -inkey test-key.pem -out test.p12 -password "pass:${testPassword}"`, { cwd }))
        .then(() => {
            gen(true);
        })
        .catch((e) => {
            gen(false);
            console.error(e);
            process.exit(1);
        });
}

Promise
    .resolve(copyServer())
    .then(() => genServer())
    .then(() => copyClient())
    .then(() => genClient());
