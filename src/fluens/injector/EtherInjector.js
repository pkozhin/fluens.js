fluens.injector.EtherInjector = function(model) {

    this.commands = function(context) {
        var re = model.markerExp.replace("T", context.scope.type),
            rex = new RegExp(re),
            item = context.item,
            match = item.content.match(rex);

        if (match) {

        }
    };
};
