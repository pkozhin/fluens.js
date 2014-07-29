fluens.injector.FluensInjector = function(model) {

    var commonParse = function(context) {
        var re = model.markerExp.replace(/T/g, context.scope.type),
            rex = new RegExp(re),
            item = context.item,
            match = item.content.match(rex),
            scope = context.scope;

        if (match) {
            var newContent = model.markerReplacer.replace(/T/g, scope.type)
                .replace(" A", match[2].match(/\w+/) ? " " + match[2] : "")
                .replace("C", scope.parsedContent);

            newContent = match[1] + newContent.split("\n").join("\n" + match[1]);
            grunt.file.write(item.qPath, item.content.replace(rex, newContent));
            grunt.log.writeln("Fluens: file " + item.path + " processed.");
        }
    };

    this.sources = commonParse;
    this.vendors = commonParse;
    this.styles = commonParse;
    this.namespaces = commonParse;
    this.dependencies = commonParse;
};
