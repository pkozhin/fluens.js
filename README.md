# fluens

> Interpolate templates with your data and inject the result to the desired location.
> This plugin is not in a stable version yet and can be changed without backward compatibility in the nearest future!

## Getting Started
This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install fluens --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('fluens');
```

## The "fluens" task

### Overview
In your project's Gruntfile, add a section named `fluens` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  fluens: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Usage Examples

You can check Gruntfile.js and task `fluens` for the working examples.

```js
grunt.initConfig({
  fluens: {
      dev: {
          sources: {
              parse: {
                  cwd: "./test/src/example/src",
                  paths: ['fred/*.js', '*.js']
              },
              inject: {
                  cwd: "./test/src/example/src",
                  paths: ['*.html']
              }
          },
          styles: {
              parse: {
                  cwd: "./test/src/example/src",
                  paths: ['styles/*.css']
              },
              inject: {
                  cwd: "./test/src/example/src",
                  paths: ['*.html']
              }
          },
          namespaces: {
              parse: {
                  filter: "isDirectory",
                  cwd: "./test/src/example/src",
                  paths: ['deps/**', 'fred/**']
              },
              inject: {
                  cwd: "./test/src/example/src",
                  paths: ['*.js']
              }
          }
      }
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2014 Pavel Kozhin. Licensed under the MIT license.
