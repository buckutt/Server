const express       = require('express');
const randomstring  = require('randomstring');
const dots          = require('dot');
const APIError      = require('../../../errors/APIError');
const mailer        = require('../../../lib/mailer');
const dbCatch       = require('../../../lib/dbCatch');
const config        = require('../../../../config');
const logger        = require('../../../lib/log');
const { bookshelf } = require('../../../lib/bookshelf');

const log = logger(module);

/**
 * Generate mail to send
 * @param  {String} mail User mail
 * @param  {String} key  Recover key
 * @return {Object}      Mail to send
 */
function generateMessage(mail, key) {
    const from     = config.askpin.from;
    const to       = mail;
    const subject  = config.askpin.subject;
    const template = dots.template(config.askpin.template);
    const html     = template({ link: `${config.urls.managerUrl}/#/generate?key=${key}` });

    return {
        from, to, subject, html
    };
}


/**
 * AskPin controller.
 */
const router = new express.Router();

router.get('/services/manager/askpin', (req, res, next) => {
    log.info(`Ask pin for mail ${req.query.mail}`);

    const mail   = req.query.mail;
    const models = req.app.locals.models;

    let user;

    models.User
        .query(q => q.where(bookshelf.knex.raw('lower(mail)'), '=', mail.toLowerCase().trim()))
        .fetch()
        .then((user_) => {
            user = user_;

            if (!user) {
                return Promise.reject(new APIError(module, 404, 'Incorrect mail'));
            }

            user.set('recoverKey', randomstring.generate());

            return user.save();
        })
        .then(() => mailer.sendMail(generateMessage(mail, user.get('recoverKey'))))
        .then(() => res.status(200).json({ success: true }).end())
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
