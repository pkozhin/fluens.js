fluens.core.FluensCache = function(model, commentParser, excludes) {
    var cacheMap = {}, basicMetadataExp = /^\/\*\*[^~]+\*\//;

    var cacheItems = function(scope, phase, phaseType) {
        if (!cacheMap[scope.type]) { cacheMap[scope.type] = {parse:{}, inject:{}}; }
        var cached = (cacheMap[scope.type][phaseType] = []);

        grunt.file.expand({filter: "isFile", cwd: phase.cwd}, phase.paths)
            .forEach(function(path) {
                var content = null, rawMetadata, metadata;

                if (_.indexOf(scope.excludes || excludes, scope.type) === -1) {
                    content = grunt.file.read(model.stripslashes(phase.cwd + "/"  +path));
                    rawMetadata = content.match(basicMetadataExp);
                    metadata = rawMetadata ? commentParser(rawMetadata[0]) : null;
                }
                cached.push({
                    path: path,
                    qPath: model.stripslashes(phase.cwd + "/" + path),
                    cwd: phase.cwd,
                    content: content,
                    metadata: metadata
                });
            }
        );
        phase.cachedContent = cached;
    };

    this.cache = function(scope) {
        cacheItems(scope, scope.parse, "parse");
        cacheItems(scope, scope.inject, "inject");
    };

    this.parsed = function(key) {
        return cacheMap[key].parse || null;
    };

    this.injected = function(key) {
        return cacheMap[key].inject || null;
    };
};
