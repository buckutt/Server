module.exports = (bookshelf) => {
    const name = 'Set';
    const Model = bookshelf.Model.extend({
        tableName    : 'sets',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        promotions() {
            return this.belongsToMany('Promotion', 'promotions_sets');
        },

        articles() {
            return this.belongsToMany('Article', 'articles_sets');
        }
    });

    return { Model, name };
};
