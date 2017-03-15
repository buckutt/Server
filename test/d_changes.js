/* eslint-disable func-names */

const io     = require('socket.io-client');
const assert = require('assert');
const fs     = require('fs');

/* global unirest */

/**
 * ws wrapper to support SSL and CORS
 * @param  {Object} headers Additional headers
 * @return {WebSocket} The ws instance
 */
function WS(headers) {
    const p12File = fs.readFileSync('ssl/certificates/test/test.p12');
    const caFile  = fs.readFileSync('ssl/certificates/ca/ca-crt.pem');

    const opts = {
        pfx               : p12File,
        passphrase        : 'test',
        ca                : caFile,
        strictSSL         : false,
        rejectUnauthorized: false,
        extraHeaders      : Object.assign({
            origin: 'https://localhost:3006'
        }, headers)
    };

    return io('https://localhost:3006/', opts);
}

describe('Changes', () => {
    it('should not allow the changefeed when no Authorization header is sent', (done) => {
        const socket = new WS();

        socket.on('APIError', (err) => {
            assert.equal('No token or scheme provided. Header format is Authorization: Bearer [token]', err);
            socket.close();
            done();
        });
    });

    it('should not allow the changefeed when the Authorization header is wrong', (done) => {
        const socket = new WS({ Authorization: 'foo' });

        socket.on('APIError', (err) => {
            assert.equal('No token or scheme provided. Header format is Authorization: Bearer [token]', err);
            socket.close();
            done();
        });
    });

    it('should not allow the changefeed when the Authorization header is not Bearer', (done) => {
        const socket = new WS({ Authorization: 'foo bar' });

        socket.on('APIError', (err) => {
            assert.equal('Scheme is `Bearer`. Header format is Authorization: Bearer [token]', err);
            socket.close();
            done();
        });
    });

    it('should allow with no listenning', (done) => {
        const TOKEN_HEADER = { Authorization: `Bearer ${process.env.TOKEN}` };
        const socket = new WS(TOKEN_HEADER);

        socket.on('connected', () => {
            assert.ok(true);
            socket.close();
            done();
        });
    });

    it('should sends data when the Authorization header is okay', (done) => {
        const TOKEN_HEADER = { Authorization: `Bearer ${process.env.TOKEN}` };
        const socket = new WS(TOKEN_HEADER);

        socket.on('connected', () => {
            assert.ok(true);

            socket.emit('listen', ['purchases']);

            socket.on('listening', (models) => {
                assert.deepEqual(['Purchase'], models);
                socket.close();
                done();
            });
        });
    });

    it('should watch for changes', function (done) {
        this.timeout(5000);

        const TOKEN_HEADER = { Authorization: `Bearer ${process.env.TOKEN}` };
        const socket = new WS(TOKEN_HEADER);

        socket.on('connected', () => {
            assert.ok(true);

            socket.emit('listen', ['meansofpayment']);

            socket.on('listening', (models) => {
                assert.deepEqual(['MeanOfPayment'], models);

                let mopId;
                let calls = 0;

                /**
                 * Delete a mean of payment
                 */
                function requestDelete() {
                    unirest.delete(`https://localhost:3006/meansofpayment/${mopId}`)
                        .end();
                }

                /**
                 * Update a mean of payment
                 */
                function requestUpdate() {
                    unirest.put(`https://localhost:3006/meansofpayment/${mopId}`)
                        .send({ slug: 'bar', name: 'Bar' })
                        .end(() => { setTimeout(requestDelete, 500); });
                }

                unirest.post('https://localhost:3006/meansofpayment')
                    .send({ slug: 'foo', name: 'Foo' })
                    .end((response) => {
                        mopId = response.body.id;
                        setTimeout(requestUpdate, 500);
                    });

                socket.on('create', (doc) => {
                    calls += 1;
                    assert.equal('object', typeof doc.object);
                    assert.equal('string', typeof doc.object.id);
                });

                socket.on('update', (doc) => {
                    calls += 1;
                    assert.equal(mopId, doc.object.from.id);
                    assert.equal(mopId, doc.object.to.id);
                    assert.equal('Foo', doc.object.from.name);
                    assert.equal('Bar', doc.object.to.name);
                });

                socket.on('delete', (doc) => {
                    calls += 1;
                    assert.equal(mopId, doc.object.id);
                    assert.equal('Bar', doc.object.name);
                    assert.equal(3, calls);

                    done();
                });
            });
        });
    });
});
