const config = require('../../config');

module.exports = (user, pointId) => {
    const now    = new Date();
    const result = { canSell: false, canReload: false };

    /* istanbul ignore if */
    if (!user || !user.rights) {
        return result;
    }

    for (const right of user.rights) {
        if (right.period.start <= now && right.period.end > now &&
            right.point_id === pointId) {
            const configRight = config.rights[right.name];

            if (configRight && configRight.canSell) {
                result.canSell = true;
            }

            if (configRight && configRight.canReload) {
                result.canReload = true;
            }
        }
    }

    return result;
};
