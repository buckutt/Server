const express            = require('express');
const APIError           = require('../../errors/APIError');
const { isUUID }         = require('../../lib/idParser');
const dbCatch            = require('../../lib/dbCatch');

const router = new express.Router();

router.get('/services/treasury/csv/purchases', (req, res, next) => {
    const models = req.app.locals.models;

    let initialQuery = models.Purchase;
    let price        = 'price';
    let pricePeriod  = 'price.period';

    if (req.query.dateIn && req.query.dateOut) {
        const dateIn  = new Date(req.query.dateIn);
        const dateOut = new Date(req.query.dateOut);

        if (!isNaN(dateIn.getTime()) && !isNaN(dateOut.getTime())) {
            initialQuery = initialQuery
                .where('created_at', '>=', dateIn)
                .where('created_at', '<=', dateOut);
        } else {
            return next(new APIError(module, 400, 'Invalid dates'));
        }
    } else {
        return next(new APIError(module, 400, 'Dates are missing'));
    }

    if (req.query.event) {
        pricePeriod = {
            'price.period': q => q.where({ event_id: req.query.event })
        };
    }

    if (req.query.point) {
        initialQuery = initialQuery.where({ point_id: req.query.point });
    }

    if (req.query.fundation) {
        price = {
            price: q => q.where({ fundation_id: req.query.fundation })
        };
    }

    initialQuery = initialQuery
        .fetchAll({
            withRelated: [
                price,
                pricePeriod,
                'price.article',
                'price.promotion',
                'seller',
                'buyer',
                'point'
            ],
            withDeleted: true
        });

    initialQuery
        .then((results) => {
            // Remove deleted purchases, transform price relation to an outer join
            const purchases = results
                .toJSON()
                .filter(p => !p.deleted_at && p.price.id && p.price.period && p.price.period.id);

            const header = ['Date', 'Point de vente', 'Vendeur', 'Acheteur', 'Article', 'Prix HT', 'Prix TTC'];

            const csv = purchases.map((purchase) => {
                const item = purchase.price.article ? purchase.price.article : purchase.price.promotion;

                return [
                    purchase.created_at.toISOString(),
                    purchase.point.name,
                    `${purchase.seller.firstname} ${purchase.seller.lastname}`,
                    `${purchase.buyer.firstname} ${purchase.buyer.lastname}`,
                    item.name,
                    purchase.price.amount / (1 + purchase.vat) / 100,
                    purchase.price.amount / 100
                ].join(',');
            }).join('\n');

            return res
                .status(200)
                .send(`${header.join(',')}\n${csv}`)
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.get('/services/treasury/csv/reloads', (req, res, next) => {
    const models = req.app.locals.models;

    let initialQuery = models.Reload;

    if (req.query.point) {
        if (isUUID(req.query.point)) {
            initialQuery = initialQuery.where({ point_id: req.query.point });
        }
    }

    if (req.query.dateIn && req.query.dateOut) {
        const dateIn = new Date(req.query.dateIn);
        const dateOut = new Date(req.query.dateOut);

        if (!isNaN(dateIn.getTime()) && !isNaN(dateOut.getTime())) {
            initialQuery = initialQuery
                .where('created_at', '>=', dateIn)
                .where('created_at', '<=', dateOut);
        } else {
            return next(new APIError(module, 400, 'Invalid dates'));
        }
    } else {
        return next(new APIError(module, 400, 'Dates are missing'));
    }

    initialQuery = initialQuery
        .fetchAll({
            withRelated: [
                'seller',
                'buyer',
                'point'
            ]
        });

    initialQuery
        .then((reloads) => {
            const header = ['Date', 'Point de vente', 'Vendeur', 'Acheteur', 'Moyen de paiement', 'Montant'];

            const csv = reloads.map(reload => [
                reload.created_at.toISOString(),
                reload.point.name,
                `${reload.seller.firstname} ${reload.seller.lastname}`,
                `${reload.buyer.firstname} ${reload.buyer.lastname}`,
                reload.type,
                reload.amount / 100
            ].join(',')).join('\n');

            res
                .status(200)
                .send(`${header.join(',')}\n${csv}`)
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.get('/services/treasury/csv/refunds', (req, res, next) => {
    const models = req.app.locals.models;

    let initialQuery = models.Refund;

    if (req.query.dateIn && req.query.dateOut) {
        const dateIn = new Date(req.query.dateIn);
        const dateOut = new Date(req.query.dateOut);

        if (!isNaN(dateIn.getTime()) && !isNaN(dateOut.getTime())) {
            initialQuery = initialQuery
                .where('created_at', '>=', dateIn)
                .where('created_at', '<=', dateOut);
        } else {
            return next(new APIError(module, 400, 'Invalid dates'));
        }
    } else {
        return next(new APIError(module, 400, 'Dates are missing'));
    }

    initialQuery = initialQuery.fetchAll({
        withRelated: [
            'seller',
            'buyer'
        ]
    });

    initialQuery
        .then((refunds) => {
            const header = ['Date', 'Vendeur', 'Acheteur', 'Moyen de paiement', 'Montant'];

            const csv = refunds.map(refund => [
                refund.created_at.toISOString(),
                `${refund.seller.firstname} ${refund.seller.lastname}`,
                `${refund.buyer.firstname} ${refund.buyer.lastname}`,
                refund.type,
                refund.amount / 100
            ].join(',')).join('\n');

            res
                .status(200)
                .send(`${header.join(',')}\n${csv}`)
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
