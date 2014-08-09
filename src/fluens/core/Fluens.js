fluens.core.Fluens = function(model, cache, scopes, validator) {

    var description = 'Interpolate templates with your data and inject the result to the desired location.',
        self = this;

    var defaultOptions = {
        phase: {
            parse: {priority: 1},
            inject: {priority: 2}
        }
    };

    var defaultPriority = 5;

    // TODO: regexp helper to manage with rex substitutions etc.
    // TODO: Implement support of options.cwd and priority for phases.
    // TODO: Can pass only phase as a part of actionFacade as phase contains reference to a scope.

    this.initContext = function(context, contextType) {
        var result = [], scope, options = _.pluck(context, "options") || {};

        options = _.merge(options, defaultOptions);
        _.forIn(context, function(item, scopeType) {
            var phases = [], priority;

            if (scopeType !== "options") {
                scope = self.scopeFactory(scopeType, contextType, phases);

                _.forIn(item, function(phase, phaseType) {
                    var processor = scopes.processor(scopeType, phaseType);

                    phase.action = phase.action || (processor ? _.bind(processor.action, processor) : null);
                    phase.validate = phase.validate || (processor ? _.bind(processor.validate, processor) : null);
                    priority = options[phaseType] ? options[phaseType].priority : defaultPriority;
                    phases.push(self.phaseFactory(phaseType, phase, scope, priority));
                });

                validator.validateScope(scope, scopeType);
                result.push(scope);
            }
        });
        return result;
    };

    this.cacheContext = function(scopes) {
        _.each(scopes, function(scope){
            cache.cacheScope(scope);
        });
    };

    this.processContext = function(scopes) {
        var phases = [];
        _.each(scopes, function(scope) {
            phases = phases.concat(scope.phases);
        });
        phases = _.sortBy(phases, function(phase){
            return phase.priority;
        });
        _.each(phases, function(phase) {
            if (phase.isActive()) {
                var actionFacade = self.actionFacadeFactory(phase.scope, phase, scopes, cache);

                if (phase.validate(actionFacade)) {
                    console.log("Phase validated. ", phase.type);
                    phase.content =  phase.action(actionFacade);
                    if (phase.type === "parse") {
                        console.log("@ ", phase.content);
                    }
                }
            }
        });
    };

    this.actionFacadeFactory = function(scope, phase, scopes, cache) {
        return new fluens.core.FluensActionFacade(scope, phase, scopes, cache);
    };

    this.scopeFactory = function(type, contextType, phases) {
        return new fluens.core.FluensScope(type, contextType, phases);
    };

    this.phaseFactory = function(type, params, scope, priority) {
        return new fluens.core.FluensPhase(type, params, scope, priority);
    };

    this.run = function(type, context, options) {
        if (!context) { throw new Error("Task '"+ type +"' is not configured."); }

        var items = this.initContext(context, type);

        this.cacheContext(items);
        this.processContext(items);
    };

    grunt.registerMultiTask('fluens', description, function(){
        self.run(this.target, this.data, this.options());
    });
};
