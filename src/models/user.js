module.exports = (bookshelf) => {
    const name = 'User';
    const Model = bookshelf.Model.extend({
        tableName    : 'users',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        meansOfLogin() {
            return this.hasMany('MeanOfLogin');
        },

        memberships() {
            return this.hasMany('Membership');
        },

        rights() {
            return this.hasMany('Right');
        },

        purchases() {
            return this.hasMany('Purchase', 'buyer_id');
        }
    });

    return { Model, name };
};
