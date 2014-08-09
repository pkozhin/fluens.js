fluens.core.FluensScopes = function() {

    var DEFAULT_SCOPE = "default";

    var map = {};

    this.processor = function(scopeType, phaseType, processor) {
        if (!processor) {
            return map[scopeType] && map[scopeType][phaseType] ?
                map[scopeType][phaseType] : (map[DEFAULT_SCOPE][phaseType] ?
                map[DEFAULT_SCOPE][phaseType] : null);
        }

        if (!map[scopeType]) {
            map[scopeType] = {};
        }

        if (map[scopeType][phaseType]) {
            grunt.verbose.writeln("Fluens: Overriding processor for scope '"+
                scopeType+"' and phase '"+ phaseType +"'.");
        }

        map[scopeType][phaseType] = processor;
        return undefined;
    };
};
