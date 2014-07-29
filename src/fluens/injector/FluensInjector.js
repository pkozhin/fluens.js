fluens.injector.FluensInjector = function(model) {

    var replace = function(match, replacer, rex, scope, item) {
        var result = replacer.replace(/T/g, scope.type)
            .replace(" A", match[2].match(/\w+/) ? " " + match[2] : "")
            .replace("C", scope.parsedContent);

        result = match[1] + result.split("\n").join("\n" + match[1]);
        return item.content.replace(rex, result);
    };

    var commonParse = function(context) {
        var htmlRe = model.htmlMarkerExp.replace(/T/g, context.scope.type),
            htmlRex = new RegExp(htmlRe),
            jsRe = model.jsMarkerExp.replace(/T/g, context.scope.type),
            jsRex = new RegExp(jsRe),
            item = context.item,
            htmlMatch = item.content.match(htmlRex),
            jsMatch = item.content.match(jsRex),
            scope = context.scope,
            newContent;

        if (htmlMatch) {
            newContent = replace(htmlMatch, model.htmlMarkerReplacer,
                htmlRex, scope, item);
        } else if (jsMatch) {
            newContent = replace(jsMatch, model.jsMarkerReplacer,
                jsRex, scope, item);
        }

        if (newContent) {
            grunt.file.write(item.qPath, newContent);
            grunt.log.writeln("Fluens: file " + item.path + " processed.");
        }
    };

    this.sources = commonParse;
    this.vendors = commonParse;
    this.styles = commonParse;
    this.namespaces = commonParse;
    this.dependencies = commonParse;
};
