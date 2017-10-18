module.exports = (bookshelf) => {
    const name = 'Fundation';
    const Model = bookshelf.Model.extend({
        tableName    : 'fundations',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        prices() {
            return this.hasMany('Price');
        }
    });

    return { Model, name };
};
