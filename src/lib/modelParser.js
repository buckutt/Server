import APIError from '../errors/APIError';

const modelsNames = {
    articles      : 'Article',
    categories    : 'Category',
    devices       : 'Device',
    events        : 'Event',
    fundations    : 'Fundation',
    groups        : 'Group',
    groupPeriods  : 'GroupPeriod',
    meansoflogin  : 'MeanOfLogin',
    meansofpayment: 'MeanOfPayment',
    periods       : 'Period',
    periodPoints  : 'PeriodPoint',
    points        : 'Point',
    prices        : 'Price',
    promotions    : 'Promotion',
    purchases     : 'Purchase',
    reloads       : 'Reload',
    rights        : 'Right',
    sets          : 'Set',
    transfers     : 'Transfer',
    users         : 'User'
};

const possibleValues = Object.keys(modelsNames);

export function modelFromName(req, res, modelName) {
    if (possibleValues.indexOf(modelName) === -1) {
        return new APIError(404, 'Model not found');
    }

    return req.app.locals.models[modelsNames[modelName]];
}

/**
 * Parses the target odel
 * @param  {Request}  req   Express request
 * @param  {Response} res   Express Response
 * @param  {Function} next  Next middleware
 * @param  {String}   model The query value
 * @return {Function} The next middleware
 */
function modelParser (req, res, next, model) {
    if (possibleValues.indexOf(model) === -1) {
        return next(new APIError(404, 'Model not found'));
    }

    req.Model = req.app.locals.models[modelsNames[model]];

    return next();
}

export default modelParser;
