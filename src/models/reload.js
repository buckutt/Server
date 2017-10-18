module.exports = (bookshelf) => {
    const name = 'Reload';
    const Model = bookshelf.Model.extend({
        tableName    : 'reloads',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        point() {
            return this.belongsTo('Point');
        },

        buyer() {
            return this.belongsTo('User', 'buyer_id');
        },

        seller() {
            return this.belongsTo('User', 'seller_id');
        }
    });

    return { Model, name };
};
