fluens.core.FluensCache = function(model, commentParser, excludes) {
    var self = this, basicMetadataExp = /^\/\*\*[^~]+\*\//,
        cacheMap = {}, scopedPhasesMap = {};

    var prepareScopedPhase = function(scope, phase) {
        if (!scopedPhasesMap[scope.type]) {
            scopedPhasesMap[scope.type] = {};
        }
        if (!scopedPhasesMap[scope.type][phase.type]) {
            scopedPhasesMap[scope.type][phase.type] = {};
        }
        return scopedPhasesMap[scope.type][phase.type];
    };

    var cachePhase = function(scope, phase) {
        grunt.file.expand({filter: phase.filter, cwd: phase.cwd}, phase.paths)
            .forEach(function(path) {
                var content = null, rawMetadata, metadata,
                    qPath = model.stripslashes(phase.cwd + "/" + path),
                    scopedPhase = prepareScopedPhase(scope, phase);

                if (!cacheMap[qPath]) {
                    if (_.indexOf(scope.excludes || excludes, scope.type) === -1) {
                        content = phase.filter === "isFile" ? grunt.file.read(qPath) : null;
                        rawMetadata = content ? content.match(basicMetadataExp) : null;
                        metadata = rawMetadata ? commentParser(rawMetadata[0]) : null;
                    }
                    cacheMap[qPath] = scopedPhase[qPath] =
                        self.cacheItemFactory(path, phase.cwd, qPath, content, metadata);
                } else if (!scopedPhase[qPath]) {
                    scopedPhase[qPath] = cacheMap[qPath];
                }
            }
        );
    };

    this.cacheScope = function(scope) {
        _.each(scope.phases, function(phase){
            cachePhase(scope, phase);
        });
    };

    this.getScope = function(scopeType) {
        return scopedPhasesMap[scopeType] || null;
    };

    this.getPhase = function(scopeType, phaseType) {
        return scopedPhasesMap[scopeType] ? scopedPhasesMap[scopeType][phaseType] : null;
    };

    this.getItem = function(qPath) {
        return cacheMap[qPath] || null;
    };

    this.cacheItemFactory = function(path, cwd, qPath, content, metadata) {
        return new fluens.core.FluensCacheItem(path, cwd, qPath, content, metadata);
    };
};
