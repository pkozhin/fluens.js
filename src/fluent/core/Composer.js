fluent.core.Composer = function(commentParser) {

    var cache = new fluent.core.FluentCache(commentParser, ["vendors", "styles"]),
        scopes = new fluent.core.FluentScopes(),
        model = new fluent.common.Model(),
        validator = new fluent.common.Validator(),
        main = new fluent.core.Fluent(model, cache, scopes, validator);

    _.each(fluent.parser, function(Type) {
        var obj = new Type(model);
        _.forIn(obj, function(value, key) {
            if (_.isFunction(value)) {
                scopes.parser(key, _.bind(value, obj));
            }
        });
    });

    _.each(fluent.injector, function(Type) {
        var obj = new Type(model);
        _.forIn(obj, function(value, key) {
            if (_.isFunction(value)) {
                scopes.injector(key, _.bind(value, obj));
            }
        });
    });

    this.facade = new fluent.FluentFacade(main);
};
