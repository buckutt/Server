import gulp       from 'gulp';
import babel      from 'gulp-babel';
import changed    from 'gulp-changed';
import sourcemaps from 'gulp-sourcemaps';

gulp.task('default', () => {
    const src = 'src/**/*.js';
    const dst = 'build';

    return gulp.src(src)
        .pipe(changed(dst))
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(dst));
});
