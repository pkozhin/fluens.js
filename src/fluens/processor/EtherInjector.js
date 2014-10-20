fluens.processor.EtherInjector = function(model) {

    var replace = function(match, replacer, rex, facade, item, content) {
        var result = replacer.replace(/T/g, facade.scope.type)
            .replace(" A", match[2].match(/\w+/) ? " " + match[2] : "")
            .replace("C", content);

        result = match[1] + result.split("\n").join("\n" + match[1]);
        return item.content.replace(rex, result);
    };

    var injectItem = function(facade, item, parsedContent) {
        var jsRex = new RegExp(model.jsMarkerExp.source.replace(/T/g, facade.scope.type)),
            newContent = item.content,
            jsMatch = newContent.match(jsRex),
            locator, commands;

        if (jsMatch && (locator = parsedContent.locators[item.qPath]) &&
            (commands = parsedContent.commands[locator.id])) {

            commands = commands.sort();

            newContent = model.normalizelf(model.trimtrailings(replace(jsMatch, model.jsMarkerReplacer,
                jsRex, facade, item, commands.join('\n\n'))));

            if (item.content !== newContent) {
                grunt.file.write(item.qPath, newContent);
                grunt.verbose.writeln("Fluens: file " + item.path +
                    " injected within '" + facade.scope.type + "' scope.");
            }
        }
        return newContent;
    };

    this.action = function(facade) {
        var parsedContent = facade.scope.getPhase("parse").content;

        _.forIn(facade.cache.getPhase(facade.scope.type, facade.phase.type),
            function(item) {
                item.content = injectItem(facade, item, parsedContent);
            }
        );
        return null;
    };

    this.validate = function(facade) {
        return Boolean(facade.scope.getPhase("parse"));
    };

    this.phases = {
        inject: {
            commands: this
        }
    };
};
