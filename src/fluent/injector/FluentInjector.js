fluent.injector.FluentInjector = function(model) {

    var commonParse = function(context) {
        var re = model.markerExp.replace("T", context.scope.type),
            rex = new RegExp(re),
            item = context.item,
            match = item.content.match(rex),
            scope = context.scope;

        if (match) {
            var newContent = model.markerReplacer.replace("T", scope.type)
                .replace("A", match[1]).replace("C", scope.parsedContent);
            grunt.file.write(item.cwd + item.path, item.content.replace(rex, newContent));

            grunt.log.writeln("File '" + item.path + "' processed.");
        }
    };

    this.sources = commonParse;
    this.vendors = commonParse;
    this.styles = commonParse;
    this.namespaces = commonParse;
    this.dependencies = commonParse;
};
