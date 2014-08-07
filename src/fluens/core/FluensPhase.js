fluens.core.FluensPhase = function(type, params, priority) {
    this.type = type;
    this.action = params.action;
    this.cwd = params.cwd;
    this.filter = params.filter || "isFile";
    this.paths = params.paths;
    this.priority = priority;
    this.content = undefined;
};