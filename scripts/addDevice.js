const fs        = require('fs-extra');
const path      = require('path');
const execSync  = require('child_process').execSync;
const Promise   = require('bluebird');
const inquirer  = require('inquirer');
const models    = require('../src/models');
const requelize = require('../src/lib/requelize');
const logger    = require('../src/lib/log');

const log = logger(module);

function createDir(opts) {
    const cwd = path.join(__dirname, '..', 'ssl', 'certificates', opts.deviceName);

    try {
        fs.mkdirsSync(cwd);
    } catch (e) {
        return Promise.reject(e);
    }

    return cwd;
}

function setDeviceConfig(opts, fingerprint) {
    log.info('Inserting device in database');

    const device      = new models.Device({ name: opts.deviceName, fingerprint });
    const devicePoint = new models.DevicePoint({ Period_id: opts.periodId });

    return models.Point.get(opts.pointId)
        .then((point) => {
            device.points = (device.points || []).concat({
                document: point,
                through : devicePoint,
                saveAll : {
                    period: true
                }
            });

            return device.saveAll({ points: true });
        });
}

function copyClient(opts, cwd) {
    log.info('Copying client files...');

    try {
        const client = fs.readFileSync('./ssl/templates/client1.cnf', 'utf8')
            .replace(/(challengePassword\s*= )(\w*)/, `$1${opts.password}`)
            .replace(/(CN\s*= )(\w*)/, `$1${opts.deviceName}`);


        fs.writeFileSync(path.join(cwd, `${opts.deviceName}.cnf`), client, 'utf8');
    } catch (e) {
        return Promise.reject(e);
    }
}

function genClient(opts) {
    log.info('Generating client certificates...');

    let outPassword;
    let out;

    const cwd = createDir(opts);
    copyClient(opts, cwd);

    try {
        outPassword = fs.readFileSync('./ssl/certificates/ca/ca.cnf', 'utf8').match(/output_password\s* = (\w*)/)[1];
    } catch (e) {
        return Promise.reject(e);
    }

    try {
        /* eslint-disable max-len */
        execSync(`openssl genrsa -out ${opts.deviceName}-key.pem 4096`, { cwd });
        execSync(`openssl req -new -config ${opts.deviceName}.cnf -key ${opts.deviceName}-key.pem -out ${opts.deviceName}-csr.pem`, { cwd });
        execSync(`openssl x509 -req -extfile ${opts.deviceName}.cnf -days 999 -passin "pass:${outPassword}" -in ${opts.deviceName}-csr.pem -CA ../ca/ca-crt.pem -CAkey ../ca/ca-key.pem -CAcreateserial -out ${opts.deviceName}-crt.pem`, { cwd });
        execSync(`openssl verify -CAfile ../ca/ca-crt.pem ${opts.deviceName}-crt.pem`, { cwd });
        execSync(`openssl pkcs12 -export -clcerts -in ${opts.deviceName}-crt.pem -inkey ${opts.deviceName}-key.pem -out ${opts.deviceName}.p12 -password "pass:${opts.password}"`, { cwd });
        out = execSync(`openssl x509 -fingerprint -in ./ssl/certificates/${opts.deviceName}/${opts.deviceName}-crt.pem`);
        /* eslint-enable max-len */
    } catch (e) {
        return Promise.reject(e);
    }

    return {
        fingerprint: out.toString().match(/Fingerprint=(.*)/)[1].replace(/:/g, ''),
        fileName   : path.join(cwd, `${opts.deviceName}.p12`)
    };
}

function getAdminPeriodPoint(opts) {
    return models.r
        .table('Period')
        .getAll('Éternité', { index: 'name' })
        .pluck('id')
        .run()
        .then((res) => {
            if (res.length === 0) {
                return Promise.reject(new Error('Database not seed'));
            }

            opts.periodId = res[0].id;

            return models.r
                .table('Point')
                .getAll('Internet', { index: 'name' })
                .pluck('id')
                .run();
        })
        .then((res) => {
            opts.pointId = res[0].id;
        });
}

function addDevice(opts) {
    let initialPromise = Promise.resolve();

    if (opts.admin) {
        initialPromise = getAdminPeriodPoint(opts);
    }

    return initialPromise
        .then(() => genClient(opts))
        .then(res => setDeviceConfig(opts, res.fingerprint))
        .then(() => opts.password);
}

module.exports = { addDevice, createDir, genClient };

// Entry point
if (require.main === module) {
    const opts = {};
    let periods;
    let points;

    requelize.sync()
        .then(() => requelize.r
            .table('Period')
            .pluck('id', 'name')
            .run()
        )
        .then((res) => {
            periods = res;

            return requelize.r.table('Point').pluck('id', 'name').run();
        })
        .then((res) => {
            points = res;

            return inquirer.prompt([
                {
                    type   : 'input',
                    name   : 'name',
                    message: 'Device name :'
                },
                {
                    type   : 'list',
                    name   : 'point',
                    message: 'Default point :',
                    choices: points.map(point => `${point.name} - ${point.id}`)
                },
                {
                    type   : 'list',
                    name   : 'period',
                    message: 'Default period :',
                    choices: periods.map(period => `${period.name} - ${period.id}`)
                },
                {
                    type   : 'password',
                    name   : 'password',
                    message: 'SSL export password :'
                }
            ]);
        })
        .then((answer) => {
            opts.pointId    = answer.point.split(' - ')[1];
            opts.periodId   = answer.period.split(' - ')[1];
            opts.deviceName = answer.name;
            opts.password   = answer.password;

            return addDevice(opts);
        })
        .then((password) => {
            log.info(`[ p12 password ] ${password}`);
            process.exit(0);
        })
        .catch((e) => {
            log.error(e);
            process.exit(1);
        });
}

