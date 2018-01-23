const express         = require('express');
const APIError        = require('../../errors/APIError');
const canSellOrReload = require('../../lib/canSellOrReload');
const dbCatch         = require('../../lib/dbCatch');

const router = new express.Router();

router.get('/services/items', (req, res, next) => {
    const userRights = canSellOrReload(req.user, req.point.id);

    if (!userRights.canSell && !userRights.canReload) {
        return next(new APIError(module, 401, 'No right to reload or sell'));
    }

    if (!req.query.buyer || !req.query.molType) {
        if (!userRights.canSell || !req.device.defaultGroup_id) {
            return res
                .status(200)
                .json({
                    articles  : [],
                    promotions: []
                })
                .end();
        }
        req.groups = [req.device.defaultGroup_id];
        return next();
    }

    const models = req.app.locals.models;
    const now    = new Date();

    models.MeanOfLogin
        .where({
            type   : req.query.molType,
            data   : req.query.buyer,
            blocked: false
        })
        .fetch({
            withRelated: [
                'user',
                'user.memberships',
                'user.purchases',
                'user.purchases.price',
                'user.purchases.price.period',
                {
                    'user.memberships.period': query => query
                        .where('start', '<=', now)
                        .where('end', '>=', now)
                },
                'user.memberships.period.event'
            ]
        })
        .then(mol => ((mol) ? mol.related('user').toJSON() : null))
        .then((buyer) => {
            if (!buyer) {
                return next(new APIError(module, 404, 'Buyer not found'));
            }

            req.buyer          = buyer;
            req.buyer.pin      = '';
            req.buyer.password = '';

            req.groups         = req.buyer.memberships
                .filter(membership => membership.period.id && membership.period.event.id)
                .map(membership => membership.group_id);


            if (!userRights.canSell || req.groups.length === 0) {
                return res
                    .status(200)
                    .json({
                        buyer     : req.buyer,
                        articles  : [],
                        promotions: []
                    })
                    .end();
            }

            next();
        })
        .catch(err => dbCatch(module, err, next));
});

router.get('/services/items', (req, res, next) => {
    const models   = req.app.locals.models;
    const now      = new Date();
    let articles   = [];
    let promotions = [];

    models.Price
        .query(price => price
            .where('point_id', req.point.id)
            .whereIn('group_id', req.groups)
        )
        .fetchAll({
            withRelated: [
                {
                    period: query => query
                        .where('start', '<=', now)
                        .where('end', '>=', now)
                },
                'period.event',
                'point',
                'fundation',
                'promotion',
                'promotion.sets',
                'promotion.sets.articles',
                'article',
                'article.categories',
                'article.categories.points'
            ]
        })
        .then(prices => ((prices) ? prices.toJSON() : null))
        .filter(price => price.period.id && price.point.id && price.fundation.id)
        .then((prices) => {
            prices.forEach((price) => {
                if (price.promotion && price.promotion.id) {
                    const promotionSets = price.promotion.sets
                        .map(set => ({
                            id      : set.id,
                            name    : set.name,
                            articles: set.articles
                        }));

                    promotions.push({
                        id   : price.promotion.id,
                        name : price.promotion.name,
                        price: {
                            id    : price.id,
                            amount: price.amount
                        },
                        sets: promotionSets
                    });
                }

                if (price.article && price.article.id) {
                    const matchReqPoint = point => point.id === req.point.id;
                    let categories      = price.article.categories
                        .filter(cat => cat.points.some(matchReqPoint));

                    categories = (categories.length > 0) ?
                        categories
                            .map(category => (
                                { id: category.id, name: category.name, priority: category.priority }
                            )) :
                        [{ id: 'default', name: 'Hors catégorie', priority: -1 }];

                    categories.forEach((category) => {
                        articles.push({
                            id     : price.article.id,
                            name   : price.article.name,
                            vat    : price.article.vat,
                            alcohol: price.article.alcohol,
                            price  : {
                                id    : price.id,
                                amount: price.amount
                            },
                            category
                        });
                    });
                }
            });

            // Keep the lowest price (by category) for each article and promotion
            articles = articles
                .sort((a, b) => (a.price.amount - b.price.amount))
                .filter((article, i, initialArticles) => (
                    i === initialArticles.findIndex(article2 =>
                        article.id === article2.id &&
                        article.category.id === article2.category.id
                    )
                ));

            promotions = promotions
                .sort((a, b) => (a.price.amount - b.price.amount))
                .filter((promotion, i, initialPromotion) => (
                    i === initialPromotion.findIndex(promotion2 => promotion.id === promotion2.id)
                ));


            // Get the displayed price of a single article inside a promotion
            promotions = promotions.map((promotion) => {
                promotion.sets = promotion.sets.map((set) => {
                    set.articles = set.articles
                        .map(article => articles.find(a => a.id === article.id))
                        .filter(article => article);
                    return set;
                });

                return promotion;
            });

            res
                .status(200)
                .json({
                    buyer: req.buyer,
                    articles,
                    promotions
                })
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
