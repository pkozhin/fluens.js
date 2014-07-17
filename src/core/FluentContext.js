fluent.FluentContext = function(scope, scopes, cache, item) {
    this.scope = scope;
    this.scopes = scopes;
    this.cache = cache;
    this.item = item;
};

fluent.FluentContext.Factory = function(scope, scopes, cache, item) {
    return fluent.FluentContext(scope, scopes, cache, item);
};
