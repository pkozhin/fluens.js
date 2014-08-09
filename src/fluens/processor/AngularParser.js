fluens.processor.AngularParser = function(model) {

    var classDefinitionRegEx = /^(.[^\*]+?)function.+\{/m,
        angularTypes = {Controller: true, Service: true, Factory: true, Value: true,
            Provider: true, Constant: true, Directive: true, Filter: true};

    this.dependencies = function(item) {
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
    };

    this.action = function(facade) {
        var self = this;

        return _.compact(_.map(facade.cache.getPhase(facade.scope.type, facade.phase.type),
            function(item) {
                return self[facade.scope.type](item);
            }
        )).join('\n');
    };

    this.validate = function(facade) {
        return _.isFunction(this[facade.scope.type]);
    };

    this.phases = {
        parse: {
            dependencies: this
        }
    };
};
