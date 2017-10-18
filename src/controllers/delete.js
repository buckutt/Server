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
        .where({ id: req.params.id })
        .fetch()
        .then(inst => inst.destroy())
        .then((inst) => {
            req.app.locals.modelChanges.emit(
                'data',
                'delete',
                modelParser.modelsNames[req.params.model],
                { from: inst, to: null }
            );

            res
                .status(200)
                .json({})
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

router.param('model', modelParser);
router.param('id', idParser);

module.exports = router;
