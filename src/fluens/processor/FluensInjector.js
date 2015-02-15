fluens.processor.FluensInjector = function(model) {

    var replace = function(match, replacer, rex, facade, item) {
        var result = replacer.replace(/T/g, facade.scope.type)
            .replace(" A", match[2].match(/\w+/) ? " " + match[2] : "")
            .replace("C", facade.scope.getPhase("parse").content);

        result = match[1] + result.split("\n").join("\n" + match[1]);
        return item.content.replace(rex, result);
    };

    var wrapValueAsType = function(value) {
        if (_.isString(value)) {
            value = "\"" + value + "\"";
        }
        return value;
    };

    // TODO: Refactor
    var injectItem = function(facade, item) {
        var htmlRex = new RegExp(model.htmlMarkerExp.source.replace(/T/g, facade.scope.type)),
            jsRex = new RegExp(model.jsMarkerExp.source.replace(/T/g, facade.scope.type)),
            optionRex = new RegExp(model.optionMarkerExp.source, "g"),
            newContent = item.content,
            htmlMatch = newContent.match(htmlRex),
            jsMatch = newContent.match(jsRex),
            optionMatch = newContent.match(optionRex),
            exposedOptions = facade.scope.options.expose;

        if (htmlMatch) {
            newContent = model.normalizelf(replace(htmlMatch,
                model.htmlMarkerReplacer, htmlRex, facade, item));
        } else if (jsMatch) {
            newContent = model.normalizelf(replace(jsMatch,
                model.jsMarkerReplacer, jsRex, facade, item));
        }

        if (optionMatch && exposedOptions) {
            _.each(optionMatch, function(value) {
                var rex = new RegExp(model.optionMarkerExp.source),
                    match = value.match(rex),
                    contentLine;

                if (match && exposedOptions[match[4]]) {
                    contentLine = value.replace(rex, "$1" + wrapValueAsType(exposedOptions[match[4]]) + "$3$4$5");
                    newContent = newContent.replace(value, contentLine);
                }
            });
        }
        if ((htmlMatch || jsMatch || (optionMatch && exposedOptions)) && item.content !== newContent) {
            grunt.file.write(item.qPath, newContent);
            grunt.verbose.writeln("Fluens: file " + item.path +
                " injected within '"+ facade.scope.type +"' scope.");
        }
        return newContent;
    };

    this.action = function(facade) {
        _.forIn(facade.cache.getPhase(facade.scope.type, facade.phase.type),
            function(item) {
                item.content = injectItem(facade, item);
            }
        );
        return null;
    };

    this.validate = function(facade) {
        return Boolean(facade.scope.getPhase("parse"));
    };

    this.phases = {
        inject: {
            // "default" means that it handles phase "inject" for any scope.
            default: this
        }
    };
};
