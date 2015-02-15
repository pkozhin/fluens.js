fluens.core.FluensScope = function(type, contextType, phases) {
    this.type = type;
    this.context = contextType;
    this.phases = phases;
    this.excludes = null;
    this.options = {};

    this.getPhase = function(type) {
        for (var i = 0; i < this.phases.length; ++i) {
            if (this.phases[i].type === type) {
                return this.phases[i];
            }
        }
        return null;
    };
};
