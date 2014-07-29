fluens.core.FluensCache = function(model, commentParser, excludes) {
    var cacheMap = {}, basicMetadataExp = /^\/\*\*[^~]+\*\//;

    this.cache = function(scope) {
        var cached = (cacheMap[scope.type] = []);

        grunt.file.expand({filter: "isFile", cwd: scope.cwd}, scope.paths)
            .forEach(function(path) {
                var content = null, rawMetadata, metadata;

                if (_.indexOf(scope.excludes || excludes, scope.type) === -1) {
                    content = grunt.file.read(model.stripslashes(scope.cwd + "/"  +path));
                    rawMetadata = content.match(basicMetadataExp);
                    metadata = rawMetadata ? commentParser(rawMetadata[0]) : null;
                }
                cached.push({
                    path: path,
                    qPath: model.stripslashes(scope.cwd + "/" + path),
                    cwd: scope.cwd,
                    content: content,
                    metadata: metadata
                });
            }
        );
        scope.cachedContent = cached;
    };

    this.item = function(key) {
        return cacheMap[key] || null;
    };
};
