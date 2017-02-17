const express      = require('express');
const randomstring = require('randomstring');
const APIError     = require('../../../errors/APIError');
const mailer       = require('../../../lib/mailer');

/**
 * Generate mail to send
 * @param  {String} mail User mail
 * @param  {String} key  Recover key
 * @return {Object}      Mail to send
 */
function generateMessage(mail, key) {
    const from    = 'noreply@buckless.com';
    const to      = mail;
    const subject = 'Votre nouveau pin !';
    /* TODO: get API url by config */
    const html    = `<a href="http://manager.b.inst.buckless.com/#!/generate?key=${key}">Cliquez ici</a>`;

    return { from, to, subject, html };
}


/**
 * AskPin controller.
 */
const router = new express.Router();

router.get('/services/manager/askpin', (req, res, next) => {
    const models = req.app.locals.models;
    const mail   = req.query.mail;

    let user;

    models.User.getAll(mail, { index: 'mail' })
        .then((users) => {
            if (!users.length) {
                return Promise.reject(new APIError(404, 'Incorrect mail'));
            }

            user = users[0];
            user.recoverKey = randomstring.generate();

            return user.save();
        })
        .then(() => mailer.sendMail(generateMessage(mail, user.recoverKey)))
        .then(() => res.status(200).json({}).end())
        .catch(err => next(err));
});

module.exports = router;
