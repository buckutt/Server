const express    = require('express');
const requelize  = require('../../lib/requelize');
const APIError   = require('../../errors/APIError');
const { isUUID } = require('../../lib/idParser');
const dbCatch    = require('../../lib/dbCatch');

const router = new express.Router();

router.get('/services/treasury/purchases', (req, res, next) => {
    const models = req.app.locals.models;

    let initialQuery = models.Purchase
        .filter(requelize.r.row('isRemoved').eq(false))
        .embed({
            price: {
                period  : true,
                articles: true
            },
            articles : true,
            promotion: true
        });

    if (req.query.period) {
        if (isUUID(req.query.period)) {
            initialQuery = initialQuery.filter(doc => doc('price')('Period_id').eq(req.query.period));
        }
    }

    if (req.query.dateIn) {
        const dateIn  = new Date(req.query.dateIn);
        const dateOut = new Date(req.query.dateOut);

        if (!isNaN(dateIn.getTime()) && !isNaN(dateOut.getTime())) {
            initialQuery = initialQuery
                .filter(doc =>
                    doc('createdAt').ge(dateIn).and(
                        doc('createdAt').le(dateOut)
                    )
                );
        } else {
            return next(new APIError(module, 400, 'Invalid dates'));
        }
    }

    if (req.query.event) {
        initialQuery = initialQuery.filter(doc => doc('price')('period')('Event_id').eq(req.query.event));
    }

    if (req.query.point) {
        initialQuery = initialQuery.filter(doc => doc('Point_id').eq(req.query.point));
    }

    if (req.query.fundation) {
        initialQuery = initialQuery.filter(doc => doc('price')('Fundation_id').eq(req.query.fundation));
    }

    initialQuery = initialQuery
        .parse(false)
        .group(purchase => purchase('price')('id'))
        .run();

    initialQuery
        .then((groups) => {
            const result = groups.map((group) => {
                const first = group.reduction[0];

                const treasuryEntry = {};

                treasuryEntry.count    = group.reduction.length;
                treasuryEntry.totalVAT = group.reduction.map(purchase => purchase.vat).reduce((a, b) => a + b, 0);
                treasuryEntry.totalTI  = group.reduction
                    .map(purchase => purchase.price.amount)
                    .reduce((a, b) => a + b, 0);
                treasuryEntry.price    = first.price.amount;
                treasuryEntry.name     = first.promotion ? first.promotion.name : first.articles[0].name;

                return treasuryEntry;
            });

            res.status(200).json(result).end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.get('/services/treasury/reloads', (req, res, next) => {
    const models = req.app.locals.models;

    let initialQuery = models.Reload
        .filter(requelize.r.row('isRemoved').eq(false));

    if (req.query.point) {
        if (isUUID(req.query.point)) {
            initialQuery = initialQuery.filter(doc => doc('Point_id').eq(req.query.point));
        }
    }

    if (req.query.dateIn) {
        const dateIn = new Date(req.query.dateIn);
        const dateOut = new Date(req.query.dateOut);

        if (!isNaN(dateIn.getTime()) && !isNaN(dateOut.getTime())) {
            initialQuery = initialQuery
            .filter(doc =>
                doc('createdAt').ge(dateIn).and(
                    doc('createdAt').le(dateOut)
                )
            );
        } else {
            return next(new APIError(module, 400, 'Invalid dates'));
        }
    }

    initialQuery = initialQuery
        .parse(false)
        .group('type')
        .map(doc => doc('credit'))
        .sum()
        .run();

    initialQuery
        .then((credits) => {
            res
                .status(200)
                .json(credits)
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
