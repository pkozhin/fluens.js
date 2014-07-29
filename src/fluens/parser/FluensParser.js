fluens.parser.FluensParser = function(model) {

    var parseScripts = function(items) {
        return items ? _.map(items, function(item){
            return model.scriptTpl.replace('C', item.path);
        }).join('\n') : null;
    };

    this.sources = function(context) {
        return parseScripts(context.cache.item("sources"));
    };

    this.vendors = function(context) {
        return parseScripts(context.cache.item("vendors"));
    };

    this.styles = function(context) {
        return context.cache.item("styles") ? _.map(context.cache.item("styles"), function(item){
            return model.styleTpl.replace('C', item.path);
        }).join("\n") : null;
    };

    this.namespaces = function(context) {
        return context.cache.item("namespaces") ? '\n' + _.map(context.cache.item("namespaces"), function(item){
            return item.path;
        }).join('\n') : null;
    };
};
