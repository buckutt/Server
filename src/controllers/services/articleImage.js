const express    = require('express');
const requelize  = require('../../lib/requelize');
const APIError   = require('../../errors/APIError');
const { isUUID } = require('../../lib/idParser');
const dbCatch    = require('../../lib/dbCatch');

const router = new express.Router();

router.get('/services/articleImage', (req, res, next) => {
    if (!isUUID(req.query.id)) {
        return next(new APIError(module, 400, 'The provided article is not valid'));
    }

    const articleQuery = req.app.locals.models.Article
        .get(req.query.id)
        .run();

    articleQuery
        .then((article) => {
            if (!article.image) {
                return next(new APIError(module, 404, 'This article doesn\'t have an image'));
            }

            const image = new Buffer(article.image.split(',')[1], 'base64');
            res.writeHead(200, {
               'Content-Type': 'image/png',
               'Content-Length': image.length
            });
            res.end(image);
        })
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
