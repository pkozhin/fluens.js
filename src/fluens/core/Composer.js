fluens.core.Composer = function(commentParser) {

    var model = new fluens.common.Model(),
        cache = new fluens.core.FluensCache(model, commentParser, ["vendors"]),
        scopes = new fluens.core.FluensScopes(),
        validator = new fluens.common.Validator(),
        main = new fluens.core.Fluens(model, cache, scopes, validator);

    _.each(_.values(fluens.processor), function(Type) {
        var obj = new Type(model);
        validator.validateProcessor(obj);

        _.forIn(obj.phases, function(phase, phaseType) {
            _.forIn(phase, function(processor, scopeType) {
                validator.validatePhaseProcessor(processor);
                scopes.processor(scopeType, phaseType, processor);
            });
        });
    });

    this.facade = new fluens.core.FluensFacade(main);
};
