/**
 * the 'debug' module is used to assist the developer in debugging the library.  It adds 2
 * properties to each namespace and class they are :
 * 
 * 			theObject._NAME = namespaceAndClassName;
 *
 *				
 * this can me left out of a production build 
the way to use this is to include it as the last javascript file loike this:

<script type="text/javascript" src="/hext/tools/debug.js"></script>

jQuery(document).ready(onDocumentReady);	


function onDocumentReady(event) {
	hext.utils.debug.init();	
}

@author Raj Dye
		

the following can be included for testing

o3djs.require('o3djs.util');
//o3djs.require('hext.engines.pressue');
o3djs.require('hext.house.structure');
o3djs.require('hext.html.console');
o3djs.require('hext.html.hint');
o3djs.require('hext.html.reset');
o3djs.require('hext.html.toolbar');
o3djs.require('hext.html.toolViews');
o3djs.require('hext.hud.paging');
o3djs.require('hext.progressUI.progressBar');
//o3djs.require('hext.sharedModel.modelManager');
o3djs.require('hext.tools.baseController');
o3djs.require('hext.tools.baseTool');
o3djs.require('hext.tools.blowerDoor');
o3djs.require('hext.tools.blowerDoorController');
o3djs.require('hext.tools.blowerDoorView');
o3djs.require('hext.tools.htmlView');
o3djs.require('hext.tools.manometer');
o3djs.require('hext.tools.manometerController');
o3djs.require('hext.tools.manometerTube');
o3djs.require('hext.tools.manometerView');
o3djs.require('hext.tools.navigation');
o3djs.require('hext.tools.navigationController');
o3djs.require('hext.tools.navigationView');
o3djs.require('hext.tools.shapeView');
o3djs.require('hext.tools.smokepuffer');
o3djs.require('hext.tools.smokePufferController');
o3djs.require('hext.tools.smokePufferView');
o3djs.require('hext.tools.toolbarView');

 */





var hext = (function(hext) {

	/**
	 * @namespace A module assist the developer in debugging the o3d and kuda libraries
	 */
	hext.utils = hext.utils || {};
	hext.utils._NAME = 'hext.utils';
	
	hext.utils.debug = hext.utils.debug || {};
	hext.utils.debug._NAME = 'hext.utils.debug';
	

	hext.utils.debug.init = function() {
		
		this.namespaces = {};
		
		this.namespaces['hemi.core'] = true;
		this.namespaces['o3d'] = true;
		
		this.classes = {}; 
		this.regExpFileExtension = new RegExp("\.[^.]*$");
		this.regExpSlashes = new RegExp("/", "gm");
		
		//introspect an build a list of namespaces
		var delegate = jQuery.proxy( this.findNamespaces, this );
		jQuery.each(o3djs.included_, delegate);

		//introspect into namespaces and build a list of classes
		delegate = jQuery.proxy( this.findClasses, this );
		jQuery.each(this.namespaces, delegate);

		delegate = jQuery.proxy( this.annotateObject, this );
		jQuery.each(this.namespaces, delegate);
		
		//this.currentDebugType = 'class';
		delegate = jQuery.proxy( this.annotateClass, this );
		jQuery.each(this.classes, delegate);
			
			
		//debugger;
	};
	
	
	
	//hext.utils.debug.loadManually = function(propName, propReference){
		
	//	o3djs.require(propName);

	//}
	
	hext.utils.debug.findClasses = function(theNameSpace){
	
		//we are passed the string representation of the namespace
		//attempt to convert it to the singleton object
		
		var theSingleton = eval(theNameSpace);
		if (theSingleton != null && typeof(theSingleton) == 'object') {
			// theSingleton is indeed an object, now lets look look at 
			// all the properties of the object and pick out the classes
			this.theCurrentNameSpace = theNameSpace;
			var delegate = jQuery.proxy( this.inspectSingletonProperties, this );
			jQuery.each(theSingleton, delegate);
		}
	};
	
	hext.utils.debug.inspectSingletonProperties = function( propName, propReference){
	
		//$(propReference).assert();
			if(propReference == null) return;
			
			if (propReference.prototype != null) {

				if (jQuery.isEmptyObject(propReference.prototype ) ) {
					//debug.log('prop: ' + propName + ': skip prototype empty');
				} else {
					//debug.log('prop: ' + propName + ': class ');
					var fullClassName = this.theCurrentNameSpace + '.' + propName;
					 
					this.classes[fullClassName] = true;   
				}
			} else{
				//debug.log('prop: ' + propName + ': skip no prototype');
			}
	
	};
	
	

	hext.utils.debug.findNamespaces = function(filePath){
		
		var fullClassName = filePath.replace(this.regExpFileExtension, "");
		fullClassName = fullClassName.replace(this.regExpSlashes, ".");
		
		var theNamespace;
		try
		  {
				theNamespace = eval (fullClassName);
		  }
		catch(err)
		  {
		  		console.log('hext.utils.debug.findNamespaces failed to access object: ' + filePath);
				return;
		  }
  

		
		//var code = 'var theType = typeof ({0});'.format(fullClassName);
		var theType = typeof(theNamespace);
		
		if (theType == 'object') {		
			//console.debug('fullClassName ' + fullClassName);
			
			var namespaceAry = fullClassName.split('.');
			this.traverseNamespaceTree(namespaceAry);
		} else {
			console.log('hext.utils.debug.findNamespaces: namespace is not an object: ' + filePath);
		}

	};
		
		hext.utils.debug.traverseNamespaceTree  = function (namespaceAry) {
			
			this.namespaces[namespaceAry.join('.')] = true;
			
			namespaceAry.pop();
			if(namespaceAry.length > 0){
				this.traverseNamespaceTree(namespaceAry);
			}
			
		};
		
		
		hext.utils.debug.annotateObject  = function(theNameSpace) {
			
			var theObject = eval(theNameSpace);
			
			if (theObject == null) return;
			
			var theType = typeof(theObject);
			
			if (theType == 'object') {
				theObject._NAME = theNameSpace;
			//	theObject.DEBUG_TYPE = 'namespace';
			} else {
				debug.error('in hext.utils.debug: error processing namespace: ' + theNameSpace);
			}
		};
		
		
		hext.utils.debug.annotateClass = function(theNameSpace) {
			
			var theObject = eval(theNameSpace);
			if (theObject == null) return;
			
			var theType = typeof(theObject);
			
			if (theType == 'function') {
				theObject._NAME = theNameSpace;
				//theObject.DEBUG_TYPE = 'class';
			} else {
				debug.error('namespace: ' + theNameSpace);
			}
		};
		   

	
	
	return hext;
})(hext || {});



	
	
	
	
	