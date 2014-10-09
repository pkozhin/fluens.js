Fluens
=======

[![Build Status](https://travis-ci.org/pkozhin/fluens.js.svg?branch=master)](https://travis-ci.org/pkozhin/fluens.js)
[![NPM version](https://badge.fury.io/js/fluens.svg)](http://badge.fury.io/js/fluens)

> Interpolate templates with your data and inject the result to the desired location.

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

You can check Gruntfile.js and task `fluens` in source code and tests for better understanding and working examples by visiting Fluens [repository](https://github.com/pkozhin/fluens.js) on GitHub.

```js
grunt.initConfig({
  fluens: {
      dev: {
          options: {
              cwd: "./test/src/example/src",
              phase: {
                  
              }
          },
          sources: {
              parse: {
                  paths: ["fred/*.js", "*.js"]
              },
              inject: {
                  cwd: "./test/src/example/src",
                  paths: ["*.html"]
              }
          },
          dependencies: {
              stub: {
                  cwd: "./test/src/example/src/deps",
                  paths: ["**/stub/*.js"],
                  rules: {
                      "hello.MyController": "hello.stub.MyController"
                  }
              },
              parse: {
                  paths: ["deps/*.js"]
              },
              inject: {
                  paths: ["*.js"]
              }
          },
          styles: {
              parse: {
                  cwd: "./test/src/example/src",
                  paths: ["styles/*.css"]
              },
              inject: {
                  paths: ["*.html"]
              }
          },
          namespaces: {
              parse: {
                  filter: "isDirectory",
                  paths: ["deps/**", "fred/**"]
              },
              inject: {
                  paths: ["*.js"]
              }
          },
          vendors: {
              parse: {
                  cwd: "./test/src/example/vendor",
                  paths: ["*.js"]
              },
              inject: {
                  paths: ["*.html"]
              }
          }
      }
})
```

## Options

#### cwd
Type: `String`  
Default: ``

This is current working directory which affects paths of all declared scopes. If some phase needs to use different cwd then it can be overridden on phase level.
 
#### phase
Type: `Object`  
Default: `Object`

Used for general configuration of all phases.

##### phase_name
Type: `Object`  
Default: `undefined`

###### priority
Type: `Number`  
Default: `undefined`

When some new phase integrated priority for it could be declared directly on phase or via options. For predefined phases priority has values:
- stub: 1 
- parse: 3 
- inject: 5

## Scopes
In the given example above we have multiple scopes: "sources", "dependencies", "styles", "namespaces", "vendors".
Each of these scopes is bound to a replacement marker where parsed content should be injected.

For example in html file we can have "sources" scope marker:
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
Each scope has its own logic on how to prepare injected content and the way it should be injected. Any defined scope should be supported by a processor. All the given scopes in example configuration above have predefined processors. So if you want to define some new "foo" scope then you have to write your own processor to manage your custom scope.

### Scope "*sources*"
Used to inject necessary script tags in html files. Configuration can look like:
```js
sources: {
    parse: {
        paths: ["fred/*.js", "*.js"]
    },
    inject: {
        cwd: "./test/src/example/src",
        paths: ["*.html"]
    }
}
```
During parse phase it will extract file paths from files found by paths "fred/*.js", "*.js" and wrap it with script tags. During inject phase it will find files found by paths "*.html" and look at corresponding replacement marker, if lucky it will inject previously parsed content e.g.:
```html
<!--<fluens:sources>-->
<script src="fred/Bar.js"></script>
<script src="fred/Foo.js"></script>
<script src="result.js"></script>
<!--</fluens:sources>-->
```

### Scope "*vendors*"
Used to inject necessary script tags in html files. The only specific of the scope is that Fluens does not try to read the sources within its paths. This is done because vendor sources are not needed for any further complex parsing logic. Configuration can look like:
```js
vendors: {
    parse: {
        cwd: "./test/src/example/vendor",
        paths: ["*.js"]
    },
    inject: {
        paths: ["*.html"]
    }
}
```
During parse phase it will extract file paths from files found by paths "*.js" and wrap it with script tags. During inject phase it will find files found by paths "*.html" and look at corresponding replacement marker, if lucky it will inject previously parsed content e.g.:
```html
 <!--<fluens:vendors>-->
<script src="somelib.js"></script>
<!--</fluens:vendors>-->
```
You can add vendors marker before sources marker in your .html file to allow 3rd libraries to be loaded first.

### Scope "*namespaces*"
Used to inject declarations of javascript "namespaces". Notice that filter "isDirectory" is used (by default filter is "isFile"). Configuration can look like:
```js
namespaces: {
    parse: {
        filter: "isDirectory",
        paths: ["deps/**", "fred/**"]
    },
    inject: {
        paths: ["*.js"]
    }
}
```
During parse phase it will get files paths data for files found by paths "deps/**", "fred/**" and convert file paths to javascript namespaces(packages) declarations. During inject phase it will look at corresponding replacement marker, if lucky it will inject previously parsed content e.g.:
```js
/*<fluens:namespaces>*/
window.deps = {};
window.deps.hello = {};
window.deps.hello.stub = {};
window.fred = {};
/*</fluens:namespaces>*/
```

### Scope "*styles*"
Used to inject link tag with necessary css styles. Configuration can look like:
```js
styles: {
    parse: {
        cwd: "./test/src/example/src",
        paths: ["styles/*.css"]
    },
    inject: {
        paths: ["*.html"]
    }
}
```
During parse phase it will extract needed content from files found by paths "styles/*.css" and convert file paths to link tags. During inject phase it will look at corresponding replacement marker, if lucky it will inject previously parsed content e.g.:
```html
<!--<fluens:styles>-->
<link href="styles/foo.css" rel="stylesheet">
<!--</fluens:styles>-->
```

### Scope "*dependencies*"
Used to inject AngularJS dependencies. Configuration can look like:
```js
dependencies: {
    parse: {
        paths: ["deps/*.js"]
    },
    inject: {
        paths: ["*.js"]
    }
}
```
During parse phase it will extract needed content from files found by paths "deps/*.js" and convert file content to AngularJS dependency declarations. During inject phase it will look at corresponding replacement marker, if lucky it will inject previously parsed content e.g.:
```js
/*<fluens:dependencies>*/
main.controller("MyController", deps.MyController);
/*</fluens:dependencies>*/
```
Procesor for this scope relies on JSDoc notations left in .js file to generate proper dependencies declarations. For example class deps.MyController can look like:
```js
/**
 * @module main
 * @dependency {Controller}
 * @type {*[]}
 */
deps.MyController = [function(){

}];
```
You can notice custom notations like @module, @dependency.
* @module - Means name of AngularJS module which will be used for dependency related method execution declaration.
* @dependency - Is as type of AngularJS dependency. Currently supported all basic types. 

## Phases
Fluens plugin has a set of predefined processors which manage scopes and phases. Each phase has its own processor related to scope. Currently Fluens supports "parse" and "inject" out of the box. Phase "parse" processed before phase "inject" due to declared priority. Current default priorities: stub=1, parse=3, inject=5.

To use some new phase e.g. "foo" you should create a processor supporting such phase.

### Phase "*stub*"
During this phase Fluens brings together information regarding stub usage for proper parsing on the next phase. This phase allows to declare rules for stubbing e.g.:
```js
stub: {
    cwd: "./test/src/example/src/deps",
    paths: ["**/stub/*.js"],
    rules: {
        "hello.MyController": "hello.stub.MyController"
    }
}
```
Rule above means that for dependency "MyController" will be used reference to "hello.stub.MyController" instead of "hello.MyController".           

### Phase "*parse*"
During this phase Fluens collects all necessary information by parsing files within provided paths. You can look at source code to get more understanding how it works.

### Phase "*inject*"
During this phase Fluens uses prepared content which was processed during "parse" phase and injects it into replacement markers (if found in files provided within paths). Please look at details in sources.

## Replacement markers
Currently there are two types of markers for .html and .js files with multi line comments. For example:
```html
<!--<fluens:[SCOPE_TYPE]>-->
<!--</fluens:[SCOPE_TYPE]>-->
```
```js
/*<fluens:[SCOPE_TYPE]>*/
/*</fluens:[SCOPE_TYPE]>*/
```

## Custom scope
New scope can be added directly into configuration. For example declaration of scope "foo" could look like:
 ```js
foo: {
    parse: {
        cwd: "./somepathascwd",
        paths: ["*.js"],
        validate: function(facade) {
            // If false is returned this phase for this scope will be ignored.
            return true;
        },
        action: function(facade) {
            return "some_prepared_content_for_later_injection";
        }
    },
    inject: {
        paths: ["*.js"],
        validate: function(facade) {
            return true;
        },
        action: "default"
    }
}
```
After that you can place a proper replacement market anywhere to inject and after injection is done it could look like: 
```js
/*<fluens:foo>*/
some_prepared_content_for_later_injection
/*</fluens:foo>*/
```

## Processors
To add additional scopes or/and phases you can also create your own processor class (for better encapsulation). For example processor for "foo" scope could look like:
```js
/**
 * @param {fluens.common.Model} model
 */
var FooProcessor = function(model) {
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
    // Here for phase "parse" we declare scope "foo" which points to
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
fluens.addProcessors([FooProcessor]);
```

## Debugging
Adding "--verbose" with task launching allows you to observe some specific console logs from Fluens plugin.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## License
Copyright (c) 2014 Pavel Kozhin. Licensed under the MIT license.
