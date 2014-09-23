fluens.processor.FluensParser = function(model) {

    var self = this;

    this.sources = function(path) {
        return model.scriptTpl.replace('C', path);
    };

    this.vendors = function(path) {
        return model.scriptTpl.replace('C', path);
    };

    this.styles = function(path) {
        return model.styleTpl.replace('C', path);
    };

    this.namespaces = function(path) {
        return "window." + path.replace(/\//g, ".") + " = {};";
    };

    this.action = function(facade) {
        var self = this;

        return _.map(facade.cache.getPhase(facade.scope.type, facade.phase.type),
            function(item) {
                var cwd = model.stripslashes(facade.phase.cwd + "/");
                var path = item.qPath.replace(cwd, "").replace(/^\W*/, "");
                return self[facade.scope.type](path);
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
