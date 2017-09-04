const express                  = require('express');
const requelize                = require('../../lib/requelize');
const APIError                 = require('../../errors/APIError');
const { isUUID }               = require('../../lib/idParser');
const canSellOrReload          = require('../../lib/canSellOrReload');
const dbCatch                  = require('../../lib/dbCatch');
const filterIsRemovedRecursive = require('../../lib/filterIsRemovedRecursive');

const router = new express.Router();

router.get('/services/items', (req, res, next) => {
    const userRights = canSellOrReload(req.user, req.point.id);

    // If the user can only reload but don't need buyer informations, he doesn't need the service.
    if (!userRights.canSell && (!userRights.canReload || !req.query.buyer)) {
        return next(new APIError(module, 401, 'No right to reload or sell'));
    }

    if (!req.query.buyer) {
        req.groups = (req.device.DefaultGroup_id) ? [req.device.DefaultGroup_id] : [];
        return next();
    }

    if (!isUUID(req.query.buyer)) {
        return next(new APIError(module, 400, 'The provided user is not valid'));
    }

    const buyerQuery = req.app.locals.models.User
        .get(req.query.buyer)
        .embed({
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
        })
        .run();

    buyerQuery
        .then((buyer) => {
            req.buyer          = buyer;
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
            req.groups = buyer.groups
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
                    const promotionSets = promotion.sets
                        .map(set => ({
                            id      : set.id,
                            name    : set.name,
                            articles: set.articles
                        }));

                    promotions.push({
                        id   : promotion.id,
                        name : promotion.name,
                        price: {
                            id    : price.id,
                            amount: price.amount
                        },
                        articles: promotion.articles,
                        sets    : promotionSets
                    });
                });

                price.articles.forEach((article) => {
                    const matchReqPoint = point => point.id === req.point.id;
                    let category        = article.categories.find(cat => cat.points.some(matchReqPoint));

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
                    buyer     : req.buyer,
                    articles  : filterIsRemovedRecursive(articles),
                    promotions: filterIsRemovedRecursive(promotions)
                })
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
