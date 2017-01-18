const fs           = require('fs-extra');
const path         = require('path');
const execSync     = require('child_process').execSync;
const Promise      = require('bluebird');
const randomstring = require('randomstring');
const models       = require('../src/models');
const logger       = require('../src/lib/log');

const adminPassword = randomstring.generate();
const deviceName    = 'admin';

const log = logger(module);

// Create directory
const cwd = path.join(__dirname, '..', 'ssl', 'certificates', 'admin');

try {
    fs.mkdirsSync('./ssl/certificates/admin');
} catch (e) {
    console.error(e);
    process.exit(1);
}

function setDeviceConfig(out) {
    const fingerprint = out.match(/Fingerprint=(.*)/)[1].replace(/:/g, '');
    const device      = new models.Device({ name: deviceName, fingerprint });
    const periodPoint = new models.PeriodPoint({});

    log.info('Inserting device in database');

    periodPoint.devices = [device];

    let periodId;
    let pointId;

    return models.r
        .table('Period')
        .getAll('Éternité', { index: 'name' })
        .pluck('id')
        .run()
        .then((res) => {
            if (res.length === 0) {
                throw new Error('Database not seed');
            }

            periodId = res[0].id;

            return models.r
                .table('Point')
                .getAll('Internet', { index: 'name' })
                .pluck('id')
                .run();
        })
        .then((res) => {
            pointId = res[0].id;

            return models.Period.get(periodId);
        })
        .then((period) => {
            periodPoint.period = period;

            return models.Point.get(pointId);
        })
        .then((point) => {
            periodPoint.point = point;
            return periodPoint.saveAll();
        })
        .catch(e => Promise.reject(e));
}

function copyClient() {
    log.info('Copying client files...');

    try {
        const client = fs.readFileSync('./ssl/templates/client1.cnf', 'utf8')
            .replace(/(challengePassword\s*= )(\w*)/, `$1${adminPassword}`)
            .replace(/(CN\s*= )(\w*)/, '$1admin');

        fs.writeFileSync('./ssl/certificates/admin/admin.cnf', client, 'utf8');
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

function genClient() {
    log.info('Generating client certificates...');
    let outPassword;
    let out;

    try {
        outPassword = fs.readFileSync('./ssl/certificates/ca.cnf', 'utf8').match(/output_password\s* = (\w*)/)[1];
    } catch (e) {
        return Promise.reject(new Error(e));
    }

    try {
        /* eslint-disable max-len */
        execSync(`openssl genrsa -out ${deviceName}-key.pem 4096`, { cwd });
        execSync(`openssl req -new -config ${deviceName}.cnf -key ${deviceName}-key.pem -out ${deviceName}-csr.pem`, { cwd });
        execSync(`openssl x509 -req -extfile ${deviceName}.cnf -days 999 -passin "pass:${outPassword}" -in ${deviceName}-csr.pem -CA ../ca-crt.pem -CAkey ../ca-key.pem -CAcreateserial -out ${deviceName}-crt.pem`, { cwd });
        execSync(`openssl verify -CAfile ../ca-crt.pem ${deviceName}-crt.pem`, { cwd });
        execSync(`openssl pkcs12 -export -clcerts -in ${deviceName}-crt.pem -inkey ${deviceName}-key.pem -out ${deviceName}.p12 -password "pass:${adminPassword}"`, { cwd });
        out = execSync(`openssl x509 -fingerprint -in ./ssl/certificates/${deviceName}/${deviceName}-crt.pem`);
        /* eslint-enable max-len */
    } catch (e) {
        return Promise.reject(e);
    }

    return out.toString();
}

function addAdminDevice() {
    return Promise.resolve(copyClient())
        .then(() => genClient())
        .then(out => setDeviceConfig(out));
}

module.exports = addAdminDevice;

// Entry point
if (require.main === module) {
    addAdminDevice()
        .then(() => {
            console.log(`[ admin p12 password ] ${adminPassword}`);
            process.exit(0);
        })
        .catch((e) => {
            console.log(e);
            process.exit(1);
        });
}
