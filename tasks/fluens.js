/**
* FluensJS - v0.0.9-0.5
* Copyright (c) 2014 Pavel Kozhin
* License: MIT, https://github.com/pkozhin/fluens.js/blob/master/LICENSE
*/
module.exports = function(grunt) {

"use strict";

var fluens = {};
fluens.core = {};
fluens.processor = {};
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
    this.linefeed = grunt.util.linefeed;

    this.normalizelf = function(value) {
        return grunt.util.normalizelf(value);
    };

    this.stripslashes = function(value) {
        return value.replace(/\/\//g, "/");
    };
};

fluens.common.Validator = function() {

    var validatePhase = function(scopeType, phase) {
        if (phase.paths && !_.isArray(phase.paths)) {
            throw new Error("Phase.paths should be array. Scope '" +
                scopeType + "', phase '"+ phase.type +"'.");
        }
        if (phase.cwd && !_.isString(phase.cwd)) {
            throw new Error("Phase.cwd should be a string. Scope '" +
                scopeType + "', phase '"+ phase.type +"'.");
        }
        if (!_.isFunction(phase.action)) {
            throw new Error("Phase.action should be a function. Scope '"+
                scopeType +"', phase '"+ phase.type +"'.");
        }
        if (phase.filter !== "isFile" && phase.filter !== "isDirectory") {
            throw new Error("Phase.filter can be only 'isFile' or 'isDirectory'. Scope '"+
                scopeType +"', phase '"+ phase.type +"', filter '"+ phase.filter +"'.");
        }
    };

    this.validateProcessor = function(processor) {
        if (!processor.phases) {
            throw new Error("Processor.phases is not an object.");
        }
    };

    this.validatePhaseProcessor = function(processor) {
        if (!_.isFunction(processor.action)) {
            throw new Error("Processor.action is not a function.");
        }
        if (!_.isFunction(processor.validate)) {
            throw new Error("Processor.validate is not a function.");
        }
    };

    this.validateScope = function(scope, type) {
        if (!_.isArray(scope.phases)) {
            throw new Error("Scope.phases property must be array. Scope: '"+type+"'.");
        }

        _.each(scope.phases, function(phase) {
            validatePhase(scope.type, phase);
        });
    };
};

fluens.core.Composer = function(commentParser) {

    var model = new fluens.common.Model(),
        cache = new fluens.core.FluensCache(model, commentParser, ["vendors"]),
        scopes = new fluens.core.FluensScopes(),
        validator = new fluens.common.Validator(),
        main = new fluens.core.Fluens(model, cache, scopes, validator);

    main.addProcessors(fluens.processor);

    this.facade = new fluens.core.FluensFacade(main);
};

fluens.core.Fluens = function(model, cache, scopes, validator) {

    var OPTIONS = "options",
        DEFAULT_SCOPE = "default";

    var description = 'Interpolate templates with your data and inject the result to the desired location.',
        self = this;

    var defaultOptions = {
        phase: {
            stub: {priority: 1},
            parse: {priority: 3},
            inject: {priority: 5}
        }
    };

    var defaultPriority = 5;

    this.initContext = function(context, contextType, options) {
        var result = [], scope;

        options = _.merge(defaultOptions, options);

        _.forIn(context, function(item, scopeType) {
            var phases = [], priority;

            if (scopeType !== OPTIONS && scopeType !== DEFAULT_SCOPE) {
                scope = self.scopeFactory(scopeType, contextType, phases);

                _.forIn(item, function(phase, phaseType) {
                    var processor = scopes.processor(scopeType, phaseType);

                    phase.action = _.isFunction(phase.action) ? phase.action :
                        (processor ? _.bind(processor.action, processor) : null);

                    phase.validate = _.isFunction(phase.validate) ? phase.validate :
                        (processor ? _.bind(processor.validate, processor) : null);

                    if (!phase.cwd) {
                        phase.cwd = options.cwd;
                    }
                    priority = phase.priority || (options.phase[phaseType] ?
                        options.phase[phaseType].priority : defaultPriority);

                    phases.push(self.phaseFactory(phaseType, phase, scope, priority));
                });

                validator.validateScope(scope, scopeType);
                result.push(scope);
            }
        });
        return result;
    };

    this.cacheContext = function(scopes) {
        _.each(scopes, function(scope){
            cache.cacheScope(scope);
        });
    };

    this.processContext = function(scopes) {
        var phases = [];

        _.each(scopes, function(scope) {
            phases = phases.concat(scope.phases);
        });

        phases = _.sortBy(phases, function(phase){
            return phase.priority;
        });

        _.each(phases, function(phase) {
            if (phase.isActive()) {
                var actionFacade = self.actionFacadeFactory(phase.scope, phase, scopes, cache);

                if (phase.validate(actionFacade)) {
                    phase.content =  phase.action(actionFacade);
                } else {
                    grunt.verbose.writeln("Fluens: phase '"+ phase.type +
                        "' is not valid within '"+ phase.scope.type +"' scope.");
                }
            }
        });
    };

    this.actionFacadeFactory = function(scope, phase, scopes, cache) {
        return new fluens.core.FluensActionFacade(scope, phase, scopes, cache);
    };

    this.scopeFactory = function(type, contextType, phases) {
        return new fluens.core.FluensScope(type, contextType, phases);
    };

    this.phaseFactory = function(type, params, scope, priority) {
        return new fluens.core.FluensPhase(type, params, scope, priority);
    };

    this.run = function(type, context, options) {
        if (!context) { throw new Error("Task '"+ type +"' is not configured."); }

        var items = this.initContext(context, type, options);

        this.cacheContext(items);
        this.processContext(items);
    };

    this.addProcessors = function(items) {
        _.each(_.values(items), function(Type) {
            var obj = new Type(model);
            validator.validateProcessor(obj);

            _.forIn(obj.phases, function(phase, phaseType) {
                _.forIn(phase, function(processor, scopeType) {
                    validator.validatePhaseProcessor(processor);
                    scopes.processor(scopeType, phaseType, processor);
                });
            });
        });
    };

    grunt.registerMultiTask('fluens', description, function(){
        self.run(this.target, this.data, this.options() || {});
    });
};

fluens.core.FluensActionFacade = function(scope, phase, scopes, cache) {
    this.scope = scope;
    this.phase = phase;
    this.scopes = scopes;
    this.cache = cache;
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
        _.each(scope.phases, function(phase){
            cachePhase(scope, phase);
        });
    };

    this.getScope = function(scopeType) {
        return scopedPhasesMap[scopeType] || null;
    };

    this.getPhase = function(scopeType, phaseType) {
        return scopedPhasesMap[scopeType] ? scopedPhasesMap[scopeType][phaseType] : null;
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
fluens.core.FluensFacade = function(fluens) {

    this.run = function(type, context) {
        fluens.core.run(type, context);
    };

    this.addProcessors = function(items) {
        fluens.addProcessors(items);
    };
};

fluens.core.FluensPhase = function(type, params, scope, priority) {
    this.type = type;
    this.scope = scope;
    this.action = params.action;
    this.validate = params.validate;
    this.cwd = params.cwd;
    this.filter = params.filter || "isFile";
    this.paths = params.paths;
    this.priority = priority;
    this.content = undefined;
    this.params = params;

    this.isActive = function() {
        return this.paths.length;
    };
};
fluens.core.FluensScope = function(type, contextType, phases) {
    this.type = type;
    this.context = contextType;
    this.phases = phases;
    this.excludes = null;

    this.getPhase = function(type) {
        for (var i = 0; i < this.phases.length; ++i) {
            if (this.phases[i].type === type) {
                return this.phases[i];
            }
        }
        return null;
    };
};

fluens.core.FluensScopes = function() {

    var DEFAULT_SCOPE = "default";

    var map = {};

    this.processor = function(scopeType, phaseType, processor) {
        if (!processor) {
            return map[scopeType] && map[scopeType][phaseType] ?
                map[scopeType][phaseType] : (map[DEFAULT_SCOPE][phaseType] ?
                map[DEFAULT_SCOPE][phaseType] : null);
        }

        if (!map[scopeType]) {
            map[scopeType] = {};
        }

        if (map[scopeType][phaseType]) {
            grunt.verbose.writeln("Fluens: Overriding processor for scope '"+
                scopeType+"' and phase '"+ phaseType +"'.");
        }

        map[scopeType][phaseType] = processor;
        return undefined;
    };
};

fluens.processor.AngularParser = function(model) {

    var classDefinitionRegEx = /^(.[^\*]+?) *=.+/m, stubRules = {}, stubs = {},
        angularTypes = {Controller: true, Service: true, Factory: true, Value: true,
            Provider: true, Constant: true, Directive: true, Filter: true};

    var processPath = function(path) {
        if (stubRules[path]) {
            path = stubRules[path];
        }
        return path;
    };

    var isStub = function(path) {
        return stubs[path];
    };

    this.dependencies = function(phase, item) {
        var result, moduleName, dependencyType, dependencyName,
            cwd = model.stripslashes(phase.cwd + "/"),
            path = item.qPath.replace(cwd, "").slice(0, -3).replace(/\//g, "."),
            classDefinition = item.content.match(classDefinitionRegEx);

        if (isStub(path)) {
            return null;
        }

        if (classDefinition && path.indexOf(classDefinition[1]) === -1) {
            throw new Error("Dependency package should match folder structure. Should be:" +
                path + ' but given: ' + classDefinition[1]);
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
                result = moduleName + '.'+ dependencyType +'("'+ dependencyName +'", '+ processPath(path) +');';
            }
        }
        return result;
    };

    var processStubs = function(facade) {
        _.forIn(facade.phase.params.rules, function(value, key) {
            var stub = model.stripslashes(value).replace(/\//g, ".");

            stubRules[model.stripslashes(key).replace(/\//g, ".")] = stub;
            stubs[stub] = true;
        });
        return null;
    };

    this.action = function(facade) {
        var self = this;

        return _.compact(_.map(facade.cache.getPhase(facade.scope.type, facade.phase.type),
            function(item) {
                return self[facade.scope.type](facade.phase, item);
            }
        )).join('\n');
    };

    this.validate = function(facade) {
        return _.isFunction(this[facade.scope.type]);
    };

    this.phases = {
        parse: {
            dependencies: this
        },
        stub: {
            dependencies: {
                action: processStubs,
                validate: function() {
                    return true;
                }
            }
        }
    };
};
fluens.processor.EtherInjector = function(model) {

    this.commands = function(context) {
       /* var re = model.markerExp.replace("T", context.scope.type),
            rex = new RegExp(re),
            item = context.item,
            match = item.content.match(rex);

        if (match) {

        }*/
    };

    this.action = function(facade) {
        return null;
    };

    this.validate = function(facade) {
        return _.isFunction(this[facade.scope.type]) &&
            Boolean(facade.scope.getPhase("parse"));
    };

    this.phases = {
        inject: {
            commands: this
        }
    };
};

fluens.processor.EtherParser = function(model) {

    this.commands = function(facade) {
        return null;
    };

    this.action = function(facade) {
        return null;
    };

    this.validate = function(facade) {
        return _.isFunction(this[facade.scope.type]);
    };

    this.phases = {
        parse: {
            commands: this
        }
    };
};

fluens.processor.FluensInjector = function(model) {

    var replace = function(match, replacer, rex, facade, item) {
        var result = replacer.replace(/T/g, facade.scope.type)
            .replace(" A", match[2].match(/\w+/) ? " " + match[2] : "")
            .replace("C", facade.scope.getPhase("parse").content);

        result = match[1] + result.split("\n").join("\n" + match[1]);
        return item.content.replace(rex, result);
    };

    var injectItem = function(facade, item) {
        var htmlRex = new RegExp(model.htmlMarkerExp.source.replace(/T/g, facade.scope.type)),
            jsRex = new RegExp(model.jsMarkerExp.source.replace(/T/g, facade.scope.type)),
            newContent = item.content,
            htmlMatch = newContent.match(htmlRex),
            jsMatch = newContent.match(jsRex);

        if (htmlMatch) {
            newContent = replace(htmlMatch, model.htmlMarkerReplacer,
                htmlRex, facade, item);
        } else if (jsMatch) {
            newContent = replace(jsMatch, model.jsMarkerReplacer,
                jsRex, facade, item);
        }
        if (htmlMatch || jsMatch) {
            grunt.file.write(item.qPath, model.normalizelf(newContent));
            grunt.verbose.writeln("Fluens: file " + item.path +
                " injected within '"+ facade.scope.type +"' scope.");
        }
        return newContent;
    };

    this.action = function(facade) {
        _.forIn(facade.cache.getPhase(facade.scope.type, facade.phase.type),
            function(item) {
                item.content = injectItem(facade, item);
            }
        );
        return null;
    };

    this.validate = function(facade) {
        return Boolean(facade.scope.getPhase("parse"));
    };

    this.phases = {
        inject: {
            // "default" means that it handles phase "inject" for any scope.
            default: this
        }
    };
};

fluens.processor.FluensParser = function(model) {

    var self = this;

    this.sources = function(item) {
        return model.scriptTpl.replace('C', item.path);
    };

    this.vendors = function(item) {
        return model.scriptTpl.replace('C', item.path);
    };

    this.styles = function(item) {
        return model.styleTpl.replace('C', item.path);
    };

    this.namespaces = function(item) {
        return "window." + item.path.replace(/\//g, ".") + " = {};";
    };

    this.action = function(facade) {
        var self = this;

        return _.map(facade.cache.getPhase(facade.scope.type, facade.phase.type),
            function(item) {
                return self[facade.scope.type](item);
            }
        ).join('\n');
    };

    this.validate = function(facade) {
        return _.isFunction(this[facade.scope.type]);
    };

    this.phases = {
        parse: {
            sources: this,
            vendors: this,
            styles: this,
            namespaces: this
        }
    };
};

return new fluens.core.Composer(commentParser).facade;

};
