fluens.parser.FluensParser = function(model) {

    var parseScripts = function(items) {
        return items ? _.map(items, function(item){
            return model.scriptTpl.replace('C', item.path);
        }).join('\n') : null;
    };

    this.sources = function(context) {
        return parseScripts(context.cache.parsed("sources"));
    };

    this.vendors = function(context) {
        return parseScripts(context.cache.parsed("vendors"));
    };

    this.styles = function(context) {
        return context.cache.parsed("styles") ? _.map(context.cache.parsed("styles"), function(item){
            return model.styleTpl.replace('C', item.path);
        }).join("\n") : null;
    };

    this.namespaces = function(context) {
        return context.cache.parsed("namespaces") ? _.map(context.cache.parsed("namespaces"), function(item){
            return "window." + item.path.replace(/\//g, ".") + " = {};";
        }).join('\n') : null;
    };
};
