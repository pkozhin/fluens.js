fluens.processor.EtherParser = function(model) {

    var data, initRex = /\.initialize = function[ ]?\((.*)\)/,
        nameRex = /.+\/(.+)\./, stubRules = {}, stubs = {},
        packageRex = /(.+\/.+)\./,
        promiseRex = /\.promise = function\(\)/,
        execRex = /\.execute = function[ ]?\(\)/;

    var commandLocatorItemTpl = "this.get{NAME} = function({PARAMS}) {\n" +
        model.validIndentation + "return {FACTORY}.get({COMMAND}{PARAMS});" +
        "\n};";

    var processPath = function(path) {
        if (stubRules[path]) {
            path = stubRules[path];
        }
        return path;
    };

    var isStub = function(path) {
        return stubs[path];
    };

    var processStubs = function(facade) {
        _.forIn(facade.phase.params.rules, function(value, key) {
            var stub = model.stripslashes(value).replace(/\//g, ".");

            stubRules[model.stripslashes(key).replace(/\//g, ".")] = stub;
            stubs[stub] = true;
        });
        return null;
    };

    // TODO: Think about optimization.
    var getLocator = function(phase, item) {
        var result = null, isLocator, id;

        if (item.metadata && _.isArray(item.metadata[0].tags)) {
            _.forEach(item.metadata[0].tags, function (tag) {
                if (!isLocator && tag.tag === "role") {
                    if (!tag.type) {
                        throw new Error("Fluens: Role type is required for '" + item.qPath + "'.");
                    }
                    isLocator = tag.type === "CommandLocator";
                }
                if (tag.tag === "id") {
                    if (!tag.name) {
                        throw new Error("Fluens: Id is required for '" + item.qPath + "'.");
                    }
                    id = tag.name;
                }
            });
            if (isLocator) {
                if (!id) {
                    throw new Error("Fluens: CommandLocator '"+ item.qPath +"' must have an id.");
                }
                result = {id: id, item: item};
            }
        }
        return result;
    };

    var getCommand = function(phase, item) {
        var result = null, isCommand, ownerId, paramsMatch;

        if (item.metadata && _.isArray(item.metadata[0].tags)) {
            _.forEach(item.metadata[0].tags, function (tag) {
                if (!isCommand && tag.tag === "role") {
                    if (!tag.type) {
                        throw new Error("Fluens: Role type is required for '" + item.qPath + "'.");
                    }
                    isCommand =  tag.type === "Command" || tag.type === "QCommand" ? tag.type : false;
                }
                if (tag.tag === "owner") {
                    if (!tag.name) {
                        throw new Error("Fluens: Owner is required for '" + item.qPath + "'.");
                    }
                    ownerId = tag.name;
                }
            });
            if (isCommand) {
                var path = item.qPath.replace(phase.cwd || "", "").replace(/^\W*/, "").match(packageRex)[1].replace(/\//g, ".");

                if (!isStub(path)) {
                    if (!ownerId) {
                        throw new Error("Fluens: Command '"+ item.qPath +"' must have an owner.");
                    }
                    if (isCommand === "QCommand" && !item.content.match(promiseRex)) {
                        throw new Error("Fluens: QCommand '"+ item.qPath +"' must have 'promise' method declared w/o arguments.");
                    }
                    if (isCommand === "Command" && !item.content.match(execRex)) {
                        throw new Error("Fluens: Command '"+ item.qPath +"' must have 'execute' method declared w/o arguments.");
                    }
                    paramsMatch = item.content.match(initRex);
                    result = {
                        ownerId: ownerId,
                        type: isCommand,
                        item: item,
                        cwd: phase.cwd || "",
                        path: path,
                        name: item.qPath.match(nameRex)[1],
                        params: paramsMatch ? paramsMatch[1] : ""
                    };
                }
            }
        }
        return result;
    };

    var processCommandTpl = function(command) {
        var reference =  processPath(command.path) + (command.params ? ", " : "");

        return commandLocatorItemTpl.replace("{NAME}", command.name).replace(/\{PARAMS\}/g, command.params)
            .replace("{FACTORY}", (command.type === "QCommand" ? "ether.plugin.commands.q()" : "ether.plugin.commands.plain()"))
            .replace("{COMMAND}", reference);
    };

    var parse = function(phase, item) {
        var locator, command;

        if (locator = getLocator(phase, item)) {
            data.locators[item.qPath] = locator;
        } else if (command = getCommand(phase, item)) {
            if (!data.commands[command.ownerId]) {
                data.commands[command.ownerId] = [];
            }
            data.commands[command.ownerId].push(processCommandTpl(command));
        }
    };

    // Return an object for further specific injection logic.
    this.action = function(facade) {
        data = {locators: {}, commands: {}};

        _.each(facade.cache.getPhase(facade.scope.type, facade.phase.type), function(item) {
            parse(facade.phase, item);
        });

        return data;
    };

    this.validate = function(facade) {
        return true;
    };

    this.phases = {
        parse: {
            commands: this
        },
        stub: {
            commands: {
                action: processStubs,
                validate: function() {
                    return true;
                }
            }
        }
    };
};
