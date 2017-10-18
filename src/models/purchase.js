module.exports = (bookshelf) => {
    const name = 'Purchase';
    const Model = bookshelf.Model.extend({
        tableName    : 'purchases',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        price() {
            return this.belongsTo('Price');
        },

        point() {
            return this.belongsTo('Point');
        },

        promotion() {
            return this.belongsTo('Promotion');
        },

        buyer() {
            return this.belongsTo('User', 'buyer_id');
        },

        seller() {
            return this.belongsTo('User', 'seller_id');
        },

        articles() {
            return this.belongsToMany('Article', 'articles_purchases').withPivot(['count']);
        }
    });

    return { Model, name };
};
