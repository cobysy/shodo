/* global require */

var gulp = require('gulp');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var merge = require('merge-stream');

var globs = {
    dist: "./dist",
    js: [
        "./res/js/jquery-1.7.min.js",
        "./res/js/TheShodo.js",
        "./res/js/TheShodo.FloatingPanel.js",
        "./res/js/TheShodo.Shodo.Core.js",
        "./res/js/TheShodo.Shodo.Player.js",
        "./res/js/TheShodo.Shodo.Resources.js",
        "./res/js/TheShodo.Shodo.Write.js",
        "./res/js/kazari.js",
        "./res/js/floatingPanels.js"
    ],
    css: [
        "./res/css/base.css",
        "./res/css/index.css",
    ],

    images: "./res/img/*",
    media: "./res/media/*"
};

gulp.task('clean', function () {
    return gulp.src([globs.dist], { read: false })
        .pipe(clean());
});

gulp.task('assets', ['clean'], function () {
    var images = gulp.src(globs.images).pipe(gulp.dest(globs.dist + '/res/img'));
    var media = gulp.src(globs.media).pipe(gulp.dest(globs.dist + '/res/media'));
    var html = gulp.src('./index.html').pipe(gulp.dest(globs.dist));

    return merge(images, media, html);
});

gulp.task('styles', ['clean'], function () {
    return gulp.src(globs.css)
        .pipe(concat('bundle.css'))
        //.pipe(minifyCSS())
        .pipe(gulp.dest(globs.dist + '/res/css'));
});

gulp.task('scripts', ['clean'], function () {
    return gulp.src(globs.js)
        .pipe(concat('bundle.js'))
        //.pipe(uglify())
        .pipe(gulp.dest(globs.dist + '/res/js'));
});

gulp.task('build', ['scripts', 'styles', 'assets']);

gulp.task('default', ['build']);