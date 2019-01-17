var gulp = require('gulp');
var browserSync = require('browser-sync').create();

// use default task to launch Browsersync and watch JS files
gulp.task('default', function () {
  browserSync.init({
    server: 'public',
    https: true,
    ghostMode: false
  });

  gulp.watch('public/**', function (done) {
    browserSync.reload();
    done();
  });
});
