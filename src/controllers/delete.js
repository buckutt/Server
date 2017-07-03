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

router.delete('/:model/:id', (req, res, next) => {
    log.info(`Delete ${req.params.model} ${req.params.id}`, req.details);

    // First, get the model
    req.Model
        .get(req.params.id)
        .embed(req.query.embed)
        .run()
        .then(inst => inst.delete())
        .then(() =>
            res
                .status(200)
                .end()
        )
        .catch(err => dbCatch(module, err, next));
});

router.param('model', modelParser);
router.param('id', idParser);

module.exports = router;
