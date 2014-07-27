/**
* FluentJS - v0.0.12
* Copyright (c) 2014 Pavel Kozhin
* License: MIT, https://github.com/pkozhin/fluent.js/blob/master/LICENSE
*/
module.exports = function(grunt) {

"use strict";

var fluent = {};
fluent.core = {};
fluent.parser = {};
fluent.injector = {};
fluent.common = {};

var _ = require("lodash"),
    commentParser = require("comment-parser");

fluent.common.Model = function() {
    this.markerExp = "<fluent:T(.*)>(.*)<\/fluent:T>";
    this.markerReplacer = "<fluent:T A>\nC\n<\/fluent:T>";
    this.scriptTpl = '<script src="C"></script>';
    this.styleTpl = '<link href="C" rel="stylesheet">';
};

fluent.common.Validator = function() {

    this.validateScope = function(scope, type) {
        if (!scope.paths || !scope.cwd) {
            throw new Error("Scope must have mandatory 'paths' and 'cwd' params. Scope '" + type + "'.");
        }
        if (!_.isArray(scope.paths)) {
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

fluent.core.Composer = function(commentParser) {

    var cache = new fluent.core.FluentCache(commentParser, ["vendors", "styles"]),
        scopes = new fluent.core.FluentScopes(),
        model = new fluent.common.Model(),
        validator = new fluent.common.Validator(),
        main = new fluent.core.Fluent(model, cache, scopes, validator);

    _.each(fluent.parser, function(Type) {
        var obj = new Type(model);
        _.forIn(obj, function(value, key) {
            if (_.isFunction(value)) {
                scopes.parser(key, _.bind(value, obj));
            }
        });
    });

    _.each(fluent.injector, function(Type) {
        var obj = new Type(model);
        _.forIn(obj, function(value, key) {
            if (_.isFunction(value)) {
                scopes.injector(key, _.bind(value, obj));
            }
        });
    });

    this.facade = new fluent.FluentFacade(main);
};

fluent.core.Fluent = function(model, cache, scopes, validator) {

    var description = 'Interpolate templates with your data and inject the result to the desired location.',
        self = this;

    this.initContext = function(items, contextType) {
        var result = [];
        _.forIn(items, function(item, type) {
            validator.validateScope(item, type);

            var scope = self.scopeFactory(type, contextType, item);
            result.push(scope);
            cache.cache(scope);
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
        return new fluent.core.FluentContext(scope, scopes, cache, item);
    };

    this.scopeFactory = function(type, contextType, params) {
        return new fluent.core.FluentScope(type, contextType, params);
    };

    this.run = function(type, context) {
        if (!context) { throw new Error("Task '"+ type +"' is not configured."); }

        var items = this.initContext(_.merge({}, scopes.snapshot(), context));

        this.parseContext(items);
        this.injectContext(items);
    };

    grunt.registerMultiTask('fluent', description, function() {
        self.run(this.target, this.data);
    });
};

fluent.core.FluentCache = function(commentParser, excludes) {
    var cacheMap = {}, basicMetadataExp = /^\/\*\*[^~]+\*\//;

    this.cache = function(scope) {
        var cached = (cacheMap[scope.type] = []);

        grunt.file.expand({filter: "isFile", cwd: scope.cwd}, scope.paths)
            .forEach(function(path) {
                var content = null, rawMetadata, metadata;

                if (_.indexOf(scope.excludes || excludes, scope.type) === -1) {
                    content = grunt.file.read(scope.cwd + path);
                    rawMetadata = content.match(basicMetadataExp);
                    metadata = rawMetadata ? commentParser(rawMetadata[0]) : null;
                }
                cached.push({
                    path: path,
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

fluent.core.FluentContext = function(scope, scopes, cache, item) {
    this.scope = scope;
    this.scopes = scopes;
    this.cache = cache;
    this.item = item;
};

fluent.core.FluentFacade = function(fluent) {

    this.run = function(type, context) {
        fluent.core.run(type, context);
    };
};

fluent.core.FluentScope = function(type, contextType, params) {
    this.type = type;
    this.context = contextType;
    this.paths = params.paths;
    this.cwd = params.cwd;
    this.parse = params.parse;
    this.inject = params.inject;
    this.parsedContent = null;
    this.cachedContent = null;
};

fluent.core.FluentScopes = function() {

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

fluent.injector.EtherInjector = function(model) {

    this.commands = function(context) {
        var re = model.markerExp.replace("T", context.scope.type),
            rex = new RegExp(re),
            item = context.item,
            match = item.content.match(rex);

        if (match) {

        }
    };
};

fluent.injector.FluentInjector = function(model) {

    var commonParse = function(context) {
        var re = model.markerExp.replace("T", context.scope.type),
            rex = new RegExp(re),
            item = context.item,
            match = item.content.match(rex),
            scope = context.scope;

        if (match) {
            var newContent = model.markerReplacer.replace("T", scope.type)
                .replace("A", match[1]).replace("C", scope.parsedContent);
            grunt.file.write(item.cwd + item.path, item.content.replace(rex, newContent));

            grunt.log.writeln("File '" + item.path + "' processed.");
        }
    };

    this.sources = commonParse;
    this.vendors = commonParse;
    this.styles = commonParse;
    this.namespaces = commonParse;
    this.dependencies = commonParse;
};

fluent.parser.AngularParser = function(model) {

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

fluent.parser.EtherParser = function(model) {

    this.commands = function(context) {
        return null;
    };
};

fluent.parser.FluentParser = function(model) {

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

return new fluent.core.Composer(commentParser).facade;

};
