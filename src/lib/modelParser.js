import APIError from '../APIError';

/**
 * Parses the target odel
 * @param  {Request}  req   Express request
 * @param  {Response} res   Express Response
 * @param  {Function} next  Next middleware
 * @param  {String}   model The query value
 * @return {Function} The next middleware
 */
function modelParser (req, res, next, model) {
    const modelsNames = {
        articles      : 'Article',
        categories    : 'Category',
        devices       : 'Device',
        fundations    : 'Fundation',
        groups        : 'Group',
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

    if (possibleValues.indexOf(model) === -1) {
        return next(new APIError(404, 'Model not found'));
    }

    req.Model = req.app.locals.models[modelsNames[model]];

    return next();
}

export default modelParser;
