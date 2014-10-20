fluens.common.Model = function() {
    this.htmlMarkerExp = /([ \t]*).*<!--<fluens:T(.*)>-->([^~]*).*<!--<\/fluens:T>-->/;
    this.htmlMarkerReplacer = "<!--<fluens:T A>-->\nC\n<!--<\/fluens:T>-->";
    this.jsMarkerExp = /([ \t]*).*\/\*<fluens:T(.*)>\*\/([^~]*).*\/\*<\/fluens:T>\*\//;
    this.jsMarkerReplacer = "/*<fluens:T A>*/\nC\n/*<\/fluens:T>*/";
    this.scriptTpl = '<script src="C"></script>';
    this.styleTpl = '<link href="C" rel="stylesheet">';
    this.linefeed = grunt.util.linefeed;
    this.validIndentation = '    ';

    this.normalizelf = function(value) {
        return grunt.util.normalizelf(value);
    };

    this.stripslashes = function(value) {
        return value.replace(/\/\//g, "/");
    };

    this.trimtrailings = function(content) {
        var trimming = [];

        content.split('\n').forEach(function(line) {
            trimming.push(line.replace(/\s+$/, ''));
        });

        return trimming.join('\n');
    };
};
