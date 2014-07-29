fluens.core.Fluens = function(model, cache, scopes, validator) {

    var description = 'Interpolate templates with your data and inject the result to the desired location.',
        self = this;

    this.initContext = function(items, contextType) {
        var result = [];
        _.forIn(items, function(item, type) {
            if (type !== "options") {
                validator.validateScope(item, type);
                var scope = self.scopeFactory(type, contextType, item);

                if (scope.paths) {
                    result.push(scope);
                    cache.cache(scope);
                }
            }
        });
        return result;
    };

    this.parseContext = function(scopes) {
        _.each(scopes, function(scope){
            var context = self.contextFactory(scope, scopes, cache, null);
            scope.parsedContent = scope.parse(context);
        });
    };

    this.injectContext = function(scopes) {
        _.each(scopes, function(scope) {
            _.forEach(scope.cachedContent, function(item){
                if (item.content) {
                    scope.inject(self.contextFactory(scope, scopes, cache, item));
                }
            });
        });
    };

    this.contextFactory = function(scope, scopes, cache, item) {
        return new fluens.core.FluensContext(scope, scopes, cache, item);
    };

    this.scopeFactory = function(type, contextType, params) {
        return new fluens.core.FluensScope(type, contextType, params);
    };

    this.run = function(type, context, options) {
        if (!context) { throw new Error("Task '"+ type +"' is not configured."); }

        var items = this.initContext(_.merge({}, scopes.snapshot(), context), type);

        this.parseContext(items);
        this.injectContext(items);
    };

    grunt.registerMultiTask('fluens', description, function(){
        self.run(this.target, this.data, this.options());
    });
};
