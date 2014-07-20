fluent.core.Fluent = function(cacheFactory, parserFactory, injectorFactory, contextFactory) {

    var description = 'Interpolate templates with your data and inject the result to the desired location.',
        cache = cacheFactory(commentParser, ["vendors", "styles"]),
        parser = parserFactory(),
        injector = injectorFactory(),
        self = this;

    // TODO: Refactor parsers assignment.
    var defaultScopes = {
        scripts: {
            parser: parser.scripts,
            injector: injector.common
        },
        sources: {
            parser: parser.sources,
            injector: injector.common
        },
        vendors: {
            parser: parser.vendors,
            injector: injector.common
        },
        styles: {
            parser: parser.styles,
            injector: injector.common
        },
        namespaces: {
            parser: parser.namespaces,
            injector: injector.common
        },
        dependencies: {
            parser: parser.dependencies,
            injector: injector.common
        },
        commands: {
            parser: parser.commands,
            injector: injector.commands
        }
    };

    this.cacheContext = function(scopes, contextType) {

        _.forIn(scopes, function(scope, type) {
            if (scope.paths) {
                if (!_.isArray(scope.paths)) {
                    throw new Error("Scope parameter 'paths' should an array. Scope '"+ type +"'");
                }
                if (scope.cwd && !_.isString(scope.cwd)) {
                    throw new Error("Scope parameter 'cwd' should be a string. Scope '"+ type +"'");
                }
                scope.type = type;
                scope.context = contextType;
                cache.cache(scope);
            }
        });
    };

    this.parseContext = function(scopes) {
        _.forIn(scopes, function(scope, type){
            if (!_.isFunction(scope.parser)) {
                throw new Error("Scope parameter 'parse' should be a function. Scope '"+ type +"'");
            }
            scope.parsed = scope.parser(contextFactory(scope, scopes, cache, null));
        });
    };

    this.injectContext = function(scopes) {
        _.forIn(scopes, function(scope, type) {
            _.forEach(cache.item(type), function(item){
                if (item.content && _.isFunction(scope.injector)) {
                    scope.injector(contextFactory(scope, scopes, cache, item));
                }
            });
        });
    };

    this.run = function(type, context) {
        if (!context) {
            throw new Error("Task '"+ type +"' is not configured.");
        }
        var scopes = _.merge({}, defaultScopes, context);

        this.cacheContext(scopes, type);
        this.parseContext(scopes, type);
        this.injectContext(scopes, type);
    };

    grunt.registerMultiTask('fluent', description, function() {
        self.run(this.target, this.data);
    });
};
