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

    const all = Object.values(events)
        .concat(Object.values(periods))
        .concat(Object.values(points))
        .concat(Object.values(meansOfPayment));

    const data = {
        events,
        periods,
        points,
        meansOfPayment
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

    /* Periods - Relationships : event */
    data.periods.periodEternity.Event_id = data.events.eventDefault.id;
    arr.push(data.periods.periodEternity.save());

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
