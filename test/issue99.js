import assert from 'assert';

/* global unirest, q */

describe('Issue #99', () => {
    let gid;
    const embed = q({ users: true });

    it('should add 2 same relationships', done => {
        unirest.get('https://localhost:3006/groups')
            .end(response => {
                gid = response.body[0].id;

                unirest.post(`https://localhost:3006/groups/${gid}/users`)
                    .send({ id: process.env.GJId })
                    .end(response2 => {
                        assert.equal(200, response2.code);

                        unirest.post(`https://localhost:3006/groups/${gid}/users`)
                            .send({ id: process.env.GJId })
                            .end(response3 => {
                                assert.equal(200, response3.code);

                                unirest.get(`https://localhost:3006/groups/${gid}?embed=${embed}`)
                                    .end(response4 => {
                                        assert.equal(2, response4.body.users.length);

                                        done();
                                    });
                            });
                    });
            });
    });

    it('should remove one relationship', done => {
        unirest.delete(`https://localhost:3006/groups/${gid}/users/${process.env.GJId}`)
            .end(response => {
                assert.equal(200, response.code);

                unirest.get(`https://localhost:3006/groups/${gid}?embed=${embed}`)
                    .end(response2 => {
                        assert.equal(1, response2.body.users.length);

                        unirest.delete(`https://localhost:3006/groups/${gid}/users/${process.env.GJId}`)
                            .end(response3 => {
                                assert.equal(200, response3.code);

                                unirest.get(`https://localhost:3006/groups/${gid}?embed=${embed}`)
                                    .end(response4 => {
                                        assert.equal(0, response4.body.users.length);

                                        done();
                                    });
                            });
                    });
            });
    });
});
