module.exports = (bookshelf) => {
    const name = 'Category';
    const Model = bookshelf.Model.extend({
        tableName    : 'categories',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        articles() {
            return this.belongsToMany('Article', 'articles_categories', 'category_id', 'article_id');
        },

        points() {
            return this.belongsToMany('Point', 'categories_points', 'category_id', 'point_id');
        }
    });

    return { Model, name };
};
