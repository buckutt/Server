/* eslint-disable func-names */

const io     = require('socket.io-client');
const assert = require('assert');
const fs     = require('fs');

/* global unirest */

const TOKEN_HEADER = { Authorization: `Bearer ${process.env.TOKEN}` };

/**
 * ws wrapper to support SSL and CORS
 * @param  {Object} headers Additional headers
 * @return {WebSocket} The ws instance
 */
function ws(headers) {
    const p12File = fs.readFileSync('ssl/certificates/test/test.p12');
    const caFile  = fs.readFileSync('ssl/certificates/ca/ca-crt.pem');

    const opts = {
        pfx               : p12File,
        passphrase        : 'test',
        ca                : caFile,
        strictSSL         : false,
        rejectUnauthorized: false,
        extraHeaders      : Object.assign({
            origin: 'https://localhost:3006',
        }, headers)
    };

    return io('https://localhost:3006/changes', opts);
}

describe('Changes', () => {
    it('should not allow the changefeed when no Authorization header is sent', (done) => {
        const socket = new ws();

        socket.on('connection')

        socket.on('APIError', (msg) => {
            console.log(msg);done();process.exit(1);
        });

        socket.on('message', (msg) => {
            console.log(msg);done();process.exit(1);
        });
    });

    it('should not allow the changefeed when the Authorization header is wrong', (done) => {
        const socket = new ws({ Authorization: 'foo' });

        socket.onerror = (err) => {
            assert.ok(err.indexOf('status: 400') > -1);
            socket.abort();
            done();
        };
    });

    it('should not allow the changefeed when the Authorization header is not Bearer', (done) => {
        const socket = new ws({ Authorization: 'foo bar' });

        socket.onerror = (err) => {
            assert.ok(err.indexOf('status: 400') > -1);
            socket.abort();
            done();
        };
    });

    it('should not allow a query without a model', (done) => {
        const socket = new ws(TOKEN_HEADER);

        socket.onmessage = (err) => {
            console.log('err is', err);
        }

        socket.onmessage = (e) => {
            assert.equal('Error: No model required', e.data);
            socket.close();
            done();
        };
    });

    it('should not allow a query on a non-existant model', (done) => {
        const headers = { Authorization: `Bearer ${process.env.TOKEN}` };
        const model = 'models=foobar';

        const query = `${token}&${model}`;

        const socket = new _EventSource(`https://localhost:3006/changes?${query}`);

        socket.onmessage = (e) => {
            assert.equal('Error: Model not found', e.data);
            socket.close();
            done();
        };
    });

    it('should sends data when the Authorization header is okay', (done) => {
        const token = `authorization=Bearer%20${process.env.TOKEN}`;
        const model = 'models=purchases';

        const query = `${token}&${model}`;

        const socket = new _EventSource(`https://localhost:3006/changes?${query}`);

        socket.onmessage = (e) => {
            assert.equal('{"model":"purchases","action":"listen"}', e.data);
            socket.close();
            done();
        };
    });

    it('should watch for changes', function (done) {
        this.timeout(5000);

        const token = `authorization=Bearer%20${process.env.TOKEN}`;
        const model = 'models=meansofpayment';

        const query = `${token}&${model}`;

        const socket = new _EventSource(`https://localhost:3006/changes?${query}`);

        let mopId;

        let calls = 0;

        /**
         * Check if all the queries has been feeded to the event source client
         */
        function checkDone() {
            assert.equal(4, calls);

            socket.close();
            done();
        }

        /**
         * Delete a mean of payment
         */
        function requestDelete() {
            unirest.delete(`https://localhost:3006/meansofpayment/${mopId}`)
                .end(() => {
                    setTimeout(checkDone, 500);
                });
        }

        /**
         * Update a mean of payment
         */
        function requestUpdate() {
            unirest.put(`https://localhost:3006/meansofpayment/${mopId}`)
                .send({
                    slug: 'bar',
                    name: 'Bar'
                })
                .end(() => {
                    setTimeout(requestDelete, 500);
                });
        }

        /**
         * Creates a mean of payment
         */
        function requestCreate() {
            unirest.post('https://localhost:3006/meansofpayment')
                .send({
                    slug: 'foo',
                    name: 'Foo'
                })
                .end((response) => {
                    mopId = response.body.id;
                    setTimeout(requestUpdate, 500);
                });
        }

        socket.onmessage = (e) => {
            calls += 1;

            const obj = JSON.parse(e.data);

            if (obj.action === 'listen') {
                assert.equal('string', typeof obj.model);
                requestCreate();
                return;
            }

            if (obj.action === 'create') {
                assert.equal('string', typeof obj.model);
                assert.equal('object', typeof obj.doc);
                assert.equal('string', typeof obj.doc.id);
                assert.equal(2, calls);
            }

            if (obj.action === 'update') {
                assert.equal('string', typeof obj.model);
                assert.equal('object', typeof obj.doc);
                assert.equal('string', typeof obj.doc.id);
                assert.equal('string', typeof obj.from.id);
                assert.equal(3, calls);
            }

            if (obj.action === 'delete') {
                assert.equal('string', typeof obj.model);
                assert.equal('string', typeof obj.doc.id);
                assert.equal(4, calls);
            }
        };
    });
});
