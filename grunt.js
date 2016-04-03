var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var lanyrd = require('lanyrd-scraper');
var Twitter = require('ntwitter');
var viewHelpers = require('./src/lib/view-helpers');
var data = {
	currentEvent: fs.existsSync('./src/data/currentevent.json') ? require('./src/data/currentevent.json') : {},
	nextEvent: fs.existsSync('./src/data/nextevent.json') ? require('./src/data/nextevent.json') : {},
	avatars: fs.existsSync('./src/data/avatars.json') ? require('./src/data/avatars.json') : {},
	videos: fs.existsSync('./src/data/videos.json') ? require('./src/data/videos.json') : [],
	overrides: fs.existsSync('./src/data/overrides.json') ? require('./src/data/overrides.json') : {},
};
var s3 = require('aws-publisher');
var config = require('./config');
var twitter = new Twitter(config.twitter);

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
					'node_modules/bespoke/dist/bespoke.js',
					'node_modules/bespoke-hash/dist/bespoke-hash.js',
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
						currentEvent: data.currentEvent,
						nextEvent: data.nextEvent,
						avatars: data.avatars,
						videos: data.videos,
						overrides: data.overrides,
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
					"bin/codeofconduct/index.html": "src/views/pages/codeofconduct.jade",
					"bin/welcome/index.html": "src/views/pages/welcome.jade",
					"bin/videos/index.html": "src/views/pages/videos.jade"
				}
			}
		}
	});

	grunt.registerTask('download', function(month, year) {
		var months = 'january february march april may june july august september october november december'.split(' ');
		var done = this.async();

		grunt.log.subhead('Downloading data...');

		grunt.log.writeln('Downloading event data from Lanyrd');

		var currentUrl = '/' + year + '/melbjs-' + month;
		var nextUrl = (function() {
			var monthIndex = months.indexOf(month);
			var nextEventMonth = monthIndex === months.length - 1 ? months[0] : months[monthIndex + 1];
			var nextEventYear = nextEventMonth === months[0] ? parseInt(year, 10) + 1 : year;
			return '/' + nextEventYear + '/melbjs-' + nextEventMonth;
		}());

		async.parallel({
			currentEvent: lanyrd.scrape.bind(null, currentUrl),
			nextEvent: lanyrd.scrape.bind(null, nextUrl)
		}, function(err, results) {
			var currentEvent = results.currentEvent;
			currentEvent.url = 'http://lanyrd.com' + currentUrl;

			var nextEvent = results.nextEvent;
			nextEvent.url = 'http://lanyrd.com' + nextUrl;

			var speakersArray = currentEvent.speakers.map(function(speaker) { return speaker.twitterHandle  && speaker.twitterHandle.toLowerCase(); });
			speakersArray = speakersArray.concat(nextEvent.speakers.map(function(speaker) { return speaker.twitterHandle && speaker.twitterHandle; }));

			grunt.log.writeln('Downloading avatar URLs from Twitter');
			twitter.showUser(speakersArray, function(err, users) {
				grunt.log.ok('Done!');

				grunt.log.subhead('Writing data...');

				var speakers = {};
				users.forEach(function(user) {
					speakers[user.screen_name.toLowerCase()] = user.profile_image_url;
				});

				grunt.log.writeln('Writing currentevent.json');
				fs.writeFileSync('./src/data/currentevent.json', JSON.stringify(currentEvent, null, 2));

				grunt.log.writeln('Writing nextevent.json');
				fs.writeFileSync('./src/data/nextevent.json', JSON.stringify(nextEvent, null, 2));

				grunt.log.writeln('Writing avatars.json');
				fs.writeFileSync('./src/data/avatars.json', JSON.stringify(speakers, null, 2));

				grunt.log.ok('Done!');
				done();
			});
		});
	});

	grunt.registerTask('deploy', function() {
		var done = this.async();
		var publisher = new s3(config.deploy);
		var options = {
			origin: './bin',
			dest: '',
			filter: function(f, stat) { return !(/\.(DS_Store)$/).test(f); }
		};
		publisher.publishDir(options, function() {
			console.log('Completed deployment');
			done();
		});
	});

	// Import custom tasks (and override the default test with mocha test).
	grunt.loadNpmTasks('grunt-contrib');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task.
	grunt.registerTask('default', 'lint clean stylus concat min copy jade');
};
