const gulp = require('gulp'),
    browserify = require('browserify'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    buffer = require('vinyl-buffer'),
    source = require('vinyl-source-stream');

gulp.task('browserify', function() {
    return browserify({ entries: ['src/factom.js'] })
        .transform('babelify', { presets: ['es2015'], plugins: ['transform-async-to-generator'] })
        .bundle()
        .pipe(source('factom.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('default', gulp.parallel(['browserify']));