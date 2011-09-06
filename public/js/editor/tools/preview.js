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

var editor = (function(module) {
    module.tools = module.tools || {};
    
    module.EventTypes = module.EventTypes || {};
		
	// model specific
	module.EventTypes.PreviewStarted = "Preview.PreviewStarted";
	module.EventTypes.PreviewStopped = "Preview.PreviewStopped";
	
	// view specific
	module.EventTypes.StartPreview = "Preview.StartPreview";
	module.EventTypes.StopPreview = "Preview.StopPreview";
	
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * A PreviewModel handles previewing the world the user is creating.
     */
    module.tools.PreviewModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
			
			this.worldState = null;
	    },
		
		startPreview: function() {
			if (this.worldState !== null) {
				return;
			}
			
			// save current world props (and editor props)
			var hi = hemi.input,
				hr = hemi.core.client.root,
				hw = hemi.world,
				data = module.getProjectOctane();
			
			// make a deep copy, so the preview world created from the data
			// won't affect the editor world
			data = hemi.utils.clone(data);
			
			this.worldState = {
				camera: hw.camera,
				citizens: hw.citizens,
				loader: hw.loader,
				pickGrabber: hw.pickGrabber,
				tranReg: hw.tranReg,
				fog: hw.fog,
				nextId: hw.checkNextId(),
				msgSpecs: hemi.dispatch.msgSpecs,
				pickRoot: hemi.picking.pickRoot,
				pickManager: hemi.picking.pickManager,
				modelRoot: hemi.model.modelRoot,
				shapeRoot: hemi.shape.root,
				children: hr.children,
				rL: hemi.view.renderListeners,
				mdL: hi.mouseDownListeners,
				muL: hi.mouseUpListeners,
				mmL: hi.mouseMoveListeners,
				mwL: hi.mouseWheelListeners,
		        kdL: hi.keyDownListeners,
		        kuL: hi.keyUpListeners,
		        kpL: hi.keyPressListeners,
				tool: module.getActiveTool()
			};
			
			// Hide the currently rendered tree
			var children = hr.children;
			hr.children = [];
			
			for (var ndx = 0; ndx < children.length; ndx++) {
				children[ndx].parent = null;
			}
			
			// set the world to its initial state
			hemi.view.renderListeners = [hemi.view.clientSize];
			hi.mouseDownListeners = [hw];
			hi.mouseUpListeners = [];
			hi.mouseMoveListeners = [];
			hi.mouseWheelListeners = [];
	        hi.keyDownListeners = [];
	        hi.keyUpListeners = [];
	        hi.keyPressListeners = [];
			hw.citizens = new hemi.utils.Hashtable();
			hw.camera = null;
			hw.loader = {finish: function(){}};
			hw.pickGrabber = null;
			hw.tranReg = new hemi.world.TransformRegistry();
			hw.fog = null;
			
			hemi.dispatch.msgSpecs = new hemi.utils.Hashtable();
			hemi.picking.init();
			hemi.model.init();
			hemi.shape.root = hemi.core.mainPack.createObject('Transform');
			hemi.shape.root.name = hemi.shape.SHAPE_ROOT;
			hemi.shape.root.parent = hemi.picking.pickRoot;
			
			hemi.world.subscribe(hemi.msg.progress, module.ui.progressUI, 'msgUpdate');
			
			// now load the preview data
			hemi.octane.createWorld(data);
			hemi.world.ready();
			this.notifyListeners(module.EventTypes.PreviewStarted, null);
		},
		
		stopPreview: function() {
			if (this.worldState === null) {
				return;
			}
			
			var hi = hemi.input,
				hr = hemi.core.client.root,
				hw = hemi.world,
				ws = this.worldState;
			
			// Clean up the preview world
			hw.cleanup();
			hemi.dispatch.cleanup();
			hw.camera.cleanup();
			hemi.hud.hudMgr.clearDisplay();
			hemi.model.modelRoot.parent = null;
			hemi.core.mainPack.removeObject(hemi.model.modelRoot);
			hemi.shape.root.parent = null;
			hemi.core.mainPack.removeObject(hemi.shape.root);
			hemi.picking.pickRoot.parent = null;
			hemi.core.mainPack.removeObject(hemi.picking.pickRoot);
			
			// restore the world back to original state
			hemi.dispatch.msgSpecs = ws.msgSpecs;
			hemi.picking.pickRoot = ws.pickRoot;
			hemi.picking.pickManager = ws.pickManager;
			hemi.model.modelRoot = ws.modelRoot;
			hemi.shape.root = ws.shapeRoot;
			hemi.shape.material.getParam('lightWorldPos').bind(ws.camera.light.position);
			hemi.shape.transMaterial.getParam('lightWorldPos').bind(ws.camera.light.position);
			
			if (ws.fog != null) {
				hw.fog = ws.fog;
				hemi.view.setBGColor(ws.fog.color);
			}
			
			hw.tranReg = ws.tranReg;
			hw.pickGrabber = ws.pickGrabber;
			hw.loader = ws.loader;
			hw.camera = ws.camera;
			hw.citizens = ws.citizens;
			hw.setNextId(ws.nextId);
			hi.mouseDownListeners = ws.mdL;
			hi.mouseUpListeners = ws.muL;
			hi.mouseMoveListeners = ws.mmL;
			hi.mouseWheelListeners = ws.mwL;
	        hi.keyDownListeners = ws.kdL;
	        hi.keyUpListeners = ws.kuL;
	        hi.keyPressListeners = ws.kpL;
			hemi.view.renderListeners = ws.rL;
			
			// Restore the render tree
			hr.children = ws.children;
			
			for (var ndx = 0; ndx < ws.children.length; ndx++) {
				ws.children[ndx].parent = hr;
			}
			
			hw.camera.update();
			hw.camera.updateProjection();
			this.notifyListeners(module.EventTypes.PreviewStopped, null);
			this.worldState = null;
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	 	  Preview Sidebar Widget                          //
////////////////////////////////////////////////////////////////////////////////     
	
	/*
	 * Configuration object for the PreviewSBWidget.
	 */
	module.tools.PreviewSBWidgetDefaults = {
		name: 'previewSBWidget',
		uiFile: 'js/editor/tools/html/previewSideBar.htm',
		manualVisible: false
	};
	
	module.tools.PreviewSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.PreviewSBWidgetDefaults, options);
		    this._super(newOpts);	
		}
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    

    /*
     * Configuration object for the PreviewView.
     */
    module.tools.PreviewViewDefaults = {
		axnBarId: 'previewActionBar'
    };
    
    /**
     * The PreviewView controls the sidebar and actionbar widgets for the 
     * Preview tool.
     * 
     * @param {Object} options configuration options.  Uses 
     *         editor.tools.PreviewViewDefaults as default options
     */
    module.tools.PreviewView = module.tools.ToolView.extend({
		init: function(options) {
	        var newOpts = jQuery.extend({}, module.tools.PreviewViewDefaults, options);
	        this._super(newOpts);
						
			this.addSidebarWidget(new module.tools.PreviewSBWidget());
	    },
		
		layoutActionBar: function() {
			var widget = new editor.ui.ActionBarWidget({
				uiFile: 'js/editor/tools/html/previewAxnBar.htm'
			});
			var view = this;
			
			widget.finishLayout = function() {
				widget.find('form').submit(function() {
		            return false;
		        });
		        
		        widget.find('#pvStop').bind('click', function(evt) {
		            view.notifyListeners(module.EventTypes.StopPreview, null);
		        });
				
				view.actionBar.addWidget(widget);
			};
		}
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The PreviewController facilitates PreviewModel and PreviewView
     * communication by binding event and message handlers.
     */
    module.tools.PreviewController = module.tools.ToolController.extend({
		init: function() {
			this._super();
    	},
		
	    /**
	     * Binds event and message handlers to the view and model this object 
	     * references.  
	     */
	    bindEvents: function() {
			this._super();
			
	        var model = this.model,
	        	view = this.view;
			
			// view specific listeners
			view.addListener(module.EventTypes.StopPreview, function(val) {
				model.stopPreview();
			});
			
			// model specific listeners
			model.addListener(module.EventTypes.PreviewStarted, function(val) {
				module.enableMenuBar(false);
				module.enableToolBar(false);
				view.setMode(module.tools.ToolConstants.MODE_DOWN);
				model.worldState.tool.setMode(editor.tools.ToolConstants.MODE_UP);
			});
			model.addListener(module.EventTypes.PreviewStopped, function(val) {
				module.enableMenuBar(true);
				module.enableToolBar(true);
				view.setMode(module.tools.ToolConstants.MODE_UP);
				model.worldState.tool.setMode(editor.tools.ToolConstants.MODE_DOWN);
			});
	    }
	});
    
    return module;
})(editor || {});