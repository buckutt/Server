const config = require('../../config');

module.exports = (user) => {
    const result = { canSell: false, canReload: false };

    /* istanbul ignore if */
    if (!user || !user.rights) {
        return result;
    }

    for (const right of user.rights) {
        if (!right.isRemoved && !right.period.isRemoved) {
            const configRight = config.rights[right.name];

            if (right.name === 'admin') {
                result.canReload = true;
                result.canSell   = true;
            }

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
