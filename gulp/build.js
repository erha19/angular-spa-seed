'use strict';

var gulp = require('gulp');
var path = require('path');
var config = require('./config');
var _ = require('lodash');
var wiredep = require('wiredep').stream;
var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del','imagemin-pngquant']
});
gulp.task('clean:dist', function () {
  $.del([path.join(config.paths.dist, '/')]);
});
/*****************angular template start*********************************************/

gulp.task('partials', function () {
  return gulp.src([
    path.join(config.paths.src, '/app/**/*.html')
  ])
    .pipe($.minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
      module: config.modules.templateModuleName,
      root: 'app'
    }))
    .pipe(gulp.dest(config.paths.tmp + '/partials/'));
});
/*****************angular template end*********************************************/

/*****************concat (js,css,html)*********************/
gulp.task('html',['inject','partials'],function () {
	var partialsInjectFile = gulp.src(path.join(config.paths.tmp, '/partials/templateCacheHtml.js'), { read: false });
	var partialsInjectOptions = {
	  starttag: '<!-- inject:partials -->',
	  ignorePath: path.join(config.paths.tmp, '/partials'),
	  addRootSlash: false
	};

	var htmlFilter = $.filter('*.html',{restore: true});
	var jsFilter = $.filter('**/*.js',{restore: true});
	var cssFilter = $.filter('**/*.css',{restore: true});

	return gulp.src(path.join(config.paths.tmp, '/serve/*.html'))
		//error 
		.pipe($.plumber(config.errorHandler()))
		//inject template
		.pipe($.inject(partialsInjectFile,partialsInjectOptions))
		//js
		.pipe($.useref())
		.pipe(jsFilter)
		.pipe($.scriptDebug())
		.pipe($.uglify())
		.pipe(jsFilter.restore)
		//css 
		.pipe(cssFilter)
		.pipe($.replace('../../bower_components/bootstrap-sass/assets/fonts/bootstrap/', '../fonts/'))
		.pipe($.csso())
		.pipe(cssFilter.restore)
		//md5后缀
		.pipe($.rev())
		//替换md5后缀的文件名
		.pipe($.revReplace())
		//html处理
		.pipe(htmlFilter)
		.pipe($.minifyHtml({
		  empty: true,
		  spare: true,
		  quotes: true,
		  conditionals: true
		}))
		.pipe(htmlFilter.restore)
		.pipe(gulp.dest(path.join(config.paths.dist, '/')))
		.pipe($.size({ title: path.join(config.paths.dist, '/'), showFiles: true }));

});
/*****************concat (js,css,html) end*********************/

gulp.task('renameIndex',function(){
	return gulp.src([path.join(config.paths.dist,'/*.html')])
		   .pipe($.rename('index.html'))
		   .pipe(gulp.dest(config.paths.dist))
})
/**
 * images zip
 */
gulp.task('images',function () {
	return gulp.src([
			path.join(config.paths.src, '/assets/images/**/*'),
			path.join('!' + config.paths.src, '/assets/images/sprite/**/*')
		])
		.pipe($.imagemin({
		    progressive: true,
		    svgoPlugins: [{removeViewBox: false}],
		    use: [$.imageminPngquant()]
		}))
		.pipe(gulp.dest(path.join(config.paths.dist,'/assets/images')));
});


/**
 * copy file
 */
gulp.task('other',function () {
	return gulp.src([
			path.join(config.paths.src,'/**/*'),
			path.join('!' + config.paths.src, '/assets/images/**/*'),
			path.join('!' + config.paths.src, '/**/*.{html,js,css,scss}')
		])
		.pipe($.filter(function (file) {
			return file.stat.isFile();
		}))
		.pipe(gulp.dest(path.join(config.paths.dist,'/')));
});


gulp.task('build',$.sequence('prod-config',['clean:dist','html'],['images','renameIndex'],'other'));
gulp.task('build:e2e',$.sequence('test-config',['clean:dist','html'],['images','renameIndex'],'other'));