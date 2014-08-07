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

    this.initContext = function(context, contextType) {
        var result = [], scope, options = _.pluck(context, "options") || {};

        options = _.merge(options, defaultOptions);

        _.forIn(context, function(item, scopeType) {
            var phases = [], priority;

            if (type !== "options") {
                _.forIn(item, function(phase, phaseType) {
                    phase.action = phase.action || scopes.action(scopeType, phaseType);
                    priority = options[phaseType] ? options[phaseType].priority : defaultPriority;
                    phases.push(self.phaseFactory(phaseType, phase, priority));
                });

                scope = self.scopeFactory(type, contextType, phases);
                validator.validateScope(scope, scopeType);

                result.push(scope);
            }
        });
        return result;
    };

    this.cacheContext = function(scopes) {
        _.each(scopes, function(scope){
            if (scope.isActive()) {
                cache.cacheScope(scope);
            }
        });
    };

    this.processContext = function(scopes) {
        // TODO: Implement iterating through phases by priority instead of parse and inject!!!!

    };

    this.parseContext = function(scopes) {
        _.each(scopes, function(scope){
            scope.parse.content = scope.parse.action(
                self.contextFactory(scope, scopes, cache, null));
        });
    };

    this.injectContext = function(scopes) {
        _.each(scopes, function(scope) {
            _.forIn(cache.getInject(scope.type), function(cacheItem) {
                if (cacheItem.content) {
                    cacheItem.content = scope.inject.action(
                        self.contextFactory(scope, scopes, cache, cacheItem));
                }
            });
        });
    };

    this.contextFactory = function(scope, scopes, cache, item) {
        return new fluens.core.FluensContext(scope, scopes, cache, item);
    };

    this.scopeFactory = function(type, contextType, parsePhase, injectPhase) {
        return new fluens.core.FluensScope(type, contextType, parsePhase, injectPhase);
    };

    this.phaseFactory = function(type, action, priority) {
        return new fluens.core.FluensPhase(type, action, priority);
    };

    this.run = function(type, context, options) {
        if (!context) { throw new Error("Task '"+ type +"' is not configured."); }

        var items = this.initContext(context, type);

        this.cacheContext(items);
        this.processContext(items);


        /*this.parseContext(items);
        this.injectContext(items);*/
    };

    grunt.registerMultiTask('fluens', description, function(){
        self.run(this.target, this.data, this.options());
    });
};
