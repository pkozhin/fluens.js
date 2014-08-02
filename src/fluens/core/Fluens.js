fluens.core.Fluens = function(model, cache, scopes, validator) {

    var description = 'Interpolate templates with your data and inject the result to the desired location.',
        self = this;

    // TODO: regexp helper to manage with rex substitutions etc.

    this.initContext = function(context, contextType) {
        var result = [], scope;
        _.forIn(context, function(item, type) {
            if (type !== "options") {
                item.parse.action = item.parse.action || scopes.parser(type);
                item.inject.action = item.inject.action || scopes.injector(type);

                scope = self.scopeFactory(type, contextType,
                    self.phaseFactory(fluens.core.FluensPhase.TYPE_PARSE, item.parse),
                    self.phaseFactory(fluens.core.FluensPhase.TYPE_INJECT, item.inject));

                validator.validateScope(item, type);

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

    this.phaseFactory = function(type, action) {
        return new fluens.core.FluensPhase(type, action);
    };

    this.run = function(type, context, options) {
        if (!context) { throw new Error("Task '"+ type +"' is not configured."); }

        var items = this.initContext(context, type);

        this.cacheContext(items);
        this.parseContext(items);
        this.injectContext(items);
    };

    grunt.registerMultiTask('fluens', description, function(){
        self.run(this.target, this.data, this.options());
    });
};
