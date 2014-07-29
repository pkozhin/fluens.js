fluens.core.Composer = function(commentParser) {

    var model = new fluens.common.Model(),
        cache = new fluens.core.FluensCache(model, commentParser, ["vendors", "styles"]),
        scopes = new fluens.core.FluensScopes(),
        validator = new fluens.common.Validator(),
        main = new fluens.core.Fluens(model, cache, scopes, validator);

    _.each(fluens.parser, function(Type) {
        var obj = new Type(model);
        _.forIn(obj, function(value, key) {
            if (_.isFunction(value)) {
                scopes.parser(key, _.bind(value, obj));
            }
        });
    });

    _.each(fluens.injector, function(Type) {
        var obj = new Type(model);
        _.forIn(obj, function(value, key) {
            if (_.isFunction(value)) {
                scopes.injector(key, _.bind(value, obj));
            }
        });
    });

    this.facade = new fluens.core.FluensFacade(main);
};
