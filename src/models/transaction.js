module.exports = (bookshelf) => {
    const name = 'Transaction';
    const Model = bookshelf.Model.extend({
        tableName    : 'transactions',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        user() {
            return this.belongsTo('User', 'user_id');
        }
    });

    return { Model, name };
};
