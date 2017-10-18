module.exports = (bookshelf) => {
    const name = 'Article';
    const Model = bookshelf.Model.extend({
        tableName    : 'articles',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        prices() {
            return this.hasMany('Price');
        },

        categories() {
            return this.belongsToMany('Category', 'articles_categories', 'article_id', 'category_id');
        },

        sets() {
            return this.belongsToMany('Set', 'articles_sets');
        },

        purchases() {
            return this.belongsToMany('Purchase', 'articles_purchases');
        }
    });

    return { Model, name };
};
