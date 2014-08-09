fluens.core.FluensPhase = function(type, params, scope, priority) {
    this.type = type;
    this.scope = scope;
    this.action = params.action;
    this.validate = params.validate;
    this.cwd = params.cwd;
    this.filter = params.filter || "isFile";
    this.paths = params.paths;
    this.priority = priority;
    this.content = undefined;

    this.isActive = function() {
        return this.paths.length;
    };
};