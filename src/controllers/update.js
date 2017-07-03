const express     = require('express');
const idParser    = require('../lib/idParser');
const logger      = require('../lib/log');
const modelParser = require('../lib/modelParser');
const dbCatch     = require('../lib/dbCatch');

const log = logger(module);

/**
 * Update controller. Handles updating one element.
 */
const router = new express.Router();

router.put('/:model/:id', (req, res, next) => {
    log.info(`Update ${req.params.model}(${req.params.id}) with ${JSON.stringify(req.body)}`, req.details);

    // First, get the model
    req.Model
        .get(req.params.id)
        .run()
        .then((inst) => {
            // Update based on body values
            Object.keys(req.body).forEach((k) => {
                inst[k] = req.body[k];
            });

            return inst.save();
        })
        .then((result) => {
            if (req.query.embed) {
                return req.Model.get(result.id).embed(req.query.embed).run();
            }

            return result;
        })
        .then((result) => {
            res
                .status(200)
                .json(result)
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.param('model', modelParser);
router.param('id', idParser);

module.exports = router;
