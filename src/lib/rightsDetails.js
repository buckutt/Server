const config = require('../../config');

module.exports = (user, pointId) => {
    const now    = new Date();
    const result = {
        sell  : false,
        reload: false,
        assign: false,
        admin : false
    };

    /* istanbul ignore if */
    if (!user || !user.rights) {
        return result;
    }

    for (const right of user.rights) {
        if (right.period.start <= now && right.period.end > now &&
            right.point_id === pointId) {
            const configRight = config.rights[right.name];

            if (configRight && right.name === 'admin') {
                result.admin = true;
            }

            if (configRight && configRight.canSell) {
                result.sell = true;
            }

            if (configRight && configRight.canReload) {
                result.reload = true;
            }

            if (configRight && configRight.canAssign) {
                result.assign = true;
            }
        }
    }

    return result;
};
