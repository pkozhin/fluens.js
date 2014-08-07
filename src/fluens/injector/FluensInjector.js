fluens.injector.FluensInjector = function(model) {

    var replace = function(match, replacer, rex, scope, item) {
        var result = replacer.replace(/T/g, scope.type)
            .replace(" A", match[2].match(/\w+/) ? " " + match[2] : "")
            .replace("C", scope.parse.content);

        result = match[1] + result.split("\n").join("\n" + match[1]);
        return item.content.replace(rex, result);
    };

    var commonInject = function(context) {
        var htmlRex = new RegExp(model.htmlMarkerExp.source.replace(/T/g, context.scope.type)),
            jsRex = new RegExp(model.jsMarkerExp.source.replace(/T/g, context.scope.type)),
            newContent = context.item.content,
            item = context.item,
            htmlMatch = item.content.match(htmlRex),
            jsMatch = item.content.match(jsRex),
            scope = context.scope;

        if (htmlMatch) {
            newContent = replace(htmlMatch, model.htmlMarkerReplacer,
                htmlRex, scope, item);
        } else if (jsMatch) {
            newContent = replace(jsMatch, model.jsMarkerReplacer,
                jsRex, scope, item);
        }
        if (htmlMatch || jsMatch) {
            grunt.file.write(item.qPath, newContent);
            grunt.log.writeln("Fluens: file " + item.path +
                " processed. Scope type: "+ context.scope.type +".");
        }
        return newContent;
    };

    this.sources = commonInject;
    this.vendors = commonInject;
    this.styles = commonInject;
    this.namespaces = commonInject;
    this.dependencies = commonInject;

    this.phases = {inject: this};
};
