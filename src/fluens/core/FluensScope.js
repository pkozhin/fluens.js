fluens.core.FluensScope = function(type, contextType, parsePhase, injectPhase) {
    this.type = type;
    this.context = contextType;
    this.parse = parsePhase;
    this.inject = injectPhase;
    this.excludes = null;

    this.isActive = function() {
        return Boolean(this.parse && this.parse.paths && this.parse.paths.length);
    };
};
