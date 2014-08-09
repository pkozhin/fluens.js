fluens.common.Model = function() {
    this.htmlMarkerExp = /([ \t]*).*<!--<fluens:T(.*)>-->([^~]*).*<!--<\/fluens:T>-->/;
    this.htmlMarkerReplacer = "<!--<fluens:T A>-->\nC\n<!--<\/fluens:T>-->";
    this.jsMarkerExp = /([ \t]*).*\/\*<fluens:T(.*)>\*\/([^~]*).*\/\*<\/fluens:T>\*\//;
    this.jsMarkerReplacer = "/*<fluens:T A>*/\nC\n/*<\/fluens:T>*/";
    this.scriptTpl = '<script src="C"></script>';
    this.styleTpl = '<link href="C" rel="stylesheet">';
    this.stripslashes = function(value) {
        return value.replace(/\/\//g, "/");
    };
};
