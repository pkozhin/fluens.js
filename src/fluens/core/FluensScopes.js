fluens.core.FluensScopes = function() {

    var parsers = {}, injectors = {}, map;

    this.parser = function(key, fn) {
        if (!_.isFunction(fn)) {
            return parsers[key] ? parsers[key] : null;
        }
        if (parsers[key]) {
            throw new Error("Parser '"+key+"' already exists.");
        }
        parsers[key] = fn;
        map = null;
    };

    this.injector = function(key, fn) {
        if (!_.isFunction(fn)) {
            return injectors[key] ? injectors[key] : null;
        }
        if (injectors[key]) {
            throw new Error("Injector '"+key+"' already exists.");
        }
        injectors[key] = fn;
        map = null;
    };
};
