module.exports = (bookshelf) => {
    const name = 'Refund';
    const Model = bookshelf.Model.extend({
        tableName    : 'refunds',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        buyer() {
            return this.belongsTo('User', 'buyer_id');
        },

        seller() {
            return this.belongsTo('User', 'seller_id');
        }
    });

    return { Model, name };
};
