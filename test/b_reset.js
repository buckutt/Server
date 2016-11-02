/* eslint-disable func-names */

const Promise  = require('bluebird');
const syncExec = require('sync-exec');
const thinky   = require('../src/lib/thinky');

const sslResult = syncExec('openssl x509 -noout -fingerprint -in ssl/test/test-crt.pem').stdout;

if (sslResult.indexOf('=') === -1) {
    console.error('Couldn\'t find test certificate (ssl/test/test-crt.pem). Start `npm run addTestDevice`');
    process.exit(1);
}

const fingerprint = sslResult.split('=')[1].replace(/:/g, '').trim();
const r           = thinky.r;

describe('Before tests', () => {
    it('should empty all the databases', function (done) {
        this.timeout(20 * 1000);

        r.tableList()
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
        this.timeout(5000);

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
                pin        : '$2a$12$p/OhqfEVU8tCqo52amm1xeslmqUIBG0xoLgLqLjvRGHAoSrYo5Nbi',
                password   : '$2a$12$fjlZii3c7OyS75c0DZdaUue.vhSe/ISFQPots2bWnGvr5t5IOUQ7W',
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
                pin        : '$2a$12$p/OhqfEVU8tCqo52amm1xeslmqUIBG0xoLgLqLjvRGHAoSrYo5Nbi',
                password   : '$2a$12$fjlZii3c7OyS75c0DZdaUue.vhSe/ISFQPots2bWnGvr5t5IOUQ7W',
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
                pin        : '$2a$12$p/OhqfEVU8tCqo52amm1xeslmqUIBG0xoLgLqLjvRGHAoSrYo5Nbi',
                password   : '$2a$12$fjlZii3c7OyS75c0DZdaUue.vhSe/ISFQPots2bWnGvr5t5IOUQ7W',
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
        .then(res =>
            r.table('Period').insert([{
                name     : 'Surrounding',
                start    : new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)),
                end      : new Date(Date.now() + (1000 * 60 * 60 * 24 * 30)),
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false,
                Event_id : res.generated_keys[0]
            }, {
                name     : 'Never',
                start    : new Date(Date.now() - (1000 * 60 * 60 * 24 * 30 * 2)),
                end      : new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)),
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false,
                Event_id : res.generated_keys[0]
            }])
        )
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
        .then(() =>
            r.table('Device').insert({
                fingerprint,
                name     : 'buckless-test',
                createdAt: new Date(),
                editedAt : new Date(),
                isRemoved: false
            })
        )
        .then((res) => {
            deviceId = res.generated_keys[0];
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
        });
    });
});
