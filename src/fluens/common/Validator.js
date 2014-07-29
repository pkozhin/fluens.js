fluens.common.Validator = function() {

    this.validateScope = function(scope, type) {
        if (scope.paths && !_.isArray(scope.paths)) {
            throw new Error("Scope parameter 'paths' should an array. Scope '" + type + "'.");
        }
        if (scope.cwd && !_.isString(scope.cwd)) {
            throw new Error("Scope parameter 'cwd' should be a string. Scope '" + type + "'.");
        }
        if (!_.isFunction(scope.parse)) {
            throw new Error("Scope parameter 'parse' should be a function. Scope '"+ type +"'");
        }
        if (!_.isFunction(scope.inject)) {
            throw new Error("Scope parameter 'inject' should be a function. Scope '" + type + "'.");
        }
        if (scope.type || scope.context || scope.parsedContent || scope.cachedContent) {
            throw new Error("Scope has reserved properties: " +
                "type, context, parsedContext, cachedContent which should not be assigned initially.");
        }
    };
};
