const express            = require('express');
const { groupBy, sumBy } = require('lodash');
const APIError           = require('../../errors/APIError');
const { isUUID }         = require('../../lib/idParser');
const dbCatch            = require('../../lib/dbCatch');

const router = new express.Router();

router.get('/services/treasury/purchases', (req, res, next) => {
    const models = req.app.locals.models;

    let initialQuery = models.Purchase;
    let price        = 'price';
    let pricePeriod  = 'price.period';

    if (req.query.period) {
        if (isUUID(req.query.period)) {
            pricePeriod = {
                'price.period': q => q.where({ id: req.query.period })
            };
        }
    } else if (req.query.dateIn) {
        const dateIn  = new Date(req.query.dateIn);
        const dateOut = new Date(req.query.dateOut);

        if (!isNaN(dateIn.getTime()) && !isNaN(dateOut.getTime())) {
            initialQuery = initialQuery
                .where('created_at', '>=', dateIn)
                .where('created_at', '<=', dateOut);
        } else {
            return next(new APIError(module, 400, 'Invalid dates'));
        }
    }

    if (req.query.event) {
        if (typeof pricePeriod === 'string') {
            pricePeriod = {
                'price.period': q => q.where({ event_id: req.query.event })
            };
        } else {
            const prevCall = pricePeriod['price.period'];
            pricePeriod = {
                'price.period': q => prevCall(q).andWhere({ event_id: req.query.event })
            };
        }
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
                'price.promotion'
            ],
            withDeleted: true
        });

    initialQuery
        .then((results) => {
            // Remove deleted purchases, transform price relation to an outer join
            const purchases = results
                .toJSON()
                .filter(p => !p.deleted_at && p.price.id && price.period && price.period.id);

            const groupedPurchases = groupBy(purchases, 'price_id');

            const mappedPurchases = Object.values(groupedPurchases)
                .map(p => ({
                    price   : p[0].price.amount,
                    id      : p[0].price.id,
                    totalTI : sumBy(p, 'price.amount'),
                    totalVAT: sumBy(p, 'vat'),
                    count   : p.length,
                    name    : (p[0].price.article) ? p[0].price.article.name : p[0].price.promotion.name
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            res.status(200).json(mappedPurchases).end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.get('/services/treasury/reloads', (req, res, next) => {
    const models = req.app.locals.models;

    let initialQuery = models.Reload;

    if (req.query.point) {
        if (isUUID(req.query.point)) {
            initialQuery = initialQuery.where({ point_id: req.query.point });
        }
    }

    if (req.query.dateIn) {
        const dateIn = new Date(req.query.dateIn);
        const dateOut = new Date(req.query.dateOut);

        if (!isNaN(dateIn.getTime()) && !isNaN(dateOut.getTime())) {
            initialQuery = initialQuery
                .where('created_at', '>=', dateIn)
                .where('created_at', '<=', dateOut);
        } else {
            return next(new APIError(module, 400, 'Invalid dates'));
        }
    }

    initialQuery = initialQuery
        .query(q => q
            .select('type')
            .sum('credit as credit')
            .groupBy('type')
        )
        .fetchAll();

    initialQuery
        .then((credits) => {
            res
                .status(200)
                .json(credits.toJSON())
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.get('/services/treasury/refunds', (req, res, next) => {
    const models = req.app.locals.models;

    let initialQuery = models.Refund;

    if (req.query.dateIn) {
        const dateIn = new Date(req.query.dateIn);
        const dateOut = new Date(req.query.dateOut);

        if (!isNaN(dateIn.getTime()) && !isNaN(dateOut.getTime())) {
            initialQuery = initialQuery
                .where('created_at', '>=', dateIn)
                .where('created_at', '<=', dateOut);
        } else {
            return next(new APIError(module, 400, 'Invalid dates'));
        }
    }

    initialQuery = initialQuery
        .query(q => q
            .select('type')
            .sum('amount as amount')
            .groupBy('type')
        )
        .fetchAll();

    initialQuery
        .then((amounts) => {
            res
                .status(200)
                .json(amounts.toJSON())
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
