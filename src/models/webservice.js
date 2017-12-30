module.exports = (bookshelf) => {
    const name = 'Webservice';
    const Model = bookshelf.Model.extend({
        tableName    : 'webservices',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true
    });

    return { Model, name };
};
