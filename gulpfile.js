// Project Requirements
var gulp = require('gulp');
var sys = require('sys')
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var map = require('map-stream');
var stylish = require('jshint-stylish');
var plumber = require('gulp-plumber');
var _ = require('underscore');
var prefix = require('gulp-autoprefixer');
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
var BundlePath = './site/*.{css,js}'

// Gulp Tasks:

gulp.task('bundle_js', function() {
  gulp.src(JSPaths, {base: JSBase })
    .pipe(plumber({errorHandler: onError}))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(concat('bundle.js'))
    .pipe(gulp.dest('./site'));
});

gulp.task('bundle_css', function() {
    gulp.src(CSSPaths, {base: CSSBase})
    .pipe(plumber({errorHandler: onError}))
    .pipe(sass())
    .pipe(concat('bundle.css'))
    .pipe(prefix({ cascade: true }))
    .pipe(gulp.dest('./site'));
});

gulp.task('bundle', ['bundle_js','bundle_css']);

gulp.task('watch_js', function() {
    gulp.watch(JSPaths, ['bundle_js']);
});

gulp.task('watch_css', function() {
    gulp.watch(CSSPaths, ['bundle_css']);
});

gulp.task('watch_bundle', function() {
    gulp.watch(BundlePath, function() {
        if (!node) {
            gulp.start('fb-flo');
        }
    });
});

gulp.task('watch_assets', ['watch_js','watch_css']);

gulp.task('watch_assets_with_flo', ['fb-flo','watch_js','watch_css','watch_bundle']);

gulp.task('fb-flo', function() {
    if (node) {
        node.kill();
    }

    gulp.start('terminateOrphanFbFlo');

    node = spawn('node', ['flo.js'], {stdio: 'inherit'});
    node.on('close', function (code) {
        if (code === 8) {
          gulp.log('Error detected, turning off fb-flo...');
        }
  });
});

gulp.task('terminateOrphanFbFlo', function() {
    var fbFloRegex = /node\s+(\d+)\s/g;
    var fbFloLsof = spawn('lsof', ['-i', ':8888']);
    
    fbFloLsof.stderr.on('data',  onStderr);
    
    fbFloLsof.on('close', onStdClose);
    
    fbFloLsof.stdout.on('data', function (data) {
        var fbFloPid = '',
        results = fbFloRegex.exec(data);
        if (results && results[1]) { 
            exec('kill -9 ' + results[1]);
        }
    });
});

gulp.task('default', ['bundle', 'watch_assets_with_flo' ]);

// Utility Functions

function onError (err) {
    console.log(err);
    // kill $(ps aux | grep 'node flo' | awk '{print $2}')
    if (node) {
        node.kill();
        node = false;
    }
}

function onStderr(data) {
  console.log('stderr: ' + data);
}

function onStdClose(code) {
  console.log('child process exited with code ' + code);
}
