module.exports = (bookshelf) => {
    const name = 'Device';
    const Model = bookshelf.Model.extend({
        tableName    : 'devices',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        defaultGroup() {
            return this.belongsTo('Group', 'defaultGroup_id');
        },

        wikets() {
            return this.hasMany('Wiket');
        }
    });

    return { Model, name };
};
