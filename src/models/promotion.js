module.exports = (bookshelf) => {
    const name = 'Promotion';
    const Model = bookshelf.Model.extend({
        tableName    : 'promotions',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        sets() {
            return this.belongsToMany('Set', 'promotions_sets');
        },

        prices() {
            return this.hasMany('Price');
        },

        purchases() {
            return this.hasMany('Purchase');
        }
    });

    return { Model, name };
};
