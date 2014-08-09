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
          options: {
              cwd: "./test/src/example/src",
              phase: {
                  parse: {priority: 1},
                  inject: {priority: 2}
              }
          },
          sources: {
              parse: {
                  paths: ['fred/*.js', '*.js']
              },
              inject: {
                  cwd: "./test/src/example/src",
                  paths: ['*.html']
              }
          },
          dependencies: {
              parse: {
                  paths: ['deps/*.js']
              },
              inject: {
                  paths: ['*.js']
              }
          },
          styles: {
              parse: {
                  cwd: "./test/src/example/src",
                  paths: ['styles/*.css']
              },
              inject: {
                  paths: ['*.html']
              }
          },
          namespaces: {
              parse: {
                  filter: "isDirectory",
                  paths: ['deps/**', 'fred/**']
              },
              inject: {
                  paths: ['*.js']
              }
          }
      }
})
```

## Scopes
In the given example above we have multiple scopes: "sources", "dependencies", "styles", "namespaces".
Each of these scope is bound to a replacement marker where parsed content should be injected.

For example in html file there can be "sources" scope marker:
```html
<!--<fluens:sources>-->
<!--</fluens:sources>-->
```

After task execution it can be replaced with:
```html
<!--<fluens:sources>-->
<script src="fred/Bar.js"></script>
<script src="fred/Foo.js"></script>
<script src="result.js"></script>
<!--</fluens:sources>-->
```
Each scope has its own logic on how to prepare injected content and the way it should be injected. Any defined scope should be supported by registered processor. All the given scopes in example configuration above have related processors. So if you define some new "foo" scope then you have to write your own processor to manage this custom scope.

## Phases
Fluens plugin has a set of predefined processors which manage scopes and phases. Each phase has it's own processor related to scope. Currently fluens supports two types of phases: "parse" and "inject". Phase "parse" processed before phase "inject" due to declared priority. Actually you can avoid defining priority for these phases in config options because same done internally in default options.

To use some new phase e.g. "foo" you should create a processor supporting such phase.

### Parse phase
During this phase Fluens collects all necessary information by parsing files within provided paths. You can look at source code to get more understanding how it works.

### Inject phase
During this phase Fluens uses prepared content which was processed during "parse" phase and injects it into replacement markers (if found in files provided within paths). Please look at details in sources.

## Replacement markers
Currently there are two type of markers for .html and .js files. For example:
```html
<!--<fluens:sources>-->
<!--</fluens:sources>-->
```
```js
/*<fluens:namespaces>*/
/*</fluens:namespaces>*/
```

## Processors
To use more scopes or/and phases you can create your own processor class. For example processor for "foo" scope could look like:
```js
var FooParser = function(model) {
    /**
     * @param {fluens.core.FluensCacheItem} item
     * @returns {string}
     */
    var parseItem = function(item) {
        // Just adding "FOO" prefix to the file path.
        return "FOO." + item.path;
    };

    /**
     * @param {fluens.core.FluensActionFacade} facade
     * @returns {string}
     */
    var parse = function(facade) {
        var items = facade.cache.getPhase(facade.scope.type, facade.phase.type);

        // Adding "FOO" prefix to all file paths and concat them with new line.
        // This will be a content for further injection.
        return _.compact(_.map(items,
            function(item) {
                return parseItem(item);
            }
        )).join('\n');
    };

    var validate = function(facade) {
        // Can be any logic to check if this we can use this processor
        // in context of the given facade (scope and phase).
        return true;
    };
    // Here for phase "phase" we declare scope "foo" which points to
    // an object which has validate() and action() methods.
    this.phases = {
        parse: {
            foo: {
                action: parse,
                validate: validate
            }
        }
    };
};
```

After that we need to add this processor to Fluens:
```js
var fluens = require("fluens");
// Can pass hash or array here.
fluens.addProcessors([FooParser]);
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2014 Pavel Kozhin. Licensed under the MIT license.
