/**
* FluentJS - v0.0.3
* Copyright (c) 2014 Pavel Kozhin
* License: MIT, https://github.com/pkozhin/fluent.js/blob/master/LICENSE
*/
module.exports = function(grunt) {

"use strict";

var fluent = {},
    _ = require("lodash"),
    commentParser = require("comment-parser");

fluent.Fluent = function(cacheFactory, parserFactory, injectorFactory, contextFactory) {

    var description = 'Interpolate templates with your data and inject the result to the desired location.',
        cache = cacheFactory(commentParser, ["vendors", "styles"]),
        parser = parserFactory(),
        injector = injectorFactory(),
        self = this;

    var defaultScopes = {
        scripts: {parser: parser.scripts, injector: injector.common},
        sources: {parser: parser.sources, injector: injector.common},
        vendors: {parser: parser.vendors, injector: injector.common},
        styles: {parser: parser.styles, injector: injector.common},
        namespaces: {parser: parser.namespaces, injector: injector.common},
        dependencies: {parser: parser.dependencies, injector: injector.common},
        commands: {parser: parser.commands, injector: injector.commands}
    };

    this.cacheContext = function(scopes, contextType) {

        _.forIn(scopes, function(scope, type) {
            if (scope.paths) {
                if (!_.isArray(scope.paths)) {
                    throw new Error("Scope parameter 'paths' should an array. Scope '"+ type +"'");
                }
                if (scope.cwd && !_.isString(scope.cwd)) {
                    throw new Error("Scope parameter 'cwd' should be a string. Scope '"+ type +"'");
                }
                scope.type = type;
                scope.context = contextType;
                cache.cache(scope);
            }
        });
    };

    this.parseContext = function(scopes) {
        _.forIn(scopes, function(scope, type){
            if (!_.isFunction(scope.parser)) {
                throw new Error("Scope parameter 'parse' should be a function. Scope '"+ type +"'");
            }
            scope.parsed = scope.parser(contextFactory(scope, scopes, cache, null));
        });
    };

    this.injectContext = function(scopes) {
        _.forIn(scopes, function(scope, type) {
            _.forEach(cache.item(type), function(item){
                if (item.content && _.isFunction(scope.injector)) {
                    scope.injector(contextFactory(scope, scopes, cache, item));
                }
            });
        });
    };

    this.run = function(type, context) {
        if (!context) {
            throw new Error("Task '"+ type +"' is not configured.");
        }
        var scopes = _.merge({}, defaultScopes, context);

        this.cacheContext(scopes, type);
        this.parseContext(scopes, type);
        this.injectContext(scopes, type);
    };

    grunt.registerMultiTask('fluent', description, function() {
        self.run(this.target, this.data);
    });
};

fluent.FluentCache = function(commentParser, excludes) {
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
            });
    };

    this.item = function(key) {
        return cacheMap[key] || null;
    };

};

fluent.FluentCache.Factory = function(commentParser, excludes) {
    return fluent.FluentCache(commentParser, excludes);
};

fluent.FluentContext = function(scope, scopes, cache, item) {
    this.scope = scope;
    this.scopes = scopes;
    this.cache = cache;
    this.item = item;
};

fluent.FluentContext.Factory = function(scope, scopes, cache, item) {
    return fluent.FluentContext(scope, scopes, cache, item);
};

fluent.FluentFacade = function(fluent) {

    this.run = function(type, context) {
        fluent.run(type, context);
    };
};

fluent.FluentInjector = function() {
    var markerExp = "<fluent:T(.*)>(.*)<\/fluent:T>",
        markerReplacer = "<fluent:T A>\nC\n<\/fluent:T>";

    this.common = function(context) {
        var re = markerExp.replace("T", context.scope.type),
            rex = new RegExp(re),
            item = context.item,
            match = item.content.match(rex),
            scope = context.scope;

        if (match) {
            var newContent = markerReplacer.replace("T", scope.type)
                .replace("A", match[1]).replace("C", scope.parsed);
            grunt.file.write(item.cwd + item.path, item.content.replace(rex, newContent));

            grunt.log.writeln("File '" + item.path + "' processed.");
        }
    };

    this.commands = function(context) {
        var re = markerExp.replace("T", context.scope.type),
            rex = new RegExp(re),
            item = context.item,
            match = item.content.match(rex);

        if (match) {

        }
    };
};

fluent.FluentInjector.Factory = function() {
    return fluent.FluentInjector();
};

fluent.FluentParser = function() {
    var scriptTpl = '<script src="C"></script>',
        styleTpl = '<link href="C" rel="stylesheet">',
        classDefinitionRegEx = /^(.[^\*]+?)function.+\{/m,
        angularTypes = {Controller: true, Service: true, Factory: true, Value: true,
            Provider: true, Constant: true, Directive: true, Filter: true};

    var parseCommon = function(items) {
        return items ? _.map(items, function(item){
            return scriptTpl.replace('C', item.path);
        }).join('\n') : null;
    };

    this.scripts = function(context) {
        return parseCommon(context.cache.item("vendors") && context.cache.item("sources") ?
            context.cache.item("vendors").concat(context.cache.item("sources")) : null);
    };

    this.sources = function(context) {
        return parseCommon(context.cache.item("sources"));
    };

    this.vendors = function(context) {
        return parseCommon(context.cache.item("vendors"));
    };

    this.styles = function(context) {
        return context.cache.item("styles") ? _.map(context.cache.item("styles"), function(item){
            return styleTpl.replace('C', item.path);
        }).join("\n") : null;
    };

    this.namespaces = function(context) {
        return context.cache.item("namespaces") ? '\n' + _.map(context.cache.item("namespaces"), function(item){
            return item.path;
        }).join('\n') : null;
    };

    this.dependencies = function(context) {
        return context.cache.item("dependencies") ? '\n' +
            _.compact(_.map(context.cache.item("dependencies"), function(item){
                var result, moduleName, dependencyType, dependencyName, path,
                    classDefinition = item.content.match(classDefinitionRegEx);

                if (classDefinition && classDefinition[1].indexOf(item.path.slice(0, -3)) == -1) {
                    throw new Error("Dependency package should match folder structure: " +
                        item.path + ' vs. ' + classDefinition[1]);
                }

                if (item.metadata && _.isArray(item.metadata[0].tags)) {
                    _.forEach(item.metadata[0].tags, function(tag) {
                        if (tag.tag == "module") {
                            if (!tag.name) { throw new Error("Module name is required for '"+ item.path +"'.");}
                            moduleName = tag.name;
                        }
                        if (tag.tag == "dependency") {
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
                        dependencyName = dependencyType == "controller" ? path.match(/.+\.(.+)$/)[1] : path;
                        result = moduleName + '.'+ dependencyType +'("'+ dependencyName +'", '+ path +');';
                    }
                }

                return result;
        })).join('\n') : null;
    };

    this.commands = function(context) {
        return null;
    };
};

fluent.FluentParser.Factory = function() {
    return fluent.FluentParser();
};

return new fluent.FluentFacade(new fluent.Fluent(fluent.FluentCache.Factory, fluent.FluentParser.Factory, fluent.FluentInjector.Factory, fluent.FluentContext.Factory));

};
