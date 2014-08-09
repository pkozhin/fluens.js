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
