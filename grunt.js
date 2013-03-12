var path = require('path');
var _ = require('underscore');
var viewHelpers = require('./src/lib/view-helpers');
var data = {
	event: require('./src/data/event.json'),
	videos: require('./src/data/videos.json')
};

module.exports = function(grunt) {
	'use strict';

	// Your stylus file
	var MAIN_STYLUS_FILES = [
		'src/public/css/reset.styl',
		'src/public/css/main.styl'
	];
	var WELCOME_STYLUS_FILES = [
		'src/public/css/reset.styl',
		'src/public/css/welcome.styl'
	];
	var ALL_STYLUS_FILES = [].concat(MAIN_STYLUS_FILES, WELCOME_STYLUS_FILES);

	// Your public js files (exclude 3rd party libraries)
	var MAIN_JAVASCRIPT_FILES = [];
	var WELCOME_JAVASCRIPT_FILES = [
		'src/public/js/welcome.js'
	];
	var ALL_PUBLIC_JAVASCRIPT_FILES = [].concat(MAIN_JAVASCRIPT_FILES, WELCOME_JAVASCRIPT_FILES);

	// Usually just these two build files
	var PROJECT_FILES = [
		'grunt.js',
		'package.json'
	];

	// Project configuration.
	grunt.initConfig({
		pkg: '<json:package.json>',
		lint: {
			files: [].concat(
				ALL_PUBLIC_JAVASCRIPT_FILES,
				PROJECT_FILES
			)
		},
		clean: {
			js: [
				'bin/public/js/**/*.js'
			],
			css: [
				'bin/public/css/**/*.css'
			],
			html: [
				'bin/**/*.html'
			],
			copy: [
				'bin/public/img/**/*'
			]
		},
		stylus: {
			compile: {
				options: {
					compress: true
				},
				files: {
					// Compile and concat into single file.
					'bin/public/css/<%= pkg.name %>-main-<%= pkg.version %>.css': MAIN_STYLUS_FILES,
					'bin/public/css/<%= pkg.name %>-welcome-<%= pkg.version %>.css': WELCOME_STYLUS_FILES
				}
			}
		},
		concat: {
			main: {
				src: [].concat(MAIN_JAVASCRIPT_FILES),
				dest: 'bin/public/js/<%= pkg.name %>-main-<%= pkg.version %>.js'
			},
			welcome: {
				src: [
					'src/public/js/bespoke.min.js',
					'src/public/js/prefixfree.min.js'
				].concat(WELCOME_JAVASCRIPT_FILES),
				dest: 'bin/public/js/<%= pkg.name %>-welcome-<%= pkg.version %>.js'
			}
		},
		min: {
			main: {
				src: [
					'bin/public/js/<%= pkg.name %>-main-<%= pkg.version %>.js'
				],
				dest: 'bin/public/js/<%= pkg.name %>-main-<%= pkg.version %>.min.js'
			},
			welcome: {
				src: [
					'bin/public/js/<%= pkg.name %>-welcome-<%= pkg.version %>.js'
				],
				dest: 'bin/public/js/<%= pkg.name %>-welcome-<%= pkg.version %>.min.js'
			}
		},
		copy: {
			dist: {
				files: {
					"bin/public/img/": "src/public/img/**/*"
				}
			}
		},
		watch: {
			stylus: {
				files: ALL_STYLUS_FILES,
				tasks: 'clean:css stylus'
			},
			jade: {
				files: 'src/views/**/*.jade',
				tasks: 'clean:html jade'
			},
			images: {
				files: 'src/public/img/**/*',
				tasks: 'clean:copy copy'
			},
			fonts: {
				files: 'src/public/fonts/**/*',
				tasks: 'clean:copy copy'
			},
			files: {
				files: 'src/public/files/**/*',
				tasks: 'clean:copy copy'
			},
			js: {
				files: ALL_PUBLIC_JAVASCRIPT_FILES,
				tasks: 'lint clean:js concat min'
			}
		},
		jshint: {
			options: {
				smarttabs: true,
				trailing: true,
				curly: true,
				eqeqeq: true,
				immed: true,
				latedef: false,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true,
				node: true,
				es5: true,
				strict: false
			},
			globals: {
				describe: true,
				it: true,
				before: true,
				after: true,
				exports: true,
				// Browser:
				window: true,
				document: true,
				$: true,
				google: true,
				jQuery: true,
				bespoke: true
			}
		},
		jade: {
			compile: {
				options: {
					data: {
						debug: false,
						// Manually bring in the helpers.
						a: viewHelpers.a,
						strong: viewHelpers.strong,
						event: data.event,
						videos: data.videos,
						project: {
							name: '<%= pkg.name %>',
							version: '<%= pkg.version %>',
							js: {
								useMinified: true
							}
						}
					}
				},
				files: {
					"bin/index.html": "src/views/pages/index.jade",
					"bin/welcome/index.html": "src/views/pages/welcome.jade"
				}
			}
		}
	});

	// Import custom tasks (and override the default test with mocha test).
	grunt.loadNpmTasks('grunt-contrib');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task.
	grunt.registerTask('default', 'lint clean stylus concat min copy jade');
};