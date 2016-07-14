/*
 * Copyright (c) 2016, simplefatty
 * Licensed under the MIT License.
 */

'use strict';

let gulp = require('gulp'),
	path = require('path'),
	fs = require('fs'),
	config = require('./config'),
	_ = require('lodash'),
	wiredep = require('wiredep').stream,
	$ = require('gulp-load-plugins')({
		pattern: ['gulp-*', 'event-stream', 'main-bower-files', 'uglify-save-license', 'del']
	}),
	browserSync = require('browser-sync'),
	gulpsync = $.sync(gulp),
	reload = browserSync.reload;


gulp.task('dev-config', ()=> {
	return gulp.src('app.conf.json')
		.pipe($.ngConfig(config.modules.ConstantModuleName, {
			environment: 'development',
			createModule: false,
			wrap: true
		}))
		.pipe(gulp.dest(path.join(config.paths.src, '/app')))
});
gulp.task('prod-config', ()=> {
	return gulp.src('app.conf.json')
		.pipe($.ngConfig(config.modules.ConstantModuleName, {
			environment: 'production',
			createModule: false,
			wrap: true
		}))
		.pipe(gulp.dest(path.join(config.paths.src, '/app')))
});


/**
 * @description 代码质量管理
 */

gulp.task('jshint', ()=> {
	return gulp.src(path.join(config.paths.src, 'app/**/*.js'))
		.pipe($.plumber(config.errorHandler()))
		.pipe($.jshint())
		.pipe(reload({
			stream: true
		}))
		.pipe($.size());
});


/**
 * @description 清理DIST,TEMP文件夹
 */

gulp.task('clean', ()=> {
	$.del([path.join(config.paths.dist, '/'), path.join(config.paths.tmp, '/')]);
});

/**
 * @description SASS预编译模块,依赖compass模块编译
 */

gulp.task('styles:compass', ['inject_sass'], ()=> {
	return gulp.src(path.join(config.paths.src, 'app/index.scss'))
		.pipe($.plumber(config.errorHandler()))
		.pipe($.compass({
			config_file: path.join(__dirname, '/../config.rb'),
			css: path.join(config.paths.tmp, '/serve/app/'),
			sass: path.join(config.paths.src, '/app/'),
		}))
		//sprite图片路径修复
		.pipe($.replace('../../../src/assets/images/', '../assets/images/'))
		.pipe(gulp.dest(path.join(config.paths.tmp, '/serve/app/')))
		//css改变时无刷新改变页面
		.pipe(reload({
			stream: true 
		}));
});

/**
 * @description 编译之前将scss注入index.scss
 */

gulp.task('inject_sass', ()=> {
	let injectFiles = gulp.src([
		path.join(config.paths.src, 'app/**/*.scss'),
		path.join('!' + config.paths.src, 'app/index.scss')
	], {
		read: false
	});

	let injectOptions = {
		transform: function(filePath) {
			filePath = filePath.replace(config.paths.src + '/app/', '');
			return '@import "' + filePath + '";';
		},
		starttag: '// injector',
		endtag: '// endinjector',
		addRootSlash: false
	};
	return gulp.src(path.join(config.paths.src, 'app/index.scss'))
		.pipe($.inject(injectFiles, injectOptions))
		.pipe(wiredep(_.assign({}, config.wiredep)))
		.pipe(gulp.dest(path.join(config.paths.src, 'app/')))
});

/**
 * @description Html中的CSS以及JS注入
 */

gulp.task('inject', ['jshint', 'styles:compass', 'vendor:base'], ()=> {
	let injectStyles = gulp.src([
		path.join(config.paths.tmp, '/serve/app/**/*.css')
	], {
		read: false
	});

	let injectScripts = gulp.src([
		path.join(config.paths.src, '/app/**/*.js'),
		path.join('!' + config.paths.src, '/app/vendor.js'),
	]).pipe($.angularFilesort());

	let injectOptions = {
		ignorePath: [config.paths.src, path.join(config.paths.tmp, '/serve')],
		addRootSlash: false
	};

	return gulp.src(path.join(config.paths.src, '/*.html'))
		.pipe($.plumber(config.errorHandler()))
		.pipe($.inject($.eventStream.merge(
			injectStyles,
			injectScripts
		), injectOptions))
		.pipe(gulp.dest(path.join(config.paths.tmp, '/serve')));

});

gulp.task('vendor', gulpsync.sync(['vendor:base', 'vendor:app']));


/**
 * @description 复制依赖文件
 */

gulp.task('vendor:base', ()=> {
	let jsFilter = $.filter('**/*.js', {
			restore: true
		}),
		cssFilter = $.filter('**/*.css', {
			restore: true
		});
	return gulp.src(config.vendor.base.source, {
			base: config.paths.bower_path
		})
		.pipe($.expectFile(config.vendor.base.source))
		.pipe(jsFilter)
		.pipe($.concat(config.vendor.base.name + '.js'))
		.pipe(jsFilter.restore)
		.pipe(cssFilter)
		.pipe($.concat(config.vendor.base.name + '.css'))
		.pipe(cssFilter.restore)
		.pipe(gulp.dest(config.vendor.base.dest));
});

gulp.task('vendor:app', ()=> {

	let jsFilter = $.filter('*.js', {
			restore: true
		}),
		cssFilter = $.filter('*.css', {
			restore: true
		});

	return gulp.src(config.vendor.app.source, {
			base: config.paths.bower_path
		})
		.pipe($.expectFile(config.vendor.app.source))
		.pipe(jsFilter)
		.pipe(jsFilter.restore)
		.pipe(cssFilter)
		.pipe(cssFilter.restore)
		.pipe(gulp.dest(config.vendor.app.dest));

});