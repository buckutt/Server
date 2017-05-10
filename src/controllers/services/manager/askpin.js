const express      = require('express');
const randomstring = require('randomstring');
const dots         = require('dot');
const APIError     = require('../../../errors/APIError');
const mailer       = require('../../../lib/mailer');
const dbCatch      = require('../../../lib/dbCatch');
const config       = require('../../../../config');

/**
 * Generate mail to send
 * @param  {String} mail User mail
 * @param  {String} key  Recover key
 * @return {Object}      Mail to send
 */
function generateMessage(mail, key) {
    const from     = config.from;
    const to       = mail;
    const subject  = config.subject;
    const template = dots.template(config.askpin.template);
    const html     = template({ link: `${config.managerUrl}/#/generate?key=${key}` });

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
        .catch(err => dbCatch(err, next));
});

module.exports = router;
