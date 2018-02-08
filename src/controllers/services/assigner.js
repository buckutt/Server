const express      = require('express');
const bcrypt       = require('bcryptjs');
const { padStart } = require('lodash');
const mailer       = require('../../lib/mailer');
const dbCatch      = require('../../lib/dbCatch');
const fetchFromAPI = require('../../ticketProviders');
const APIError     = require('../../errors/APIError');
const template     = require('../../mailTemplates');
const config       = require('../../../config');

/**
 * Assigner controller. Handles cards assignment
 */
const router = new express.Router();

router.get('/services/assigner', (req, res, next) => {
    const ticketId = req.query.ticketId;

    if (!ticketId || ticketId.length === 0) {
        return next(new APIError(module, 400, 'Invalid ticketId'));
    }

    const { MeanOfLogin, User } = req.app.locals.models;

    let user;
    let pin;

    MeanOfLogin
        .where({
            type   : 'ticketId',
            data   : ticketId,
            blocked: false
        })
        .fetch({
            withRelated: ['user']
        })
        .then(mol => ((mol) ? mol.toJSON() : null))
        .then((mol) => {
            if (mol && mol.user.id) {
                return res
                    .status(200)
                    .json({
                        id    : mol.user.id,
                        credit: mol.user.credit,
                        name  : `${mol.user.firstname} ${mol.user.lastname}`
                    })
                    .end();
            } else {
                return fetchFromAPI(ticketId)
                    .then((userData) => {
                        pin = padStart(Math.floor(Math.random() * 10000), 4, '0');

                        userData.password = 'none';
                        userData.pin      = bcrypt.hashSync(pin);
                        userData.credit   = userData.credit || 0;

                        user = new User(userData);

                        return user.save();
                    })
                    .then(() => {
                        if (!config.assigner.sendPINMail) {
                            return Promise.resolve();
                        }

                        const from     = config.askpin.from;
                        const to       = user.get('mail');
                        const subject  = config.assigner.subject;
                        const { html, text } = template('pinAssign', {
                            pin,
                            brandname: config.provider.config.merchantName,
                            link     : `${config.urls.managerUrl}`
                        });

                        return mailer.sendMail({ from, to, subject, html, text });
                    })
                    .then(() => {
                        const mailMol = new MeanOfLogin({
                            user_id: user.id,
                            type   : 'mail',
                            data   : user.get('mail'),
                            blocked: false
                        });

                        const ticketMol = new MeanOfLogin({
                            user_id: user.id,
                            type   : 'ticketId',
                            data   : ticketId,
                            blocked: false
                        });

                        return Promise.all([ mailMol.save(), ticketMol.save() ]);
                    })
                    .then(() => {
                        return res
                            .status(200)
                            .json({
                                id    : user.id,
                                credit: user.get('credit'),
                                name  : `${user.get('firstname')} ${user.get('lastname')}`
                            })
                            .end();
                    });
            }
        })
        .catch(err => dbCatch(module, err, next));
});


router.post('/services/assigner/groups', (req, res, next) => {
    const userId = req.body.user;
    const groups = req.body.groups;

    if (!userId || userId.length === 0) {
        return next(new APIError(module, 400, 'Invalid user'));
    }

    if (!groups || !Array.isArray(groups)) {
        return next(new APIError(module, 400, 'Invalid groups'));
    }

    const Membership = req.app.locals.models.Membership;

    const memberships = groups.map((groupId) => {
        const membership = new Membership({
            user_id  : userId,
            group_id : groupId,
            period_id: req.event.defaultPeriod
        });

        return membership.save();
    });

    Promise.all(memberships)
        .then(() =>
            res
                .status(200)
                .json({})
                .end()
        )
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
