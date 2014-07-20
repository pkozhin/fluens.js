fluent.parser.CommonParser = function() {

    var scriptTpl = '<script src="C"></script>',
        styleTpl = '<link href="C" rel="stylesheet">';

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
};

fluent.parser.CommonParser.Factory = function() {
    return fluent.CommonParser();
};
