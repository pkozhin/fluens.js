fluens.core.FluensPhase = function(type, params) {
    this.type = type;
    this.action = params.action;
    this.cwd = params.cwd;
    this.filter = params.filter || "isFile";
    this.paths = params.paths;
    this.content = undefined;
};
fluens.core.FluensPhase.TYPE_PARSE = "parse";
fluens.core.FluensPhase.TYPE_INJECT = "inject";
