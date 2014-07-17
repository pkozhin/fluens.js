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
