fluens.processor.EtherParser = function(model) {

    var data, initRex = /\.initialize = function[ ]?\((.*)\)/,
        nameRex = /.+\/(.+)\./,
        packageRex = /(.+\/.+)\./,
        promiseRex = /\.promise = function\(\)/,
        execRex = /\.execute = function[ ]?\(\)/;

    var commandLocatorItemTpl = "this.get{NAME} = function({PARAMS}) {\n" +
        "\treturn {FACTORY}.get({COMMAND}{PARAMS});" +
        "\n};";

    // TODO: Think about optimization.
    var getLocator = function(phase, item) {
        var result = null, isLocator, id;

        if (item.metadata && _.isArray(item.metadata[0].tags)) {
            _.forEach(item.metadata[0].tags, function (tag) {
                if (!isLocator && tag.tag === "role") {
                    if (!tag.type) {
                        throw new Error("Fluens: Role type is required for '" + item.path + "'.");
                    }
                    isLocator = tag.type === "CommandLocator";
                }
                if (tag.tag === "id") {
                    if (!tag.name) {
                        throw new Error("Fluens: Id is required for '" + item.path + "'.");
                    }
                    id = tag.name;
                }
            });
            if (isLocator) {
                if (!id) {
                    throw new Error("Fluens: CommandLocator mus have an id.");
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
                        throw new Error("Fluens: Role type is required for '" + item.path + "'.");
                    }
                    isCommand =  tag.type === "Command" || tag.type === "QCommand" ? tag.type : false;
                }
                if (tag.tag === "owner") {
                    if (!tag.name) {
                        throw new Error("Fluens: Owner is required for '" + item.path + "'.");
                    }
                    ownerId = tag.name;
                }
            });
            if (isCommand) {
                if (!ownerId) {
                    throw new Error("Fluens: Command mus have an owner.");
                }
                if (isCommand === "QCommand" && !item.content.match(promiseRex)) {
                    throw new Error("Fluens: QCommand must have 'promise' method declared w/o arguments.");
                }
                if (isCommand === "Command" && !item.content.match(execRex)) {
                    throw new Error("Fluens: Command must have 'execute' method declared w/o arguments.");
                }
                paramsMatch = item.content.match(initRex);
                result = {
                    ownerId: ownerId,
                    type: isCommand,
                    item: item,
                    name: item.qPath.match(nameRex)[1],
                    params: paramsMatch ? paramsMatch[1] : ""
                };
            }
        }
        return result;
    };

    var processCommandTpl = function(command) {
        var reference = command.item.path.match(packageRex)[1].replace(/\//g, ".") + (command.params ? ", " : "");

        return commandLocatorItemTpl.replace("{NAME}", command.name).replace(/\{PARAMS\}/g, command.params)
            .replace("{FACTORY}", (command.type === "QCommand" ? "Ether.plugin.commands.q()" : "Ether.plugin.commands.plain()"))
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
        }
    };
};
