fluens.core.FluensScope = function(type, contextType, params) {
    this.type = type;
    this.context = contextType;
    this.paths = params.paths;
    this.cwd = params.cwd;
    this.parse = params.parse;
    this.inject = params.inject;
    this.parsedContent = null;
    this.cachedContent = null;
};
