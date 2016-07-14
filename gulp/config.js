/*
 * Copyright (c) 2016, simplefatty
 * Licensed under the MIT License.
 */

'use strict';

let gutil = require('gulp-util'),
  bower_path = 'bower_components';

exports.paths = {
  bower_path: bower_path,
  src: 'src',
  dist: 'dist',
  tmp: '.tmp',
  env: {

  }
};
/*
 * @description 依赖配置
 */
exports.vendor = {
  // 程序启动依赖模块
  base: {
    source: require('../vendor.base.json'),
    dest: 'src/app',
    name: 'vendor'
  },

  // 按需加载模块
  app: {
    source: require('../vendor.json'),
    dest: 'src/vendor'
  }
};
exports.modules = {
    ConstantModuleName: 'app',
    templateModuleName: 'app.tmp'
}

/*
 * @description 错误处理
 */
exports.errorHandler = function() {
  return function(err) {
    gutil.beep();
    gutil.log(err.toString());
  }
};