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
	o3djs.require('editor.ui.detailsList');
	
	module.tools = module.tools || {};
	
    module.tools.ToolConstants = module.tools.ToolConstants || {};
	module.tools.ToolConstants.EDITOR_PREFIX = 'EditorCitizen:';
    module.tools.ToolConstants.SEL_HIGHLIGHT = 'selectorHighlight';
    module.tools.ToolConstants.X_AXIS = 'x';
    module.tools.ToolConstants.Y_AXIS = 'y';
    module.tools.ToolConstants.Z_AXIS = 'z';
    module.tools.ToolConstants.XY_PLANE = 'xyPlane';
    module.tools.ToolConstants.XZ_PLANE = 'xzPlane';
    module.tools.ToolConstants.YZ_PLANE = 'yzPlane';
	
	module.EventTypes = module.EventTypes || {};
	
	// modelbrowser model events
	module.EventTypes.AddModel = "modelbrowser.AddModel";
    module.EventTypes.RemoveModel = "modelbrowser.RemoveModel";
	module.EventTypes.AddUserCreatedShape = "modelbrowser.AddUserCreatedShape";
	module.EventTypes.RemoveUserCreatedShape = "modelbrowser.RemoveUserCreatedShape";
	module.EventTypes.UpdateUserCreatedShape = "modelbrowser.UpdateUserCreatedShape";
	module.EventTypes.WorldLoaded = "modelbrowser.WorldLoaded";
	
	// view events
    module.EventTypes.ShowPicked = "modelbrowser.ShowPicked";
    module.EventTypes.ManipState = "modelbrowser.ManipState";
	
	// selector model events
	module.EventTypes.ShapeSelected = "selector.ShapeSelected";
	module.EventTypes.TransformDeselected = "selector.TransformDeselected";
	module.EventTypes.TransformHidden = "selector.TransformHidden";
	module.EventTypes.TransformSelected = "selector.TransformSelected";
	module.EventTypes.TransformShown = "selector.TransformShown";
	
	// hidden items sidebar widget events
    module.EventTypes.ShowHiddenItem = "hiddenItems.ShowHiddenItem";
	
	// model tree sidebar widget events
	module.EventTypes.DeselectTreeItem = "modelbrowser.DeselectTreeItem";
	module.EventTypes.SelectTreeItem = "modelbrowser.SelectTreeItem";
	module.EventTypes.SetShape = "modelbrowser.SetShape";
	module.EventTypes.SetTexture = "modelbrowser.SetTexture";
	
	// info display events
    module.EventTypes.TextureReady = "infoDisplay.TextureReady";
	
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
	
	module.tools.ModelBrowserModel = module.tools.ToolModel.extend({
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
		},
			
		worldCleaned: function() {			
			for (var ndx = 0, len = this.models.length; ndx < len; ndx++) {
				this.notifyListeners(module.EventTypes.RemoveModel, this.models[ndx]);
			}
			
			for (var ndx = 0, len = this.shapes.length; ndx < len; ndx++) {
				var s = hemi.world.getCitizenById(this.shapes[ndx]);
				this.notifyListeners(module.EventTypes.RemoveUserCreatedShape, s);
			}
			
			this.models = [];
			this.shapes = [];
		},
			
		worldLoaded: function() {
			this.notifyListeners(module.EventTypes.WorldLoaded, null);
		},
		
		addModel: function(model) {
			var json = this.createJsonObj(model);
			this.models.push(model);
			this.notifyListeners(module.EventTypes.AddModel, json);
		},
		
		addShape: function(shape) {
			var json = this.createJsonObj(shape);
			this.shapes.push(shape.getId());
			this.notifyListeners(module.EventTypes.AddUserCreatedShape, json);
		},
		
		removeShape: function(shape) {
			var ndx = jQuery.inArray(shape.getId(), this.shapes);			
			this.shapes.splice(ndx, 1);
			
			this.notifyListeners(module.EventTypes.RemoveUserCreatedShape, shape);
		},
		
		updateShape: function(shape) {
			var json = this.createJsonObj(shape);
			var ndx = jQuery.inArray(shape.getId(), this.shapes);
			this.shapes[ndx] = shape;
			
			this.notifyListeners(module.EventTypes.UpdateUserCreatedShape, {
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
    module.tools.SelectorModel = module.tools.ToolModel.extend({
		init: function() {
        	this._super();
	        
			this.selected = new Hashtable();
	        this.highlightedShapes = new Hashtable();
			this.rotationAmount = 0.785398163; // 45 degrees
			this.currentShape = null;
			this.msgHandler = null;
			this.shapHighlightMat = null;
	        this.tranHighlightMat = null;
			this.curHandle = new module.ui.TransHandles();
	        
	        this.initSelectorUI();
			var that = this;
			
			hemi.msg.subscribe(hemi.msg.load,
				function(msg) {
					if (msg.src instanceof hemi.model.Model) {
						that.processModel(msg.src);
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
			if (this.currentShape !== null) {
				var elements = this.currentShape.elements;
				
				for (var ee = 0; ee < elements.length; ee++) {
					elements[ee].material = this.tranHighlightMat;
				}
				
				this.currentShape = null;
				this.notifyListeners(module.EventTypes.ShapeSelected, null);
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
					this.notifyListeners(module.EventTypes.ShapeSelected, null);
					this.unhighlightTransform(transform);
					this.notifyListeners(module.EventTypes.TransformDeselected, transform);
				}
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
            this.notifyListeners(module.EventTypes.TransformHidden, {
				transform: transform,
				owner: opt_owner
			});
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
			this.tranHighlightMat.name = module.tools.ToolConstants.SEL_HIGHLIGHT;
			this.shapHighlightMat.state = state;
			this.shapHighlightMat.name = module.tools.ToolConstants.SEL_HIGHLIGHT + 'Shape';
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
			var transform = pickInfo.shapeInfo.parent.transform,
				owner = hemi.world.getTranOwner(transform);
			
			if (this.isSelected(transform) && mouseEvent.shiftKey) {
				this.deselectTransform(transform, owner);
			} else {
				if (!mouseEvent.shiftKey) {
					this.deselectAll();
				}
				
				this.selectTransform(transform, owner);
			}
	    },
	    
	    processModel: function(model) {
			var updates = model.transformUpdates;
			
			for (var ndx = 0, len = updates.length; ndx < len; ndx++) {
	            var update = updates[ndx];
				
	            if (update.visible === false) {
					this.hideTransform(update.transform, model);
	            }
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
				if (this.currentShape !== null) {
					var elements = this.currentShape.elements;
					
					for (var ee = 0; ee < elements.length; ee++) {
						elements[ee].material = this.tranHighlightMat;
					}
				}
				
				var elements = highlightShape.elements;
				
				for (var ee = 0; ee < elements.length; ee++) {
					elements[ee].material = this.shapHighlightMat;
				}
				
				this.currentShape = highlightShape;
				this.notifyListeners(module.EventTypes.ShapeSelected, {
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
			this.notifyListeners(module.EventTypes.TransformSelected, transform);
		},
		
		setManipState: function(state) {
			this.curHandle.setDrawState(state);
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
            this.notifyListeners(module.EventTypes.TransformShown, transform);
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
			this.curHandle.setDrawState(module.ui.trans.DrawState.NONE);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                              Sidebar Widget                                //
//////////////////////////////////////////////////////////////////////////////// 

	
	module.tools.ChildLIWidget = module.ui.ListItemWidget.extend({
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
	
	/*
	 * Configuration object for the ModelTreeSBWidget.
	 */
	module.tools.ModelTreeSBWidgetDefaults = {
		uiFile: 'js/editor/tools/html/modelbrowser.htm',
		name: 'modelTreeSBWidget'
	};
	
	module.tools.ModelTreeSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.ModelTreeSBWidgetDefaults, options);
	        this._super(newOpts);
			
			this.tree = null;
			this.treeParent = null;
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
			
			this.tree = this.find('#mbtree');
			this.treeParent = this.tree.parent();
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
							wgt.notifyListeners(module.EventTypes.SelectTreeItem, {
								transform: metadata.actualNode,
								node: elem,
								mouseEvent: data.args[2],
								type: metadata.type
							});
							wgt.tree.jstree('toggle_node', elem);
						} else {
							jQuery('#mbTreeWrapper').scrollTo(elem, 400);
						}
						
						wgt.displayTransformNode(metadata.actualNode);
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
						
						wgt.notifyListeners(module.EventTypes.SelectTreeItem, {
							owner: model,
							material: material,
							type: metadata.type
						});
						
						wgt.displayMaterialNode(material, model);
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
					wgt.notifyListeners(module.EventTypes.DeselectTreeItem, {
						node: metadata.actualNode,
						type: metadata.type
					});
				}
			})
			.jstree({
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
			
			this.instructions = jQuery('<p>Click on an item in the browser or on an item in the viewer to view its details.</p>');
		},
		
		displayMaterialNode: function(material, model) {
			var detailsList = new module.ui.DetailsList(),
				params = material.params,
				textures = {},
				texList = new module.ui.ListWidget({
					widgetId: 'mbrTextureList',
					prefix: 'mbrTexLst',
					type: module.ui.ListType.UNORDERED
				}),
				wgt = this;
			
			detailsList.addItem('Name:', material.name);
			
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
					item = new module.tools.ChildLIWidget();
				
				item.setText(name);
				item.attachObject({
					model: model,
					texture: tex
				});
				item.title.data('liWidget', item);
				item.title.bind('click', function(evt) {
					var item = jQuery(this).data('liWidget'),
						data = item.getAttachedObject();
					wgt.notifyListeners(module.EventTypes.SetTexture, data);
				});
				item.removeBtn.bind('click', function(evt) {
					wgt.notifyListeners(module.EventTypes.SetTexture, null);
				});
				
				texList.add(item);
			}
			
			jQuery('#mbDetails').empty().append(detailsList.getList());
			jQuery('#mbChildren').empty().append(texList.getUI());
			jQuery('#mbChildrenTitle').text('Textures');
		},
		
		displayTransformNode: function(transform) {
			var detailsList = new module.ui.DetailsList(),
				shapes = transform.shapes,
				shapeList = new module.ui.ListWidget({
					widgetId: 'mbrShapeList',
					prefix: 'mbrShpLst',
					type: module.ui.ListType.UNORDERED
				}),
				worldMatrix = transform.getUpdatedWorldMatrix(),
				wgt = this;
			
			for (var i = 0, il = worldMatrix.length; i < il; i++) {
				for (var j = 0, jl = worldMatrix[i].length; j < jl; j++) {
					worldMatrix[i][j] = module.utils.roundNumber(worldMatrix[i][j], 5);
				}
			}
			
			detailsList.addItem('Name:', transform.name);
			detailsList.addItem('World Matrix:', worldMatrix);
			
			for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
				var shape = shapes[ndx],
					name = shape.name !== '' ? shape.name : 'unnamed'; 
				
				if (name.match(HIGHLIGHT_PRE) === null) {
					var item = new module.tools.ChildLIWidget();
					
					item.setText(name);
					item.attachObject({
						transform: transform,
						shape: shape
					});
					item.title.data('liWidget', item);
					item.title.bind('click', function(evt) {
						var item = jQuery(this).data('liWidget'),
							data = item.getAttachedObject();
						wgt.notifyListeners(module.EventTypes.SetShape, data);
					});
					item.removeBtn.bind('click', function(evt) {
						wgt.notifyListeners(module.EventTypes.SetShape, null);
					});
					
					shapeList.add(item);
				}
			};
			
			jQuery('#mbDetails').empty().append(detailsList.getList());
			jQuery('#mbChildren').empty().append(shapeList.getUI());
			jQuery('#mbChildrenTitle').text('Shapes');
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
			this.notifyListeners(module.EventTypes.SBWidgetInvalidate);
		},
		
		deselectNode: function(nodeName) {
	        var node = jQuery('#node_' + nodeName);
			this.tree.jstree('deselect_node', node);
			jQuery('#mbDetails').empty().append(this.instructions);
			jQuery('#mbChildren').empty();
			jQuery('#mbChildrenTitle').empty();
		},
		
		deselectAll: function() {
			this.tree.jstree('deselect_all');
			jQuery('#mbDetails').empty().append(this.instructions);
			jQuery('#mbChildren').empty();
			jQuery('#mbChildrenTitle').empty();
		},
		
		addModel: function(modelData) {
			this.tree.jstree('create_node', jQuery('#node_models'), 
				'inside', {
					json_data: modelData
				});
		},
		
		removeModel: function(model) {
			var node = jQuery('#node_' + getNodeId(model));
			this.tree.jstree('delete_node', node);
		},
		
		addShape: function(shapeData) {
			this.tree.jstree('create_node', jQuery('#node_shapes'), 
				'inside', {
					json_data: shapeData
				});
		},
		
		removeShape: function(shape) {
			var node = jQuery('#node_' + getNodeId(shape));
			this.tree.jstree('delete_node', node);
		},
		
		updateShape: function(shapeData, shape) {
			// shape transforms may invariably change so we need to replace the
			// whole node
			var node = jQuery('#node_' + getNodeId(shape));
			this.tree.jstree('create_node', node, 'after', {
				json_data: shapeData
			});
			this.tree.jstree('delete_node', node);
		},
		
		resize: function(maxHeight) {
			this._super(maxHeight);	
			var treePane = this.find('#mbTreePane'),	
				
			// now determine details pane height
				detHeight = this.find('#mbDetailsPane').outerHeight(true),
			
			// get the tree pane header height
				hdrHeight = this.find('#mbTreePane h1').outerHeight(true),
			
			// adjust the tree pane height
			 	treeHeight = maxHeight - detHeight - hdrHeight;
			
			if (treeHeight > 0) {
				this.find('#mbTreeWrapper').height(treeHeight);
			}
		}
	});
	
	module.ui.HiddenItemLIWidget = module.ui.ListItemWidget.extend({
		init: function() {
			this._super();
		},
						
		finishLayout: function() {
			this.container = jQuery('<div></div>');
			this.title = jQuery('<span></span>');
			this.showBtn = jQuery('<button class="removeBtn">Show</button>');
			var btnDiv = jQuery('<div class="buttonContainer"></div>');
			
			btnDiv.append(this.showBtn);
			this.container.append(this.title).append(btnDiv);
		},
		
		setText: function(text) {
			this.title.text(text);
		},
		
		attachModel: function(model) {
			this.model = model;
		}
	});
	
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.HiddenItemsSBWidgetDefaults = {
		name: 'hiddenItemsSBWidget',
		manualVisible: true
	};
	
	module.tools.HiddenItemsSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.HiddenItemsSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.hiddenItems = new Hashtable();		
			this.ownerTransHash = new Hashtable();
		},
		
		finishLayout: function() {
			this._super();
			this.title = jQuery('<h1>Hidden Items</h1>');
			
			this.list = new module.ui.ListWidget({
				widgetId: 'mbrHiddenList',
				prefix: 'mbrHidLst',
				type: module.ui.ListType.UNORDERED
			});
			
			this.container.append(this.title).append(this.list.getUI());
		},
		
	    addHiddenItem: function(transform, owner) {
			if (!this.hiddenItems.containsKey(transform.clientId)) {
				var li = new module.ui.HiddenItemLIWidget(),
	            	wgt = this;
					
				li.setText(transform.name);
				li.attachObject(transform);
				
				li.showBtn.bind('click', function(evt) {
					var transform = li.getAttachedObject();
					wgt.notifyListeners(module.EventTypes.ShowHiddenItem, transform);
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
			
			// get the header height
				hdrHeight = this.title.outerHeight(true),
			
			// adjust the list pane height
			 	listHeight = maxHeight - hdrHeight;
				
			if (listHeight > 0) {
				list.height(listHeight);
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
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    	
	
	module.tools.InfoDisplay = module.utils.Listenable.extend({
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
			this.nameText.name = module.tools.ToolConstants.EDITOR_PREFIX + 'ShapeName';
			this.nameText.setWidth(300);
			this.nameText.setConfig(textConfig);
			this.nameText.y = 15;
			
			this.boundTitle = new hemi.hud.HudText();
			this.boundTitle.name = module.tools.ToolConstants.EDITOR_PREFIX + 'ShapeBound';
			this.boundTitle.setWidth(300);
			this.boundTitle.setConfig(textConfig);
			this.boundTitle.setText('Bounding Box:');
			
			this.boundMin = new hemi.hud.HudText();
			this.boundMin.name = module.tools.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMin';
			this.boundMin.setWidth(300);
			this.boundMin.setConfig(textConfig);
			this.boundMin.setText('Min Extent:');
			
			this.boundMax = new hemi.hud.HudText();
			this.boundMax.name = module.tools.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMax';
			this.boundMax.setWidth(300);
			this.boundMax.setConfig(textConfig);
			this.boundMax.setText('Max Extent:');
			
			this.boundMinX = new hemi.hud.HudText();
			this.boundMinX.name = module.tools.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMinX';
			this.boundMinX.setWidth(300);
			this.boundMinX.setConfig(textConfig);
			this.boundMinY = new hemi.hud.HudText();
			this.boundMinY.name = module.tools.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMinY';
			this.boundMinY.setWidth(300);
			this.boundMinY.setConfig(textConfig);
			this.boundMinZ = new hemi.hud.HudText();
			this.boundMinZ.name = module.tools.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMinZ';
			this.boundMinZ.setWidth(300);
			this.boundMinZ.setConfig(textConfig);
			
			
			this.boundMaxX = new hemi.hud.HudText();
			this.boundMaxX.name = module.tools.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMaxX';
			this.boundMaxX.setWidth(300);
			this.boundMaxX.setConfig(textConfig);
			this.boundMaxY = new hemi.hud.HudText();
			this.boundMaxY.name = module.tools.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMaxY';
			this.boundMaxY.setWidth(300);
			this.boundMaxY.setConfig(textConfig);
			this.boundMaxZ = new hemi.hud.HudText();
			this.boundMaxZ.name = module.tools.ToolConstants.EDITOR_PREFIX + 'ShapeBoundMaxZ';
			this.boundMaxZ.setWidth(300);
			this.boundMaxZ.setConfig(textConfig);
			
			var page = new hemi.hud.HudPage();
			page.name = module.tools.ToolConstants.EDITOR_PREFIX + 'ShapePage';
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
			page2.name = module.tools.ToolConstants.EDITOR_PREFIX + 'TexturePage';
			page2.setConfig({
				color: [0, 0, 0, 0.3]
			});
			
			this.display = new hemi.hud.HudDisplay();
			this.display.name = module.tools.ToolConstants.EDITOR_PREFIX + 'ModelBrowserDisplay';
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
						that.notifyListeners(module.EventTypes.TextureReady, null);
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
							that.notifyListeners(module.EventTypes.TextureReady, null);
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
			this.boundMinX.setText('x: ' + module.utils.roundNumber(minExtent[0], 5));
			this.boundMinY.setText('y: ' + module.utils.roundNumber(minExtent[1], 5));
			this.boundMinZ.setText('z: ' + module.utils.roundNumber(minExtent[2], 5));
			this.boundMaxX.setText('x: ' + module.utils.roundNumber(maxExtent[0], 5));
			this.boundMaxY.setText('y: ' + module.utils.roundNumber(maxExtent[1], 5));
			this.boundMaxZ.setText('z: ' + module.utils.roundNumber(maxExtent[2], 5));
			
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
				
				this.notifyListeners(module.EventTypes.TextureReady, null);
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
	module.tools.ModelBrowserViewDefaults = {
		axnBarId: 'mbActionBar',
		toolName: 'Model Browser',
		toolTip: 'Model Browser: browses transforms and shapes in models',
		widgetId: 'modelBrowserBtn'
	};
	
	module.tools.ModelBrowserView = module.tools.ToolView.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.ModelBrowserViewDefaults, options);
			this._super(newOpts);
			
			this.isDown = false;
			this.infoDisplay = new module.tools.InfoDisplay();
			
			this.addSidebarWidget(new module.tools.ModelTreeSBWidget());
			this.addSidebarWidget(new module.tools.HiddenItemsSBWidget());
		},
		
		layoutActionBar: function() {
			var widget = new module.ui.ActionBarWidget({
				uiFile: 'js/editor/tools/html/modelbrowserAxnBar.htm',
				immediateLayout: false
			});
			var view = this;
			
			widget.finishLayout = function() {
				var manipBtns = widget.find('#mbTranslate, #mbRotate, #mbScale'),
					tBtn = manipBtns.filter('#mbTranslate'),
					rBtn = manipBtns.filter('#mbRotate'),
					sBtn = manipBtns.filter('#mbScale'),
					down = module.tools.ToolConstants.MODE_DOWN;
									
		        widget.find('form').submit(function() {
		            return false;
		        });
		        
		        widget.find('#mbHide').bind('click', function(evt) {
		            view.notifyListeners(module.EventTypes.ShowPicked, false);
		        });
		        
		        widget.find('#mbShow').bind('click', function(evt) {
					view.notifyListeners(module.EventTypes.ShowPicked, true);
		        });
		        
		        widget.find('#mbShowAll').bind('click', function(evt) {
					view.hiddenItemsSBWidget.showAll();
		        });
		        
		        widget.find('#mbShowHiddenItemsDlg').bind('click', function(evt) {
		            var isVisible = view.hiddenItemsSBWidget.isVisible();
		            view.hiddenItemsSBWidget.setVisible(!isVisible);
		        });
		        
		        manipBtns.bind('click', function(evt) {
					var elem = jQuery(this),
						id = elem.attr('id'),
						isDown = elem.data('isDown'),
						msg;
						
					switch(id) {
						case 'mbTranslate':
						    msg = module.ui.trans.DrawState.TRANSLATE;
							rBtn.data('isDown', false).removeClass(down);
							sBtn.data('isDown', false).removeClass(down);
							break;
						case 'mbRotate':
						    msg = module.ui.trans.DrawState.ROTATE;
							tBtn.data('isDown', false).removeClass(down);
							sBtn.data('isDown', false).removeClass(down);
							break;
						case 'mbScale':
						    msg = module.ui.trans.DrawState.SCALE;
							tBtn.data('isDown', false).removeClass(down);
							rBtn.data('isDown', false).removeClass(down);
							break;
					}
					
					if (isDown) {						
						msg = module.ui.trans.DrawState.NONE;
					}
						
		            view.notifyListeners(module.EventTypes.ManipState, msg);
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
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////
	
	module.tools.ModelBrowserController = module.tools.ToolController.extend({
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
		 * Overrides editor.tools.ToolController.checkBindEvents()
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
				mbrWgt = view.modelTreeSBWidget,
				hidWgt = view.hiddenItemsSBWidget,
				infoDisp = view.infoDisplay;
			
			selModel.curHandle.setDrawCallback(function() {
				infoDisp.refresh();
			});
			
			// for when the tool gets selected/deselected	
			view.addListener(module.EventTypes.ToolModeSet, function(value) {
				var isDown = value.newMode === module.tools.ToolConstants.MODE_DOWN,
					wasDown = value.oldMode === module.tools.ToolConstants.MODE_DOWN,
					savedState = selModel.savedDrawState,
					handle = selModel.curHandle;
				selModel.enableSelection(isDown);
				
				if (isDown && savedState != null) {
					handle.setDrawState(savedState);
				}
				else if (!isDown && wasDown) {
					selModel.savedDrawState = selModel.curHandle.drawState;
					handle.setDrawState(module.ui.trans.DrawState.NONE);
				}
				
				infoDisp.setVisible(isDown && infoDisp.currentOwner != null);
				hidWgt.setVisible(isDown && hidWgt.hiddenItems.size() > 0);
			});	        
			
			// hidden list widget specific
			hidWgt.addListener(module.EventTypes.ShowHiddenItem, function(transform) {
                selModel.showTransform(transform);
			});
			
			// mdl browser widget specific
			mbrWgt.addListener(module.EventTypes.SelectTreeItem, function(value) {
				if (value.type === 'transform') {
					if (!value.mouseEvent.shiftKey) {
						selModel.deselectAll();
					}
					
					selModel.selectTransform(value.transform);
				} else if (value.type === 'material') {
					selModel.deselectAll();
					// TODO: Do something useful like highlight the material so
					// that the user can see what shapes use it. ~ekitson
				}
			});			
			mbrWgt.addListener(module.EventTypes.DeselectTreeItem, function(data) {
				if (data.type === 'transform') {
					selModel.deselectTransform(data.node);
				} else {
					infoDisp.deselect();
				}
			});
			mbrWgt.addListener(module.EventTypes.SetShape, function(data) {
				if (data !== null) {
					selModel.selectShape(data.shape, data.transform);
				} else {
					selModel.deselectShape();
				}
			});
			mbrWgt.addListener(module.EventTypes.SetTexture, function(data) {
				if (data !== null) {
					infoDisp.setTexture(data.texture, data.model);
				} else {
					infoDisp.deselect();
				}
			});
			
			// view specific  
	        view.addListener(module.EventTypes.ManipState, function(state) {
				selModel.setManipState(state);
	        });
	        view.addListener(module.EventTypes.ShowPicked, function(value) {
				if (value) {
	                selModel.showSelected();
				} else {
	                selModel.hideSelected();
				}
			});
			
			// info display specific
			infoDisp.addListener(module.EventTypes.TextureReady, function(value) {
				var isDown = view.mode === module.tools.ToolConstants.MODE_DOWN;
				infoDisp.setVisible(isDown);
	        });
			
			// mbr model specific
			model.addListener(module.EventTypes.AddModel, function(json) {
				mbrWgt.addModel(json);
			});			
	        model.addListener(module.EventTypes.RemoveModel, function(model) {
	            mbrWgt.removeModel(model);
				hidWgt.removeOwner(model);
				
				if (infoDisp.currentOwner != null 
						&& model.getId() === infoDisp.currentOwner.getId()) {
					infoDisp.deselect();			
				}
	        });	
			model.addListener(module.EventTypes.AddUserCreatedShape, function(json) {
				var isDown = view.mode == module.tools.ToolConstants.MODE_DOWN,
					shape = json.metadata.actualNode;
				
				mbrWgt.addShape(json);
				
				if (shape.transform.visible === false) {
					hidWgt.addHiddenItem(shape.transform, shape);
					hidWgt.setVisible(isDown);
				}
			});		
			model.addListener(module.EventTypes.RemoveUserCreatedShape, function(shape) {
				mbrWgt.removeShape(shape);
				hidWgt.removeOwner(shape);
				
				if (infoDisp.currentOwner != null 
						&& shape.getId() === infoDisp.currentOwner.getId()) {
					infoDisp.deselect();
				}
				selModel.deselectTransform(shape.getTransform());
			});		
			model.addListener(module.EventTypes.UpdateUserCreatedShape, function(shapeObj) {
				var isDown = view.mode == module.tools.ToolConstants.MODE_DOWN,
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
	        model.addListener(module.EventTypes.WorldLoaded, function() {
	            infoDisp.createHud();
	        });
			
			// select model specific
			selModel.addListener(module.EventTypes.ShapeSelected, function(shapeInfo) {
				var isDown = view.mode == module.tools.ToolConstants.MODE_DOWN;
				
				if (shapeInfo === null) {
					infoDisp.deselect();
				} else {
					infoDisp.setShape(shapeInfo.shape, shapeInfo.owner);
					infoDisp.setVisible(isDown);
				}
			});			
			selModel.addListener(module.EventTypes.TransformDeselected, function(transform) {
				mbrWgt.deselectNode(getNodeId(transform));
			});	        
	        selModel.addListener(module.EventTypes.TransformHidden, function(obj) {
				var isDown = view.mode == module.tools.ToolConstants.MODE_DOWN;
	            hidWgt.addHiddenItem(obj.transform, obj.owner);
				hidWgt.setVisible(isDown);
	        });			
			selModel.addListener(module.EventTypes.TransformSelected, function(transform) {
				mbrWgt.selectNode(getNodeId(transform));
			});	        
	        selModel.addListener(module.EventTypes.TransformShown, function(transform) {
	            hidWgt.removeHiddenItem(transform);
	        });
		}
	});
	
	return module;
})(editor || {});
