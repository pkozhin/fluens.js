fluens.core.Composer = function(commentParser) {

    var model = new fluens.common.Model(),
        cache = new fluens.core.FluensCache(model, commentParser, ["vendors"]),
        scopes = new fluens.core.FluensScopes(),
        validator = new fluens.common.Validator(),
        main = new fluens.core.Fluens(model, cache, scopes, validator);

    // TODO: Refactor processors lookup.
    _.each(_.values(fluens.parser).concat(_.values(fluens.injector)), function(Type) {
        var obj = new Type(model);

        if (!obj.phases) {
            throw new Error("Phase processor must have 'phases' property.");
        }
        _.forIn(obj.phases, function(phase, phaseType) {
            _.forIn(phase, function(action, scopeType) {
                if (_.isFunction(action)) {
                    scopes.action(scopeType, phaseType, _.bind(action, obj));
                }
            });
        });
    });

    this.facade = new fluens.core.FluensFacade(main);
};
