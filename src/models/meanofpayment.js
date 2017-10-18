module.exports = (bookshelf) => {
    const name = 'MeanOfPayment';
    const Model = bookshelf.Model.extend({
        tableName    : 'meansofpayment',
        hasTimestamps: true,
        uuid         : true,
        softDelete   : true
    });

    return { Model, name };
};
