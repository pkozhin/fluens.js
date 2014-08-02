/**
* FluensJS - v0.0.3-0.1
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
    this.htmlMarkerExp = /([ \t]*).*<!--<fluens:T(.*)>-->([^~]*).*<!--<\/fluens:T>-->/;
    this.htmlMarkerReplacer = "<!--<fluens:T A>-->\nC\n<!--<\/fluens:T>-->";
    this.jsMarkerExp = /([ \t]*).*\/\*<fluens:T(.*)>\*\/([^~]*).*\/\*<\/fluens:T>\*\//;
    this.jsMarkerReplacer = "/*<fluens:T A>*/\nC\n/*<\/fluens:T>*/";
    this.scriptTpl = '<script src="C"></script>';
    this.styleTpl = '<link href="C" rel="stylesheet">';
    this.stripslashes = function(value) {
        return value.replace(/\/\//g, "/");
    };
};

fluens.common.Validator = function() {

    var validatePhase = function(scope, scopeType, phase) {
        if (phase.paths && !_.isArray(phase.paths)) {
            throw new Error("Phase parameter 'paths' should be array. Scope '" +
                scopeType + "', phase '"+ phase.type +"'.");
        }
        if (phase.cwd && !_.isString(phase.cwd)) {
            throw new Error("Phase parameter 'cwd' should be a string. Scope '" +
                scopeType + "', phase '"+ phase.type +"'.");
        }

        if (scope.type || scope.context) {
            throw new Error("Scope has reserved properties: " +
                "type, context, which should not be assigned initially.");
        }
        if (phase.content || phase.cachedContent) {
            throw new Error("Phase has reserved properties: " +
                "parsedContext, cachedContent which should not be assigned initially.");
        }
    };

    this.validateScope = function(scope, type) {
        validatePhase(scope, type, scope.parse);

        if (!_.isFunction(scope.parse.action)) {
            throw new Error("Phase parameter 'action' should be a function. Scope '"+
                type +"', phase 'parse'.");
        }
        validatePhase(scope, type, scope.inject);

        if (!_.isFunction(scope.inject.action)) {
            throw new Error("Phase parameter 'action' should be a function. Scope '" +
                type + "', phase 'inject'.");
        }
    };
};

fluens.core.Composer = function(commentParser) {

    var model = new fluens.common.Model(),
        cache = new fluens.core.FluensCache(model, commentParser, ["vendors"]),
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

    // TODO: regexp helper to manage with rex substitutions etc.

    this.initContext = function(context, contextType) {
        var result = [], scope;
        _.forIn(context, function(item, type) {
            if (type !== "options") {
                item.parse.action = item.parse.action || scopes.parser(type);
                item.inject.action = item.inject.action || scopes.injector(type);

                scope = self.scopeFactory(type, contextType,
                    self.phaseFactory(fluens.core.FluensPhase.TYPE_PARSE, item.parse),
                    self.phaseFactory(fluens.core.FluensPhase.TYPE_INJECT, item.inject));

                validator.validateScope(item, type);

                result.push(scope);
            }
        });
        return result;
    };

    this.cacheContext = function(scopes) {
        _.each(scopes, function(scope){
            if (scope.isActive()) {
                cache.cacheScope(scope);
            }
        });
    };

    this.parseContext = function(scopes) {
        _.each(scopes, function(scope){
            scope.parse.content = scope.parse.action(
                self.contextFactory(scope, scopes, cache, null));
        });
    };

    this.injectContext = function(scopes) {
        _.each(scopes, function(scope) {
            _.forIn(cache.getInject(scope.type), function(cacheItem) {
                if (cacheItem.content) {
                    cacheItem.content = scope.inject.action(
                        self.contextFactory(scope, scopes, cache, cacheItem));
                }
            });
        });
    };

    this.contextFactory = function(scope, scopes, cache, item) {
        return new fluens.core.FluensContext(scope, scopes, cache, item);
    };

    this.scopeFactory = function(type, contextType, parsePhase, injectPhase) {
        return new fluens.core.FluensScope(type, contextType, parsePhase, injectPhase);
    };

    this.phaseFactory = function(type, action) {
        return new fluens.core.FluensPhase(type, action);
    };

    this.run = function(type, context, options) {
        if (!context) { throw new Error("Task '"+ type +"' is not configured."); }

        var items = this.initContext(context, type);

        this.cacheContext(items);
        this.parseContext(items);
        this.injectContext(items);
    };

    grunt.registerMultiTask('fluens', description, function(){
        self.run(this.target, this.data, this.options());
    });
};

