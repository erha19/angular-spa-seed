'use strict';

let gulp = require('gulp'),
	fs = require('fs');

fs.readdirSync('./gulp').forEach(file=>{
	if((/\.(js|coffee)$/i).test(file)){
		require('./gulp/' + file);
	}
});

gulp.task('default', ['clean'],()=> {
  gulp.start('build');
});