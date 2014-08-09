fluens.common.Validator = function() {

    var validatePhase = function(scopeType, phase) {
        if (phase.paths && !_.isArray(phase.paths)) {
            throw new Error("Phase.paths should be array. Scope '" +
                scopeType + "', phase '"+ phase.type +"'.");
        }
        if (phase.cwd && !_.isString(phase.cwd)) {
            throw new Error("Phase.cwd should be a string. Scope '" +
                scopeType + "', phase '"+ phase.type +"'.");
        }
        if (!_.isFunction(phase.action)) {
            throw new Error("Phase.action should be a function. Scope '"+
                scopeType +"', phase '"+ phase.type +"'.");
        }
        if (phase.filter !== "isFile" && phase.filter !== "isDirectory") {
            throw new Error("Phase.filter can be only 'isFile' or 'isDirectory'. Scope '"+
                scopeType +"', phase '"+ phase.type +"', filter '"+ phase.filter +"'.");
        }
    };

    this.validateProcessor = function(processor) {
        if (!processor.phases) {
            throw new Error("Processor.phases is not an object.");
        }
    };

    this.validatePhaseProcessor = function(processor) {
        if (!_.isFunction(processor.action)) {
            throw new Error("Processor.action is not a function.");
        }
        if (!_.isFunction(processor.validate)) {
            throw new Error("Processor.validate is not a function.");
        }
    };

    this.validateScope = function(scope, type) {
        if (!_.isArray(scope.phases)) {
            throw new Error("Scope.phases property must be array. Scope: '"+type+"'.");
        }

        _.each(scope.phases, function(phase) {
            validatePhase(scope.type, phase);
        });
    };
};
