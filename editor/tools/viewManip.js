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
	
    module.tools.ToolConstants = module.tools.ToolConstants || {};
    module.tools.ToolConstants.WIRE_HIGHLIGHT = 'wireframeHighlight';
	
	module.EventTypes = module.EventTypes || {};
	
////////////////////////////////////////////////////////////////////////////////
//                              Wireframe Model                               //
////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * The WireframeModel handles the shape picking behavior of the selection
	 * tool.
	 */
	module.tools.WireframeModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
			this.elements = new Hashtable();
			this.initWireframeUI();
			this.enabled = false;
			var that = this;
			
			hemi.msg.subscribe(hemi.msg.load,
				function(msg) {
					if (msg.src instanceof hemi.model.Model) {
						that.addModel(msg.src);
					}
				});
		},
		
	    /**
	     * Initializes the ui behavior for shape picking, which shows the 
	     * wireframe of the picked shape.
	     */
	    initWireframeUI: function() {
	        this.highlightMaterial = hemi.core.material.createConstantMaterial(
	            hemi.core.mainPack, 
	            hemi.view.viewInfo, 
	            [0.4, 0.4, 0.4, 1]);
	        // Setup a state to bring the lines forward.
	        var state = hemi.core.mainPack.createObject('State');
	        state.getStateParam('PolygonOffset2').value = -1.0;
	        state.getStateParam('FillMode').value = hemi.core.o3d.State.WIREFRAME;
	        this.highlightMaterial.state = state;
	        this.highlightMaterial.name = module.tools.ToolConstants.WIRE_HIGHLIGHT;
	    },
		
		addModel: function(model) {
			var root = model.root;
			var that = this;
			this.elements.put(model.name, getElements(root));
		
			function getElements(transform, list) {		
				if (list == null) {
					list = [];
	            }
				var children = transform.shapes;
				
				for (var i = 0, len = children.length; i < len; i++) {
					var child = children[i];
					
					var elements = child.elements;
					
					for (var j = 0, len2 = elements.length; j < len2; j++) {
						var element = elements[j];
						var material = element.material;
						
						list.push({
							element: element,
							material: material
						});
					}
				}
				
	            children = transform.children;
				
				for (var i = 0; i < children.length; i++) {
	                var child = children[i];				
					getElements(child, list);
				}
				
				return list;
			}
		},
		
		enableWireframe: function(enable){
			this.enabled = enable;
			
			if (enable) {
				var keys = this.elements.keys();
				
				for (var i = 0, len = keys.length; i < len; i++) {
					var list = this.elements.get(keys[i]);
					for (var j = 0, len2 = list.length; j < len2; j++) {
						var obj = list[j];
						if (obj.element.material.name != module.tools.ToolConstants.SEL_HIGHLIGHT) {
							obj.element.material = this.highlightMaterial;
						}
					}
				}
			}
			else {
				var keys = this.elements.keys();
				
				for (var i = 0, len = keys.length; i < len; i++) {
					var list = this.elements.get(keys[i]);
					for (var j = 0, len2 = list.length; j < len2; j++) {
						var obj = list[j];
						obj.element.material = obj.material;
					}
				}
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                            Orthographic Model                              //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * The OrthographicModel handles the shape picking behavior of the selection
     * tool.    
     */
    module.tools.OrthographicModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
    	},
		
		setView: function(eye) {
			hemi.world.camera.setOrthographic();
	        hemi.world.camera.setEyeTarget(
	            hemi.core.math.mulScalarVector(scale, eye),  // eye
	            [0, 0, 0]);  // target
			hemi.world.camera.update();
		},
		
		resetView: function() {
			hemi.world.camera.updateProjection();
		}
	});
	
	return module;
})(editor || {});
