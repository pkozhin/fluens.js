fluens.processor.EtherInjector = function(model) {

    this.commands = function(context) {
       /* var re = model.markerExp.replace("T", context.scope.type),
            rex = new RegExp(re),
            item = context.item,
            match = item.content.match(rex);

        if (match) {

        }*/
    };

    this.action = function(facade) {
        return null;
    };

    this.validate = function(facade) {
        return _.isFunction(this[facade.scope.type]) &&
            Boolean(facade.scope.getPhase("parse"));
    };

    this.phases = {
        inject: {
            commands: this
        }
    };
};
