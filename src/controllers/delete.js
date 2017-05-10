const express     = require('express');
const idParser    = require('../lib/idParser');
const logger      = require('../lib/log');
const modelParser = require('../lib/modelParser');
const { pp }      = require('../lib/utils');
const dbCatch     = require('../lib/dbCatch');

const log = logger(module);

/**
 * Update controller. Handles updating one element.
 */
const router = new express.Router();

router.delete('/:model/:id', (req, res, next) => {
    const queryLog = `${req.Model._name}.get(${req.params.id}).embed(${pp(req.query.embed)})`;
    log.info(queryLog);

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
        .catch(err => dbCatch(err, next));
});

router.param('model', modelParser);
router.param('id', idParser);

module.exports = router;
