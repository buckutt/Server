const express  = require('express');
const APIError = require('../../../errors/APIError');
const dbCatch  = require('../../../lib/dbCatch');

const router = new express.Router();

router.get('/services/stats/purchases', (req, res, next) => {
    const models = req.app.locals.models;

    let initialQuery = models.Purchase;
    let price        = 'price';
    let pricePeriod  = 'price.period';

    if (req.query.dateIn && req.query.dateOut) {
        const dateIn  = new Date(req.query.dateIn);
        const dateOut = new Date(req.query.dateOut);

        if (!Number.isNaN(dateIn.getTime()) && !Number.isNaN(dateOut.getTime())) {
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

    if (req.query.article) {
        if (typeof price === 'string') {
            price = {
                price: q => q.where({ article_id: req.query.article })
            };
        } else {
            const prevCall = price.price;
            price = {
                price: q => prevCall(q).andWhere({ article_id: req.query.article })
            };
        }
    }

    if (req.query.promotion) {
        if (typeof price === 'string') {
            price = {
                price: q => q.where({ promotion_id: req.query.promotion })
            };
        } else {
            const prevCall2 = price.price;
            price = {
                price: q => prevCall2(q).andWhere({ promotion_id: req.query.promotion })
            };
        }
    }

    initialQuery
        .fetchAll({
            withRelated: [
                'articles',
                price,
                pricePeriod,
                'price.article',
                'price.promotion'
            ],
            withDeleted: true
        })
        .then((results) => {
            const purchases = results
                .toJSON()
                .filter(p => !p.deleted_at && p.price.id && p.price.period && p.price.period.id)
                .map(purchase => purchase.created_at);

            res.status(200).json(purchases).end();
        })
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