fluens.core.FluensCache = function(model, commentParser, excludes) {
    var self = this, basicMetadataExp = /^\/\*\*[^~]+\*\//,
        cacheMap = {}, scopedPhasesMap = {};

    var prepareScopedPhase = function(scope, phase) {
        if (!scopedPhasesMap[scope.type]) {
            scopedPhasesMap[scope.type] = {};
        }
        if (!scopedPhasesMap[scope.type][phase.type]) {
            scopedPhasesMap[scope.type][phase.type] = {};
        }
        return scopedPhasesMap[scope.type][phase.type];
    };

    var cachePhase = function(scope, phase) {
        grunt.file.expand({filter: phase.filter, cwd: phase.cwd}, phase.paths)
            .forEach(function(path) {
                var content = null, rawMetadata, metadata,
                    qPath = model.stripslashes(phase.cwd + "/" + path),
                    scopedPhase = prepareScopedPhase(scope, phase);

                if (!cacheMap[qPath]) {
                    if (_.indexOf(scope.excludes || excludes, scope.type) === -1) {
                        content = phase.filter === "isFile" ? grunt.file.read(qPath) : null;
                        rawMetadata = content ? content.match(basicMetadataExp) : null;
                        metadata = rawMetadata ? commentParser(rawMetadata[0]) : null;
                    }
                    cacheMap[qPath] = scopedPhase[qPath] =
                        self.cacheItemFactory(path, phase.cwd, qPath, content, metadata);
                } else if (!scopedPhase[qPath]) {
                    scopedPhase[qPath] = cacheMap[qPath];
                }
            }
        );
    };

    this.cacheScope = function(scope) {
        cachePhase(scope, scope.parse);
        cachePhase(scope, scope.inject);
    };

    this.getParse = function(type) {
       return _.values(scopedPhasesMap[type][fluens.core.FluensPhase.TYPE_PARSE]);
    };

    this.getInject = function(type) {
        return _.values(scopedPhasesMap[type][fluens.core.FluensPhase.TYPE_INJECT]);
    };

    this.getItem = function(qPath) {
        return cacheMap[qPath] || null;
    };

    this.cacheItemFactory = function(path, cwd, qPath, content, metadata) {
        return new fluens.core.FluensCacheItem(path, cwd, qPath, content, metadata);
    };
};

fluens.core.FluensCacheItem = function(path, cwd, qPath, content, metadata) {
    this.path = path;
    this.cwd = cwd;
    this.qPath = qPath;
    this.content = content;
    this.metadata = metadata;
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

fluens.core.FluensPhase = function(type, params) {
    this.type = type;
    this.action = params.action;
    this.cwd = params.cwd;
    this.filter = params.filter || "isFile";
    this.paths = params.paths;
    this.content = undefined;
};
fluens.core.FluensPhase.TYPE_PARSE = "parse";
fluens.core.FluensPhase.TYPE_INJECT = "inject";

fluens.core.FluensScope = function(type, contextType, parsePhase, injectPhase) {
    this.type = type;
    this.context = contextType;
    this.parse = parsePhase;
    this.inject = injectPhase;
    this.excludes = null;

    this.isActive = function() {
        return Boolean(this.parse && this.parse.paths && this.parse.paths.length);
    };
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
            return injectors[key] ? injectors[key] : null;
        }
        if (injectors[key]) {
            throw new Error("Injector '"+key+"' already exists.");
        }
        injectors[key] = fn;
        map = null;
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
            .replace("C", scope.parse.content);

        result = match[1] + result.split("\n").join("\n" + match[1]);
        return item.content.replace(rex, result);
    };

    var commonInject = function(context) {
        var htmlRex = new RegExp(model.htmlMarkerExp.source.replace(/T/g, context.scope.type)),
            jsRex = new RegExp(model.jsMarkerExp.source.replace(/T/g, context.scope.type)),
            newContent = context.item.content,
            item = context.item,
            htmlMatch = item.content.match(htmlRex),
            jsMatch = item.content.match(jsRex),
            scope = context.scope;

        if (htmlMatch) {
            newContent = replace(htmlMatch, model.htmlMarkerReplacer,
                htmlRex, scope, item);
        } else if (jsMatch) {
            newContent = replace(jsMatch, model.jsMarkerReplacer,
                jsRex, scope, item);
        }
        if (htmlMatch || jsMatch) {
            grunt.file.write(item.qPath, newContent);
            grunt.log.writeln("Fluens: file " + item.path +
                " processed. Scope type: "+ context.scope.type +".");
        }
        return newContent;
    };

    this.sources = commonInject;
    this.vendors = commonInject;
    this.styles = commonInject;
    this.namespaces = commonInject;
    this.dependencies = commonInject;
};

fluens.parser.AngularParser = function(model) {

    var classDefinitionRegEx = /^(.[^\*]+?)function.+\{/m,
        angularTypes = {Controller: true, Service: true, Factory: true, Value: true,
            Provider: true, Constant: true, Directive: true, Filter: true};

    this.dependencies = function(context) {
        return _.compact(_.map(context.cache.getParse("dependencies"), function(item){
                var result, moduleName, dependencyType, dependencyName,
                    path = item.path.slice(0, -3).replace(/\//g, "."),
                    classDefinition = item.content.match(classDefinitionRegEx);

                if (classDefinition && classDefinition[1].indexOf(path) === -1) {
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
                        dependencyType = dependencyType.toLowerCase();
                        dependencyName = dependencyType === "controller" ? path.match(/.+\.(.+)$/)[1] : path;
                        result = moduleName + '.'+ dependencyType +'("'+ dependencyName +'", '+ path +');';
                    }
                }

                return result;
            })).join('\n');
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
        return parseScripts(context.cache.getParse("sources"));
    };

    this.vendors = function(context) {
        return parseScripts(context.cache.getParse("vendors"));
    };

    this.styles = function(context) {
        return _.map(context.cache.getParse("styles"), function(item){
            return model.styleTpl.replace('C', item.path);
        }).join("\n");
    };

    this.namespaces = function(context) {
        return _.map(context.cache.getParse("namespaces"), function(item){
            return "window." + item.path.replace(/\//g, ".") + " = {};";
        }).join('\n');
    };
};

return new fluens.core.Composer(commentParser).facade;

};
