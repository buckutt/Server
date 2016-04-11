import fs            from 'fs-extra';
import inquirer      from 'inquirer';
import childProcess  from 'child_process';
import Promise       from 'bluebird';
import status        from 'elegant-status';
import models        from '../src/models';

Promise.promisifyAll(childProcess);
const exec = childProcess.execAsync;

let periods    = [];
let points     = [];
let deviceName = '';
let pointId;
let periodId;

// status
let generate;
let insert;

models.r.table('Period').pluck('id', 'name').run().then(res => {
    periods = res;
    return models.r.table('Point').pluck('id', 'name').run();
})
.then(res => {
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
        },
    ]);
})
.then(answer => {
    pointId    = answer.point.split(' - ')[1];
    periodId   = answer.period.split(' - ')[1];
    deviceName = answer.name;

    let client = '';

    let outPassword  = '';
    let chalPassword = '';

    const copy = status('Copying files...');

    try {
        fs.mkdirsSync(`./ssl/${deviceName}`);

        outPassword  = fs.readFileSync('./ssl/ca.cnf', 'utf8').match(/output_password\s* = (\w*)/)[1];
        chalPassword = fs.readFileSync('./ssl/server.cnf', 'utf8').match(/challengePassword\s* = (\w*)/)[1];
        client       = fs.readFileSync('./ssl/example/client1.cnf', 'utf8')
            .replace(/(challengePassword\s*= )(\w*)/, `$1${chalPassword}`)
            .replace(/(CN\s*= )(\w*)/, `$1${deviceName}`);

        fs.writeFileSync(`./ssl/${deviceName}/${deviceName}.cnf`, client, 'utf8');
        copy(true);
    } catch (e) {
        copy(false);
        return Promise.reject(new Error(e));
    }

    generate = status('Generating certificates...');

    /* eslint-disable max-len */
    return exec(`cd ./ssl/${deviceName} &&
        openssl genrsa -out ${deviceName}-key.pem 4096 &&
        openssl req -new -config ${deviceName}.cnf -key ${deviceName}-key.pem -out ${deviceName}-csr.pem &&
        openssl x509 -req -extfile ${deviceName}.cnf -days 999 -passin "pass:${outPassword}" -in ${deviceName}-csr.pem -CA ../ca-crt.pem -CAkey ../ca-key.pem -CAcreateserial -out ${deviceName}-crt.pem &&

        openssl verify -CAfile ../ca-crt.pem ${deviceName}-crt.pem &&

        openssl pkcs12 -export -clcerts -in ${deviceName}-crt.pem -inkey ${deviceName}-key.pem -out ${deviceName}.p12 -password "pass:${answer.password}"
    `);
    /* eslint-enable max-len */
})
.catch(e => {
    generate(false);
    return Promise.reject(new Error(e));
})
.then(() => exec(`openssl x509 -fingerprint -in ./ssl/${deviceName}/${deviceName}-crt.pem`))
.then(out => {
    const fingerprint = out.match(/Fingerprint=(.*)/)[1].replace(/:/g, '');

    generate(true);

    insert = status('Inserting into database...');

    let periodPoint;
    const device = new models.Device({ name: deviceName, fingerprint });

    return models.PeriodPoint.filter({ Period_id: periodId, Point_id: pointId }).getJoin({ devices: true }).run()
        .then(res => {
            if (res.length === 0) {
                periodPoint = new models.PeriodPoint({});
                periodPoint.devices = [ device ];
            } else {
                periodPoint = res[0];
                periodPoint.devices.push(device);
            }

            return models.Period.get(periodId);
        }
    )
    .then(period => {
        periodPoint.period = period;

        return models.Point.get(pointId);
    })
    .then(point => {
        periodPoint.point = point;
        return periodPoint.saveAll();
    })
    .catch((e) => {
        insert(false);
        return Promise.reject(new Error(e));
    });
})
.then(() => {
    insert(true);
    process.exit(0);
})
.catch(err => {
    generate(false);
    console.log(err.stack);
    process.exit(1);
});
