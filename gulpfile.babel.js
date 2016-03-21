import gulp from 'gulp';
import babel from 'gulp-babel';
import changed from 'gulp-changed';
import sourcemaps from 'gulp-sourcemaps';
import rimraf from 'rimraf';

gulp.task('seed', ['default'], (cb) => {
    const models = require('./app/models').default;

    models.onReady = () => {
        const buckuttData = require('./app/buckuttData').default;
        const raw         = buckuttData.raw(models);

        Promise
            .all(raw.all.map(document => document.save()))
            .then(() => {
                console.log('Inserted documents');
                return Promise.all(buckuttData.rels(models, raw.data));
            })
            .then(() => models.r.wait())
            .then(() => buckuttData.post(models, raw.data))
            .then(() => {
                console.log('Inserted relationships');
                cb();
            })
            .catch((err) => {
                console.log(err.stack);
                cb();
            });
    };
});

gulp.task('clean', (cb) => {
    rimraf('build', cb);
});

gulp.task('cleardb', (cb) => {
    rimraf('rethinkdb_data', cb);
});

gulp.task('config', () => {
    const src = 'src/config/**/*.json';
    const dst = 'app/config/';

    return gulp.src(src)
        .pipe(changed(dst))
        .pipe(gulp.dest(dst));
});

gulp.task('default', ['config'], () => {
    const src = 'src/**/*.js';
    const dst = 'app';

    return gulp.src(src)
        .pipe(changed(dst))
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(dst));
});
