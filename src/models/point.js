module.exports = (bookshelf) => {
    const name = 'Point';
    const Model = bookshelf.Model.extend({
        tableName    : 'points',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        prices() {
            return this.hasMany('Price');
        },

        purchases() {
            return this.hasMany('Purchase');
        },

        reloads() {
            return this.hasMany('Reload');
        },

        rights() {
            return this.hasMany('Right');
        },

        wikets() {
            return this.hasMany('Wiket');
        },

        categories() {
            return this.belongsToMany('Category', 'categories_points', 'point_id', 'category_id');
        },

        defaultGroup() {
            return this.belongsTo('Group', 'defaultGroup_id');
        }
    });

    return { Model, name };
};
