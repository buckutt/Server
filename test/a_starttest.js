import assert   from 'assert';
import fs       from 'fs';
import unirest  from 'unirest';
import syncExec from 'sync-exec';
import moment   from 'moment';
import app      from '../src/app';

describe('Should start the test application', () => {
    before(function (done) {
        this.timeout(0);

        let sslDateResult = syncExec('openssl x509 -noout -enddate -in ssl/test/test-crt.pem').stdout;
        sslDateResult = sslDateResult.split('=').pop();

        let date = moment(sslDateResult, ['MMM D HH:mm:ss YYYY', 'MMM  D HH:mm:ss YYYY']);

        // Remove GMT
        date = date
            .add(moment().utcOffset(), 'minutes')
            .utcOffset(0);

        console.log(`[Checking SSL Date] ${date.toString()}`);

        if (date.isBefore(moment())) {
            throw new Error('Test SSL certificates are outdated');
        }

        app
            .start()
            .then(done);
    });

    it('should refuse if no ssl certificate is present', done => {
        unirest.request('https://localhost:3006/', {
            cert              : null,
            key               : null,
            ca                : null,
            strictSSL         : false,
            rejectUnauthorized: false
        }, (error, res) => {
            assert.equal(error, null);
            assert.equal(401, res.statusCode);
            assert.equal('Unauthorized : missing client HTTPS certificate', res.body);

            done();
        });
    });
});

const certFile = fs.readFileSync('ssl/test/test-crt.pem');
const keyFile  = fs.readFileSync('ssl/test/test-key.pem');
const caFile   = fs.readFileSync('ssl/test/ca-crt.pem');

const options  = {
    cert              : certFile,
    key               : keyFile,
    ca                : caFile,
    strictSSL         : false,
    rejectUnauthorized: false
};

unirest.request = unirest.request.defaults(options);

global.unirest = unirest;
global.q       = obj => encodeURIComponent(JSON.stringify(obj));

['get', 'post', 'put', 'delete'].forEach(method => {
    const previous_ = unirest[method];
    unirest[method] = (...args) => previous_(...args)
        .type('json')
        .header('Authorization', `Bearer ${process.env.TOKEN}`);
});
