module.exports = (bookshelf) => {
    const name = 'MeanOfLogin';
    const Model = bookshelf.Model.extend({
        tableName    : 'meansoflogin',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        user() {
            return this.belongsTo('User');
        }
    });

    return { Model, name };
};
