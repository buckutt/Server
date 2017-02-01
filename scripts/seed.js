const models = require('../src/models');
const logger = require('../src/lib/log');

const log = logger(module);

// Shim for values
Object.values = obj => Object.keys(obj).map(key => obj[key]);

const seeder = () => {
    /* MeanOfPayment */
    const meanofpaymentCard = new models.MeanOfPayment({
        slug: 'card',
        name: 'Carte'
    });

    const meanofpaymentCash = new models.MeanOfPayment({
        slug: 'cash',
        name: 'Liquide'
    });

    const meanofpaymentCheque = new models.MeanOfPayment({
        slug: 'cheque',
        name: 'Chèque'
    });

    /* Events */
    const eventDefault = new models.Event({
        name : 'Défaut',
        config: {
            minReload    : 100,
            maxPerAccount: 10000
        }
    });

    /* Periods */
    const periodEternity = new models.Period({
        name : 'Éternité',
        start: new Date(0),
        end  : new Date(21474000000000)
    });

    /* Points */
    const pointInternet = new models.Point({
        name: 'Internet'
    });

    /* Users */
    const defaultAdmin = new models.User({
        firstname  : 'Admin',
        lastname   : 'Admin',
        nickname   : 'Admin',
        pin        : '$2a$12$zkBo1ZCnnRuGYo6TC7fpgOYb8zACrnSJSTUrFdrPwMKQ/1s4xOauO',
        password   : '$2a$12$wPVfP2StwfdJ.IfPVdXfZOGCiDvQDYRnTrLzrtE8gDP1mEmrS0lj6',
        mail       : 'admin@buckless.com',
        credit     : 0,
        isTemporary: false
    });

    /* MeanOfLogin */
    const defaultMol = new models.MeanOfLogin({
        type: 'etuMail',
        data: 'admin@buckless.com'
    });

    /* Rights */
    const rightAdmin = new models.Right({
        name: 'admin'
    });

    const events = {
        eventDefault
    };

    const periods = {
        periodEternity
    };

    const points = {
        pointInternet
    };

    const meansOfPayment = {
        meanofpaymentCard,
        meanofpaymentCash,
        meanofpaymentCheque
    };

    const users = {
        defaultAdmin
    };

    const meansOfLogin = {
        defaultMol
    };

    const rights = {
        rightAdmin
    };

    const all = Object.values(events)
        .concat(Object.values(periods))
        .concat(Object.values(points))
        .concat(Object.values(meansOfPayment))
        .concat(Object.values(users))
        .concat(Object.values(meansOfLogin))
        .concat(Object.values(rights));

    const data = {
        events,
        periods,
        points,
        meansOfPayment,
        users,
        meansOfLogin,
        rights
    };

    return {
        data,
        all
    };
};

function seeds(all) {
    return Promise.all(all.map(document => document.save()));
}

function rels(data) {
    const arr = [];

    /* MeansOfLogin - Relationships : user */
    data.meansOfLogin.defaultMol.User_id = data.users.defaultAdmin.id;
    arr.push(data.meansOfLogin.defaultMol.save());

    /* Periods - Relationships : event */
    data.periods.periodEternity.Event_id = data.events.eventDefault.id;
    arr.push(data.periods.periodEternity.save());

    /* Rights - Relationships : period, users */
    data.rights.rightAdmin.Period_id = data.periods.periodEternity.id;
    data.rights.rightAdmin.users     = [data.users.defaultAdmin];
    arr.push(data.rights.rightAdmin.saveAll({
        users: true
    }));

    return Promise.all(arr);
}

function seed() {
    const raw = seeder();

    return seeds(raw.all)
        .then(() => rels(raw.data));
}

module.exports = seed;

// Entry point
if (require.main === module) {
    const raw = seeder();

    seeds(raw.all)
        .then(() => {
            log.info('Inserted documents');

            return rels(raw.data);
        })
        .then(() => {
            log.info('Inserted relationships');

            process.exit(0);
        })
        .catch((e) => {
            log.error(e);
            process.exit(1);
        });
}
