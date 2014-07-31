fluens.core.FluensScope = function(type, contextType, params) {
    this.type = type;
    this.context = contextType;
    this.parse = params.parse;
    this.inject = params.inject;

    this.isActive = function() {
        return Boolean(this.parse && this.parse.paths && this.parse.paths.length);
    };
};
