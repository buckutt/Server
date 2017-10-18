module.exports = (bookshelf) => {
    const name = 'Period';
    const Model = bookshelf.Model.extend({
        tableName    : 'periods',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        event() {
            return this.belongsTo('Event');
        },

        wikets() {
            return this.hasMany('Wiket');
        },

        memberships() {
            return this.hasMany('Membership');
        },

        prices() {
            return this.hasMany('Price');
        },

        rights() {
            return this.hasMany('Right');
        }
    });

    return { Model, name };
};
