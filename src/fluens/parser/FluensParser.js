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
