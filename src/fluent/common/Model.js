fluent.common.Model = function() {
    this.markerExp = "<fluent:T(.*)>(.*)<\/fluent:T>";
    this.markerReplacer = "<fluent:T A>\nC\n<\/fluent:T>";
    this.scriptTpl = '<script src="C"></script>';
    this.styleTpl = '<link href="C" rel="stylesheet">';
};
