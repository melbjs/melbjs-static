## [MelbJS](http://melbjs.com)

The Melbourne JavaScript Meetup Website.

This is a version of the website built to be staticly hosted. Dynamic content will be compiled into the page. This should increase speed and reliability of the site.

For more details about the meetup visit [melbjs.com](http://melbjs.com)

## Compiling

Tested & Builds on:
grunt v0.3.17

First, download event data. For example, to download data for May 2013's meetup:
```bash
$ grunt download:may:2013
```

Compile static assets into 'bin' directory with the default Grunt task:

```bash
$ grunt
```

Serve the MelbJS site from the 'bin' directory:

```
$ serve bin/
```

## Contribute

If you have any bug fixes or minor improvements, feel free to send us a pull request.

For any large changes, please contact [@melbjs](http://twitter.com/melbjs) with your ideas, or send us a link to your shiny new fork!