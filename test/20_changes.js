import EventSource from 'eventsource';
import assert      from 'assert';
import fs          from 'fs';

/* global unirest */

/**
 * Event source wrapper to support SSL and CORS
 * @param  {String} url     The base URL
 * @param  {Object} options The options (see EventSource doc on MDN)
 * @return {EventSource} The event source instance
 */
function _EventSource (url, options) {
    return new EventSource(url, Object.assign({
        cert              : fs.readFileSync('ssl/test/test.crt'),
        key               : fs.readFileSync('ssl/test/test.key'),
        strictSSL         : false,
        rejectUnauthorized: false,
        headers           : {
            origin: 'https://localhost:3006'
        }
    }, options));
}

describe('Changes', () => {
    it('should not allow the changefeed when no Authorization header is sent', done => {
        const es = new _EventSource('https://localhost:3006/changes');

        es.onmessage = e => {
            assert.equal('Error: No token or scheme provided. Header format is Authorization: Bearer [token]', e.data);
            es.close();
            done();
        };
    });

    it('should not allow the changefeed when the Authorization header is wrong', done => {
        const es = new _EventSource('https://localhost:3006/changes?authorization=foo');

        es.onmessage = e => {
            assert.equal('Error: No token or scheme provided. Header format is Authorization: Bearer [token]', e.data);
            es.close();
            done();
        };
    });

    it('should not allow the changefeed when the Authorization header is not Bearer', done => {
        const es = new _EventSource('https://localhost:3006/changes?authorization=foo%20bar');

        es.onmessage = e => {
            assert.equal('Error: Scheme is `Bearer`. Header format is Authorization: Bearer [token]', e.data);
            es.close();
            done();
        };
    });

    it('should not allow a query without a model', done => {
        const token = `authorization=Bearer%20${process.env.TOKEN}`;

        const query = `${token}`;

        const es = new _EventSource(`https://localhost:3006/changes?${query}`);

        es.onmessage = e => {
            assert.equal('Error: Model not found', e.data);
            es.close();
            done();
        };
    });

    it('should sends data when the Authorization header is okay', done => {
        const token = `authorization=Bearer%20${process.env.TOKEN}`;
        const model = 'model=purchases';

        const query = `${token}&${model}`;

        const es = new _EventSource(`https://localhost:3006/changes?${query}`);

        es.onmessage = e => {
            assert.equal('ok', e.data);
            es.close();
            done();
        };
    });

    it('should watch for changes', function (done) {
        this.timeout(5000);

        const token = `authorization=Bearer%20${process.env.TOKEN}`;
        const model = 'model=meansofpayment';

        const query = `${token}&${model}`;

        const es = new _EventSource(`https://localhost:3006/changes?${query}`);

        let mopId;

        let calls = 0;

        /**
         * Check if all the queries has been feeded to the event source client
         */
        function checkDone () {
            assert.equal(4, calls);

            es.close();
            done();
        }

        /**
         * Delete a mean of payment
         */
        function requestDelete () {
            unirest.delete(`https://localhost:3006/meansofpayment/${mopId}`)
                .end(() => {
                    setTimeout(checkDone, 500);
                });
        }

        /**
         * Update a mean of payment
         */
        function requestUpdate () {
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
        function requestCreate () {
            unirest.post('https://localhost:3006/meansofpayment')
                .send({
                    slug: 'foo',
                    name: 'Foo'
                })
                .end(response => {
                    mopId = response.body.id;
                    setTimeout(requestUpdate, 500);
                });
        }

        es.onmessage = e => {
            ++calls;

            if (e.data === 'ok') {
                assert.equal('ok', e.data);
                requestCreate();
                return;
            }

            const obj = JSON.parse(e.data);

            if (obj.action === 'create') {
                assert.equal('object', typeof obj.doc);
                assert.equal('string', typeof obj.doc.id);
            }

            if (obj.action === 'update') {
                assert.equal('object', typeof obj.doc);
                assert.equal('string', typeof obj.doc.id);
                assert.equal('string', typeof obj.from.id);
            }

            if (obj.action === 'delete') {
                assert.equal('string', typeof obj.doc.id);
            }
        };
    });
});
