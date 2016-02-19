'use strict';

var gulp = require('gulp'),
    path = require('path'),
    config = require('./config'),
    _ = require('lodash'),
    wiredep = require('wiredep').stream,
    $ = require('gulp-load-plugins')({
      pattern: ['gulp-*', 'event-stream', 'main-bower-files', 'uglify-save-license', 'del']
    }),
    browserSync = require('browser-sync'),
    reload      = browserSync.reload;



gulp.task('dev-config',function () {
  return gulp.src('app.conf.json')
        .pipe($.ngConfig(config.modules.ConstantModuleName,{
          environment: 'development',
          createModule: false,
          wrap: true
        }))
        .pipe(gulp.dest(path.join(config.paths.src,'/app')))
});
gulp.task('prod-config',function () {
  return gulp.src('app.conf.json')
        .pipe($.ngConfig(config.modules.ConstantModuleName,{
          environment: 'production',
          createModule: false,
          wrap: true
        }))
        .pipe(gulp.dest(path.join(config.paths.src,'/app')))
});


gulp.task('jshint',function () {
	return gulp.src(path.join(config.paths.src,'app/**/*.js'))
	.pipe($.plumber(config.errorHandler()))
	.pipe($.jshint())
	.pipe(reload({ stream: true }))
	.pipe($.size());
});



gulp.task('clean', function () {
  $.del([path.join(config.paths.dist, '/'), path.join(config.paths.tmp, '/')]);
});



/******编译之前将scss注入index.scss  start ************/
gulp.task('inject_sass',function () {
	//1,将所有scss文件注入到index.scss
	var injectFiles = gulp.src([
			path.join(config.paths.src,'app/**/*.scss'),
			path.join('!'+ config.paths.src, 'app/index.scss')
		],{read:false});
	/**
	 * 参考API:https://github.com/klei/gulp-inject#optionsstarttag
	 */
	var injectOptions = {
	  transform: function(filePath) {
	    filePath = filePath.replace(config.paths.src + '/app/', '');
	    return '@import "' + filePath + '";';
	  },
	  starttag: '// injector',
	  endtag: '// endinjector',
	  addRootSlash: false
	};
	return gulp.src(path.join(config.paths.src,'app/index.scss'))
					.pipe($.inject(injectFiles,injectOptions))
					.pipe(wiredep(_.assign({}, config.wiredep)))
					.pipe(gulp.dest(path.join(config.paths.src,'app/')))
});
/******编译之前将scss注入index.scss   end ************/


/*****************CSS(COMPASS编译) start*********************************************/
gulp.task('styles:compass',['inject_sass'],function () {
	return gulp.src(path.join(config.paths.src,'app/index.scss'))
		.pipe($.plumber(config.errorHandler()))
		.pipe($.compass({
			config_file: path.join(__dirname, '/../config.rb'),
		  	css: path.join(config.paths.tmp, '/serve/app/'),
		  	sass: path.join(config.paths.src, '/app/'),
		}))
		//sprite图片路径修复
		.pipe($.replace('../../../src/assets/images/', '../assets/images/'))
		.pipe(gulp.dest(path.join(config.paths.tmp,'/serve/app/')))
		//css改变时无刷新改变页面
		.pipe(reload({ stream: true }));
});
/*****************CSS(COMPASS编译) end*********************************************/

/*****************inject(css,js注入html) start***************************/
gulp.task('inject', ['jshint', 'styles:compass'], function () {
  var injectStyles = gulp.src([
    path.join(config.paths.tmp, '/serve/app/**/*.css'),
    path.join('!' + config.paths.tmp, '/serve/app/vendor.css')
  ], { read: false });

  var injectScripts = gulp.src([
    path.join(config.paths.src, '/app/**/*.module.js'),
    path.join(config.paths.src, '/app/**/*.js'),
    path.join('!' + config.paths.src, '/app/**/*.spec.js'),
    path.join('!' + config.paths.src, '/app/**/*.mock.js')
  ]).pipe($.angularFilesort());

  var injectOptions = {
    ignorePath: [config.paths.src, path.join(config.paths.tmp, '/serve')],
    addRootSlash: false
  };

	return gulp.src(path.join(config.paths.src, '/*.html'))
		.pipe($.plumber(config.errorHandler()))
		.pipe($.inject($.eventStream.merge(
		  injectStyles,
		  injectScripts
		),injectOptions))
		.pipe(wiredep(_.extend({}, config.wiredep)))
	  .pipe(gulp.dest(path.join(config.paths.tmp, '/serve')));

});
/*****************inject(css,js注入html) end*********************************************/

