var gulp       = require('gulp');
var babel      = require('gulp-babel');
var changed    = require('gulp-changed');
var sourcemaps = require('gulp-sourcemaps');
var rimraf     = require('rimraf');

gulp.task('seed', ['default'], function (cb) {
    var models = require('./app/models').default;

    models.onReady = function () {
        var buckuttData = require('./app/buckuttData').default;
        var raw         = buckuttData.raw(models);

        Promise
            .all(
                raw.all.map(function (document) { return document.save(); })
            )
            .then(function () {
                console.log('Inserted documents');

                return Promise.all(buckuttData.rels(models, raw.data));
            })
            .then(function () {
                return models.r.wait()
            })
            .then(function () {
                return buckuttData.post(models, raw.data)
            })
            .then(function () {
                console.log('Inserted relationships');
                cb();
            })
            .catch(function (err) {
                console.log(err.stack);
                cb();
            });
    };
});

gulp.task('clean', function (cb) {
    rimraf('app', cb);
});

gulp.task('cleardb', function (cb) {
    rimraf('rethinkdb_data', cb);
});

gulp.task('config', function () {
    var src = 'src/config/**/*.json';
    var dst = 'app/config/';

    return gulp.src(src)
        .pipe(changed(dst))
        .pipe(gulp.dest(dst));
});

gulp.task('default', ['config'], function () {
    var src = 'src/**/*.js';
    var dst = 'app';
    return gulp.src(src)
        .pipe(changed(dst))
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(dst));
});
