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
        if (!(right.point_id && right.point_id !== pointId)) {
            if (right.period.start <= now && right.period.end > now) {
                if (right.name === 'admin') {
                    result.admin = true;
                }

                const configRight = config.rights[right.name];

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
    }

    return result;
};
