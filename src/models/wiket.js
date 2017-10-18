module.exports = (bookshelf) => {
    const name = 'Wiket';
    const Model = bookshelf.Model.extend({
        tableName    : 'wikets',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        point() {
            return this.belongsTo('Point');
        },

        device() {
            return this.belongsTo('Device');
        },

        period() {
            return this.belongsTo('Period');
        }
    });

    return { Model, name };
};
