import thinky from '../lib/thinky';

const type = thinky.type;

const Point = thinky.createModel('Point', {
    // Optional => not specified in bodies but generated by RethinkDB
    id       : type.string().optional(),
    name     : String,
    createdAt: type.date().default(new Date()),
    editedAt : Date,
    isRemoved: type.boolean().default(false)
}, {
    enforce_missing: true,
    enforce_extra  : 'remove',
    enforce_type   : 'strict'
});

Point.pre('save', function (next) {
    this.editedAt = new Date();
    next();
});

Point.ensureIndex('name');
Point.ensureIndex('createdAt');
Point.ensureIndex('editedAt');

Point.associate = models => {
    models.Point.hasMany(models.PeriodPoint, 'periodPoints', 'id', 'Point_id');
    models.Point.hasMany(models.Promotion, 'promotions', 'id', 'Promotion_id');
    models.Point.hasMany(models.Purchase, 'purchases', 'id', 'Purchase_id');
    models.Point.hasMany(models.Reload, 'reloads', 'id', 'Reload_id');
    models.Point.hasMany(models.Right, 'rights', 'id', 'Right_id');
    models.Point.hasAndBelongsToMany(models.Article, 'articles', 'id', 'id');
};

export default Point;
