/**
 * The 'debug' module is used to assist the developer in debugging the library.
 * It adds the following property to each namespace and class :
 * 
 * 			theObject._NAME = namespaceAndClassName;
 *				
 * This can be left out of a production build. To use this module, include this
 * javascript file and call hext.utils.debug.init();
 * @author Raj Dye
 */
var hext = (function(hext) {
	
	hext.utils = hext.utils || {};
	hext.utils._NAME = 'hext.utils';
	
	/**
	 * @namespace A module to assist the developer in debugging the o3d and kuda
	 * libraries.
	 */
	hext.utils.debug = hext.utils.debug || {};
	hext.utils.debug._NAME = 'hext.utils.debug';
	

	hext.utils.debug.init = function() {
		
		this.namespaces = {};
		
		this.namespaces['hemi.core'] = true;
		this.namespaces['o3d'] = true;
		
		this.classes = {}; 
		this.regExpFileExtension = new RegExp("\.[^.]*$");
		this.regExpSlashes = new RegExp("/", "gm");
		
		//introspect and build a list of namespaces
		var delegate = jQuery.proxy(this.findNamespaces, this);
		jQuery.each(o3djs.included_, delegate);

		//introspect into namespaces and build a list of classes
		delegate = jQuery.proxy(this.findClasses, this);
		jQuery.each(this.namespaces, delegate);

		delegate = jQuery.proxy(this.annotateObject, this);
		jQuery.each(this.namespaces, delegate);
		
		delegate = jQuery.proxy(this.annotateClass, this);
		jQuery.each(this.classes, delegate);
	};
	
	hext.utils.debug.findClasses = function(theNameSpace){
		//we are passed the string representation of the namespace
		//attempt to convert it to the singleton object
		var theSingleton = eval(theNameSpace);
		
		if (theSingleton != null && typeof(theSingleton) == 'object') {
			// theSingleton is indeed an object, now lets look look at 
			// all the properties of the object and pick out the classes
			this.theCurrentNameSpace = theNameSpace;
			var delegate = jQuery.proxy(this.inspectSingletonProperties, this);
			jQuery.each(theSingleton, delegate);
		}
	};
	
	hext.utils.debug.inspectSingletonProperties = function( propName, propReference){
		if(propReference == null) return;
		
		if (propReference.prototype != null) {
			if (!jQuery.isEmptyObject(propReference.prototype)) {
				var fullClassName = this.theCurrentNameSpace + '.' + propName;
				this.classes[fullClassName] = true;   
			}
		}
	};
	
	hext.utils.debug.findNamespaces = function(filePath){
		var fullClassName = filePath.replace(this.regExpFileExtension, "");
		fullClassName = fullClassName.replace(this.regExpSlashes, ".");
		var theNamespace;
		
		try {
			theNamespace = eval (fullClassName);
		}
		catch(err) {
			hemi.console.log('hext.utils.debug.findNamespaces failed to access object: ' + filePath);
			return;
		}
		
		var theType = typeof(theNamespace);
		
		if (theType == 'object') {		
			var namespaceAry = fullClassName.split('.');
			this.traverseNamespaceTree(namespaceAry);
		} else {
			hemi.console.log('hext.utils.debug.findNamespaces: namespace is not an object: ' + filePath);
		}
	};
	
	hext.utils.debug.traverseNamespaceTree = function (namespaceAry) {
		this.namespaces[namespaceAry.join('.')] = true;
		namespaceAry.pop();
		
		if(namespaceAry.length > 0){
			this.traverseNamespaceTree(namespaceAry);
		}
	};
		
		
	hext.utils.debug.annotateObject = function(theNameSpace) {
		var theObject = eval(theNameSpace);
		if (theObject == null) return;
		
		var theType = typeof(theObject);
		
		if (theType == 'object') {
			theObject._NAME = theNameSpace;
		} else {
			hemi.console.log('in hext.utils.debug: error processing namespace: ' + theNameSpace);
		}
	};
	
	hext.utils.debug.annotateClass = function(theNameSpace) {
		var theObject = eval(theNameSpace);
		if (theObject == null) return;
		
		var theType = typeof(theObject);
		
		if (theType == 'function') {
			theObject._NAME = theNameSpace;
		} else {
			hemi.console.log('namespace: ' + theNameSpace);
		}
	};
	
	return hext;
})(hext || {});