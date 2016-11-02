const express    = require('express');
const APIError   = require('../../errors/APIError');
const { isUUID } = require('../../lib/idParser');

const router = new express.Router();

router.get('/services/treasury/purchases', (req, res, next) => {
    const models = req.app.locals.models;

    let initialQuery = models.Purchase.getJoin({
        price: {
            period  : true,
            articles: true
        },
        articles : true,
        promotion: true
    });

    if (req.query.period) {
        if (isUUID(req.query.period)) {
            initialQuery = initialQuery.filter(doc =>
                doc('price')('Period_id').eq(req.query.period)
            );
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
            return next(new APIError(400, 'Invalid dates'));
        }
    }

    if (req.query.point) {
        initialQuery = initialQuery.filter(doc =>
            doc('Point_id').eq(req.query.point)
        );
    }

    if (req.query.fundation) {
        initialQuery = initialQuery.filter(doc =>
            doc('price')('Fundation_id').eq(req.query.fundation)
        );
    }


    initialQuery = initialQuery
        .group(purchase => purchase('price')('id'))
        .map(doc => doc.merge({
            articlesAmount: doc('articlesAmount').merge(articleAmount => ({
                price: models.r.table('Price').get(articleAmount('price'))
            })),
            vat: models.r.branch(
                doc('articlesAmount').count().eq(1),
                doc('price')('amount').div(
                    models.r.expr(1).add(doc('articlesAmount').nth(0)('vat').div(100))
                ),
                -1
            )
        }))
        .execute();

    initialQuery.then((groups) => {
        const results = groups.map((group) => {
            const first = group.reduction[0];

            group.count         = group.reduction.length;
            group.purchasePrice = first.price.amount;
            group.totalVAT      = group.count * group.purchasePrice;
            group.name          = first.promotion ? first.promotion.name : first.articles[0].name;

            group.reduction = group.reduction.map((purchase) => {
                if (purchase.vat >= 0) {
                    return purchase.vat;
                }

                const priceWT = purchase.price.amount;

                purchase.articlesAmount = purchase.articlesAmount.map(articleAmount => ({
                    wt   : articleAmount.price.amount / (1 + (articleAmount.vat / 100)),
                    vat  : 1 + (articleAmount.vat / 100),
                    price: articleAmount.price.amount
                }));

                const totalWt = purchase.articlesAmount.reduce((a, b) => a.wt + b.wt);

                let totalDivide = 0;
                purchase.articlesAmount.forEach((articleAmount) => {
                    totalDivide += (articleAmount.wt / totalWt) * articleAmount.vat;
                });

                return priceWT / totalDivide;
            });

            group.totalWT = group.reduction.reduce((a, b) => a + b);

            return {
                name    : group.name,
                count   : group.count,
                price   : group.purchasePrice,
                totalVAT: group.totalVAT,
                totalWT : group.totalWT
            };
        });

        res.status(200).json(results).end();
    });
});

router.get('/services/treasury/reloads', (req, res, next) => {
    const models = req.app.locals.models;

    let initialQuery = models.Reload;

    if (req.query.point) {
        if (isUUID(req.query.point)) {
            initialQuery = initialQuery.filter(doc =>
                doc('Point_id').eq(req.query.point)
            );
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
            return next(new APIError(400, 'Invalid dates'));
        }
    }

    initialQuery = initialQuery
        .group('type')
        .map(doc => doc('credit'))
        .sum()
        .execute();

    initialQuery.then((credits) => {
        res.status(200).json(credits).end();
    });
});

module.exports = router;
