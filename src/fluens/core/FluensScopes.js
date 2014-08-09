fluens.core.FluensScopes = function() {

    var map = {};

    this.processor = function(scopeType, phaseType, processor) {
        if (!processor) {
            return map[scopeType] && map[scopeType][phaseType] ?
                map[scopeType][phaseType] : null;
        }

        if (!map[scopeType]) {
            map[scopeType] = {};
        }

        if (map[scopeType][phaseType]) {
            throw new Error("Processor for scope '"+scopeType+"' and phase '"+
                phaseType+"' already exists.");
        }

        map[scopeType][phaseType] = processor;
    };
};
