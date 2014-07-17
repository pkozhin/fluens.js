fluent.FluentInjector = function() {
    var markerExp = "<fluent:T(.*)>(.*)<\/fluent:T>",
        markerReplacer = "<fluent:T A>\nC\n<\/fluent:T>";

    this.common = function(context) {
        var re = markerExp.replace("T", context.scope.type),
            rex = new RegExp(re),
            item = context.item,
            match = item.content.match(rex),
            scope = context.scope;

        if (match) {
            var newContent = markerReplacer.replace("T", scope.type)
                .replace("A", match[1]).replace("C", scope.parsed);
            grunt.file.write(item.cwd + item.path, item.content.replace(rex, newContent));

            grunt.log.writeln("File '" + item.path + "' processed.");
        }
    };

    this.commands = function(context) {
        var re = markerExp.replace("T", context.scope.type),
            rex = new RegExp(re),
            item = context.item,
            match = item.content.match(rex);

        if (match) {

        }
    };
};

fluent.FluentInjector.Factory = function() {
    return fluent.FluentInjector();
};
