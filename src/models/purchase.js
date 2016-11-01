const thinky = require('../lib/thinky');

const type = thinky.type;

const Purchase = thinky.createModel('Purchase', {
    // Optional => not specified in bodies but generated by RethinkDB
    id            : type.string().optional(),
    createdAt     : type.date().default(new Date()),
    editedAt      : Date,
    articlesAmount: type.array().optional().schema({
        id   : String,
        price: String,
        vat  : Number
    }),
    isRemoved   : type.boolean().default(false),
    // Force Thinky to show thoses additional fields that would be cut by enforce_extra
    Buyer_id    : type.string().optional(),
    Price_id    : type.string().optional(),
    Point_id    : type.string().optional(),
    Promotion_id: type.string().optional(),
    Seller_id   : type.string().optional()
}, {
    enforce_missing: true,
    enforce_extra  : 'remove',
    enforce_type   : 'strict'
});

Purchase.pre('save', function preSave(next) {
    this.editedAt = new Date();
    next();
});

Purchase.ensureIndex('ip');
Purchase.ensureIndex('price');
Purchase.ensureIndex('createdAt');
Purchase.ensureIndex('editedAt');

Purchase.associate = (models) => {
    models.Purchase.belongsTo(models.Price, 'price', 'Price_id', 'id');
    models.Purchase.belongsTo(models.Point, 'point', 'Point_id', 'id');
    models.Purchase.belongsTo(models.Promotion, 'promotion', 'Promotion_id', 'id');
    models.Purchase.belongsTo(models.User, 'buyer', 'Buyer_id', 'id');
    models.Purchase.belongsTo(models.User, 'seller', 'Seller_id', 'id');
    models.Purchase.hasAndBelongsToMany(models.Article, 'articles', 'id', 'id');
};

module.exports = Purchase;
