const opToSql = {
    gt: '>',
    lt: '<',
    ge: '>=',
    le: '<=',
    eq: '=',
    ne: '<>'
};

module.exports = (query, filters) => {
    let filteredQuery = query;

    filters.forEach((filter) => {
        const f = filter;

        for (const op of ['gt', 'ne', 'lt', 'ge', 'le', 'eq']) {
            if (f.hasOwnProperty(op)) {
                if (f.date) {
                    f[op] = new Date(f[op]);
                }

                filteredQuery = filteredQuery.where(f.field, opToSql[op], f[op]);
            }
        }
    });

    return filteredQuery;
};
