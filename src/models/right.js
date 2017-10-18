module.exports = (bookshelf) => {
    const name = 'Right';
    const Model = bookshelf.Model.extend({
        tableName    : 'rights',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        point() {
            return this.belongsTo('Point');
        },

        period() {
            return this.belongsTo('Period');
        },

        user() {
            return this.belongsTo('User');
        }
    });

    return { Model, name };
};
