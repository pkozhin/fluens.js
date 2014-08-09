fluens.processor.EtherParser = function(model) {

    this.commands = function(facade) {
        return null;
    };

    this.action = function(facade) {
        return null;
    };

    this.validate = function(facade) {
        return _.isFunction(this[facade.scope.type]);
    };

    this.phases = {
        parse: {
            commands: this
        }
    };
};
