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

var editor = (function(editor) {	
	editor.tools = editor.tools || {};
	
    editor.ui.ToolConstants = editor.ui.ToolConstants || {};
	editor.ui.ToolConstants.EDITOR_PREFIX = 'EditorCitizen:';
    editor.ui.ToolConstants.SEL_HIGHLIGHT = 'selectorHighlight';
    editor.ui.ToolConstants.X_AXIS = 'x';
    editor.ui.ToolConstants.Y_AXIS = 'y';
    editor.ui.ToolConstants.Z_AXIS = 'z';
    editor.ui.ToolConstants.XY_PLANE = 'xyPlane';
    editor.ui.ToolConstants.XZ_PLANE = 'xzPlane';
    editor.ui.ToolConstants.YZ_PLANE = 'yzPlane';
	
	editor.EventTypes = editor.EventTypes || {};
	
	// modelbrowser model events
	editor.EventTypes.AddModel = "modelbrowser.AddModel";
    editor.EventTypes.RemoveModel = "modelbrowser.RemoveModel";
	editor.EventTypes.AddUserCreatedShape = "modelbrowser.AddUserCreatedShape";
	editor.EventTypes.RemoveUserCreatedShape = "modelbrowser.RemoveUserCreatedShape";
	editor.EventTypes.UpdateUserCreatedShape = "modelbrowser.UpdateUserCreatedShape";
	editor.EventTypes.WorldLoaded = "modelbrowser.WorldLoaded";
	
	// view events
    editor.EventTypes.ShowPicked = "modelbrowser.ShowPicked";
    editor.EventTypes.ManipState = "modelbrowser.ManipState";
    editor.EventTypes.SetTransOpacity = "modelbrowser.SetTransOpacity";
	
	// selector model events
	editor.EventTypes.PickableSet = "selector.PickableSet";
	editor.EventTypes.ShapeSelected = "selector.ShapeSelected";
	editor.EventTypes.TransformDeselected = "selector.TransformDeselected";
	editor.EventTypes.TransformHidden = "selector.TransformHidden";
	editor.EventTypes.TransformSelected = "selector.TransformSelected";
	editor.EventTypes.TransformShown = "selector.TransformShown";
	
	// hidden items sidebar widget events
	editor.EventTypes.SetPickable = "hiddenItems.SetPickable";
    editor.EventTypes.ShowHiddenItem = "hiddenItems.ShowHiddenItem";
	
	// model tree sidebar widget events
	editor.EventTypes.DeselectTreeItem = "modelbrowser.DeselectTreeItem";
	editor.EventTypes.SelectTreeItem = "modelbrowser.SelectTreeItem";
	editor.EventTypes.SetShape = "modelbrowser.SetShape";
	editor.EventTypes.SetTexture = "modelbrowser.SetTexture";
	
	// info display events
    editor.EventTypes.TextureReady = "infoDisplay.TextureReady";
	
	// TODO: We need a better way of testing for our highlight shapes than
	// searching for this prefix.
	HIGHLIGHT_PRE = 'kuda_highlight_';
	
	
////////////////////////////////////////////////////////////////////////////////
//                          	Helper Methods                                //
////////////////////////////////////////////////////////////////////////////////
		
	getNodeType = function(node) {
		var isCitizen = jQuery.isFunction(node.getCitizenType);
		
		if (isCitizen) {
			return 'citizen';
		}
		return node.className.split('.').pop().toLowerCase();
	};
	
	getNodeId = function(node) {
		// assumes nodes are always tranforms
		var isCitizen = jQuery.isFunction(node.getCitizenType);
		
		if (isCitizen) {
			return node.getId();
		}
		
		return node.clientId;
	};
	
////////////////////////////////////////////////////////////////////////////////
//                          ModelBrowser Model                                //
////////////////////////////////////////////////////////////////////////////////
	
	editor.tools.ModelBrowserModel = editor.ui.ToolModel.extend({
		init: function() {
			this._super();
			this.models = [];
			this.shapes = [];
			var that = this;
			
			hemi.msg.subscribe(hemi.msg.load,
				function(msg) {
					if (msg.src instanceof hemi.model.Model) {
						that.addModel(msg.src);
					}
				});
			hemi.msg.subscribe(hemi.msg.unload,
				function(msg) {
					if (msg.src instanceof hemi.model.Model) {
						that.removeModel(msg.src);
					}
				});
		},
			
		worldCleaned: function() {			
			for (var ndx = 0, len = this.models.length; ndx < len; ndx++) {
				this.notifyListeners(editor.EventTypes.RemoveModel, this.models[ndx]);
			}
			
			for (var ndx = 0, len = this.shapes.length; ndx < len; ndx++) {
				var s = hemi.world.getCitizenById(this.shapes[ndx]);
				this.notifyListeners(editor.EventTypes.RemoveUserCreatedShape, s);
			}
			
			this.models = [];
			this.shapes = [];
		},
			
		worldLoaded: function() {
			this.notifyListeners(editor.EventTypes.WorldLoaded, null);
		},
		
		addModel: function(model) {
			var json = this.createJsonObj(model);
			this.models.push(model);
			this.notifyListeners(editor.EventTypes.AddModel, json);
		},
		
		addShape: function(shape) {
			var json = this.createJsonObj(shape);
			this.shapes.push(shape.getId());
			this.notifyListeners(editor.EventTypes.AddUserCreatedShape, json);
		},
		
		removeModel: function(model) {
			var ndx = jQuery.inArray(model, this.models);			
			this.models.splice(ndx, 1);
			
			this.notifyListeners(editor.EventTypes.RemoveModel, model);
		},
		
		removeShape: function(shape) {
			var ndx = jQuery.inArray(shape.getId(), this.shapes);			
			this.shapes.splice(ndx, 1);
			
			this.notifyListeners(editor.EventTypes.RemoveUserCreatedShape, shape);
		},
		
		updateShape: function(shape) {
			var json = this.createJsonObj(shape);
			var ndx = jQuery.inArray(shape.getId(), this.shapes);
			this.shapes[ndx] = shape;
			
			this.notifyListeners(editor.EventTypes.UpdateUserCreatedShape, {
				shapeData: json,
				shape: shape
			});
		},
		
		createJsonObj: function(node, parentNode) {
			var c = this.getNodeChildren(node),
				nodeType = getNodeType(node),
				children = [];
			
			if (parentNode == null) {
				parentNode = node;
			}
			
			for (var i = 0; c && i < c.length; i++) {
				var nodeJson = this.createJsonObj(c[i], parentNode);
				children.push(nodeJson);
			}
			
			var tNode = {
				data: node.name,
				attr: {
					id: 'node_' + getNodeId(node),
					rel: nodeType
				},
				state: children.length > 0 ? 'closed' : 'leaf',
				children: children,
				metadata: {
					type: nodeType,
					actualNode: node,
					parent: parentNode
				}
			};
			
			return tNode;
		},
		
		getNodeChildren: function(node) {
			var children;
			
			if (jQuery.isFunction(node.getCitizenType)) {
				var type = node.getCitizenType().split('.').pop();
				
				switch(type) {
					case 'Model':
						var tranObj = {
								name: 'Transforms',
								children: [node.root],
								className: 'directory'
							},
							matObj = {
								name: 'Materials',
								children: node.materials,
								className: 'directory'
							};
					    children = [tranObj, matObj];
						break;
					case 'Shape':
					    children = [node.getTransform()];
						break;
					default:
						children = null;
						break;
				}
			} else {
				children = node.children;
			}
			
			return children;
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                              Selector Model                                //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * The SelectorModel handles the shape picking behavior of the selection
     * tool.    
     */
    editor.tools.SelectorModel = editor.ui.ToolModel.extend({
		init: function() {
        	this._super();
	        
			this.selected = new Hashtable();
	        this.highlightedShapes = new Hashtable();
			this.rotationAmount = 0.785398163; // 45 degrees
			this.currentShape = null;
			this.currentHighlightShape = null;
			this.currentTransform = null;
			this.msgHandler = null;
			this.shapHighlightMat = null;
	        this.tranHighlightMat = null;
			this.curHandle = new editor.ui.TransHandles();
	        
	        this.initSelectorUI();
			var that = this;
			
			hemi.msg.subscribe(hemi.msg.load,
				function(msg) {
					if (msg.src instanceof hemi.model.Model) {
						that.processModel(msg.src);
					}
				});
			hemi.msg.subscribe(hemi.msg.unload,
				function(msg) {
					if (msg.src instanceof hemi.model.Model) {
						that.removeModel(msg.src);
					}
				});
	    },
		
		deselectAll: function() {
			var ids = this.selected.keys();
			
			for (var i = 0, il = ids.length; i < il; i++) {
				var id = ids[i],
					owner = hemi.world.getCitizenById(id),
					transforms = this.selected.get(id);
				
				while (transforms.length > 0) {
					this.deselectTransform(transforms[0], owner);
				}
			}
		},
		
		deselectShape: function() {
			if (this.currentHighlightShape !== null) {
				var elements = this.currentHighlightShape.elements;
				
				for (var ee = 0; ee < elements.length; ee++) {
					elements[ee].material = this.tranHighlightMat;
				}
				
				this.currentShape = this.currentHighlightShape = null;
				this.notifyListeners(editor.EventTypes.ShapeSelected, null);
			}
		},
		
		deselectTransform: function(transform, opt_owner) {
			if (opt_owner == null) {
				opt_owner = hemi.world.getTranOwner(transform);
			}
			
			var ownerId = opt_owner.getId(),
				transforms = this.selected.get(ownerId),
				children = transform.children;
			
			for (var ndx = 0, len = children.length; ndx < len; ndx++) {
				this.deselectTransform(children[ndx], opt_owner);
			}
			
			if (transforms !== null) {
				var ndx = transforms.indexOf(transform);
				
				if (ndx !== -1) {
					transforms.splice(ndx, 1);
					this.currentShape = null;
					this.curHandle.setTransform(null);
					this.notifyListeners(editor.EventTypes.ShapeSelected, null);
					this.unhighlightTransform(transform);
					this.notifyListeners(editor.EventTypes.TransformDeselected, transform);
				}
			}
			
			if (this.currentTransform === transform) {
				this.currentTransform = null;
			}
		},
		
		enableSelection: function(enable) {
			if (this.msgHandler !== null) {
				hemi.world.unsubscribe(this.msgHandler, hemi.msg.pick);
				this.msgHandler = null;
			}
			
			if (enable) {
				this.msgHandler = hemi.world.subscribe(
					hemi.msg.pick, 
					this, 
					"onPick", 
					[
						hemi.dispatch.MSG_ARG + "data.pickInfo", 
						hemi.dispatch.MSG_ARG + "data.mouseEvent"
					]);
					
				this.highlightSelected();
			}
			else {
				this.unhighlightAll();
			}
		},
		
		getSelectedTransforms: function() {
			var transforms = [],
				values = this.selected.values();
			
			for (var i = 0, il = values.length; i < il; i++) {
				transforms = transforms.concat(values[i]);
			}
			
			return transforms;
		},
	    
	    hideSelected: function() {
			var that = this;
			
			this.selected.each(function(key, value) {
				var owner = hemi.world.getCitizenById(key);
				
				for (var ndx = 0, len = value.length; ndx < len; ndx++) {
					that.hideTransform(value[ndx], owner);
				}
			});
	    },
	    
	    hideTransform: function(transform, opt_owner) {
			if (opt_owner == null) {
				opt_owner = hemi.world.getTranOwner(transform);
			}
			
			opt_owner.setVisible({
				transforms: [transform],
				vis: false
			});
			opt_owner.setPickable({
				transforms: [transform],
				pick: false
			});
            this.notifyListeners(editor.EventTypes.TransformHidden, {
				transform: transform,
				owner: opt_owner
			});
	    },
		
		highlightSelected: function() {
			var owners = this.selected.values();
			
			for (var i = 0, il = owners.length; i < il; i++) {
				var transforms = owners[i];
				
				for (var j = 0, jl = transforms.length; j < jl; j++) {
					this.highlightTransform(transforms[j]);
				}
			}
		},
	    
	    highlightShape: function(shape, transform) {
	        var highlightShape = hemi.core.shape.duplicateShape(hemi.core.mainPack, shape);
			highlightShape.name = HIGHLIGHT_PRE + shape.name;
	        
	        // Set all of it's elements to use the highlight material.
	        var elements = highlightShape.elements;
	        
	        for (var ee = 0; ee < elements.length; ee++) {
	            elements[ee].material = this.tranHighlightMat;
	        }
	        
	        // Add it to the same transform
	        transform.addShape(highlightShape);
	        this.highlightedShapes.put(shape.clientId, highlightShape);
	    },
	    
	    highlightTransform: function(transform) {
			var children = transform.children,
				shapes = transform.shapes;
			
			for (var ndx = 0, len = children.length; ndx < len; ndx++) {
				this.highlightTransform(children[ndx]);
			}
			
			for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
				this.highlightShape(shapes[ndx], transform);
			}
	    },
		
		/**
		 * Initializes the ui behavior for shape picking, which shows the 
		 * wireframe of the picked shape.
		 */
		initSelectorUI: function() {
			this.tranHighlightMat = hemi.core.material.createConstantMaterial(
				hemi.core.mainPack, 
				hemi.view.viewInfo, 
				[0, 1, 0, 0.6],
				true);
			this.shapHighlightMat = hemi.core.material.createConstantMaterial(
				hemi.core.mainPack, 
				hemi.view.viewInfo, 
				[0, 0, 1, 0.6],
				true);
			
			// Setup a state to bring the lines forward.
			var state = hemi.core.mainPack.createObject('State');
			state.getStateParam('PolygonOffset2').value = -1.0;
			state.getStateParam('FillMode').value = hemi.core.o3d.State.WIREFRAME;
			
			this.tranHighlightMat.state = state;
			this.tranHighlightMat.name = editor.ui.ToolConstants.SEL_HIGHLIGHT;
			this.shapHighlightMat.state = state;
			this.shapHighlightMat.name = editor.ui.ToolConstants.SEL_HIGHLIGHT + 'Shape';
		},
		
		isSelected: function(transform, opt_owner) {
			var transforms;
			
			if (opt_owner != null) {
				opt_owner = this.selected.get(opt_owner.getId());
			} else {
				transforms = this.getSelectedTransforms();
			}
			
			return transforms.indexOf(transform) !== -1;
		},
		
	    onPick: function(pickInfo, mouseEvent) {
			if (!this.curHandle.down) {
				var transform = pickInfo.shapeInfo.parent.transform, 
					owner = hemi.world.getTranOwner(transform);
				
				if (this.isSelected(transform) && mouseEvent.shiftKey) {
					this.deselectTransform(transform, owner);
				}
				else {
					if (!mouseEvent.shiftKey) {
						this.deselectAll();
					}
					
					this.selectTransform(transform, owner);
				}
			}
	    },
	    
	    processModel: function(model) {
			var updates = model.transformUpdates;
			
			for (var ndx = 0, len = updates.length; ndx < len; ndx++) {
	            var update = updates[ndx],
					vis = update.visible,
					pick = update.pickable;
				
	            if (vis === false) {
					this.hideTransform(update.transform, model);
					
					// Pickable will be false or null (not true)
					if (pick === null) {
						this.setTransformPickable(update.transform, true, model);
					}
	            }
	        }
	    },
		
		removeModel: function(model) {
			var id = model.getId(),
				transforms = this.selected.get(id);
			
			while (transforms && transforms.length > 0) {
				this.deselectTransform(transforms[0], model);
			}
		},
	    
	    selectShape: function(shape, transform) {
			var shapeName = HIGHLIGHT_PRE + shape.name,
				shapes = transform.shapes,
				highlightShape = null;
			
			for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
				if (shapes[ndx].name === shapeName) {
					highlightShape = shapes[ndx];
					break;
				}
			}
			
			if (highlightShape !== null) {
				if (this.currentHighlightShape !== null) {
					var elements = this.currentHighlightShape.elements;
					
					for (var ee = 0; ee < elements.length; ee++) {
						elements[ee].material = this.tranHighlightMat;
					}
				}
				
				var elements = highlightShape.elements;
				
				for (var ee = 0; ee < elements.length; ee++) {
					elements[ee].material = this.shapHighlightMat;
				}
				
				this.currentHighlightShape = highlightShape;
				this.currentShape = shape;
				this.notifyListeners(editor.EventTypes.ShapeSelected, {
					shape: shape,
					owner: hemi.world.getTranOwner(transform)
				});
			}
	    },
		
		selectTransform: function(transform, opt_owner) {			
			if (opt_owner == null) {
				opt_owner = hemi.world.getTranOwner(transform);
			}
			
			// First clean out any child transforms or shapes that may have been
			// previously selected.
			this.deselectTransform(transform, opt_owner);
			
			var ownerId = opt_owner.getId(),
				transforms = this.selected.get(ownerId);
			
			if (transforms === null) {
				transforms = [transform];
				this.curHandle.setTransform(transform);
				this.selected.put(ownerId, transforms);
			} else {
				var ndx = transforms.indexOf(transform);
				
				if (transforms.length === 0) {					
					this.curHandle.setTransform(transform);
				}
				if (ndx === -1) {
					transforms.push(transform);
				}
			}
						
			this.highlightTransform(transform);
			this.notifyListeners(editor.EventTypes.TransformSelected, transform);
			this.currentTransform = transform;
		},
		
		setManipState: function(state) {
			this.curHandle.setDrawState(state);
		},
		
		setOpacity: function(opacity) {
			if (this.currentTransform) {				
				var owner = hemi.world.getTranOwner(this.currentTransform);
				if (owner instanceof hemi.model.Model) {
					owner.setTransformOpacity(this.currentTransform, opacity, true);
				}
			}
		},
		
		setTransformPickable: function(transform, pickable, opt_owner) {
			if (opt_owner == null) {
				opt_owner = hemi.world.getTranOwner(transform);
			}
			
			opt_owner.setPickable({
				transforms: [transform],
				pick: pickable
			});
            this.notifyListeners(editor.EventTypes.PickableSet, {
				tran: transform,
				pick: pickable
			});
		},
	    
	    showSelected: function() {
			var that = this;
			
			this.selected.each(function(key, value) {
				var owner = hemi.world.getCitizenById(key);
				
				for (var ndx = 0, len = value.length; ndx < len; ndx++) {
					that.showTransform(value[ndx], owner);
				}
			});
	    },
	    
	    showTransform: function(transform, opt_owner) {
			if (opt_owner == null) {
				opt_owner = hemi.world.getTranOwner(transform);
			}
			
			opt_owner.setVisible({
				transforms: [transform],
				vis: true
			});
			opt_owner.setPickable({
				transforms: [transform],
				pick: true
			});
            this.notifyListeners(editor.EventTypes.TransformShown, transform);
	    },
		
		unhighlightAll: function() {
			var owners = this.selected.values();
			
			for (var i = 0, il = owners.length; i < il; i++) {
				var transforms = owners[i];
				
				for (var j = 0, jl = transforms.length; j < jl; j++) {
					this.unhighlightTransform(transforms[j]);
				}
			}
		},
	    
	    unhighlightShape: function(shape, transform) {
			var highlightShape = this.highlightedShapes.remove(shape.clientId);
			
			if (highlightShape !== null) {
				// Remove it from the transform of the selected object.
				transform.removeShape(highlightShape);
				// Remove everything related to it.
				hemi.core.shape.deleteDuplicateShape(highlightShape, hemi.core.mainPack);
			}
	    },
	    
	    unhighlightTransform: function(transform) {
			var children = transform.children,
				shapes = transform.shapes,
				filtered = [];
			
			for (var ndx = 0, len = children.length; ndx < len; ndx++) {
				this.unhighlightTransform(children[ndx]);
			}
			
			for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
				var shape = shapes[ndx];
				
				if (shape.name.match(HIGHLIGHT_PRE) === null) {
					filtered.push(shape);
				}
			}
			
			for (var ndx = 0, len = filtered.length; ndx < len; ndx++) {
				this.unhighlightShape(filtered[ndx], transform);
			}
	    },
		
		worldCleaned: function() {
			// turn off handles
			this.curHandle.setDrawState(editor.ui.trans.DrawState.NONE);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                      	  		Side Panel		     	                  //
////////////////////////////////////////////////////////////////////////////////

	var SidePanel = editor.ui.Panel.extend({
		init: function() {
			this._super({
				name: 'sidePanel',
				classes: ['mbrSidePanel']
			});
			
			this.visibleWidget = null;
			this.buttonHash = new Hashtable();
		},
		
		addWidget: function(widget, name) {
			this._super(widget);
			
			var button = jQuery('<button>' + name + '</button>'),
				pnl = this,
				id = 'mbr' + name.replace(' ', '');
			
			this.buttonHash.put(widget, button);
			widget.container.attr('id', id);
			button.attr('id', id + 'Btn')
			.bind('click', function() {
				// hide visible widget
				if (pnl.visibleWidget) {
					pnl.visibleWidget.setVisible(false);
					pnl.buttonHash.get(pnl.visibleWidget).removeClass('down');
				}
				widget.setVisible(true);
				pnl.visibleWidget = widget;
				button.addClass('down');
			});
			
			this.buttons.append(button);
			
			if (this.widgets.length === 1) {
				button.click();
			}
		},
		
		finishLayout: function() {
			this._super();
			
			this.buttons = jQuery('<div class="panelButtons"></div>');
			this.container.prepend(this.buttons);
		},
		
		setVisible: function(visible, opt_updateMeta) {
			this._super(visible, opt_updateMeta);
			
			for (var i = 0, il = this.widgets.length; i < il; i++) {
				sizeAndPosition.call(this.widgets[i]);
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                      	  	  Bottom Panel		     	                  //
////////////////////////////////////////////////////////////////////////////////

	var BottomPanel = editor.ui.Panel.extend({
		init: function() {
			this._super({
				name: 'bottomPanel',
				classes: ['mbrBottomPanel']
			});
		},
		
		setVisible: function(visible) {
			
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                      	  Widget Private Methods     	                  //
////////////////////////////////////////////////////////////////////////////////  
	
	var sizeAndPosition = function() {
			var wgt = this,
				container = this.container,
				btnPnlHeight = jQuery('.mbrSidePanel .panelButtons').outerHeight(),
				padding = parseInt(container.css('paddingBottom')) +
					parseInt(container.css('paddingTop')),
				win = jQuery(window),
				winHeight = win.height(),
				wgtHeight = winHeight - padding - btnPnlHeight;
			
			container.height(wgtHeight)
		},
		
		subResize = function() {
			var wgt = this,
				details = this.detailsList,
				treePane = this.treeParent,
				height = this.container.outerHeight(),
				detHeight = details.outerHeight();
				
			console.log(detHeight);
			treePane.height(height - detHeight);
		};
	
	
////////////////////////////////////////////////////////////////////////////////
//                            	Model Tree Widget                             //
//////////////////////////////////////////////////////////////////////////////// 

	
	var ChildListItem = editor.ui.ListItem.extend({
		init: function() {
			this._super();
		},
						
		finishLayout: function() {
			this.container = jQuery('<div></div>');
			this.title = jQuery('<span></span>');
			this.removeBtn = jQuery('<button class="removeBtn">Remove</button>');
			var btnDiv = jQuery('<div class="buttonContainer"></div>');
			
			btnDiv.append(this.removeBtn);
			this.container.append(this.title).append(btnDiv);
		},
		
		setText: function(text) {
			this.title.text(text);
		}
	});
	
	
	var ModelTreeWidget = editor.ui.Widget.extend({
		init: function(options) {
	        this._super({
				name: 'modelTreeWidget'
			});
		},
		
		addModel: function(modelData) {
			this.tree.jstree('create_node', jQuery('#node_models'), 
				'inside', {
					json_data: modelData
				});
		},
		
		addShape: function(shapeData) {
			this.tree.jstree('create_node', jQuery('#node_shapes'), 
				'inside', {
					json_data: shapeData
				});
		},
		
		deselectNode: function(nodeName) {
	        var node = jQuery('#node_' + nodeName);
			this.tree.jstree('deselect_node', node);
		},
		
		displayMaterialNode: function(material, model) {
			var params = material.params,
				textures = {},
				texList = new editor.ui.List({
					widgetId: 'mbrTextureList',
					prefix: 'mbrTexLst',
					type: editor.ui.ListType.UNORDERED
				}),
				wgt = this;
			
//			detailsList.addItem('Name:', material.name);
			
			for (var i = 0, il = params.length; i < il; i++) {
				var param = params[i],
					className = param.className.toLowerCase();
				
				if (className.indexOf('sampler') >= 0) {
					var tex = param.value.texture;
					
					if (tex != null) {
						textures[tex.clientId] = tex;
					}
				} else if (className.indexOf('texture') >= 0) {
					var tex = param.value;
					textures[tex.clientId] = tex;
				}
			}
			
			for (var tId in textures) {
				var tex = textures[tId],
					name = tex.name !== '' ? tex.name : 'unnamed',
					item = new ChildListItem();
				
				item.setText(name);
				item.attachObject({
					model: model,
					texture: tex
				});
				item.title.data('liWidget', item);
				item.title.bind('click', function(evt) {
					var item = jQuery(this).data('liWidget'),
						data = item.getAttachedObject();
					wgt.notifyListeners(editor.EventTypes.SetTexture, data);
				});
				item.removeBtn.bind('click', function(evt) {
					wgt.notifyListeners(editor.EventTypes.SetTexture, null);
				});
				
				texList.add(item);
			}
			
			this.detailsList.slideUp(function() {
				wgt.detailsList.empty().append('<h1>Textures</h1>')
					.append(texList.getUI()).slideDown(function() {
						subResize.call(wgt);
					})
			});
		},
		
		displayTransformNode: function(transform) {
			var shapes = transform.shapes,
				shapeList = new editor.ui.List({
					widgetId: 'mbrShapeList',
					prefix: 'mbrShpLst',
					type: editor.ui.ListType.UNORDERED
				}),
				wgt = this;
			
			for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
				var shape = shapes[ndx],
					name = shape.name !== '' ? shape.name : 'unnamed'; 
				
				if (name.match(HIGHLIGHT_PRE) === null) {
					var item = new ChildListItem();
					
					item.setText(name);
					item.attachObject({
						transform: transform,
						shape: shape
					});
					item.title.data('liWidget', item);
					item.title.bind('click', function(evt) {
						var item = jQuery(this).data('liWidget'),
							data = item.getAttachedObject();
						wgt.notifyListeners(editor.EventTypes.SetShape, data);
					});
					item.removeBtn.bind('click', function(evt) {
						wgt.notifyListeners(editor.EventTypes.SetShape, null);
					});
					
					shapeList.add(item);
				}
			};
			
			this.detailsList.slideUp(function() {
				wgt.detailsList.empty().append('<h1>Shapes</h1>')
					.append(shapeList.getUI()).slideDown(function() {
						subResize.call(wgt);
					});				
			});
		},
		
		finishLayout: function() {
			this._super();	
				
			var wgt = this,
				baseJson = [{
					data: 'models',
					attr: {
						id: 'node_models',
						rel: 'type'
					},
					state: 'leaf',
					metadata: {
						type: 'type'
					}
				},
				{
					data: 'shapes',
					attr: {
						id: 'node_shapes',
						rel: 'type'
					},
					state: 'leaf',
					metadata: {
						type: 'type'
					}
				}];
			
			this.tree = jQuery('<div id="mbrTree"></div>');
			this.treeParent = jQuery('<div id="mbrTreeWrapper"></div>');
			this.tree.bind('select_node.jstree', function(evt, data) {
				var elem = data.rslt.obj,
					metadata = elem.data('jstree'),
					type = metadata.type,
					selected = wgt.tree.jstree('get_selected');
				
				switch(type) {
					case 'transform':
						// Deselect any non-transforms that may be selected
						for (var i = 0, il = selected.length; i < il; i++) {
							var sel = selected[i],
								selData = jQuery(sel).data('jstree');
							
							if (selData.type !== type) {
								wgt.tree.jstree('deselect_node', sel);
							}
						}
						
						if (data.args[2] != null) {
							wgt.notifyListeners(editor.EventTypes.SelectTreeItem, {
								transform: metadata.actualNode,
								node: elem,
								mouseEvent: data.args[2],
								type: metadata.type
							});
							wgt.tree.jstree('toggle_node', elem);
						} else {
							wgt.treeParent.scrollTo(elem, 400);
						}
						
//						wgt.displayTransformNode(metadata.actualNode);
						break;
					case 'material':
						var material = metadata.actualNode,
							model = metadata.parent;
						
						// Materials are always single selection
						for (var i = 0, il = selected.length; i < il; i++) {
							var sel = selected[i];
							
							if (sel !== elem[0]) {
								wgt.tree.jstree('deselect_node', sel);
							}
						}
						
						wgt.notifyListeners(editor.EventTypes.SelectTreeItem, {
							owner: model,
							material: material,
							type: metadata.type
						});
						
//						wgt.displayMaterialNode(material, model);
						break;
					default:
						wgt.tree.jstree('toggle_node', elem);
						break;
				}
			})
			.bind('deselect_node.jstree', function(evt, data) {
				var elem = data.rslt.obj,
					metadata = elem.data('jstree');
				
				if (metadata != null) {
					wgt.notifyListeners(editor.EventTypes.DeselectTreeItem, {
						node: metadata.actualNode,
						type: metadata.type
					});
				}
			})
			.jstree({
				'progress_render': true,
				'json_data': {
					'data': baseJson
				},
				'types': {
					'types': {
						'shape': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '0 0'
							}
						},
						'transform': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-16px 0'
							}
						},
						'citizen': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-48px 0'
							}
						},
						'type' : {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-64px 0'
							}
						}
					}
				},
				'themes': {
					'dots': false
				},
				'ui': {
					'select_multiple_modifier': 'shift',
					'selected_parent_close': 'select_parent',
					'disable_selecting_children': true
				},
				'plugins': ['themes', 'types', 'json_data', 'ui']
			});
			
			this.detailsList = jQuery('<div id="mbrDetails"></div>').hide();
			this.treeParent.append(this.tree);
			this.container.append(this.detailsList).append(this.treeParent);
			sizeAndPosition.call(this);
		},
		
		removeModel: function(model) {
			var node = jQuery('#node_' + getNodeId(model));
			this.tree.jstree('delete_node', node);
		},
		
		removeShape: function(shape) {
			var node = jQuery('#node_' + getNodeId(shape));
			this.tree.jstree('delete_node', node);
		},
		
		selectNode: function(nodeName) {
			var elem = jQuery('#node_' + nodeName);
			var path = this.tree.jstree('get_path', elem, true);
			var temp;
			
			for (var i = 0, il = path.length - 1; i < il; i++) {
				var node = jQuery('#' + path[i]);
				this.tree.jstree('open_node', node, false, true);
			}
			
			this.tree.jstree('select_node', elem, false);
			this.notifyListeners(editor.EventTypes.Sidebar.WidgetInvalidate);
		},
		
		updateShape: function(shapeData, shape) {
			// shape transforms may invariably change so we need to replace the
			// whole node
			var node = jQuery('#node_' + getNodeId(shape));
			this.tree.jstree('create_node', node, 'after', {
				json_data: shapeData
			});
			this.tree.jstree('delete_node', node);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                            Hidden Items Widget                             //
//////////////////////////////////////////////////////////////////////////////// 
	
	var HiddenItemListItem = editor.ui.ListItem.extend({
		init: function() {
			this._super();
		},
		
		finishLayout: function() {
			this.container = jQuery('<div></div>');
			this.title = jQuery('<span></span>');
			this.pickBtn = jQuery('<input type="checkbox"/>');
			this.showBtn = jQuery('<button class="removeBtn">Show</button>');
			var btnDiv = jQuery('<div class="buttonContainer"></div>');
			var pickSpan = jQuery('<span style="float:left;">Pick</span>');
			
			pickSpan.append(this.pickBtn);
			btnDiv.append(pickSpan).append(this.showBtn);
			this.container.append(this.title).append(btnDiv);
		},
		
		setText: function(text) {
			this.title.text(text);
		},
		
		attachModel: function(model) {
			this.model = model;
		}
	});
	
	var HiddenItemsWidget = editor.ui.Widget.extend({
		init: function(options) {
		    this._super({
				name: 'hiddenItemsWidget',
				manualVisible: true
			});
			
			this.hiddenItems = new Hashtable();		
			this.ownerTransHash = new Hashtable();
		},
		
		finishLayout: function() {
			this._super();
			
			this.list = new editor.ui.List({
				widgetId: 'mbrHiddenList',
				prefix: 'mbrHidLst',
				type: editor.ui.ListType.UNORDERED
			});
			
			this.container.append(this.list.getUI());
			sizeAndPosition.call(this);
		},
		
	    addHiddenItem: function(transform, owner) {
			if (!this.hiddenItems.containsKey(transform.clientId)) {
				var li = new HiddenItemListItem(),
	            	wgt = this;
					
				li.setText(transform.name);
				li.attachObject(transform);
				
				li.pickBtn.bind('click', function(evt) {
					var transform = li.getAttachedObject();
					wgt.notifyListeners(editor.EventTypes.SetPickable, {
						tran: transform,
						pick: this.checked
					});
				});
				li.showBtn.bind('click', function(evt) {
					var transform = li.getAttachedObject();
					wgt.notifyListeners(editor.EventTypes.ShowHiddenItem, transform);
				});
				
				var transforms = this.ownerTransHash.get(owner) || [];
				transforms.push(transform);
				
				this.list.add(li);
				this.hiddenItems.put(transform.clientId, li);
				this.ownerTransHash.put(owner, transforms);
			}
	    },
	    
	    removeHiddenItem: function(transform) {
			var li = this.hiddenItems.remove(transform.clientId);
			this.list.remove(li);
			
			if (this.hiddenItems.size() === 0) {
				this.setVisible(false);
			}
	    },
		
		removeOwner: function(owner) {
			var transforms = this.ownerTransHash.get(owner);
			
			if (transforms) {
				for (var ndx = 0, len = transforms.length; ndx < len; ndx++) {
					this.removeHiddenItem(transforms[ndx]);
				}
			}
		},
		
		resize: function(maxHeight) {
			this._super(maxHeight);	
			var list = this.list.getUI(),
			
			// adjust the list pane height
			 	listHeight = maxHeight - hdrHeight;
				
			if (listHeight > 0) {
				list.height(listHeight);
			}
		},
		
		setPickable: function(transform, pickable) {
			var li = this.hiddenItems.get(transform.clientId);
			
			if (li) {
				li.pickBtn.prop('checked', pickable);
			}
		},
		
		showAll: function() {
			var listItems = this.hiddenItems.values();
			
			for (var ndx = 0, len = listItems.length; ndx < len; ndx++) {
				listItems[ndx].showBtn.click();
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                           Model Loading Widget                             //
////////////////////////////////////////////////////////////////////////////////

	var LoaderWidget = editor.ui.Widget.extend({
		init: function() {
			this._super({
				name: 'modelLoader',
				uiFile: 'js/editor/plugins/models/html/modelLoading.htm'
			});
		},
		
		createImportPanel: function() {			
			var msg = this.msgPanel,
				pnl = this.find('#mbrImportPnl'),						
				lbl = pnl.find('label'),	
				btn = pnl.find('button'),
				wgt = this;				
			
			btn.file().choose(function(evt, input) {
				msg.text('Uploading Model...').show(200);
				
				// assuming no multi select file
				var file = input.files[0],
					name = file.fileName != null ? file.fileName : file.name;
					
				jQuery.ajax({
					url: '/model',
					dataType: 'json',
					type: 'post',
					data: file,
					processData: false,
					contentType: 'application/octet-stream',
					headers: {
						'X-File-Name': encodeURIComponent(name),
						'X-File-Size': file.size,
						'X-File-Type': file.type
					},
					success: function(data, status, xhr) {
						msg.text('Loading Model...').removeClass('errMsg');
						loadModel(data.url, function() {
							var sel = wgt.find('#mbrLoadPnl select'), 
								prj = jQuery('<option value="' + data.url + '">' + data.name + '</option>');
								
							sel.append(prj);
							msg.text('').hide(200);
							populateUnloadPanel.call(wgt);
						});
					},
					error: function(xhr, status, err) {
						msg.text(xhr.responseText).addClass('errMsg').show();
					}
				});
			});	
			
			testServer.call(this, function() {
				btn.show();
				lbl.show();
			}, function() {
				btn.hide();
				lbl.hide();
			});
		},
		
		createLoadPanel: function() {				
			var pnl = this.find('#mbrLoadPnl'),							
				lbl = pnl.find('label'),
				sel = pnl.find('select'),
				ipt = pnl.find('input').hide(),
				btn = pnl.find('button'),
				msg = this.msgPanel,
				wgt = this;	
		
			btn.bind('click', function() {
				msg.text('Loading Model...').show(200);
				var val = ipt.is(':visible') ? ipt.val() : sel.val();
				loadModel(val, function() {					
					msg.text('').hide(200);
					populateUnloadPanel.call(wgt);
				});
			});	
			
			testServer.call(this, function(data) {
					var models = data.models;
					
					ipt.hide();
					sel.empty().show();
					for (var i = 0, il = models.length; i < il; i++) {
						var mdl = models[i];
						var prj = jQuery('<option value="' + mdl.url + '">' + mdl.name + '</option>');
						sel.append(prj);
					}
					
					msg.hide(200);
				},
				function() {						
					sel.hide();
					ipt.show();
				});
		},
		
		createUnloadPanel: function() {			
			var pnl = this.find('#mbrUnloadPnl'),							
				lbl = pnl.find('label'),
				sel = pnl.find('select'),
				btn = pnl.find('button'),
				msg = this.msgPanel,
				wgt = this;
		
			btn.bind('click', function() {				
				var id = parseInt(sel.val());
					model = hemi.world.getCitizenById(id);
				
				var msgHandler = model.subscribe(hemi.msg.unload,
					function(m) {
						msg.text('').hide(200);
						model.unsubscribe(msgHandler, hemi.msg.unload);
						populateUnloadPanel.call(wgt);
					});
					
				model.cleanup();
			});	
			
			populateUnloadPanel.call(this);
		},
		
		finishLayout: function() {
			this._super();
			
			this.msgPanel = this.find('#mbrMsg');
			this.createImportPanel();
			this.createLoadPanel();
			this.createUnloadPanel();
		}
	});
	
	var testServer = function(success, error) {
			var msg = this.msgPanel;
						
			jQuery.ajax({
				url: '/models',
				dataType: 'json',
				success: function(data, status, xhr) {	
					msg.text('').removeClass('errMsg').hide();
					success(data);
				},					
				error: function(xhr, status, err) {
					if (xhr.status !== 400) {
						msg.text('Server is not running').addClass('errMsg')
							.show();
						error(xhr, status, err);
					}
					else {
						msg.text(xhr.responseText).addClass('errMsg').show();
					}
				}
			});
		},
	
		loadModel = function(url, cb) {			
			// do the model load
			var model = new hemi.model.Model();
			
			var msgHandler = model.subscribe(hemi.msg.load,
				function(msg) {
					cb();
					model.unsubscribe(msgHandler, hemi.msg.load);
				});
				
			model.setFileName(url);
		},
		
		populateUnloadPanel = function() {			
			var models = hemi.world.getModels(),
				sel = this.find('#mbrUnloadPnl select'),
				btn = this.find('#mbrUnloadPnl button');
			
			sel.empty().show();
			
			if (models.length === 0) {
				btn.attr('disabled', 'disabled');
				var prj = jQuery('<option value="">No models loaded</option>');
				sel.append(prj);
			} else {
				btn.removeAttr('disabled');
				
				for (var i = 0, il = models.length; i < il; i++) {
					var mdl = models[i];
					var prj = jQuery('<option value="' + mdl.getId() + '">' + mdl.name + '</option>');
					sel.append(prj);
				}
			}
		};
	
////////////////////////////////////////////////////////////////////////////////
//                        Transform Adjusting Widget                          //
////////////////////////////////////////////////////////////////////////////////

	var AdjustState = {
		NONE: -1,
		TRANSLATE: 0,
		ROTATE: 1,
		SCALE: 2	
	};
	
	var AdjustWidget = editor.ui.Widget.extend({
		init: function() {
			this._super({
				name: 'adjustWidget'
			});
			
			this.state = AdjustState.NONE;
		},
		
		finishLayout: function() {
			this._super();
			var wgt = this,
				form = jQuery('<form></form>').submit(function() { 
					return false; 
				}),
				notify = function(btn, msg) {					
					btn.toggleClass('down');
					
					if (!btn.hasClass('down')) {
						msg = editor.ui.trans.DrawState.NONE;	
					}
					wgt.notifyListeners(editor.EventTypes.ManipState, msg);
				};
			
			this.transBtn = jQuery('<button id="mbrTranslateBtn">Translate</button>');
			this.rotateBtn = jQuery('<button id="mbrRotateBtn">Rotate</button>');
			this.scaleBtn = jQuery('<button id="mbrScaleBtn">Scale</button>');
			
			form.append(this.transBtn).append(this.rotateBtn)
				.append(this.scaleBtn);
			this.container.append(form);
			
			this.transBtn.bind('click', function() {				
				wgt.rotateBtn.removeClass('down');
				wgt.scaleBtn.removeClass('down');
				notify(jQuery(this), editor.ui.trans.DrawState.TRANSLATE);
			});
			this.rotateBtn.bind('click', function() {				
				wgt.transBtn.removeClass('down');
				wgt.scaleBtn.removeClass('down');
				notify(jQuery(this), editor.ui.trans.DrawState.ROTATE);
			});
			this.scaleBtn.bind('click', function() {				
				wgt.rotateBtn.removeClass('down');
				wgt.transBtn.removeClass('down');
				notify(jQuery(this), editor.ui.trans.DrawState.SCALE);
			});
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                              Opacity Widget                                //
////////////////////////////////////////////////////////////////////////////////    
	
	var OpacityWidget = editor.ui.Widget.extend({
		init: function() {
			this._super({
				name: 'opacityWidget'
			});
		},
		
		finishLayout: function() {
			this._super();
			
			var wgt = this,
				label = jQuery('<label>Opacity</label>');
			this.slider = jQuery('<div id="mbrTransparencySlider"></div>');
			this.slider.slider({
				value: 100,
				range: 'min',
				slide: function(evt, ui) {								
					wgt.notifyListeners(editor.EventTypes.SetTransOpacity, 
						ui.value/100);
				}
			});
			
			this.container.append(label).append(this.slider)
				.addClass('opacity');
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                           	Details Widget	                              //
////////////////////////////////////////////////////////////////////////////////
	
	var DetailsType = {
		TRANSFORM: 0,
		MATERIAL: 1
	};
	
	var buildMaterialPopup = function(material, model) {
			var params = material.params,
				textures = {},
				texList = new editor.ui.List(),
				container = jQuery('<div></div>'),
				detCtn = jQuery('<div><div class="details"></div><button class="back" href="#">Back</button></div>').hide(),
				backBtn = detCtn.find('.back'),
				detPnl = detCtn.find('.details'),
				wgt = this;
			
			for (var i = 0, il = params.length; i < il; i++) {
				var param = params[i],
					className = param.className.toLowerCase();
				
				if (className.indexOf('sampler') >= 0) {
					var tex = param.value.texture;
					
					if (tex != null) {
						textures[tex.clientId] = tex;
					}
				} else if (className.indexOf('texture') >= 0) {
					var tex = param.value;
					textures[tex.clientId] = tex;
				}
			}
			
			for (var tId in textures) {
				var tex = textures[tId],
					name = tex.name !== '' ? tex.name : 'unnamed',
					item = new ChildListItem();
				
				item.setText(name);
				item.attachObject({
					model: model,
					texture: tex
				});
				item.title.data('liWidget', item);
				item.title.bind('click', function(evt) {
					var item = jQuery(this).data('liWidget'),
						data = item.getAttachedObject();
						
					showMaterialDetails(data.texture, data.model, detPnl);
					detCtn.show();
					texList.setVisible(false);
				});
				item.removeBtn.bind('click', function(evt) {
					wgt.notifyListeners(editor.EventTypes.SetTexture, null);
				});
				
				texList.add(item);
			}
			
			backBtn.bind('click', function() {
				detCtn.hide();
				texList.setVisible(true);
			});
			
			container.append(detCtn).append(texList.getUI());
			
			return container;
		},
		
		buildTransformPopup = function(transform) {
			var shapes = transform.shapes,
				shapeList = new editor.ui.List(),
				container = jQuery('<div></div>'),
				detCtn = jQuery('<div><div class="details"></div><button class="back" href="#">Back</button></div>').hide(),
				backBtn = detCtn.find('.back'),
				detPnl = detCtn.find('.details'),
				wgt = this;
			
			for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
				var shape = shapes[ndx],
					name = shape.name !== '' ? shape.name : 'unnamed'; 
				
				if (name.match(HIGHLIGHT_PRE) === null) {
					var item = new ChildListItem();
					
					item.setText(name);
					item.attachObject({
						transform: transform,
						shape: shape
					});
					item.title.data('liWidget', item);
					item.title.bind('click', function(evt) {
						var item = jQuery(this).data('liWidget'),
							data = item.getAttachedObject();
//						wgt.notifyListeners(editor.EventTypes.SetShape, data);
						showShapeDetails(data.shape, data.transform, detPnl);
						detCtn.show();
						shapeList.setVisible(false);
					});
					
					shapeList.add(item);
				}
			};
			
			backBtn.bind('click', function() {
				detCtn.hide();
				shapeList.setVisible(true);
			});
			
			container.append(detCtn).append(shapeList.getUI());
			
			return container;
		},
		
		showMaterialDetails = function(texture, model, pnl) {
			var params = texture.params;
			
			pnl.empty().append('<h2>' + texture.name + '</h2>');
				
			for (var i = 0, il = params.length; i < il; i++) {
				var param = params[i];
				
				if (param.name.toLowerCase().indexOf('uri') >= 0) {
					var end = model.fileName.lastIndexOf('/'),
						path = model.fileName.substring(0, end + 1);
					
					var img = jQuery('<img />');
					img.attr('src', path + param.value);
					pnl.append(img);
				}
			}
		},
		
		showShapeDetails = function(shape, transform, pnl) {
			var shapeInfo = hemi.picking.pickManager.createShapeInfo(shape, null),
				box = shapeInfo.boundingBox,
				minExtent = box.minExtent,
				maxExtent = box.maxExtent,
				title = jQuery('<h2>' + shape.name + '</h2>'),
				dl = jQuery('<dl></dl>'),
				liTemplate = jQuery.template(null, '<li><span class="label">${Label}</span>${Value}</li>'),
				minDt = jQuery('<dt>Min Extent</dt>')
				minDd = jQuery('<dd><ul></ul></dd>'),
				maxDt = jQuery('<dt>Max Extent</dt>'),
				maxDd = jQuery('<dd><ul></ul></dd>'),
				minData = [
					{ Label: 'x', Value: editor.utils.roundNumber(minExtent[0], 7) },
					{ Label: 'y', Value: editor.utils.roundNumber(minExtent[1], 7) },
					{ Label: 'z', Value: editor.utils.roundNumber(minExtent[2], 7) }
				],
				maxData = [
					{ Label: 'x', Value: editor.utils.roundNumber(minExtent[0], 7) },
					{ Label: 'y', Value: editor.utils.roundNumber(minExtent[1], 7) },
					{ Label: 'z', Value: editor.utils.roundNumber(minExtent[2], 7) }
				];
				
			dl.append(minDt).append(minDd).append(maxDt).append(maxDd);
			pnl.empty().append(title).append(dl);
			
			jQuery.tmpl(liTemplate, minData).appendTo(minDd.find('ul'));
			jQuery.tmpl(liTemplate, maxData).appendTo(maxDd.find('ul'));			
		};
	
	var DetailsWidget = editor.ui.Widget.extend({
		init: function() {
			this._super({
				name: 'detailsWidget'
			});
		},
		
		buildPopup: function() {
			if (this.type === DetailsType.TRANSFORM) {
				return buildTransformPopup.call(this, this.obj);
			}
			else {
				return buildMaterialPopup.call(this, this.obj.material, 
					this.obj.owner);
			}
		},
		
		finishLayout: function() {
			this._super();
			
			this.btn = jQuery('<button id="mbrDetailsBtn">View Shapes</button>');
			this.form = jQuery('<form></form>').submit(function() {
				return false;
			});
			
			this.form.append('<label>Details</label>').append(this.btn);
			this.container.append(this.form);
			
			var popup = editor.ui.createTooltip('mbrPopup'),
				wgt = this;
			
			this.btn.bind('click', function(evt) {
				var btn = jQuery(this);
				popup.show(btn, wgt.buildPopup(), null, {
					top: 5,
					left: 0
				});
				
				jQuery(document).bind('click.mbr', function(e) {
					var target = jQuery(e.target),
						parent = target.parents('.tooltip, #mbrDetailsBtn');
					
					if (parent.size() == 0 && target.attr('id') != 'mbrDetailsBtn') {
						popup.hide();
						jQuery(document).unbind('click.mbr');
					}
				});
			});
		},
		
		set: function(obj, type) {
			if (obj) {
				this.container.show();
			}
			else {
				this.container.hide();
			}
			
			this.type = type;
			this.obj = obj;
			
			this.btn.text(type === DetailsType.TRANSFORM ? 'View Shapes' : 
				'View Textures');
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                             Hide/Show Widget                               //
////////////////////////////////////////////////////////////////////////////////
	
	var VisibilityWidget = editor.ui.Widget.extend({
		init: function() {
			this._super({
				name: 'visibilityWidget'
			});
		},
		
		finishLayout: function() {
			this._super();			
			this.visBtn = jQuery('<button>Hide</button>');
			
			var label = jQuery('<label>Visibility</label>'),
				form = jQuery('<form></form>').submit(function() {
					return false;
				}),
				wgt = this;
			
			form.append(label).append(this.visBtn);
			this.container.append(form);
			
			this.visBtn.bind('click', function() {
				wgt.notifyListeners(editor.EventTypes.ShowPicked, 
					!wgt.transform.visible);
				jQuery(this).text(wgt.transform.visible ? 'Hide' : 'Show');
			});
		},
		
		set: function(transform) {
			this.transform = transform;			
			this.visBtn.text(this.transform.visible ? 'Hide' : 'Show');
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    	
	
	editor.tools.InfoDisplay = editor.utils.Listenable.extend({
		init: function() {
			this._super();
			
			this.currentOwner = null;
			this.images = {};
			this.visible = false;
		},
		
		createHud: function() {
			var textConfig = {
				color: [0.9, 0.9, 1, 1],
				textAlign: 'left',
				textSize: 13
			};
			
			this.nameText = new hemi.hud.HudText();
			this.nameText.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'ShapeName';
			this.nameText.setWidth(300);
			this.nameText.setConfig(textConfig);
			this.nameText.y = 15;
			
			this.boundTitle = new hemi.hud.HudText();
			this.boundTitle.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'ShapeBound';
			this.boundTitle.setWidth(300);
			this.boundTitle.setConfig(textConfig);
			this.boundTitle.setText('Bounding Box:');
			
			this.boundMin = new hemi.hud.HudText();
			this.boundMin.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMin';
			this.boundMin.setWidth(300);
			this.boundMin.setConfig(textConfig);
			this.boundMin.setText('Min Extent:');
			
			this.boundMax = new hemi.hud.HudText();
			this.boundMax.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMax';
			this.boundMax.setWidth(300);
			this.boundMax.setConfig(textConfig);
			this.boundMax.setText('Max Extent:');
			
			this.boundMinX = new hemi.hud.HudText();
			this.boundMinX.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMinX';
			this.boundMinX.setWidth(300);
			this.boundMinX.setConfig(textConfig);
			this.boundMinY = new hemi.hud.HudText();
			this.boundMinY.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMinY';
			this.boundMinY.setWidth(300);
			this.boundMinY.setConfig(textConfig);
			this.boundMinZ = new hemi.hud.HudText();
			this.boundMinZ.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMinZ';
			this.boundMinZ.setWidth(300);
			this.boundMinZ.setConfig(textConfig);
			
			
			this.boundMaxX = new hemi.hud.HudText();
			this.boundMaxX.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMaxX';
			this.boundMaxX.setWidth(300);
			this.boundMaxX.setConfig(textConfig);
			this.boundMaxY = new hemi.hud.HudText();
			this.boundMaxY.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMaxY';
			this.boundMaxY.setWidth(300);
			this.boundMaxY.setConfig(textConfig);
			this.boundMaxZ = new hemi.hud.HudText();
			this.boundMaxZ.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMaxZ';
			this.boundMaxZ.setWidth(300);
			this.boundMaxZ.setConfig(textConfig);
			
			var page = new hemi.hud.HudPage();
			page.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'ShapePage';
			page.setConfig({
				color: [0, 0, 0, 0.5],
				curve: 0.08
			});
			page.addElement(this.nameText);
			page.addElement(this.boundTitle);
			page.addElement(this.boundMin);
			page.addElement(this.boundMinX);
			page.addElement(this.boundMinY);
			page.addElement(this.boundMinZ);
			page.addElement(this.boundMax);
			page.addElement(this.boundMaxX);
			page.addElement(this.boundMaxY);
			page.addElement(this.boundMaxZ);
			
			var page2 = new hemi.hud.HudPage();
			page2.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'TexturePage';
			page2.setConfig({
				color: [0, 0, 0, 0.3]
			});
			
			this.display = new hemi.hud.HudDisplay();
			this.display.name = editor.ui.ToolConstants.EDITOR_PREFIX + 'ModelBrowserDisplay';
			this.display.addPage(page);
			this.display.addPage(page2);
		},
		
		createImage: function(uri) {
			var image = new hemi.hud.HudImage(),
				that = this,
				msgHandler = image.subscribe(hemi.msg.load,
					function(msg) {
						image.unsubscribe(msgHandler);
						
						// Give it a 15 pixel buffer for the page offset and
						// margin.
						var cHeight = hemi.core.client.height - 15,
							cWidth = hemi.core.client.width - 15,
							iHeight = image.height,
							iWidth = image.width;
						
						if (iWidth > cWidth) {
							var ratio = cWidth / iWidth;
							iWidth *= ratio;
							iHeight *= ratio;
						}
						if (iHeight > cHeight) {
							var ratio = cHeight / iHeight;
							iWidth *= ratio;
							iHeight *= ratio;
						}
						
						image.height = Math.round(iHeight);
						image.width = Math.round(iWidth);
						image.x = cWidth + 5 - image.width;
						image.y = 10;
						that.notifyListeners(editor.EventTypes.TextureReady, null);
					});
			
			// So the HudImage doesn't accidentally end up in Octane.
			hemi.world.removeCitizen(image);
			image.setImageUrl(uri);
			return image;
		},
		
		createImageMulti: function(uris) {
			var images = [],
				handlers = [],
				count = 0,
				halfCount = Math.ceil(uris.length / 2),
				// Give it a 15 pixel buffer for the page offset and margin.
				cHeight = hemi.core.client.height - 15,
				cWidth = hemi.core.client.width - 15,
				// The images will be arranged in two rows
				scaleHeight = cHeight / 2,
				scaleWidth = cWidth / halfCount,
				x = cWidth + 5,
				y = 10,
				maxHeight = 0;
			
			for (var i = 0, il = uris.length; i < il; i++) {
				var image = new hemi.hud.HudImage(),
					that = this;
				
				handlers[i] = image.subscribe(hemi.msg.load,
					function(msg) {
						image = images[count];
						image.unsubscribe(handlers[count]);
						++count;
						
						var iHeight = image.height,
							iWidth = image.width;
						
						if (iWidth > scaleWidth) {
							var ratio = scaleWidth / iWidth;
							iWidth *= ratio;
							iHeight *= ratio;
						}
						if (iHeight > scaleHeight) {
							var ratio = scaleHeight / iHeight;
							iWidth *= ratio;
							iHeight *= ratio;
						}
						
						image.height = Math.round(iHeight);
						image.width = Math.round(iWidth);
						
						if (count <= halfCount) {
							maxHeight = Math.max(maxHeight, image.height);
						} else if (y === 10) {
							x = cWidth + 5;
							y += maxHeight;
						}
						
						x -= image.width;
						image.x = x;
						image.y = y;
						
						if (count === uris.length) {
							that.notifyListeners(editor.EventTypes.TextureReady, null);
						} else {
							images[count].setImageUrl(uris[count]);
						}
					});
				
				// So the HudImage doesn't accidentally end up in Octane.
				hemi.world.removeCitizen(image);
				images[i] = image;
			}
			
			images[0].setImageUrl(uris[0]);
			return images;
		},
		
		deselect: function() {
			this.setVisible(false);
			this.currentOwner = null;
		},
		
		refresh: function() {
			if (this.visible) {
				this.display.showPage();
			}
		},
		
		setShape: function(shape, owner) {
			this.deselect();
			
			var shapeInfo = hemi.picking.pickManager.createShapeInfo(shape, null),
				box = shapeInfo.boundingBox,
				minExtent = box.minExtent,
				maxExtent = box.maxExtent;
			
			this.nameText.setText('Name: ' + (shape.name ? shape.name : 'unnamed'));
			this.boundMinX.setText('x: ' + editor.utils.roundNumber(minExtent[0], 5));
			this.boundMinY.setText('y: ' + editor.utils.roundNumber(minExtent[1], 5));
			this.boundMinZ.setText('z: ' + editor.utils.roundNumber(minExtent[2], 5));
			this.boundMaxX.setText('x: ' + editor.utils.roundNumber(maxExtent[0], 5));
			this.boundMaxY.setText('y: ' + editor.utils.roundNumber(maxExtent[1], 5));
			this.boundMaxZ.setText('z: ' + editor.utils.roundNumber(maxExtent[2], 5));
			
			var x = hemi.core.client.width - (this.nameText.wrappedWidth + 15);
			this.nameText.x = x;
			this.boundTitle.x = x;
			this.boundMin.x = x + 10;
			this.boundMinX.x = x + 20;
			this.boundMinY.x = x + 20;
			this.boundMinZ.x = x + 20;
			this.boundMax.x = x + 10;
			this.boundMaxX.x = x + 20;
			this.boundMaxY.x = x + 20;
			this.boundMaxZ.x = x + 20;
			
			this.boundTitle.y = this.nameText.y + this.nameText.wrappedHeight;
			this.boundMin.y = this.boundTitle.y + this.boundTitle.wrappedHeight;
			this.boundMinX.y = this.boundMin.y + this.boundMin.wrappedHeight;
			this.boundMinY.y = this.boundMinX.y + this.boundMinX.wrappedHeight;
			this.boundMinZ.y = this.boundMinY.y + this.boundMinY.wrappedHeight;
			this.boundMax.y = this.boundMinZ.y + this.boundMinZ.wrappedHeight;
			this.boundMaxX.y = this.boundMax.y + this.boundMax.wrappedHeight;
			this.boundMaxY.y = this.boundMaxX.y + this.boundMaxX.wrappedHeight;
			this.boundMaxZ.y = this.boundMaxY.y + this.boundMaxY.wrappedHeight;
						
			// save state
			this.currentOwner = owner;
			this.display.currentPage = 0;
		},
		
		setTexture: function(texture, model) {
			this.deselect();
			this.currentOwner = model;
			this.display.currentPage = 1;
			
			var tId = texture.clientId,
				page = this.display.getCurrentPage();
			page.clearElements();
			
			if (this.images[tId] != null) {
				var images = this.images[tId];
				
				for (var i = 0, il = images.length; i < il; i++) {
					page.addElement(images[i]);
				}
				
				this.notifyListeners(editor.EventTypes.TextureReady, null);
			} else {
				var params = texture.params,
					uris = [];
				
				for (var i = 0, il = params.length; i < il; i++) {
					var param = params[i];
					
					if (param.name.toLowerCase().indexOf('uri') >= 0) {
						var end = model.fileName.lastIndexOf('/'),
							path = model.fileName.substring(0, end + 1);
						
						uris.push(path + param.value);
					}
				}
				
				if (uris.length === 1) {
					var image = this.createImage(uris[0]);
					this.images[tId] = [image];
					page.addElement(image);
				} else if (uris.length > 1) {
					var images = this.createImageMulti(uris);
					this.images[tId] = images;
					
					for (var i = 0, il = images.length; i < il; i++) {
						page.addElement(images[i]);
					}
				}
			}
		},
		
		setVisible: function(visible) {
			if (visible) {
				this.visible = true;
				this.display.isVisible() ? this.display.showPage() 
					: this.display.show();
			} else if (this.display){
				this.visible = false;
				this.display.hide();
			}
		}
	});
	
	/*
	 * Configuration object for the ModelBrowserView.
	 */
	editor.tools.ModelBrowserViewDefaults = {
		axnBarId: 'mbActionBar',
		toolName: 'Model Browser',
		toolTip: 'Model Browser: browses transforms and shapes in models',
		widgetId: 'modelBrowserBtn'
	};
	
	editor.tools.ModelBrowserView = editor.ui.ToolView.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, editor.tools.ModelBrowserViewDefaults, options);
			this._super(newOpts);
			
			this.isDown = false;
			this.infoDisplay = new editor.tools.InfoDisplay();
			
			this.addPanel(new SidePanel());
			this.addPanel(new editor.ui.Panel({
				location: editor.ui.Location.TOP,
				classes: ['mbrTopPanel'],
				name: 'topPanel'
			}));
			this.addPanel(new editor.ui.Panel({
				location: editor.ui.Location.BOTTOM,
				classes: ['mbrBottomPanel'],
				name: 'bottomPanel',
				startsVisible: false
			}));
			
			this.sidePanel.addWidget(new ModelTreeWidget(), "Model Tree");
			this.sidePanel.addWidget(new HiddenItemsWidget(), "Hidden Transforms");
			
			this.topPanel.addWidget(new LoaderWidget());
			
			this.bottomPanel.addWidget(new AdjustWidget());
			this.bottomPanel.addWidget(new OpacityWidget());
			this.bottomPanel.addWidget(new DetailsWidget());
			this.bottomPanel.addWidget(new VisibilityWidget());
		},
		
		layoutActionBar: function() {
			var widget = new editor.ui.ActionBarWidget({
				uiFile: 'js/editor/tools/html/modelbrowserAxnBar.htm',
				immediateLayout: false
			});
			var view = this;
			
			widget.finishLayout = function() {
				var manipBtns = widget.find('#mbTranslate, #mbRotate, #mbScale'),
					tBtn = manipBtns.filter('#mbTranslate'),
					rBtn = manipBtns.filter('#mbRotate'),
					sBtn = manipBtns.filter('#mbScale'),
					down = editor.ui.ToolConstants.MODE_DOWN;
									
		        widget.find('form').submit(function() {
		            return false;
		        });
		        
		        widget.find('#mbHide').bind('click', function(evt) {
		            view.notifyListeners(editor.EventTypes.ShowPicked, false);
		        });
		        
		        widget.find('#mbShow').bind('click', function(evt) {
					view.notifyListeners(editor.EventTypes.ShowPicked, true);
		        });
		        
		        widget.find('#mbShowAll').bind('click', function(evt) {
					view.hiddenItemsWidget.showAll();
		        });
		        
		        widget.find('#mbShowHiddenItemsDlg').bind('click', function(evt) {
		            var isVisible = view.hiddenItemsWidget.isVisible();
		            view.hiddenItemsWidget.setVisible(!isVisible);
		        });
				
				this.slider = widget.find('#mbTransparencySlider');
				this.slider.slider({
					value: 100,
					slide: function(evt, ui) {								
						view.notifyListeners(editor.EventTypes.SetTransOpacity, 
							ui.value/100);
					}
				});
				
				this.manipSection = widget.find('#mbManipSection').hide();
				this.effectsSection = widget.find('#mbEffectsSection').hide();
		        
		        manipBtns.bind('click', function(evt) {
					var elem = jQuery(this),
						id = elem.attr('id'),
						isDown = elem.data('isDown'),
						msg;
						
					switch(id) {
						case 'mbTranslate':
						    msg = editor.ui.trans.DrawState.TRANSLATE;
							rBtn.data('isDown', false).removeClass(down);
							sBtn.data('isDown', false).removeClass(down);
							break;
						case 'mbRotate':
						    msg = editor.ui.trans.DrawState.ROTATE;
							tBtn.data('isDown', false).removeClass(down);
							sBtn.data('isDown', false).removeClass(down);
							break;
						case 'mbScale':
						    msg = editor.ui.trans.DrawState.SCALE;
							tBtn.data('isDown', false).removeClass(down);
							rBtn.data('isDown', false).removeClass(down);
							break;
					}
					
					if (isDown) {						
						msg = editor.ui.trans.DrawState.NONE;
					}
						
		            view.notifyListeners(editor.EventTypes.ManipState, msg);
					elem.data('isDown', !isDown);
					
					if (isDown) {
						elem.removeClass(down);
					}
					else {
						elem.addClass(down);
					}
		        })
		        .data('isDown', false);
				
				view.actionBar.addWidget(widget);
			};
			
			widget.layout();
			
			this.abWgt = widget;		
		},
		
		transformDeselected: function() {
			var wgt = this.abWgt;
			
			wgt.manipSection.hide();
			wgt.effectsSection.hide();
		},
		
		transformSelected: function(transform) {
			var param = transform.getParam('opacity'),
				wgt = this.abWgt;
			
			wgt.manipSection.show();
			wgt.effectsSection.show();
			wgt.slider.slider('value', param == null ? 100 : param.value * 100); 
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////
	
	editor.tools.ModelBrowserController = editor.ui.ToolController.extend({
		init: function() {
			this._super();
		},
				
		/**
		 * Sets the selector model to the given model.  If the model browser view
		 * and model are already given, this calls bindEvents().
		 *
		 * @param {editor.tools.SelectorModel} model the new model
		 */
		setSelectorModel: function(model) {
			this.selModel = model;
			
			if (this.checkBindEvents()) {
				this.bindEvents();
			}
		},
		
		/**
		 * Overrides editor.ui.ToolController.checkBindEvents()
		 *
		 * Returns true if the orthographic model, wireframe model, and view are all
		 * set.
		 *
		 * @return true if orthographic model, wireframe model, and view are all
		 *      set, false otherwise.
		 */
		checkBindEvents: function() {
			return this.selModel && this.model && this.view;
		},
		
		/**
		 * Binds event and message handlers to the view and model this object
		 * references.
		 */
		bindEvents: function() {
			this._super();
			
			var model = this.model,
				selModel = this.selModel,
				view = this.view,
				mbrWgt = view.sidePanel.modelTreeWidget,
				hidWgt = view.sidePanel.hiddenItemsWidget,
				opaWgt = view.bottomPanel.opacityWidget,
				adjWgt = view.bottomPanel.adjustWidget,
				visWgt = view.bottomPanel.visibilityWidget,
				detWgt = view.bottomPanel.detailsWidget,
				infoDisp = view.infoDisplay;
			
			selModel.curHandle.setDrawCallback(function() {
				infoDisp.refresh();
			});
			
			// for when the tool gets selected/deselected	
			view.addListener(editor.EventTypes.ToolModeSet, function(value) {
				var isDown = value.newMode === editor.ui.ToolConstants.MODE_DOWN,
					wasDown = value.oldMode === editor.ui.ToolConstants.MODE_DOWN,
					savedState = selModel.savedDrawState,
					handle = selModel.curHandle;
				selModel.enableSelection(isDown);
				
				if (isDown && savedState != null) {
					handle.setDrawState(savedState);
				}
				else if (!isDown && wasDown) {
					selModel.savedDrawState = selModel.curHandle.drawState;
					handle.setDrawState(editor.ui.trans.DrawState.NONE);
				}
				
				infoDisp.setVisible(isDown && infoDisp.currentOwner != null);
				hidWgt.setVisible(isDown && hidWgt.hiddenItems.size() > 0);
			});	        
			
			// hidden list widget specific
			hidWgt.addListener(editor.EventTypes.SetPickable, function(data) {
				selModel.setTransformPickable(data.tran, data.pick);
			});
			hidWgt.addListener(editor.EventTypes.ShowHiddenItem, function(transform) {
                selModel.showTransform(transform);
			});
			
			// mdl browser widget specific
			mbrWgt.addListener(editor.EventTypes.SelectTreeItem, function(value) {
				if (value.type === 'transform') {
					if (!value.mouseEvent.shiftKey) {
						selModel.deselectAll();
					}
					
					selModel.selectTransform(value.transform);
				} else if (value.type === 'material') {
					selModel.deselectAll();
					detWgt.set(value, DetailsType.MATERIAL);
					view.bottomPanel.setVisible(true);
					// TODO: Do something useful like highlight the material so
					// that the user can see what shapes use it. ~ekitson
				}
			});			
			mbrWgt.addListener(editor.EventTypes.DeselectTreeItem, function(data) {
				if (data.type === 'transform') {
					selModel.deselectTransform(data.node);
				} else {
					infoDisp.deselect();
				}
			});
			mbrWgt.addListener(editor.EventTypes.SetShape, function(data) {
				if (data !== null) {
					selModel.selectShape(data.shape, data.transform);
				} else {
					selModel.deselectShape();
				}
			});
			mbrWgt.addListener(editor.EventTypes.SetTexture, function(data) {
				if (data !== null) {
					infoDisp.setTexture(data.texture, data.model);
				} else {
					infoDisp.deselect();
				}
			});
			
			// bottom panel			  
	        adjWgt.addListener(editor.EventTypes.ManipState, function(state) {
				selModel.setManipState(state);
	        });
	        opaWgt.addListener(editor.EventTypes.SetTransOpacity, function(opacity) {
				selModel.setOpacity(opacity);
	        });
	        visWgt.addListener(editor.EventTypes.ShowPicked, function(value) {
				if (value) {
	                selModel.showSelected();
				} else {
	                selModel.hideSelected();
				}
			});
			
			// info display specific
			infoDisp.addListener(editor.EventTypes.TextureReady, function(value) {
				var isDown = view.mode === editor.ui.ToolConstants.MODE_DOWN;
				infoDisp.setVisible(isDown);
	        });
			
			// mbr model specific
			model.addListener(editor.EventTypes.AddModel, function(json) {
				mbrWgt.addModel(json);
			});			
	        model.addListener(editor.EventTypes.RemoveModel, function(model) {
	            mbrWgt.removeModel(model);
				hidWgt.removeOwner(model);
				
				if (infoDisp.currentOwner != null 
						&& model.getId() === infoDisp.currentOwner.getId()) {
					infoDisp.deselect();			
				}
	        });	
			model.addListener(editor.EventTypes.AddUserCreatedShape, function(json) {
				var isDown = view.mode == editor.ui.ToolConstants.MODE_DOWN,
					shape = json.metadata.actualNode;
				
				mbrWgt.addShape(json);
				
				if (shape.transform.visible === false) {
					hidWgt.addHiddenItem(shape.transform, shape);
					hidWgt.setVisible(isDown);
				}
			});		
			model.addListener(editor.EventTypes.RemoveUserCreatedShape, function(shape) {
				mbrWgt.removeShape(shape);
				hidWgt.removeOwner(shape);
				
				if (infoDisp.currentOwner != null 
						&& shape.getId() === infoDisp.currentOwner.getId()) {
					infoDisp.deselect();
				}
				selModel.deselectTransform(shape.getTransform());
			});		
			model.addListener(editor.EventTypes.UpdateUserCreatedShape, function(shapeObj) {
				var isDown = view.mode == editor.ui.ToolConstants.MODE_DOWN,
					shape = shapeObj.shape;
				mbrWgt.updateShape(shapeObj.shapeData, shape);
				
				if (infoDisp.currentOwner != null 
						&& shape.getId() === infoDisp.currentOwner.getId()) {
					var tfm = shape.getTransform(),
						shp = tfm.shapes[0];
						
					infoDisp.deselect();
					selModel.selectTransform(tfm);
					selModel.selectShape(shp, tfm);
					infoDisp.setShape(shape.getTransform().shapes[0], shape);
					infoDisp.setVisible(isDown);
				}
			});			
	        model.addListener(editor.EventTypes.WorldLoaded, function() {
	            infoDisp.createHud();
	        });
			
			// select model specific
			selModel.addListener(editor.EventTypes.PickableSet, function(data) {
	            hidWgt.setPickable(data.tran, data.pick);
	        });
			selModel.addListener(editor.EventTypes.ShapeSelected, function(shapeInfo) {
				var isDown = view.mode == editor.ui.ToolConstants.MODE_DOWN;
				
				if (shapeInfo === null) {
					infoDisp.deselect();
				} else {
					infoDisp.setShape(shapeInfo.shape, shapeInfo.owner);
					infoDisp.setVisible(isDown);
				}
			});
			selModel.addListener(editor.EventTypes.TransformDeselected, function(transform) {
				mbrWgt.deselectNode(getNodeId(transform));
				view.transformDeselected();
			});
	        selModel.addListener(editor.EventTypes.TransformHidden, function(obj) {
				var isDown = view.mode == editor.ui.ToolConstants.MODE_DOWN;
	            hidWgt.addHiddenItem(obj.transform, obj.owner);
				hidWgt.setVisible(isDown);
	        });
			selModel.addListener(editor.EventTypes.TransformSelected, function(transform) {
				mbrWgt.selectNode(getNodeId(transform));
				view.transformSelected(transform);
				detWgt.set(transform, DetailsType.TRANSFORM);
				visWgt.set(transform);
				view.bottomPanel.setVisible(true);
			});
	        selModel.addListener(editor.EventTypes.TransformShown, function(transform) {
	            hidWgt.removeHiddenItem(transform);
	        });
		}
	});
	
	return editor;
})(editor || {});
