module.exports = (bookshelf) => {
    const name = 'Device';
    const Model = bookshelf.Model.extend({
        tableName    : 'devices',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true,

        wikets() {
            return this.hasMany('Wiket');
        }
    });

    return { Model, name };
};
