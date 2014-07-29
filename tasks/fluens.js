/**
* FluensJS - v0.0.1
* Copyright (c) 2014 Pavel Kozhin
* License: MIT, https://github.com/pkozhin/fluens.js/blob/master/LICENSE
*/
module.exports = function(grunt) {

"use strict";

var fluens = {};
fluens.core = {};
fluens.parser = {};
fluens.injector = {};
fluens.common = {};

var _ = require("lodash"),
    commentParser = require("comment-parser");

fluens.common.Model = function() {
    this.htmlMarkerExp = "([ \t]*).+<!--<fluens:T(.*)>-->([^~]*).+<!--<\/fluens:T>-->"; // jshint ignore:line
    this.htmlMarkerReplacer = "<!--<fluens:T A>-->\nC\n<!--<\/fluens:T>-->";
    this.jsMarkerExp = "([ \t]*).+\/\*<fluens:T(.*)>\*\/([^~]*).+\/\*<\/fluens:T>\*\/"; // jshint ignore:line
    this.jsMarkerReplacer = "/*<fluens:T A>*/\nC\n/*<\/fluens:T>*/";
    this.scriptTpl = '<script src="C"></script>';
    this.styleTpl = '<link href="C" rel="stylesheet">';
    this.stripslashes = function(value) {
        return value.replace(/\/\//g, "/");
    };
};

fluens.common.Validator = function() {

    this.validateScope = function(scope, type) {
        if (scope.paths && !_.isArray(scope.paths)) {
            throw new Error("Scope parameter 'paths' should an array. Scope '" + type + "'.");
        }
        if (scope.cwd && !_.isString(scope.cwd)) {
            throw new Error("Scope parameter 'cwd' should be a string. Scope '" + type + "'.");
        }
        if (!_.isFunction(scope.parse)) {
            throw new Error("Scope parameter 'parse' should be a function. Scope '"+ type +"'");
        }
        if (!_.isFunction(scope.inject)) {
            throw new Error("Scope parameter 'inject' should be a function. Scope '" + type + "'.");
        }
        if (scope.type || scope.context || scope.parsedContent || scope.cachedContent) {
            throw new Error("Scope has reserved properties: " +
                "type, context, parsedContext, cachedContent which should not be assigned initially.");
        }
    };
};

fluens.core.Composer = function(commentParser) {

    var model = new fluens.common.Model(),
        cache = new fluens.core.FluensCache(model, commentParser, ["vendors", "styles"]),
        scopes = new fluens.core.FluensScopes(),
        validator = new fluens.common.Validator(),
        main = new fluens.core.Fluens(model, cache, scopes, validator);

    _.each(fluens.parser, function(Type) {
        var obj = new Type(model);
        _.forIn(obj, function(value, key) {
            if (_.isFunction(value)) {
                scopes.parser(key, _.bind(value, obj));
            }
        });
    });

    _.each(fluens.injector, function(Type) {
        var obj = new Type(model);
        _.forIn(obj, function(value, key) {
            if (_.isFunction(value)) {
                scopes.injector(key, _.bind(value, obj));
            }
        });
    });

    this.facade = new fluens.core.FluensFacade(main);
};

fluens.core.Fluens = function(model, cache, scopes, validator) {

    var description = 'Interpolate templates with your data and inject the result to the desired location.',
        self = this;

    this.initContext = function(items, contextType) {
        var result = [];
        _.forIn(items, function(item, type) {
            if (type !== "options") {
                validator.validateScope(item, type);
                var scope = self.scopeFactory(type, contextType, item);

                if (scope.paths) {
                    result.push(scope);
                    cache.cache(scope);
                }
            }
        });
        return result;
    };

    this.parseContext = function(scopes) {
        _.each(scopes, function(scope){
            var context = self.contextFactory(scope, scopes, cache, null);
            scope.parsedContent = scope.parse(context);
        });
    };

    this.injectContext = function(scopes) {
        _.each(scopes, function(scope) {
            _.forEach(scope.cachedContent, function(item){
                if (item.content) {
                    scope.inject(self.contextFactory(scope, scopes, cache, item));
                }
            });
        });
    };

    this.contextFactory = function(scope, scopes, cache, item) {
        return new fluens.core.FluensContext(scope, scopes, cache, item);
    };

    this.scopeFactory = function(type, contextType, params) {
        return new fluens.core.FluensScope(type, contextType, params);
    };

    this.run = function(type, context, options) {
        if (!context) { throw new Error("Task '"+ type +"' is not configured."); }

        var items = this.initContext(_.merge({}, scopes.snapshot(), context), type);

        this.parseContext(items);
        this.injectContext(items);
    };

    grunt.registerMultiTask('fluens', description, function(){
        self.run(this.target, this.data, this.options());
    });
};

fluens.core.FluensCache = function(model, commentParser, excludes) {
    var cacheMap = {}, basicMetadataExp = /^\/\*\*[^~]+\*\//;

    this.cache = function(scope) {
        var cached = (cacheMap[scope.type] = []);

        grunt.file.expand({filter: "isFile", cwd: scope.cwd}, scope.paths)
            .forEach(function(path) {
                var content = null, rawMetadata, metadata;

                if (_.indexOf(scope.excludes || excludes, scope.type) === -1) {
                    content = grunt.file.read(model.stripslashes(scope.cwd + "/"  +path));
                    rawMetadata = content.match(basicMetadataExp);
                    metadata = rawMetadata ? commentParser(rawMetadata[0]) : null;
                }
                cached.push({
                    path: path,
                    qPath: model.stripslashes(scope.cwd + "/" + path),
                    cwd: scope.cwd,
                    content: content,
                    metadata: metadata
                });
            }
        );
        scope.cachedContent = cached;
    };

    this.item = function(key) {
        return cacheMap[key] || null;
    };
};

fluens.core.FluensContext = function(scope, scopes, cache, item) {
    this.scope = scope;
    this.scopes = scopes;
    this.cache = cache;
    this.item = item;
};

fluens.core.FluensFacade = function(fluens) {

    this.run = function(type, context) {
        fluens.core.run(type, context);
    };
};

fluens.core.FluensScope = function(type, contextType, params) {
    this.type = type;
    this.context = contextType;
    this.paths = params.paths;
    this.cwd = params.cwd;
    this.parse = params.parse;
    this.inject = params.inject;
    this.parsedContent = null;
    this.cachedContent = null;
};

fluens.core.FluensScopes = function() {

    var parsers = {}, injectors = {}, map;

    this.parser = function(key, fn) {
        if (!_.isFunction(fn)) {
            return parsers[key] ? parsers[key] : null;
        }
        if (parsers[key]) {
            throw new Error("Parser '"+key+"' already exists.");
        }
        parsers[key] = fn;
        map = null;
    };

    this.injector = function(key, fn) {
        if (!_.isFunction(fn)) {
            return injectors[key] ? parsers[key] : null;
        }
        if (injectors[key]) {
            throw new Error("Injector '"+key+"' already exists.");
        }
        injectors[key] = fn;
        map = null;
    };

    this.snapshot = function() {
        if (map) {
            return map;
        }
        map = {};
        _.forIn(parsers, function(value, key) {
            if (!map[key]) { map[key] = {};}
            map[key].parse = value;
        });
        _.forIn(injectors, function(value, key) {
            if (!map[key]) { map[key] = {};}
            map[key].inject = value;
        });
        return map;
    };
};

fluens.injector.EtherInjector = function(model) {

    this.commands = function(context) {
        var re = model.markerExp.replace("T", context.scope.type),
            rex = new RegExp(re),
            item = context.item,
            match = item.content.match(rex);

        if (match) {

        }
    };
};

fluens.injector.FluensInjector = function(model) {

    var replace = function(match, replacer, rex, scope, item) {
        var result = replacer.replace(/T/g, scope.type)
            .replace(" A", match[2].match(/\w+/) ? " " + match[2] : "")
            .replace("C", scope.parsedContent);

        result = match[1] + result.split("\n").join("\n" + match[1]);
        return item.content.replace(rex, result);
    };

    var commonParse = function(context) {
        var htmlRe = model.htmlMarkerExp.replace(/T/g, context.scope.type),
            htmlRex = new RegExp(htmlRe),
            jsRe = model.jsMarkerExp.replace(/T/g, context.scope.type),
            jsRex = new RegExp(jsRe),
            item = context.item,
            htmlMatch = item.content.match(htmlRex),
            jsMatch = item.content.match(jsRex),
            scope = context.scope,
            newContent;

        if (htmlMatch) {
            newContent = replace(htmlMatch, model.htmlMarkerReplacer,
                htmlRex, scope, item);
        } else if (jsMatch) {
            newContent = replace(jsMatch, model.jsMarkerReplacer,
                jsRex, scope, item);
        }

        if (newContent) {
            grunt.file.write(item.qPath, newContent);
            grunt.log.writeln("Fluens: file " + item.path + " processed.");
        }
    };

    this.sources = commonParse;
    this.vendors = commonParse;
    this.styles = commonParse;
    this.namespaces = commonParse;
    this.dependencies = commonParse;
};

fluens.parser.AngularParser = function(model) {

    var classDefinitionRegEx = /^(.[^\*]+?)function.+\{/m,
        angularTypes = {Controller: true, Service: true, Factory: true, Value: true,
            Provider: true, Constant: true, Directive: true, Filter: true};

    this.dependencies = function(context) {
        return context.cache.item("dependencies") ? '\n' +
            _.compact(_.map(context.cache.item("dependencies"), function(item){
                var result, moduleName, dependencyType, dependencyName, path,
                    classDefinition = item.content.match(classDefinitionRegEx);

                if (classDefinition && classDefinition[1].indexOf(item.path.slice(0, -3)) === -1) {
                    throw new Error("Dependency package should match folder structure: " +
                        item.path + ' vs. ' + classDefinition[1]);
                }

                if (item.metadata && _.isArray(item.metadata[0].tags)) {
                    _.forEach(item.metadata[0].tags, function(tag) {
                        if (tag.tag === "module") {
                            if (!tag.name) { throw new Error("Module name is required for '"+ item.path +"'.");}
                            moduleName = tag.name;
                        }
                        if (tag.tag === "dependency") {
                            if (!tag.type) { throw new Error("Dependency type is required for '"+ item.path +"'.");}
                            dependencyType = tag.type;
                        }
                        if (moduleName && dependencyType) { return false; }
                    });

                    if (moduleName && dependencyType) {
                        if (dependencyType && !angularTypes[dependencyType]) {
                            throw new Error("Invalid dependency type - '"+dependencyType+"'.");
                        }
                        path = item.path.slice(0, -3);
                        dependencyType = dependencyType.toLowerCase();
                        dependencyName = dependencyType === "controller" ? path.match(/.+\.(.+)$/)[1] : path;
                        result = moduleName + '.'+ dependencyType +'("'+ dependencyName +'", '+ path +');';
                    }
                }

                return result;
            })).join('\n') : null;
    };
};

fluens.parser.EtherParser = function(model) {

    this.commands = function(context) {
        return null;
    };
};

fluens.parser.FluensParser = function(model) {

    var parseScripts = function(items) {
        return items ? _.map(items, function(item){
            return model.scriptTpl.replace('C', item.path);
        }).join('\n') : null;
    };

    this.sources = function(context) {
        return parseScripts(context.cache.item("sources"));
    };

    this.vendors = function(context) {
        return parseScripts(context.cache.item("vendors"));
    };

    this.styles = function(context) {
        return context.cache.item("styles") ? _.map(context.cache.item("styles"), function(item){
            return model.styleTpl.replace('C', item.path);
        }).join("\n") : null;
    };

    this.namespaces = function(context) {
        return context.cache.item("namespaces") ? '\n' + _.map(context.cache.item("namespaces"), function(item){
            return item.path;
        }).join('\n') : null;
    };
};

return new fluens.core.Composer(commentParser).facade;

};
