// Return the parsed query parameter from the raw one
const queryRules = {
    limit  : limit => parseInt(limit, 10),
    offset : offset => parseInt(offset, 10),
    orderBy: order => order,
    sort   : sort => sort,
    embed  : embed => JSON.parse(decodeURIComponent(embed))
};

/**
 * Parses the query to build the future rethink call
 * @param  {Request}  req  Express request
 * @param  {Response} res  Express response
 * @param  {Function} next Next middleware
 * @return {Function} The next middleware
 */
export default function query (req, res, next) {
    const newQuery = {};

    Object.keys(queryRules).forEach(q => {
        const value = (req.query.hasOwnProperty(q)) ? req.query[q].toString() : null;

        if (!value) {
            return;
        }
        newQuery[q] = queryRules[q](value);
    });

    req.query = newQuery;

    return next();
}
