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

    return Object.values(periods)
        .concat(Object.values(points))
        .concat(Object.values(meansOfPayment));
};

function seed() {
    return models.loadModels().then(() => Promise.all(seeder().map(document => document.save())));
}

module.exports = seed;

// Entry point
if (require.main === module) {
    seed()
        .then(() => {
            log.info('Inserted documents');
            process.exit(0);
        })
        .catch((e) => {
            log.error(e);
            process.exit(1);
        });
}
