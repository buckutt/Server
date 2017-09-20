const express                  = require('express');
const requelize                = require('../../lib/requelize');
const APIError                 = require('../../errors/APIError');
const canSellOrReload          = require('../../lib/canSellOrReload');
const dbCatch                  = require('../../lib/dbCatch');
const filterIsRemovedRecursive = require('../../lib/filterIsRemovedRecursive');

const router = new express.Router();

router.get('/services/items', (req, res, next) => {
    const userRights = canSellOrReload(req.user, req.point.id);

    if (!userRights.canSell && !userRights.canReload) {
        return next(new APIError(module, 401, 'No right to reload or sell'));
    }

    if (!req.query.buyer || !req.query.molType) {
        if (!userRights.canSell) {
            return res
                .status(200)
                .json({})
                .end();
        }

        req.groups = (req.device.DefaultGroup_id) ? [req.device.DefaultGroup_id] : [];
        return next();
    }

    const buyerQuery = req.app.locals.models.MeanOfLogin
        .getAll([
            req.query.molType,
            req.query.buyer,
            false,
            false
        ], { index: 'login' })
        .limit(1)
        .embed({
            user: {
                groups: {
                    _through: {
                        period: true
                    }
                },
                purchases: {
                    price: {
                        period: true
                    }
                }
            }
        })
        .map((mol) => mol('user'))
        .run();

    buyerQuery
        .then((buyers) => {
            if (buyers.length === 0) {
                return next(new APIError(module, 404, 'Buyer not found'));
            }

            req.buyer          = buyers[0];
            req.buyer.pin      = '';
            req.buyer.password = '';

            if (!userRights.canSell) {
                return res
                    .status(200)
                    .json({
                        buyer: req.buyer
                    })
                    .end();
            }

            const now  = new Date();
            req.groups = req.buyer.groups
                .filter(group =>
                    (group._through.period.start.getTime() <= now &&
                    group._through.period.end.getTime() >= now) &&
                    !group._through.period.isRemoved &&
                    !group.isRemoved)
                .map(group => group.id);


            next();
        })
        .catch(err => dbCatch(module, err, next));
});

router.get('/services/items', (req, res, next) => {
    const models     = req.app.locals.models;
    let articles     = [];
    let promotions   = [];
    const now        = new Date();
    const pricesJoin = {
        period    : true,
        point     : true,
        fundation : true,
        promotions: {
            articles: true,
            sets    : {
                articles: true
            }
        },
        articles: {
            categories: {
                points: true
            }
        }
    };

    const itemsQuery = models.Price
        .getAll([ req.point.id, false ], { index: 'pointAndNotRemoved' })
        .filter(doc => requelize.r.expr(req.groups).contains(doc('Group_id')))
        .embed(pricesJoin)
        .filter(requelize.r.row('period')('start').le(now).and(
            requelize.r.row('period')('end').ge(now).and(
                requelize.r.row('period')('isRemoved').eq(false).and(
                    requelize.r.row('point')('isRemoved').eq(false).and(
                        requelize.r.row('fundation')('isRemoved').eq(false)
                    )
                )
            )
        ))
        .run();

    itemsQuery
        .then((pricesResult) => {
            // Take and filter usefull informations for each price
            pricesResult.forEach((price) => {
                price.promotions.forEach((promotion) => {
                    if (!promotion.isRemoved) {
                        const promotionSets = promotion.sets
                            .filter(set => !set.isRemoved)
                            .map(set => ({
                                id      : set.id,
                                name    : set.name,
                                articles: set.articles.filter(article => !article.isRemoved)
                            }));

                        promotions.push({
                            id   : promotion.id,
                            name : promotion.name,
                            price: {
                                id    : price.id,
                                amount: price.amount
                            },
                            articles: promotion.articles.filter(article => !article.isRemoved),
                            sets    : promotionSets
                        });
                    }
                });

                price.articles.forEach((article) => {
                    if (!article.isRemoved) {
                        const matchReqPoint = point => point.id === req.point.id;
                        let category        = article.categories
                            .filter(cat => !cat.isRemoved)
                            .find(cat => cat.points.some(matchReqPoint));

                        category = (category) ?
                            { id: category.id, name: category.name, priority: category.priority } :
                            { id: 'default', name: 'Hors catégorie', priority: -1 };

                        articles.push({
                            id     : article.id,
                            name   : article.name,
                            vat    : article.vat,
                            alcohol: article.alcohol,
                            price  : {
                                id    : price.id,
                                amount: price.amount
                            },
                            category
                        });
                    }
                });
            });

            // Keep the lowest price for each article and promotion
            articles = articles
                .sort((a, b) => (a.price.amount - b.price.amount))
                .filter((article, i, initialArticles) => (
                    i === initialArticles.findIndex(article2 => article.id === article2.id)
                ));

            promotions = promotions
                .sort((a, b) => (a.price.amount - b.price.amount))
                .filter((promotion, i, initialPromotion) => (
                    i === initialPromotion.findIndex(promotion2 => promotion.id === promotion2.id)
                ));


            // Get the displayed price of a single article inside a promotion
            promotions = promotions.map((promotion) => {
                promotion.articles = promotion.articles
                    .map(article => articles.find(a => a.id === article.id));

                promotion.sets = promotion.sets.map((set) => {
                    set.articles = set.articles
                        .map(article => articles.find(a => a.id === article.id));
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
