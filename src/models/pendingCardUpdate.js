module.exports = (bookshelf) => {
    const name = 'PendingCardUpdate';
    const Model = bookshelf.Model.extend({
        tableName    : 'pendingCardUpdates',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        user() {
            return this.belongsTo('User');
        }
    });

    return { Model, name };
};
