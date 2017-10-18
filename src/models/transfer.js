module.exports = (bookshelf) => {
    const name = 'Transfer';
    const Model = bookshelf.Model.extend({
        tableName    : 'transfers',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        sender() {
            return this.belongsTo('User', 'sender_id');
        },

        reciever() {
            return this.belongsTo('User', 'reciever_id');
        }
    });

    return { Model, name };
};
