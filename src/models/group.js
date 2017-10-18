module.exports = (bookshelf) => {
    const name = 'Group';
    const Model = bookshelf.Model.extend({
        tableName    : 'groups',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        prices() {
            return this.hasMany('Price');
        },

        memberships() {
            return this.hasMany('Membership');
        }
    });

    return { Model, name };
};
