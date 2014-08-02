fluens.common.Validator = function() {

    var validatePhase = function(scope, scopeType, phase) {
        if (phase.paths && !_.isArray(phase.paths)) {
            throw new Error("Phase parameter 'paths' should be array. Scope '" +
                scopeType + "', phase '"+ phase.type +"'.");
        }
        if (phase.cwd && !_.isString(phase.cwd)) {
            throw new Error("Phase parameter 'cwd' should be a string. Scope '" +
                scopeType + "', phase '"+ phase.type +"'.");
        }

        if (scope.type || scope.context) {
            throw new Error("Scope has reserved properties: " +
                "type, context, which should not be assigned initially.");
        }
        if (phase.content || phase.cachedContent) {
            throw new Error("Phase has reserved properties: " +
                "parsedContext, cachedContent which should not be assigned initially.");
        }
    };

    this.validateScope = function(scope, type) {
        validatePhase(scope, type, scope.parse);

        if (!_.isFunction(scope.parse.action)) {
            throw new Error("Phase parameter 'action' should be a function. Scope '"+
                type +"', phase 'parse'.");
        }
        validatePhase(scope, type, scope.inject);

        if (!_.isFunction(scope.inject.action)) {
            throw new Error("Phase parameter 'action' should be a function. Scope '" +
                type + "', phase 'inject'.");
        }
    };
};
