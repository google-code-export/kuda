/* 
 * Kuda includes a library and editor for authoring interactive 3D content for the web.
 * Copyright (C) 2011 SRI International.
 *
 * This program is free software; you can redistribute it and/or modify it under the terms
 * of the GNU General Public License as published by the Free Software Foundation; either 
 * version 2 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program; 
 * if not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, 
 * Boston, MA 02110-1301 USA.
 */

var editor = {
		// Keep a copy of the Hemi Class for inheritnace
		Class: hemi.Class
	};

(function() {
	o3djs.require('editor.requires');
	
	// The container for tool plugins
	editor.tools = {};
	
////////////////////////////////////////////////////////////////////////////////
//                               Dispatch Proxy                               //
////////////////////////////////////////////////////////////////////////////////

	var DispatchProxy = function() {
		// The set of MessageSpecs (and MessageTargets) being created by the
		// messaging tool
		this.worldSpecs = new hemi.utils.Hashtable();
		// The set of MessageSpecs used by the editor
		this.editorSpecs = null;
	};
	
	DispatchProxy.prototype = {
		swap: function() {
			if (this.editorSpecs === null) {
				this.editorSpecs = hemi.dispatch.msgSpecs;
				hemi.dispatch.msgSpecs = this.worldSpecs;
			}
		},
		
		unswap: function() {
			if (this.editorSpecs !== null) {
				hemi.dispatch.msgSpecs = this.editorSpecs;
				this.editorSpecs = null;
			}
		},
		
		getTargetSpec: function(target) {
			this.swap();
			var ret = hemi.dispatch.getTargetSpec(target);
			this.unswap();
			return ret;
		},
		
		getTargets: function(attributes, wildcards) {
			this.swap();
			var ret = hemi.dispatch.getTargets(attributes, wildcards);
			this.unswap();
			return ret;
		},
		
		registerTarget: function(src, msg, handler, opt_func, opt_args) {
			this.swap();
			var ret = hemi.dispatch.registerTarget(src, msg, handler, opt_func, 
				opt_args);
			this.unswap();
			return ret;
		},
		
		removeTarget: function(target, opt_attributes) {
			this.swap();
			var ret = hemi.dispatch.removeTarget(target, opt_attributes);
			this.unswap();
			return ret;
		},
		
		cleanup: function() {
			this.swap();
			hemi.dispatch.cleanup();
			this.unswap();
		},
		
		toOctane: function() {
			this.swap();
			var ret = hemi.dispatch.toOctane();
			this.unswap();
			return ret;
		}
	};
	
	var dispatchProxy = new DispatchProxy();
	
////////////////////////////////////////////////////////////////////////////////
//                                 Main App                                   //
////////////////////////////////////////////////////////////////////////////////
		
		
	var initViewerStep1 = function() {						
			o3djs.webgl.makeClients(function(clientElements) {
				setupWorldMessages();
				editor.ui.initializeView(clientElements);
				editor.projects.init();
				editor.plugins.init();
			});
		},
		
		setupWorldMessages = function() {			
			hemi.world.subscribe(hemi.msg.cleanup, function() {
				editor.notifyListeners(editor.events.WorldCleaned);
			});
			hemi.world.subscribe(hemi.msg.ready, function() {
				editor.notifyListeners(editor.events.WorldLoaded);
				editor.projects.loadingDone();
			});
		},
		
		uninitViewer = function() {
			if (hemi.core.client) {
				hemi.core.client.cleanup();
			}
		};
	
////////////////////////////////////////////////////////////////////////////////
//                             Editor Utilities                               //
////////////////////////////////////////////////////////////////////////////////
	
	editor.getActivePlugins = function() {
		return activePlugins;
	};
	
	editor.getActiveTool = function() {
		var views = editor.getViews();
			
		for (var i = 0, il = views.length; i < il; i++) {
			var view = views[i];
			
			if (view.mode === editor.ToolConstants.MODE_DOWN) {
				return view;
			}
		}
		
		return null;
	};
	
	editor.getCss = function(url, media) {
		jQuery( document.createElement('link') ).attr({
	        href: url,
	        media: media || 'screen',
	        type: 'text/css',
	        rel: 'stylesheet'
	    }).appendTo('head');
	};
	
	editor.getDispatchProxy = function() {
		return dispatchProxy;
	};
			
	editor.getProjectOctane = function() {
		dispatchProxy.swap();
		var data = hemi.world.toOctane(function(citizen) {
			return citizen.name.search(editor.ToolConstants.EDITOR_PREFIX) === -1;
		});
		dispatchProxy.unswap();
		return data;
	};
	
	editor.getScript = function(url, callback) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;
		
		editor.notifyListeners(editor.events.ScriptLoadStart, url);
		
		{
	        var done = false;
	
	        // Attach handlers for all browsers
	        script.onload = script.onreadystatechange = function(){
	            if (!done && (!this.readyState ||
	            		this.readyState == "loaded" || 
						this.readyState == "complete")) {
	                done = true;
					if (callback) {
						callback();
					}
					editor.notifyListeners(editor.events.ScriptLoaded, url);
	
	                // Handle memory leak in IE
	                script.onload = script.onreadystatechange = null;
	            }
	        };
	    }
		
	    document.body.appendChild(script);
	};
	
	window.onload = function() {	
		initViewerStep1();
	};
	
	window.onunload = function() {
		uninitViewer();
	};
})();
