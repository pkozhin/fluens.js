fluens.common.Model = function() {
    this.markerExp = "([ \t]*)<fluens:T(.*)>([^~]*)<\/fluens:T>";
    this.markerReplacer = "<fluens:T A>\nC\n<\/fluens:T>";
    this.scriptTpl = '<script src="C"></script>';
    this.styleTpl = '<link href="C" rel="stylesheet">';
    this.stripslashes = function(value) {
        return value.replace(/\/\//g, "/");
    };
};
