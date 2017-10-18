module.exports = (bookshelf) => {
    const name = 'Price';
    const Model = bookshelf.Model.extend({
        tableName    : 'prices',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        article() {
            return this.belongsTo('Article');
        },

        fundation() {
            return this.belongsTo('Fundation');
        },

        group() {
            return this.belongsTo('Group');
        },

        period() {
            return this.belongsTo('Period');
        },

        point() {
            return this.belongsTo('Point');
        },

        promotion() {
            return this.belongsTo('Promotion');
        },

        purchases() {
            return this.hasMany('Purchase');
        }
    });

    return { Model, name };
};
