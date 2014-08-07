fluens.core.FluensScopes = function() {

    var map = {};

    this.action = function(scopeType, phaseType, action) {
        if (!_.isFunction(action)) {
            return map[scopeType] && map[scopeType][phaseType] ?
                map[scopeType][phaseType] : null;
        }

        if (!map[scopeType]) {
            map[scopeType] = {};
        }

        if (map[scopeType][phaseType]) {
            throw new Error("Action for scope '"+scopeType+"' and phase '"+
                phaseType+"' already exists.");
        }
        map[scopeType][phaseType] = action;
    };
};
