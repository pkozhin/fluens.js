/**
 * Helps with code generation.
 *
 * Copyright (c) 2014 Pavel Kozhin
 * License: MIT, https://github.com/pkozhin/fluent.js/blob/master/LICENSE
 *
 * @type {exports}
 */
var grunt = require("grunt"),
    _ = require("lodash"),
    commentParser = require("comment-parser");

function Fluent() {
    var self = this, config,
        cache = {}, excludes = ["vendors", "styles"];

    var basicMetadataExp = /^\/\*\*[^~]+\*\//,
        classDefinitionExp = /^(.[^\*]+?)function.+\{/m,
        scriptTpl = '<script src="@"></script>',
        markerExp = "<fluent:T(.*)>(.*)<\/fluent:T>",
        markerReplacer = "<fluent:T A>\nC\n<\/fluent:T>";

    var angularTypes = {Controller: true, Service: true, Factory: true, Value: true,
        Provider: true, Constant: true, Directive: true, Filter: true};

    var paramsToObject = function(str) {
        var result = {},
            pairs = str.split(" ");
        _.each(pairs, function(value){
            var pair = value.split("=");
            result[pair[0]] = pair[1].replace(/'|"/g, "");
        });
        return result;
    };

    var initCache = function(scope) {
        var result = [];
        grunt.file.expand({filter: "isFile", cwd: scope.cwd}, scope.paths)
            .forEach(function(path) {
                var content = null, rawMetadata, metadata;

                if (_.indexOf(scope.excludes || excludes, scope.type) === -1) {
                    content = grunt.file.read(scope.cwd + path);
                    rawMetadata = content.match(basicMetadataExp);
                    metadata = rawMetadata ? commentParser(rawMetadata[0]) : null;
                }
                result.push({
                    path: path,
                    cwd: scope.cwd,
                    content: content,
                    metadata: metadata
                });
            });
        return result;
    };

    var parseCommonScripts = function(items) {
        return items ? _.map(items, function(item){
            return scriptTpl.replace('@', item.path);
        }).join('\n') : null;
    };

    var parseScripts = function(scope, cache, scopes) {
        return parseCommonScripts(cache.vendors && cache.sources ?
            cache.vendors.concat(cache.sources) : null);
    };

    var parseSources = function(scope, cache, scopes) {
        return parseCommonScripts(cache.sources);
    };

    var parseVendors = function(scope, cache, scopes) {
        return parseCommonScripts(cache.vendors);
    };

    var parseStyles = function(scope, cache, scopes) {
        return cache.styles ? _.map(cache.styles, function(item){
            return '<link href="'+ item.path +'" rel="stylesheet">';
        }).join("\n") : null;
    };

    var parseNamespaces = function(scope, cache, scopes) {
        return cache.namespaces ? '\n' + _.map(cache.namespaces, function(item){
            return item.path;
        }).join('\n') : null;
    };

    var parseDependencies = function(scope, cache, scopes) {
        return cache.dependencies ? '\n' + _.compact(_.map(cache.dependencies, function(item){
            var result, moduleName, dependencyType, dependencyName, classDefinition;

            classDefinition = content.match(classDefinitionExp);

            if (classDefinition && classDefinition[1].indexOf(item.path.slice(0, -3)) == -1) {
                throw new Error("Dependency package should match folder structure: "
                    + item.path + ' vs. ' + classDefinition[1]);
            }

            if (item.metadata && _.isArray(item.metadata[0].tags)) {
                _.forEach(item.metadata[0].tags, function(tag) {
                    if (tag.tag == "module") {
                        if (!tag.name) { throw new Error("Module name is required for '"+item.path+"'.");}
                        moduleName = tag.name;
                    }
                    if (tag.tag == "dependency") {
                        if (!tag.type) { throw new Error("Dependency type is required for '"+item.path+"'.");}
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

    var parseCommands = function(scope, cache, scopes) {
        return "Here should be commands!";
    };

    var injectCommon = function(item, scope, cache, scopes) {
        var re = markerExp.replace("T", scope.type),
            rex = new RegExp(re),
            matched = item.content.match(rex);

        if (matched) {
            var newContent = markerReplacer.replace("T", scope.type)
                .replace("A", match[1]).replace("C", cache[scope.parsed]);
            grunt.file.write(item.cwd + item.path, item.content.replace(rex, newContent));
        }
    };

    var injectCommands = function(item, scope, cache, scopes) {
        var re = markerExp.replace("T", scope.type),
            rex = new RegExp(re),
            matched = item.content.match(rex);

        if (matched) {

        }
    };

    var inject = function(scopes, cache) {
        _.forIn(scopes, function(scope, type) {
            _.forEach(cache[type], function(item){
                if (item.content && _.isFunction(scope.injector)) {
                    scope.injector(item, scope, cache, scopes);
                }
            });
        });
    };

    var initContext = function(context, contextType) {
        var scopes = _.merge({
            scripts: {parser: parseScripts, injector: injectCommon},
            sources: {parser: parseSources, injector: injectCommon},
            vendors: {parser: parseVendors, injector: injectCommon},
            styles: {parser: parseStyles, injector: injectCommon},
            namespaces: {parser: parseNamespaces, injector: injectCommon},
            dependencies: {parser: parseDependencies, injector: injectCommon},
            commands: {parser: parseCommands, injector: injectCommands}
        }, context);

        _.forIn(scopes, function(scope, type) {
            if (scope.paths) {
                if (!_.isArray(scope.paths)) {
                    throw new Error("Scope parameter 'paths' should an array. Scope '"+ type +"'");
                }
                if (value.cwd && !_.isString(value.cwd)) {
                    throw new Error("Scope parameter 'cwd' should be a string. Scope '"+ type +"'");
                }
                scope.type = type;
                scope.context = contextType;
                cache[scope.type] = initCache(scope);
            }
        });

        _.forIn(scopes, function(scope, type){
            if (!_.isFunction(value.parser)) {
                throw new Error("Scope parameter 'parse' should be a function. Scope '"+ type +"'");
            }
            scope.parsed = scope.parser(scope, cache, scopes);
        });

        inject(scopes, cache);
    };
    // TODO: Present FluentFacade and Fluent!
    this.init = function(_config) {
        if (_config) {
            config = _config;
            if (_.isObject(_config.contexts)) {
                _.forIn(function(value, key) {
                    initContext(config.contexts[key], key);
                });
            } else {
                throw new Error("Config should contain contexts.");
            }
        } else {
            throw new Error("Config is required.");
        }
    };
}
module.exports = new Fluent();

//<fluent:commands id="claimsLocator">

//</fluent:commands>
/*
var config = {
    contexts: {
        dev: {

        },
        prod: {}
    }
};
*/
