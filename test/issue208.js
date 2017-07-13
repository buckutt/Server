/* eslint-disable func-names */

const assert = require('assert');

/* global unirest, q */

describe('Issue #208', () => {
    it('should allow filtering three-way delete', (done) => {
        const embed = q({ users: true });
        unirest.get(`https://localhost:3006/groups?embed=${embed}`)
            .end((response) => {
                const gid = response.body[0].id;

                const filter = q({ foo: 'bar' });

                unirest.delete(`https://localhost:3006/groups/${gid}/users/${process.env.GJId}?filter=${filter}`)
                    .send()
                    .end((response2) => {
                        assert.equal(404, response2.code);
                        done();
                    });
            });
    });
});
