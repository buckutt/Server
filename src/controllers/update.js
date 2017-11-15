const express                      = require('express');
const idParser                     = require('../lib/idParser');
const logger                       = require('../lib/log');
const modelParser                  = require('../lib/modelParser');
const { embedParser, embedFilter } = require('../lib/embedParser');
const dbCatch                      = require('../lib/dbCatch');

const log = logger(module);

/**
 * Update controller. Handles updating one element.
 */
const router = new express.Router();

router.put('/:model/:id', (req, res, next) => {
    log.info(`Update ${req.params.model}(${req.params.id}) with ${JSON.stringify(req.body)}`, req.details);

    // First, get the model
    req.Model
        .where({ id: req.params.id })
        .fetch()
        .then((inst) => {
            const previous = inst.toJSON();

            // Update based on body values
            Object.keys(req.body).forEach((key) => {
                inst.set(key, req.body[key]);
            });

            // Has to be set manually because of the previous select
            inst.set('updated_at', new Date());

            req.app.locals.modelChanges.emit(
                'data',
                'update',
                modelParser.modelsNames[req.params.model],
                { from: previous, to: inst.toJSON() }
            );

            return inst.save();
        })
        .then((result) => {
            // Embed multiple relatives
            const withRelated = (req.query.embed) ? embedParser(req.query.embed) : [];

            return req.Model
                .where({ id: result.id })
                .fetch({ withRelated });
        })
        .then((result) => {
            const embedFilters = (req.query.embed) ?
                req.query.embed.filter(rel => rel.required).map(rel => rel.embed) :
                [];

            res
                .status(200)
                .json(embedFilter(embedFilters, [result.toJSON()])[0])
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.param('model', modelParser);
router.param('id', idParser);

module.exports = router;
