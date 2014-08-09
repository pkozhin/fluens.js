fluens.processor.FluensInjector = function(model) {

    var replace = function(match, replacer, rex, facade, item) {
        var result = replacer.replace(/T/g, facade.scope.type)
            .replace(" A", match[2].match(/\w+/) ? " " + match[2] : "")
            .replace("C", facade.scope.getPhase("parse").content);

        result = match[1] + result.split("\n").join("\n" + match[1]);
        return item.content.replace(rex, result);
    };

    var injectItem = function(facade, item) {
        var htmlRex = new RegExp(model.htmlMarkerExp.source.replace(/T/g, facade.scope.type)),
            jsRex = new RegExp(model.jsMarkerExp.source.replace(/T/g, facade.scope.type)),
            newContent = item.content,
            htmlMatch = newContent.match(htmlRex),
            jsMatch = newContent.match(jsRex);

        if (htmlMatch) {
            newContent = replace(htmlMatch, model.htmlMarkerReplacer,
                htmlRex, facade, item);
        } else if (jsMatch) {
            newContent = replace(jsMatch, model.jsMarkerReplacer,
                jsRex, facade, item);
        }
        if (htmlMatch || jsMatch) {
            grunt.file.write(item.qPath, newContent);
            grunt.log.writeln("Fluens: file " + item.path +
                " injected. Scope type: "+ facade.scope.type +".");
        }
        return newContent;
    };

    this.action = function(facade) {
        _.forIn(facade.cache.getPhase(facade.scope.type, facade.phase.type),
            function(item) {
                //console.log("Before: ", item.path);
                //console.log(item.content);
                item.content = injectItem(facade, item);
                //console.log("After: ");
                //console.log(item.content);
            }
        );
        return null;
    };

    this.validate = function(facade) {
        return Boolean(facade.scope.getPhase("parse"));
    };

    this.phases = {
        inject: {
            sources: this,
            vendors: this,
            styles: this,
            namespaces: this,
            dependencies: this
        }
    };
};
