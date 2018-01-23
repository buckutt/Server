const APIError = require('../errors/APIError');

const modelsNames = {
    articles      : 'Article',
    categories    : 'Category',
    devices       : 'Device',
    events        : 'Event',
    fundations    : 'Fundation',
    groups        : 'Group',
    memberships   : 'Membership',
    meansoflogin  : 'MeanOfLogin',
    meansofpayment: 'MeanOfPayment',
    periods       : 'Period',
    wikets        : 'Wiket',
    points        : 'Point',
    prices        : 'Price',
    promotions    : 'Promotion',
    purchases     : 'Purchase',
    refunds       : 'Refund',
    reloads       : 'Reload',
    rights        : 'Right',
    sets          : 'Set',
    transfers     : 'Transfer',
    users         : 'User',
    webservices   : 'Webservice'
};

const possibleValues = Object.keys(modelsNames);

/**
 * Parses the target odel
 * @param  {Request}  req   Express request
 * @param  {Response} res   Express Response
 * @param  {Function} next  Next middleware
 * @param  {String}   model The query value
 * @return {Function} The next middleware
 */
function modelParser(req, res, next, model) {
    if (possibleValues.indexOf(model.toLowerCase()) === -1) {
        return next(new APIError(module, 404, 'Model not found'));
    }

    req.Model = req.app.locals.models[modelsNames[model.toLowerCase()]];

    return next();
}

module.exports = modelParser;

module.exports.modelsNames = modelsNames;
