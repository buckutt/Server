const path         = require('path');
const fs           = require('fs-extra');
const mkdirp       = require('mkdirp');
const inquirer     = require('inquirer');
const execSync     = require('child_process').execSync;
const logger       = require('../src/lib/log');
const randomstring = require('randomstring');

const log = logger(module);

mkdirp.sync('./ssl/certificates/server/');

function copyFromTemplate() {
    log.info('Copying files...');

    try {
        fs.copySync('./ssl/templates/ca.cnf', './ssl/certificates/ca.cnf');
        fs.copySync('./ssl/templates/server.cnf', './ssl/certificates/server/server.cnf');
    } catch (e) {
        throw new Error(e);
    }
}

function updateFiles(chalPassword, outPassword) {
    log.info('Updating files...');

    try {
        const server = fs.readFileSync('./ssl/certificates/server/server.cnf', 'utf8')
            .replace(/(challengePassword\s*= )(\w*)/, `$1${chalPassword}`);
        const ca     = fs.readFileSync('./ssl/certificates/ca.cnf', 'utf8')
            .replace(/(challengePassword\s*= )(\w*)/, `$1${chalPassword}`)
            .replace(/(output_password\s*= )(\w*)/, `$1${outPassword}`);

        fs.writeFileSync('./ssl/certificates/server/server.cnf', server, 'utf8');
        fs.writeFileSync('./ssl/certificates/ca.cnf', ca, 'utf8');
    } catch (e) {
        throw e;
    }
}

function generateCertificate(outPassword) {
    log.info('Generating certificates...');
    const cwd       = path.join(__dirname, '..', 'ssl', 'certificates');
    const serverCwd = path.join(cwd, 'server');

    try {
        /* eslint-disable max-len */
        execSync('openssl req -new -x509 -days 9999 -config ca.cnf -keyout ca-key.pem -out ca-crt.pem', { cwd });
        execSync('openssl genrsa -out server-key.pem 4096', { cwd: serverCwd });
        execSync('openssl req -new -config server.cnf -key server-key.pem -out server-csr.pem', { cwd: serverCwd });
        execSync(`openssl x509 -req -extfile server.cnf -days 999 -passin "pass:${outPassword}" -in server-csr.pem -CA ../ca-crt.pem -CAkey ../ca-key.pem -CAcreateserial -out server-crt.pem`, { cwd: serverCwd });
        /* eslint-enable max-len */
    } catch (e) {
        throw e;
    }
}

function sslConfig(chalPassword_, outPassword_, randomPassword) {
    let chalPassword = chalPassword_;
    let outPassword = outPassword_;

    if (randomPassword) {
        chalPassword = randomstring.generate();
        outPassword  = randomstring.generate();
    }

    copyFromTemplate();
    updateFiles(chalPassword, outPassword);
    generateCertificate(outPassword);

    return { chalPassword, outPassword };
}

module.exports = sslConfig;

// Entry point
if (require.main === module) {
    const prompter = inquirer.prompt([
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
    ]);

    prompter
        .then(answer => sslConfig(answer.chalPassword, answer.outPassword))
        .then((pass) => {
            log.info(`[ chalPassword ] ${pass.chalPassword}`);
            log.info(`[ outPassword ] ${pass.outPassword}`);
        });
}
