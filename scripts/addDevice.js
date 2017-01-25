const path         = require('path');
const fs           = require('fs-extra');
const inquirer     = require('inquirer');
const childProcess = require('child_process');
const Promise      = require('bluebird');
const logger       = require('../src/lib/log');
const models       = require('../src/models');

const log = logger(module);

Promise.promisifyAll(childProcess);
const exec = childProcess.execAsync;

let periods    = [];
let points     = [];
let deviceName = '';
let pointId;
let periodId;

models.r
    .table('Period')
    .pluck('id', 'name')
    .run()
    .then((res) => {
        periods = res;

        return models.r.table('Point').pluck('id', 'name').run();
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
        pointId    = answer.point.split(' - ')[1];
        periodId   = answer.period.split(' - ')[1];
        deviceName = answer.name;

        let client = '';

        let outPassword  = '';
        let chalPassword = '';

        log.info('Copying files...');

        log.info('Generating certificates...');

        try {
            fs.mkdirsSync(`./ssl/${deviceName}`);

            outPassword  = fs.readFileSync('./ssl/certificates/ca.cnf', 'utf8')
                .match(/output_password\s* = (\w*)/)[1];
            chalPassword = fs.readFileSync('./ssl/certificates/server.cnf', 'utf8')
                .match(/challengePassword\s* = (\w*)/)[1];
            client       = fs.readFileSync('./ssl/certificates/example/client1.cnf', 'utf8')
                .replace(/(challengePassword\s*= )(\w*)/, `$1${chalPassword}`)
                .replace(/(CN\s*= )(\w*)/, `$1${deviceName}`);

            fs.writeFileSync(`./ssl/certificates/${deviceName}/${deviceName}.cnf`, client, 'utf8');
        } catch (e) {
            return Promise.reject(new Error(e));
        }

        const cwd = path.join(__dirname, '..', 'ssl', 'certificates', deviceName);

        /* eslint-disable max-len */
        return exec(`openssl genrsa -out ${deviceName}-key.pem 4096`, { cwd })
            .then(() => exec(`openssl req -new -config ${deviceName}.cnf -key ${deviceName}-key.pem -out ${deviceName}-csr.pem`, { cwd }))
            .then(() => exec(`openssl x509 -req -extfile ${deviceName}.cnf -days 999 -passin "pass:${outPassword}" -in ${deviceName}-csr.pem -CA ../ca-crt.pem -CAkey ../ca-key.pem -CAcreateserial -out ${deviceName}-crt.pem`, { cwd }))
            .then(() => exec(`openssl verify -CAfile ../ca-crt.pem ${deviceName}-crt.pem`, { cwd }))
            .then(() => exec(`openssl pkcs12 -export -clcerts -in ${deviceName}-crt.pem -inkey ${deviceName}-key.pem -out ${deviceName}.p12 -password "pass:${answer.password}"`, { cwd }));
        /* eslint-enable max-len */
    })
    .then(() => exec(`openssl x509 -fingerprint -in ./ssl/certificates/${deviceName}/${deviceName}-crt.pem`))
    .then((out) => {
        const fingerprint = out.match(/Fingerprint=(.*)/)[1].replace(/:/g, '');

        log.info('Inserting into database...');

        let periodPoint;
        const device = new models.Device({ name: deviceName, fingerprint });

        return models.PeriodPoint.filter({ Period_id: periodId, Point_id: pointId }).getJoin({ devices: true }).run()
            .then((res) => {
                if (res.length === 0) {
                    periodPoint         = new models.PeriodPoint({});
                    periodPoint.devices = [device];
                } else {
                    periodPoint = res[0];
                    periodPoint.devices.push(device);
                }

                return models.Period.get(periodId);
            }
        )
        .then((period) => {
            periodPoint.period = period;

            return models.Point.get(pointId);
        })
        .then((point) => {
            periodPoint.point = point;
            return periodPoint.saveAll();
        });
    })
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        log.error(err);
        process.exit(1);
    });
