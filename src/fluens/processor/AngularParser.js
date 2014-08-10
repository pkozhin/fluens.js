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