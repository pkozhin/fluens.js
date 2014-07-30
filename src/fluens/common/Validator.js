fluens.common.Validator = function() {

    var validatePhase = function(scope, scopeType, phase, phaseType) {
        if (phase.paths && !_.isArray(phase.paths)) {
            throw new Error("Phase parameter 'paths' should be array. Scope '" +
                scopeType + "', phase '"+ phaseType +"'.");
        }
        if (phase.cwd && !_.isString(phase.cwd)) {
            throw new Error("Phase parameter 'cwd' should be a string. Scope '" +
                scopeType + "', phase '"+ phaseType +"'.");
        }

        if (scope.type || scope.context) {
            throw new Error("Scope has reserved properties: " +
                "type, context, which should not be assigned initially.");
        }
        if (scope.parsedContent || phase.cachedContent) {
            throw new Error("Phase has reserved properties: " +
                "parsedContext, cachedContent which should not be assigned initially.");
        }
    };

    this.validateScope = function(scope, type) {
        validatePhase(scope, type, scope.parse, "parse");
        if (!_.isFunction(scope.parse.parser)) {
            throw new Error("Phase parameter 'parser' should be a function. Scope '"+
                type +"', phase 'parse'.");
        }
        validatePhase(scope, type, scope.inject, "inject");
        if (!_.isFunction(scope.inject.injector)) {
            throw new Error("Phase parameter 'injector' should be a function. Scope '" +
                type + "', phase 'inject'.");
        }
    };
};
