fluent.core.FluentContext = function(scope, scopes, cache, item) {
    this.scope = scope;
    this.scopes = scopes;
    this.cache = cache;
    this.item = item;
};

fluent.core.FluentContext.Factory = function(scope, scopes, cache, item) {
    return fluent.core.FluentContext(scope, scopes, cache, item);
};
