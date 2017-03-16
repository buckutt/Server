/* eslint-disable func-names */

const Promise   = require('bluebird');
const fs        = require('fs');
const unirest   = require('unirest');
const thinky    = require('../src/lib/thinky');
const models    = require('../src/models');
const addDevice = require('../scripts/addDevice');

const r         = thinky.r;

describe('Before tests', () => {
    it('should empty the database', function (done) {
        this.timeout(20 * 1000);

        models.loadModels()
            .then(() => r.tableList())
            .then((tableList) => {
                const deletePromises = [];

                tableList.forEach((table) => {
                    deletePromises.push(r.table(table).delete());
                });

                return Promise.all(deletePromises);
            })
            .then(() => {
                done();
            });
    });

    it('should create one user', function (done) {
        this.timeout(10000);

        let userId;
        let noRightsUserId;
        let sellerUserId;
        let deviceId;
        let periodId;
        let outdatedPeriodId;

        r.table('User').insert([
            {
                firstname  : 'Buck',
                lastname   : 'UTT',
                nickname   : 'buck',
                pin        : '$2a$08$BbpMLi5.FSkF/8vn1d.1iu3oiUorqdPlIJYv.4acQpNUbZRpxSzUa',
                password   : '$2a$08$bXHvytIeJpSy8QdC8E4kIuwR5WjU8rhaBcMVoMC3mEgJ1fOS78kaO',
                mail       : 'buck@buckless.fr',
                credit     : 120,
                isTemporary: false,
                createdAt  : new Date(),
                editedAt   : new Date(),
                isRemoved  : false,
                failedAuth : 0
            },
            {
                firstname  : 'No',
                lastname   : 'Rights',
                nickname   : 'NoRights',
                pin        : '$2a$08$BbpMLi5.FSkF/8vn1d.1iu3oiUorqdPlIJYv.4acQpNUbZRpxSzUa',
                password   : '$2a$08$bXHvytIeJpSy8QdC8E4kIuwR5WjU8rhaBcMVoMC3mEgJ1fOS78kaO',
                mail       : 'norights@buckless.fr',
                credit     : 120,
                isTemporary: false,
                createdAt  : new Date(),
                editedAt   : new Date(),
                isRemoved  : false,
                failedAuth : 0
            },
            {
                firstname  : 'Sel',
                lastname   : 'ler',
                nickname   : 'Seller',
                pin        : '$2a$08$BbpMLi5.FSkF/8vn1d.1iu3oiUorqdPlIJYv.4acQpNUbZRpxSzUa',
                password   : '$2a$08$bXHvytIeJpSy8QdC8E4kIuwR5WjU8rhaBcMVoMC3mEgJ1fOS78kaO',
                mail       : 'seller@buckless.fr',
                credit     : 120,
                isTemporary: false,
                createdAt  : new Date(),
                editedAt   : new Date(),
                isRemoved  : false,
                failedAuth : 0
            }
        ])
        .then((res) => {
            userId         = res.generated_keys[0];
            noRightsUserId = res.generated_keys[1];
            sellerUserId   = res.generated_keys[2];

            return r.table('MeanOfLogin').insert([{
                type     : 'etuMail',
                data     : 'buck@buckless.fr',
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false,
                User_id  : userId
            }, {
                type     : 'etuId',
                data     : '22000000353423',
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false,
                User_id  : userId
            }, {
                type     : 'etuMail',
                data     : 'norights@buckless.fr',
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false,
                User_id  : noRightsUserId
            }, {
                type     : 'etuMail',
                data     : 'seller@buckless.fr',
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false,
                User_id  : sellerUserId
            }]);
        })
        .then(() =>
            r.table('Event').insert({
                name  : 'Vente permanente au Foyer',
                config: {
                    minReload    : 500,
                    maxPerAccount: 100 * 100
                },
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false
            })
        )
        .then((res) => {
            process.env.EventFoyerId = res.generated_keys[0];

            return r.table('Period').insert([{
                name     : 'Surrounding',
                start    : new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)),
                end      : new Date(Date.now() + (1000 * 60 * 60 * 24 * 30)),
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false,
                Event_id : process.env.EventFoyerId
            }, {
                name     : 'Never',
                start    : new Date(Date.now() - (1000 * 60 * 60 * 24 * 30 * 2)),
                end      : new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)),
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false,
                Event_id : process.env.EventFoyerId
            }]);
        })
        .then((res) => {
            periodId         = res.generated_keys[0];
            outdatedPeriodId = res.generated_keys[1];

            process.env.PeriodId = periodId;

            return r.table('Point').insert([{
                name     : 'Foyer',
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false
            }, {
                name     : 'UnusedPoint',
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false
            }]);
        })
        .then((res) => {
            process.env.FoyerId = res.generated_keys[0];

            return r.table('Fundation').insert({
                name   : 'UNG',
                website: 'http://ung.utt.fr',
                mail   : 'ung@utt.fr'
            });
        })
        .then((res) => {
            process.env.UNGId = res.generated_keys[0];

            return r.table('Price').insert([
                {
                    amount      : 60,
                    Period_id   : periodId,
                    Point_id    : process.env.FoyerId,
                    Fundation_id: process.env.UNGId
                },
                {
                    amount      : 100,
                    Period_id   : periodId,
                    Point_id    : process.env.FoyerId,
                    Fundation_id: process.env.UNGId
                }
            ]);
        })
        .then((res) => {
            process.env.PriceId          = res.generated_keys[0];
            process.env.PromotionPriceId = res.generated_keys[1];

            return r.table('Right').insert([{
                name     : 'admin',
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false,
                Period_id: periodId
            }, {
                name     : 'admin',
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false,
                Period_id: outdatedPeriodId,
                Point_id : process.env.FoyerId
            }, {
                name     : 'seller',
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false,
                Period_id: periodId,
                Point_id : process.env.FoyerId
            }, {
                name     : 'reloader',
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false,
                Period_id: periodId,
                Point_id : process.env.FoyerId
            }]);
        })
        .then(res =>
            r.table('Right_User').insert([{
                Right_id: res.generated_keys[0],
                User_id : userId
            }, {
                Right_id: res.generated_keys[1],
                User_id : userId
            }, {
                Right_id: res.generated_keys[2],
                User_id : sellerUserId
            }, {
                Right_id: res.generated_keys[3],
                User_id : sellerUserId
            }])
        )
        .then(() => addDevice.genClient({ password: 'test', deviceName: 'test' }))
        .then(res =>
            r.table('Device').insert({
                fingerprint: res.fingerprint,
                name       : 'test',
                createdAt  : new Date(),
                editedAt   : new Date(),
                isRemoved  : false
            })
        )
        .then((res) => {
            deviceId             = res.generated_keys[0];
            process.env.deviceId = deviceId;
        })
        .then(() =>
            r.table('PeriodPoint').insert({
                Period_id: periodId,
                Point_id : process.env.FoyerId,
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false
            })
        )
        .then(res =>
            r.table('Device_PeriodPoint').insert({
                id            : `${deviceId}_${res.generated_keys[0]}`,
                Device_id     : deviceId,
                PeriodPoint_id: res.generated_keys[0]
            })
        )
        .then(() =>
            r.table('MeanOfPayment').insert([
                {
                    slug: 'card',
                    name: 'Carte'
                },
                {
                    slug: 'cash',
                    name: 'Liquide'
                },
                {
                    slug: 'cheque',
                    name: 'Chèque'
                },
                {
                    slug: 'gobby',
                    name: 'Gobby'
                }
            ])
        )
        .then(() =>
            r.table('Group').insert({
                name     : 'Users',
                createdAt: new Date(),
                editedAt : new Date()
            })
        )
        .then(() => {
            done();
        })
        .catch((err) => {
            console.log(err);
            process.exit(1);
        });
    });

    after((done) => {
        const p12File = fs.readFileSync('ssl/certificates/test/test.p12');
        const caFile  = fs.readFileSync('ssl/certificates/ca/ca-crt.pem');

        const options = {
            pfx               : p12File,
            passphrase        : 'test',
            ca                : caFile,
            strictSSL         : false,
            rejectUnauthorized: false
        };

        unirest.request = unirest.request.defaults(options);

        global.unirest = unirest;
        global.q       = obj => encodeURIComponent(JSON.stringify(obj));

        ['get', 'post', 'put', 'delete'].forEach((method) => {
            const previous_ = unirest[method];
            unirest[method] = (...args) => previous_(...args)
                .type('json')
                .header('Authorization', `Bearer ${process.env.TOKEN}`);
        });

        done();
    });
});
