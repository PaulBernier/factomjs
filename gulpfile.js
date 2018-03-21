const gulp = require('gulp'),
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    source = require('vinyl-source-stream');

gulp.task('browserify', function() {
    return browserify({ entries: ['src/factom.js'] })
        .transform('babelify', { presets: ['es2015'] })
        .bundle()
        .pipe(source('factom.js'))
        .pipe(buffer())
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['browserify']);