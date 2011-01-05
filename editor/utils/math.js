var editor = (function(module, jQuery) {
	module.utils = module.utils || {};
	
	module.utils.roundNumber = function(num, dec) {
	    var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
	    return result;
	};
	
	return module;
})(editor || {}, jQuery);
