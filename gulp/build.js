/*
 * Copyright (c) 2016, simplefatty
 * Licensed under the MIT License.
 */
'use strict';

let gulp = require('gulp'),
	path = require('path'),
	config = require('./config'),
	_ = require('lodash'),
	wiredep = require('wiredep').stream,
	$ = require('gulp-load-plugins')({
		pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del', 'imagemin-pngquant']
	});
gulp.task('clean:dist', ()=> {
	$.del([path.join(config.paths.dist, '/')]);
});


/**
 * @description 生成Html模版文件
 */

gulp.task('partials', ()=> {
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


/**
 * @description Html,Js,Css压缩合并
 */
gulp.task('html', ['inject', 'partials'], ()=> {
	let partialsInjectFile = gulp.src(path.join(config.paths.tmp, '/partials/templateCacheHtml.js'), {
		read: false
	});
	let partialsInjectOptions = {
		starttag: '<!-- inject:partials -->',
		ignorePath: path.join(config.paths.tmp, '/partials'),
		addRootSlash: false
	};

	let htmlFilter = $.filter('*.html', {
		restore: true
	});
	let jsFilter = $.filter('**/*.js', {
		restore: true
	});
	let cssFilter = $.filter('**/*.css', {
		restore: true
	});

	return gulp.src(path.join(config.paths.tmp, '/serve/*.html'))
		//error 
		.pipe($.plumber(config.errorHandler()))
		//inject template
		.pipe($.inject(partialsInjectFile, partialsInjectOptions))
		//js
		.pipe($.useref())
		.pipe(jsFilter)
		.pipe($.stripDebug())
		.pipe($.uglify())
		.pipe(jsFilter.restore)
		//css 
		.pipe(cssFilter)
		.pipe($.autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe($.csso())
		.pipe(cssFilter.restore)
		//md5后缀
		.pipe($.if('*.css', $.rev()))
		.pipe($.if('*.js', $.rev()))
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
		.pipe($.size({
			title: path.join(config.paths.dist, '/'),
			showFiles: true
		}));

});



/**
 * @description 图片压缩
 */
gulp.task('images', ()=> {
	return gulp.src([
			path.join(config.paths.src, '/assets/images/**/*'),
			path.join('!' + config.paths.src, '/assets/images/sprite/**/*')
		])
		.pipe($.imagemin({
			progressive: true,
			svgoPlugins: [{
				removeViewBox: false
			}],
			use: [$.imageminPngquant()]
		}))
		.pipe(gulp.dest(path.join(config.paths.dist, '/assets/images')));
});

gulp.task('fonts', ()=> {

	return gulp.src(config.vendor.base.source, {
			base: config.paths.bower_path
		})
		.pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))
		.pipe($.flatten())
		.pipe(gulp.dest(path.join(config.paths.dist, '/fonts/')));
});

/**
 * @description [复制文件] 前端依赖库以及静态文件
 */
gulp.task('other:vendor', ()=> {
	return gulp.src([
			path.join(config.paths.src, '/vendor/**/*')
		])
		.pipe($.filter(file=> {
			return file.stat.isFile();
		}))
		.pipe(gulp.dest(path.join(config.paths.dist, '/vendor')));
});
gulp.task('other:assets', ()=> {
	return gulp.src([
			path.join(config.paths.src, '/app/assets/**/*')
		])
		.pipe($.filter(file=> {
			return file.stat.isFile();
		}))
		.pipe(gulp.dest(path.join(config.paths.dist, '/assets')));
});


gulp.task('build', $.sequence('prod-config', ['clean:dist', 'html'], ['images', 'fonts'], 'other:vendor', 'other:assets'));
