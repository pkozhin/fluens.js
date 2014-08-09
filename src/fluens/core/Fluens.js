fluens.core.Fluens = function(model, cache, scopes, validator) {

    var OPTIONS = "options",
        DEFAULT_SCOPE = "default";

    var description = 'Interpolate templates with your data and inject the result to the desired location.',
        self = this;

    var defaultOptions = {
        phase: {
            parse: {priority: 1},
            inject: {priority: 2}
        }
    };

    var defaultPriority = 5;

    this.initContext = function(context, contextType, options) {
        var result = [], scope;

        options = _.merge(defaultOptions, options);

        _.forIn(context, function(item, scopeType) {
            var phases = [], priority;

            if (scopeType !== OPTIONS && scopeType !== DEFAULT_SCOPE) {
                scope = self.scopeFactory(scopeType, contextType, phases);

                _.forIn(item, function(phase, phaseType) {
                    var processor = scopes.processor(scopeType, phaseType);

                    phase.action = _.isFunction(phase.action) ? phase.action :
                        (processor ? _.bind(processor.action, processor) : null);

                    phase.validate = _.isFunction(phase.validate) ? phase.validate :
                        (processor ? _.bind(processor.validate, processor) : null);

                    if (!phase.cwd) {
                        phase.cwd = options.cwd;
                    }
                    priority = phase.priority || (options[phaseType] ?
                        options[phaseType].priority : defaultPriority);

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
                    phase.content =  phase.action(actionFacade);
                } else {
                    grunt.verbose.writeln("Fluens: phase '"+ phase.type +
                        "' is not valid within '"+ phase.scope.type +"' scope.");
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

        var items = this.initContext(context, type, options);

        this.cacheContext(items);
        this.processContext(items);
    };

    this.addProcessors = function(items) {
        _.each(_.values(items), function(Type) {
            var obj = new Type(model);
            validator.validateProcessor(obj);

            _.forIn(obj.phases, function(phase, phaseType) {
                _.forIn(phase, function(processor, scopeType) {
                    validator.validatePhaseProcessor(processor);
                    scopes.processor(scopeType, phaseType, processor);
                });
            });
        });
    };

    grunt.registerMultiTask('fluens', description, function(){
        self.run(this.target, this.data, this.options() || {});
    });
};
