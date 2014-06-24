// Project Requirements
var gulp = require('gulp');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var spawn = require('child_process').spawn;
var stylish = require('jshint-stylish');
var plumber = require('gulp-plumber');
var _ = require('underscore');
var node;


// Config stuff:
// Specific order that creation of files in javascript folder and in subfolders trigger the watch
// Persistent bug, watch doesn't trigger on creation of a file in javascript/ path.
// Refer to: http://stackoverflow.com/questions/21386940/why-does-gulp-src-not-like-being-passed-an-array-of-complete-paths-to-files
var JSBase = './assets/javascript/';
var JSRelPaths = ['*.js','**/*.js'];
var JSPaths = _.map(JSRelPaths, function(path) {return JSBase+path;});
var CSSBase = './assets/scss/';
var CSSRelPaths = ['*.{scss,css}','**/*.{scss,css}'];
var CSSPaths = _.map(CSSRelPaths, function(path) {return CSSBase+path;});

gulp.task('bundle_js', function() {
  if (!node) {
    gulp.start('fb-flo');
  }
  gulp.src(JSPaths, {base: JSBase })
    .pipe(plumber({errorHandler: onError}))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(concat('bundle.js'))
    .pipe(gulp.dest('./site'));
});

// Compile Our Sass
gulp.task('bundle_css', function() {
    gulp.src(CSSPaths, {base: CSSBase})
    .pipe(sass())
    .pipe(concat('bundle.css'))
    .pipe(gulp.dest('./site'));
});

gulp.task('bundle', ['bundle_js','bundle_css']);

gulp.task('fb-flo', function() {
    if (node) {
        node.kill();
    }
    node = spawn('node', ['flo.js'], {stdio: 'inherit'});
    node.on('close', function (code) {
        if (code === 8) {
          gulp.log('Error detected, turning off fb-flo...');
        }
  });
});

gulp.task('watch_js', function() {
    gulp.watch(JSPaths, ['bundle_js']); 
});

gulp.task('watch_css', function() {
    gulp.watch(CSSPaths, ['bundle_css']); 
});

function onError (err) {
    console.log(err);
    // kill $(ps aux | grep 'node flo' | awk '{print $2}')
    if (node) {
        node.kill();
        node = false;
    }
}

gulp.task('default', ['bundle','watch_js','watch_css','fb-flo']);
