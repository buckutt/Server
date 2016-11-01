const thinky = require('../lib/thinky');

const type = thinky.type;

const Price = thinky.createModel('Price', {
    // Optional => not specified in bodies but generated by RethinkDB
    id          : type.string().optional(),
    amount      : Number,
    createdAt   : type.date().default(new Date()),
    editedAt    : Date,
    isRemoved   : type.boolean().default(false),
    // Force Thinky to show thoses additional fields that would be cut by enforce_extra
    Fundation_id: type.string().optional(),
    Group_id    : type.string().optional(),
    Period_id   : type.string().optional(),
    Point_id    : type.string().optional()
}, {
    enforce_missing: true,
    enforce_extra  : 'remove',
    enforce_type   : 'strict'
});

Price.pre('save', function preSave(next) {
    this.editedAt = new Date();
    next();
});

Price.ensureIndex('amount');
Price.ensureIndex('createdAt');
Price.ensureIndex('editedAt');

Price.associate = (models) => {
    models.Price.belongsTo(models.Fundation, 'fundation', 'Fundation_id', 'id');
    models.Price.belongsTo(models.Group, 'group', 'Group_id', 'id');
    models.Price.belongsTo(models.Period, 'period', 'Period_id', 'id');
    models.Price.belongsTo(models.Point, 'point', 'Point_id', 'id');
    models.Price.hasMany(models.Purchase, 'purchases', 'id', 'Purchase_id');
    models.Price.hasAndBelongsToMany(models.Promotion, 'promotions', 'id', 'id');
    models.Price.hasAndBelongsToMany(models.Article, 'articles', 'id', 'id');
};

module.exports = Price;
