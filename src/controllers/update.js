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
    const queryLog = `${req.Model._name}.get(${req.params.id})`;
    log.info(queryLog);

    // First, get the model
    req.Model
        .get(req.params.id)
        .run()
        .then((inst) => {
            // Update based on body values
            Object.keys(req.body).forEach((k) => {
                inst[k] = req.body[k];
            });

            log.info(`${req.params.id}.save()`);
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
        .catch(err => dbCatch(err, next));
});

router.param('model', modelParser);
router.param('id', idParser);

module.exports = router;
