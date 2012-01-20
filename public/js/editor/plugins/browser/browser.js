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

(function() {
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                     			   			 Initialization  		                      		  //
////////////////////////////////////////////////////////////////////////////////////////////////////

	var shorthand = editor.tools.browser,
		wgtSuper = editor.ui.Widget.prototype,
		
		HILIGHT_COLOR = new THREE.Color(0x75d0f4),
		DEFAULT_COLOR = new THREE.Color(0xffffff),
		HIGHLIGHT_MAT = new THREE.MeshBasicMaterial({
			color: 0x75d0f4
		});

	shorthand.init = function() {
		var navPane = editor.ui.getNavPane('Geometry'),
			
			mbrMdl = new BrowserModel(),
			mbrView = new BrowserView(),
			mbrCtr = new BrowserController();
		
		mbrCtr.setModel(mbrMdl);
		mbrCtr.setView(mbrView);
		
		navPane.add(mbrView);
		
		var model = editor.getModel('shapes');
		
		if (model) {
			model.addListener(editor.events.Created, function(shape) {
				mbrMdl.addShape(shape);
			});
			model.addListener(editor.events.Removing, function(shape) {
				mbrMdl.removeShape(shape);
			});
			model.addListener(editor.events.Updated, function(shape) {
				mbrMdl.updateShape(shape);
			});
		} else {
			editor.addListener(editor.events.PluginLoaded, function(name) {
				if (name === 'shapes') {
					var model = editor.getModel(name);
					
					model.addListener(editor.events.Created, function(shape) {
						mbrMdl.addShape(shape);
					});
					model.addListener(editor.events.Removing, function(shape) {
						mbrMdl.removeShape(shape);
					});
					model.addListener(editor.events.Updated, function(shape) {
						mbrMdl.updateShape(shape);
					});
				}
			});
		}
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                     			  			Tool Definition  				                      //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
    shorthand.constants = {
		// TODO: We need a better way of testing for our highlight shapes than
		// searching for this prefix.
    	HIGHLIGHT_PRE: 'kuda_highlight_',
    	SEL_HIGHLIGHT: 'selectorHighlight'	
    };
	
	shorthand.events = {
		// browser model events
		AddUserCreatedShape: "browser.AddUserCreatedShape",
		LoadException: "browser.LoadException",
		PickableSet: "browser.PickableSet",
		RemoveUserCreatedShape: "browser.RemoveUserCreatedShape",
		ServerRunning: 'browser.ServerRunning',
		ShapeSelected: "browser.ShapeSelected",
		TransformDeselected: "browser.TransformDeselected",
		TransformHidden: "browser.TransformHidden",
		TransformSelected: "browser.TransformSelected",
		TransformShown: "browser.TransformShown",
		UpdateUserCreatedShape: "browser.UpdateUserCreatedShape",
		
		// view events
	    ShowPicked: "browser.ShowPicked",
	    ManipState: "browser.ManipState",
	    SetTransOpacity: "browser.SetTransOpacity",
		
		// hidden items widget events
		SetPickable: "browser.SetPickable",
	    ShowHiddenItem: "browser.ShowHiddenItem",
		
		// model tree widget events
		DeselectTreeItem: "browser.DeselectTreeItem",
		SelectTreeItem: "browser.SelectTreeItem",
		
		// loader widget events
		LoadModel: "browser.LoadModel",
		UnloadModel: "browser.UnloadModel"
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                          				  Helper Methods		                              //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var owners = new Hashtable();
		
	var createJsonObj = function(node, parentNode, owner) {
			var c = getNodeChildren(node),
				nodeType = getNodeType(node),
				children = [];
				
			if (owner) {
				owners.put(node, owner);
			}
			
			if (parentNode == null) {
				parentNode = node;
				owner = node;
			}
			
			for (var i = 0; c && i < c.length; i++) {
				var nodeJson = createJsonObj(c[i], parentNode, owner);
				children.push(nodeJson);
			}
			
			var tNode = {
				data: node.name,
				attr: {
					id: getNodeId(node),
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
		
		generateNodes = function(nodeName, closePath) {
			var paths = getNodePath(nodeName),
				toClose = [];
			
			for (var i = 0; i < paths.length; ++i) {
				var node = this.tree.find('#' + paths[i]);
				
				if (node.length > 0) {
					if (closePath && this.tree.jstree('is_closed', node)) {
						toClose.unshift(node);
					}
					
					this.tree.jstree('open_node', node, false, true);
				}
			}
			
			for (var i = 0; i < toClose.length; ++i) {
				this.tree.jstree('close_node', toClose[i], true);
			}
		},
		
		getNodePath = function(nodeName) {
			var ndx = nodeName.indexOf('_'),
				names = [];
			
			ndx = nodeName.indexOf('_', ndx + 1);
			
			while (ndx > -1) {
				names.push(nodeName.substr(0, ndx));
				ndx = nodeName.indexOf('_', ndx + 1);
			}
			
			return names;
		},
		
		getNodeChildren = function(node) {
			var children;
			
			if (node instanceof hemi.Model) {
				var citId = getCitNodeId(node),
					tranObj = {
						name: 'Transforms',
						children: [node.root],
						className: 'directory',
						nodeId: citId + '_trans'
					},
					matObj = {
						name: 'Materials',
						children: node.materials,
						className: 'directory',
						nodeId: citId + '_mats'
					};
			    children = [tranObj, matObj];
			} else if (node instanceof hemi.Shape) {
			    children = [{
						name: 'Transforms',
						children: [node.mesh],
						className: 'directory',
						nodeId: getCitNodeId(node) + '_trans'
					}];
			} else {
				children = node.children;
			}
			
			return children;
		},
		
		getCitNodeId = function(cit) {
			var id = 'br_';
			
			if (cit instanceof hemi.Model) {
				id += 'models_';
			} else if (cit instanceof hemi.Shape) {
				id += 'shapes_';
			} else if (cit instanceof hemi.Transform || cit instanceof hemi.Mesh) {
				var owner = owners.get(cit);
				id = getCitNodeId(owner) + '_trans' + getTransformPath(cit, owner);
			} 
			
			id += cit._getId();
			return id;
		},
	
		getNodeId = function(obj) {
			var isCitizen = obj._worldId != null,
				id = '';
			
			if (isCitizen) {
				id = getCitNodeId(obj);
			} else if (obj instanceof THREE.Material) {
				id = getCitNodeId(owners.get(obj)) + '_mats_' + obj.id;
			} else if (obj.className === 'directory') {
				id = obj.nodeId;
			}
			
			return id;
		},
		
		getNodeType = function(node) {
			var type = 'ojb';
			
			if (node instanceof hemi.Transform || node instanceof hemi.Mesh) {
				type = 'transform';
			}
			else if (node._worldId != null) {
				type = 'citizen';
			}
			else if (node instanceof THREE.Material) {
				type = 'material';
			}
			return type;
		},
		
		getTransformPath = function(transform, owner) {
			var path = '_', 
				parent = transform.parent;
			
			if (parent != editor.client.scene) {
				path = parent._getId() + path;
				path = getTransformPath(parent, owner) + path;	
			}
			
			return path;
		};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                            				Browser Model		                                  //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var BrowserModel = function() {
		editor.ToolModel.call(this, 'browser');
        
		this.selected = [];
        this.highlightedShapes = new Hashtable();
		this.currentShape = null;
		this.currentHighlightShape = null;
		this.currentTransform = null;
		this.msgHandler = null;
		this.shapHighlightMat = null;
        this.tranHighlightMat = null;
		this.curHandle = new editor.ui.TransHandles();
		this.models = [];
        
//        this.initSelectorUI();
		var mdl = this;
		
		hemi.subscribe(hemi.msg.load,
			function(msg) {
				if (msg.src instanceof hemi.Model) {
					mdl.processModel(msg.src);			
					mdl.notifyListeners(editor.events.Created, msg.src);
				}
			});
			
		jQuery.ajax({
			url: '/models',
			dataType: 'json',
			success: function(data, status, xhr) {	
				mdl.models = data.models;
				mdl.notifyListeners(shorthand.events.ServerRunning, 
					mdl.models);
			},					
			error: function(xhr, status, err) {
				mdl.serverDown = true;
				mdl.notifyListeners(shorthand.events.ServerRunning,
					null);
			}
		});
	};
		
	BrowserModel.prototype = new editor.ToolModel();
	BrowserModel.prototype.constructor = BrowserModel;
		
	BrowserModel.prototype.addModel = function(url, modelName) {
		var model = new hemi.Model(editor.client),
			that = this;
		model.name = modelName;
		model.setFileName(url);
	};
	
	BrowserModel.prototype.addShape = function(shape) {
		this.notifyListeners(shorthand.events.AddUserCreatedShape, shape);
	};
	
	BrowserModel.prototype.deselectAll = function() {
		for (var i = 0, il = this.selected.length; i < il; i++) {
			this.deselectTransform(this.selected[i]);
		}
	};
	
	BrowserModel.prototype.deselectGeometry = function() {
		if (this.currentHighlightShape !== null) {
			var elements = this.currentHighlightShape.elements;
			
			for (var ee = 0; ee < elements.length; ee++) {
				elements[ee].material = this.tranHighlightMat;
			}
			
			this.currentShape = this.currentHighlightShape = null;
			this.notifyListeners(shorthand.events.ShapeSelected, null);
		}
	};
	
	BrowserModel.prototype.deselectTransform = function(transform) {
		var children = transform.children;
		
		for (var ndx = 0, len = children.length; ndx < len; ndx++) {
			this.deselectTransform(children[ndx]);
		}
		
		var ndx = this.selected.indexOf(transform);
		
		if (ndx !== -1) {
			this.selected.splice(ndx, 1);
			this.currentShape = null;
			this.curHandle.setDrawState(editor.ui.trans.DrawState.NONE);
			this.curHandle.setTransform(null);
			this.notifyListeners(shorthand.events.ShapeSelected, null);
			this.unhighlightTransform(transform);
			this.notifyListeners(shorthand.events.TransformDeselected, transform);
		}
		
		if (this.currentTransform === transform) {
			this.currentTransform = null;
		}
	};
	
	BrowserModel.prototype.enableSelection = function(enable) {
		if (this.msgHandler !== null) {
			hemi.unsubscribe(this.msgHandler, hemi.msg.pick);
			this.msgHandler = null;
		}
		
		if (enable) {
			this.msgHandler = hemi.subscribe(
				hemi.msg.pick, 
				this, 
				"onPick", 
				[
					hemi.dispatch.MSG_ARG + "data.pickedMesh", 
					hemi.dispatch.MSG_ARG + "data.mouseEvent"
				]);
				
			this.highlightSelected();
		}
		else {
			this.unhighlightAll();
		}
	};
	
	BrowserModel.prototype.getSelectedTransforms = function() {
		return this.selected;
	};
    
    BrowserModel.prototype.hideSelected = function() {
		for (var i = 0, il = this.selected.length; i < il; i++) {
			this.hideTransform(this.selected[i]);
		}
    };
    
    BrowserModel.prototype.hideTransform = function(transform) {
		transform.visible = false;
		transform.pickable = false;
        this.notifyListeners(shorthand.events.TransformHidden, {
			transform: transform,
			owner: owners.get(transform)
		});
    };
	
	BrowserModel.prototype.highlightSelected = function() {
		for (var i = 0, il = this.selected.length; i < il; i++) {
			this.highlightTransform(this.selected[i]);
		}
	};
        
    BrowserModel.prototype.highlightTransform = function(transform) {
		var children = transform.children,
			geometry = transform.geometry;
		
		for (var ndx = 0, len = children.length; ndx < len; ndx++) {
			this.highlightTransform(children[ndx]);
		}
		
		if (geometry) {
//			transform.material.color = HILIGHT_COLOR;
//			geometry.materials.push(HIGHLIGHT_MAT);
		}
    };
	
	BrowserModel.prototype.isSelected = function(transform, opt_owner) {
		var transforms;
		
		if (opt_owner != null) {
			transforms = this.selected.get(opt_owner.getId());
		} else {
			transforms = this.getSelectedTransforms();
		}
		
		return transforms.indexOf(transform) !== -1;
	};
	
    BrowserModel.prototype.onPick = function(pickedMesh, mouseEvent) {
		if (!this.curHandle.down) {			
			if (this.isSelected(pickedMesh) && mouseEvent.shiftKey) {
				this.deselectTransform(pickedMesh);
			}
			else {
				if (!mouseEvent.shiftKey) {
					this.deselectAll();
				}
				
				this.selectTransform(pickedMesh);
			}
		}
    };
    
    BrowserModel.prototype.processModel = function(model) {
//		var updates = model.transformUpdates;
//		
//		for (var ndx = 0, len = updates.length; ndx < len; ndx++) {
//            var update = updates[ndx],
//				vis = update.visible,
//				pick = update.pickable;
//			
//            if (vis === false) {
//				this.hideTransform(update.transform, model);
//				
//				// Pickable will be false or null (not true)
//				if (pick === null) {
//					this.setTransformPickable(update.transform, true, model);
//				}
//            }
//        }
    };
	
	BrowserModel.prototype.removeModel = function(model) {
		var transforms = [].concat(this.selected);
		
		for (var i = 0, il = transforms.length; i < il; i++) {
			var transform = transforms[i],
				owner = owners.get(transform);
			
			if (owner === model) {
				this.deselectTransform(transform);
			}
		}
		
		model.cleanup();
		
		this.notifyListeners(editor.events.Removing, model);
	};
	
	BrowserModel.prototype.removeShape = function(shape) {
		this.deselectTransform(shape.getTransform());
		this.notifyListeners(shorthand.events.RemoveUserCreatedShape, shape);
	};
	
	BrowserModel.prototype.selectTransform = function(transform) {		
		// First clean out any child transforms or shapes that may have been
		// previously selected.
		this.deselectTransform(transform);
		
		var ndx = this.selected.indexOf(transform);
			
		if (this.selected.length === 0) {					
			this.curHandle.setTransform(transform);
		}
		if (ndx === -1) {
			this.selected.push(transform);
		}
					
		this.highlightTransform(transform);
		this.notifyListeners(shorthand.events.TransformSelected, transform);
		this.currentTransform = transform;
	};
	
	BrowserModel.prototype.setManipState = function(state) {
		this.curHandle.setDrawState(state);
	};
	
	BrowserModel.prototype.setOpacity = function(opacity, transform) {
		if (transform == null) {
			transform = this.currentTransform;
			transform.opacityVal = opacity;
		}
		
		if (transform instanceof hemi.Transform) {
			var children = transform.children;
			for (var i = 0, il = children.length; i < il; i++) {
				this.setOpacity(opacity, children[i]);
			}
		} else {			
			hemi.fx.setOpacity(editor.client, transform, opacity);
		}
	};
	
	BrowserModel.prototype.setTransformPickable = function(transform, pickable) {
		transform.pickable = pickable;
        this.notifyListeners(shorthand.events.PickableSet, {
			tran: transform,
			pick: pickable
		});
	};
    
    BrowserModel.prototype.showSelected = function() {
		for (var i = 0, il = this.selected.length; i < il; i++) {
			this.showTransform(this.selected[i]);
		}
    };
    
    BrowserModel.prototype.showTransform = function(transform, opt_owner) {
		transform.visible = true;
		transform.pickable = true;
        this.notifyListeners(shorthand.events.TransformShown, transform);
    };
	
	BrowserModel.prototype.unhighlightAll = function() {
		var owners = this.selected.values();
		
		for (var i = 0, il = owners.length; i < il; i++) {
			var transforms = owners[i];
			
			for (var j = 0, jl = transforms.length; j < jl; j++) {
				this.unhighlightTransform(transforms[j]);
			}
		}
	};
    
   BrowserModel.prototype. unhighlightTransform = function(transform) {
		var children = transform.children,
			geometry = transform.geometry;
		
		for (var ndx = 0, len = children.length; ndx < len; ndx++) {
			this.unhighlightTransform(children[ndx]);
		}
		
		if (geometry) {
//			transform.material.color = DEFAULT_COLOR;
		}
    };
	
	BrowserModel.prototype.updateShape = function(shape) {
		this.notifyListeners(shorthand.events.UpdateUserCreatedShape, shape);
	};
		
	BrowserModel.prototype.worldCleaned = function() {
		var models = hemi.world.getCitizens({
				citizenType: hemi.Model.prototype.citizenType
			}),
			shapes = hemi.world.getCitizens({
				citizenType: hemi.Shape.prototype.citizenType
			});
		
		// turn off handles
		this.curHandle.setDrawState(editor.ui.trans.DrawState.NONE);
		
		for (var i = 0, il = models.length; i < il; ++i) {
			this.notifyListeners(editor.events.Removing, models[i]);
		}
		
		for (var i = 0, il = shapes.length; i < il; ++i) {
			this.notifyListeners(shorthand.events.RemoveUserCreatedShape, shapes[i]);
		}
	};
		
	BrowserModel.prototype.worldLoaded = function() {
		
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                      	  					Side Panel				     	                  //
////////////////////////////////////////////////////////////////////////////////////////////////////

	var SidePanel = function() {
		editor.ui.Panel.call(this, {
			classes: ['mbrSidePanel']
		});
		
		this.visibleWidget = null;
		this.buttonHash = new Hashtable();
	};
	var sidePnlSuper = editor.ui.Panel.prototype;
		
	SidePanel.prototype = new editor.ui.Panel();
	SidePanel.prototype.constructor = SidePanel;
		
	SidePanel.prototype.addWidget = function(widget, name) {
		sidePnlSuper.addWidget.call(this, widget);
		
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
	};
	
	SidePanel.prototype.layout = function() {
		sidePnlSuper.layout.call(this);
		
		this.buttons = jQuery('<div class="panelButtons"></div>');
		this.container.prepend(this.buttons);
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                      	  			  Widget Private Methods		     	                  //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var brSizeAndPosition = function() {
			var container = this.container,
				btnPnlHeight = jQuery('.mbrSidePanel .panelButtons').outerHeight(),
				padding = parseInt(container.css('paddingBottom')) +
					parseInt(container.css('paddingTop')),
				win = jQuery(window),
				winHeight = win.height(),
				wgtHeight = winHeight - padding - btnPnlHeight;
			
			container.height(wgtHeight);
		};
	
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                            				 Model Tree Widget		                             //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	
	var ModelTreeWidget = function(options) {
        editor.ui.Widget.call(this, {
			name: 'modelTreeWidget'
		});
	};
		
	ModelTreeWidget.prototype = new editor.ui.Widget();
	ModelTreeWidget.prototype.constructor = ModelTreeWidget;
		
	ModelTreeWidget.prototype.addModel = function(model) {
		var modelData = createJsonObj(model);
		
		this.tree.jstree('create_node', this.tree.find('#br_models'), 
			'inside', {
				json_data: modelData
			});
	};
	
	ModelTreeWidget.prototype.addShape = function(shape) {
		var shapeData = createJsonObj(shape);
		
		this.tree.jstree('create_node', this.tree.find('#br_shapes'), 
			'inside', {
				json_data: shapeData
			});
	};
	
	ModelTreeWidget.prototype.deselectNode = function(nodeName) {
        var node = this.tree.find('#' + nodeName);
		this.tree.jstree('deselect_node', node);
	};
	
	ModelTreeWidget.prototype.layout = function() {
		wgtSuper.layout.call(this);	
			
		var wgt = this,
			baseJson = [{
				data: 'models',
				attr: {
					id: 'br_models',
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
					id: 'br_shapes',
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
						wgt.notifyListeners(shorthand.events.SelectTreeItem, {
							transform: metadata.actualNode,
							node: elem,
							mouseEvent: data.args[2],
							type: metadata.type
						});
						wgt.tree.jstree('toggle_node', elem);
					} else {
						wgt.container.scrollTo(elem, 400);
					}
					
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
					
					wgt.notifyListeners(shorthand.events.SelectTreeItem, {
						owner: model,
						material: material,
						type: metadata.type
					});
					
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
				wgt.notifyListeners(shorthand.events.DeselectTreeItem, {
					node: metadata.actualNode,
					type: metadata.type
				});
			}
		})
		.jstree({
			'json_data': {
				'data': baseJson,
				'progressive_render': true
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
	};
	
	ModelTreeWidget.prototype.removeModel = function(model) {
		var node = this.tree.find('#' + getNodeId(model));
		this.tree.jstree('delete_node', node);
	};
	
	ModelTreeWidget.prototype.removeShape = function(shape) {
		var node = this.tree.find('#' + getNodeId(shape));
		this.tree.jstree('delete_node', node);
	};
	
	ModelTreeWidget.prototype.selectNode = function(nodeName) {
		generateNodes.call(this, nodeName, false);
		
		var node = this.tree.find('#' + nodeName);
		this.tree.jstree('select_node', node, false);
	};
	
	ModelTreeWidget.prototype.sizeAndPosition = function() {
		brSizeAndPosition.call(this);
	};
	
	ModelTreeWidget.prototype.updateShape = function(shape) {
		// shape transforms may invariably change so we need to replace the
		// whole node
		var shapeData = createJsonObj(shape),
			nodeName = getNodeId(shape);
		
		generateNodes.call(this, nodeName, true);
		var node = this.tree.find('#' + nodeName);
		
		this.tree.jstree('create_node', node, 'after', {
			json_data: shapeData
		});
		this.tree.jstree('delete_node', node);
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                            				Hidden Items Widget   		                          //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var HiddenItemListItem = function() {
		editor.ui.ListItem.call(this);
	};
	var hdnLiSuper = editor.ui.ListItem.prototype;
		
	HiddenItemListItem.prototype = new editor.ui.ListItem();
	HiddenItemListItem.prototype.constructor = HiddenItemListItem;

	HiddenItemListItem.prototype.layout = function() {
		hdnLiSuper.layout.call(this);
		
		this.title = jQuery('<span></span>');
		this.pickBtn = jQuery('<input type="checkbox"/>');
		this.showBtn = jQuery('<button class="removeBtn">Show</button>');
		var btnDiv = jQuery('<div class="buttonContainer"></div>');
		var pickSpan = jQuery('<span style="float:left;">Pick</span>');
		
		pickSpan.append(this.pickBtn);
		btnDiv.append(pickSpan).append(this.showBtn);
		this.container.append(this.title).append(btnDiv);
	};
	
	HiddenItemListItem.prototype.setText = function(text) {
		this.title.text(text);
	};
	
	var HiddenItemsWidget = function(options) {
	    editor.ui.Widget.call(this, {
			name: 'hiddenItemsWidget'
		});
		
		this.hiddenItems = new Hashtable();		
		this.ownerTransHash = new Hashtable();
	};
		
	HiddenItemsWidget.prototype = new editor.ui.Widget();
	HiddenItemsWidget.prototype.constructor = HiddenItemsWidget;
		
	HiddenItemsWidget.prototype.layout = function() {
		wgtSuper.layout.call(this);
		
		this.list = new editor.ui.List({
			listId: 'mbrHiddenList',
			prefix: 'mbrHidLst',
			type: editor.ui.ListType.UNORDERED
		});
		
		this.container.append(this.list.getUI());
	};
	
    HiddenItemsWidget.prototype.addHiddenItem = function(transform, owner) {
		var id = transform._getId();
		
		if (!this.hiddenItems.containsKey(id)) {
			var li = new HiddenItemListItem(),
            	wgt = this;
				
			li.setText(transform.name);
			li.attachObject(transform);
			
			li.pickBtn.bind('click', function(evt) {
				var transform = li.getAttachedObject();
				wgt.notifyListeners(shorthand.events.SetPickable, {
					tran: transform,
					pick: this.checked
				});
			});
			li.showBtn.bind('click', function(evt) {
				var transform = li.getAttachedObject();
				wgt.notifyListeners(shorthand.events.ShowHiddenItem, transform);
			});
			
			var transforms = this.ownerTransHash.get(owner) || [];
			transforms.push(transform);
			
			this.list.add(li);
			this.hiddenItems.put(id, li);
			this.ownerTransHash.put(owner, transforms);
		}
    };
    
    HiddenItemsWidget.prototype.removeHiddenItem = function(transform) {
		var li = this.hiddenItems.remove(transform._getId());
		this.list.remove(li);
		
		if (this.hiddenItems.size() === 0) {
			this.setVisible(false);
		}
    };
	
	HiddenItemsWidget.prototype.removeOwner = function(owner) {
		var transforms = this.ownerTransHash.get(owner);
		
		if (transforms) {
			for (var ndx = 0, len = transforms.length; ndx < len; ndx++) {
				this.removeHiddenItem(transforms[ndx]);
			}
		}
	};
	
	HiddenItemsWidget.prototype.resize = function(maxHeight) {
		wgtSuper.resize.call(this, maxHeight);	
		var list = this.list.getUI(),
		
		// adjust the list pane height
		 	listHeight = maxHeight - hdrHeight;
			
		if (listHeight > 0) {
			list.height(listHeight);
		}
	};
	
	HiddenItemsWidget.prototype.setPickable = function(transform, pickable) {
		var li = this.hiddenItems.get(transform._getId());
		
		if (li) {
			li.pickBtn.prop('checked', pickable);
		}
	};
	
	HiddenItemsWidget.prototype.showAll = function() {
		var listItems = this.hiddenItems.values();
		
		for (var ndx = 0, len = listItems.length; ndx < len; ndx++) {
			listItems[ndx].showBtn.click();
		}
	};
	
	HiddenItemsWidget.prototype.sizeAndPosition = function() {
		brSizeAndPosition.call(this);
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                           				Model Loading Widget		                          //
////////////////////////////////////////////////////////////////////////////////////////////////////

	var LoaderWidget = function() {
		editor.ui.Widget.call(this, {
			name: 'loaderWidget',
			height: editor.ui.Height.MANUAL
		});
		
		this.importData = null;
	};
		
	LoaderWidget.prototype = new editor.ui.Widget();
	LoaderWidget.prototype.constructor = LoaderWidget;
		
	LoaderWidget.prototype.errorHandler = function(error) {
		this.showMessage(error);
	};
	
	LoaderWidget.prototype.createImportPanel = function() {			
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		
		var pnl = this.find('#mbrImportPnl'),
		btn = pnl.find('button'),
		wgt = this;				
	
		var loadPnl = this.find('#mbrLoadPnl');
		var sel = loadPnl.find('select');
		
		if (window.requestFileSystem) {
			btn.bind('click', function(evt) {
				fileDiv.show();
				fileInput.focus().click();
				fileDiv.hide();
			})
			.file({multiple: true})
			.choose(function(evt, input) {
				var files = input.files;
				var jsonFileEntry;
				var fileReadCounter = files.length;
				var regEx = /.+\.json/;
				window.requestFileSystem(window.PERMANENT, 50 * 1024 * 1024, function(fs) {
					for (var i = 0; i < files.length; ++i) {
						var file = files[i];
						(function(curFile) {
							var createFile = function(fileEntry) {
								fileEntry.createWriter(function(fileWriter) {
									fileWriter.onwriteend = function() {
										fileReadCounter--;
										if (fileReadCounter == 0 && jsonFileEntry) {
											var prj = jQuery('<option value="' + jsonFileEntry.toURL() + '">' + jsonFileEntry.name.split('.')[0] + '</option>');
											sel.append(prj);
										}
									};
									if (regEx.test(fileEntry.name)) {
										jsonFileEntry = fileEntry;
									}
									fileWriter.write(curFile);
								}, wgt.errorHandler);
							};
							
							var eraseCreateFile = function(fileEntry) {
								var name = fileEntry.name;
								(function(fileName) {
									fileEntry.remove(function() {
										fs.root.getFile(fileName, {create: true, exclusive: true}, createFile, wgt.errorHandler);
									});
								})(name);
							};
							
							//Only one of these callbacks will get called
							//if file exists
							fs.root.getFile(curFile.name, {create: false, exclusive: true}, eraseCreateFile);
							//if file doesn't exist
							fs.root.getFile(curFile.name, {create: true, exclusive: true}, createFile);
						})(file);
					}
					
					
				}, wgt.errorHandler);
			});
		}
		else {
			btn.bind('click', function(evt) {
				wgt.errorHandler('Import not supported on this browser');
			});
		}
		
		// We need to hide the file div because it interferes with the mouse
		// events for the minMax button.
		var fileInput = jQuery(':input[type="file"]'),
			fileDiv = fileInput.parent().parent();
		
		fileDiv.hide();
	};
	
	LoaderWidget.prototype.loadModelsFromLocalFS = function(selectElement) {
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		var wgt = this;
		
		var regEx = /.+\.json/;
		function listResults(entries) {
			for (var i = 0; i < entries.length; ++i) {
				var entry = entries[i];
				if (regEx.test(entry.name)) {
					var prj = jQuery('<option value="' + entry.toURL() + '">' + entry.name.split('.')[0] + '</option>');
					selectElement.append(prj);
				}
			}
		}
		
		function toArray(list) {
			return Array.prototype.slice.call(list || [], 0);
		}

		if (window.requestFileSystem) {
			window.requestFileSystem(window.PERMANENT, 50 * 1024 * 1024, function(fs) {
				var dirReader = fs.root.createReader();
				var entries = [];

				// Call the reader.readEntries() until no more results are returned.
				var readEntries = function() {
					dirReader.readEntries (function(results) {
						if (!results.length) {
							listResults(entries);
						} 
						else {
							entries = entries.concat(toArray(results));
							readEntries();
						}
					}, wgt.errorHandler);
				};
	
				readEntries(); // Start reading dirs.
			});
		}
	};
	
	LoaderWidget.prototype.createLoadPanel = function() {				
		var pnl = this.find('#mbrLoadPnl'),
			sel = pnl.find('select'),
			ipt = pnl.find('input').hide(),
			wgt = this;	
	
		sel.bind('change', function() {
			if (sel.val() !== '-1') {
				wgt.showMessage('Loading Model...');
				var modelName = sel.find('option[value="' + sel.val() + '"]').text();
				wgt.notifyListeners(shorthand.events.LoadModel, {url: sel.val(), modelName: modelName});
			}
		});	
		
		ipt.bind('keydown', function(evt) {
			var code = (evt.keyCode ? evt.keyCode : evt.which),
				val = ipt.val();
			
			if (code == 13 && val !== '') { //Enter keycode
				wgt.showMessage('Loading Model...');
				var modelName = sel.find('option[value="' + sel.val() + '"]').text();
				wgt.notifyListeners(shorthand.events.LoadModel, {url: val, modelName: ipt.text()});
			}
		});
		
		this.loadModelsFromLocalFS(sel);

	};
	
	LoaderWidget.prototype.createUnloadPanel = function() {			
		var pnl = this.find('#mbrUnloadPnl'),
			sel = pnl.find('select'),
			wgt = this;
	
		sel.bind('change', function() {	
			var id = parseInt(sel.val());
			if (id !== -1) {
				var model = hemi.world.getCitizenById(id);
				
				if (editor.depends.check(model)) {
					wgt.notifyListeners(shorthand.events.UnloadModel, model);
				}
			}
		});	
		
		populateUnloadPanel.call(this);
	};
	
	LoaderWidget.prototype.layout = function() {
		wgtSuper.layout.call(this);
		this.container.append('<p id="mbrMsg"></p> \
			<form id="mbrLoadPnl"> \
				<input type="text" id="loadMdlSel" placeholder="Model Path:" /> \
				<select id="loadMdlIpt"></select> \
			</form> \
			<form id="mbrImportPnl"> \
				<button id="importMdlBtn">Import</button> \
			</form> \
			<form id="mbrUnloadPnl"> \
				<select id="unloadMdlSel"></select> \
			</form>');
		
		this.msgPanel = this.find('#mbrMsg').hide();
		this.container.find('select').sb({
			ddCtx: '.topBottomSelect',
			useTie: true
		});
		this.container.find('form').submit(function() { 
			return false; 
		});
		// Removing import panel until import is reenabled in the server
		this.find('#mbrImportPnl').hide();
		this.createImportPanel();
		this.createLoadPanel();
		this.createUnloadPanel();
	};
	
	LoaderWidget.prototype.showMessage = function(msg) {
		var wgt = this;
		
		this.msgPanel.text(msg).slideDown(200, function() {
			wgt.invalidate();
		});
	};
	
	LoaderWidget.prototype.updateLoadException = function(url) {
		this.importData = null;
		this.showMessage('Unable to load: ' + url);
		
		populateUnloadPanel.call(this);
	};
	
	LoaderWidget.prototype.updateModelLoaded = function(model) {
		var wgt = this,
			sel = this.find('#mbrLoadPnl select'),
			ipt = this.find('input');
		
		this.msgPanel.text('').slideUp(200, function() {		
			sel.val(-1).sb('refresh');
			ipt.val('');
			wgt.invalidate();
		});
		
		populateUnloadPanel.call(this);
	};
	
	LoaderWidget.prototype.updateModelRemoved = function(model) {
		var wgt = this;
		
		this.msgPanel.text('').slideUp(200, function() {		
			wgt.invalidate();
		});
		populateUnloadPanel.call(this);
	};
	
	LoaderWidget.prototype.updateServerRunning = function(models) {
		var importPnl = this.find('#mbrImportPnl'),
			loadPnl = this.find('#mbrLoadPnl'),
			sel = loadPnl.find('select'),
			ipt = loadPnl.find('input'),
			sb = loadPnl.find('.sb.selectbox');
			
		if (models == null) {
			importPnl.hide();
			sel.hide();
			sb.hide();
			ipt.show();
			
			this.invalidate();
		}
		else {									
			// Removing import panel until import is reenabled in the server
			importPnl.show();
		
			ipt.hide();
			sb.show();
			sel.empty().show() 
				.append('<option value="-1">Load a Model</option>');
				
			for (var i = 0, il = models.length; i < il; i++) {
				var mdl = models[i];
				var prj = jQuery('<option value="' + mdl.url + '">' + mdl.name + '</option>');
				sel.append(prj);
			}
			
			this.invalidate();
		}
	};
	
	var populateUnloadPanel = function() {			
			var models = hemi.world.getModels(),
				sel = this.find('#mbrUnloadPnl select'),
				btn = this.find('#mbrUnloadPnl button');
			
			sel.empty().show();
			
			if (models.length === 0) {
				btn.attr('disabled', 'disabled');
				sel.append('<option value="-1">No Models to Unload</option>');
			} else {
				btn.removeAttr('disabled');
				
				sel.append('<option value="-1">Unload a Model</option>');
				for (var i = 0, il = models.length; i < il; i++) {
					var mdl = models[i];
					var prj = jQuery('<option value="' + mdl._getId() + '">' + mdl.name + '</option>');
					sel.append(prj);
				}
			}
		};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                        				Transform Adjusting Widget		                          //
////////////////////////////////////////////////////////////////////////////////////////////////////

	var AdjustState = {
		NONE: -1,
		TRANSLATE: 0,
		ROTATE: 1,
		SCALE: 2	
	};
	
	var AdjustWidget = function() {
		editor.ui.Widget.call(this, {
			name: 'adjustWidget',
			height: editor.ui.Height.MANUAL
		});
		
		this.state = AdjustState.NONE;
	};
		
	AdjustWidget.prototype = new editor.ui.Widget();
	AdjustWidget.prototype.constructor = AdjustWidget;
		
	AdjustWidget.prototype.layout = function() {
		wgtSuper.layout.call(this);
		var wgt = this,
			form = jQuery('<form></form>').submit(function() { 
				return false; 
			}),
			notify = function(btn, msg) {					
				btn.toggleClass('down');
				
				if (!btn.hasClass('down')) {
					msg = editor.ui.trans.DrawState.NONE;	
				}
				wgt.notifyListeners(shorthand.events.ManipState, msg);
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
	};
	
	AdjustWidget.prototype.reset = function() {
		this.scaleBtn.removeClass('down');
		this.rotateBtn.removeClass('down');
		this.transBtn.removeClass('down');
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			Opacity Widget			                              //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var OpacityWidget = function() {
		editor.ui.Widget.call(this, {
			name: 'opacityWidget',
			height: editor.ui.Height.MANUAL
		});
	};
		
	OpacityWidget.prototype = new editor.ui.Widget();
	OpacityWidget.prototype.constructor = OpacityWidget;
		
	OpacityWidget.prototype.layout = function() {
		wgtSuper.layout.call(this);
		
		var wgt = this,
			label = jQuery('<label>Opacity</label>');
		this.slider = jQuery('<div id="mbrTransparencySlider"></div>');
		this.slider.slider({
			value: 100,
			range: 'min',
			slide: function(evt, ui) {								
				wgt.notifyListeners(shorthand.events.SetTransOpacity, 
					ui.value/100);
			}
		})
		.find('.ui-slider-handle').append('<span></span>');
		
		this.container.append(label).append(this.slider)
			.addClass('opacity');
	};
	
	OpacityWidget.prototype.reset = function() {
		this.slider.slider('value', 100);
	};
	
	OpacityWidget.prototype.set = function(transform) {
		this.slider.slider('value', transform.opacityVal == null ? 100 : transform.opacityVal * 100);
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                           				 Details Widget			                              //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var DetailsType = {
		TRANSFORM: 0,
		MATERIAL: 1
	};
	
	function buildMaterialPopup(material, model) {
		var params = material.parameters,
			texture = material.map,
			image = texture.image,
			container = jQuery('<div></div>'),
			detCtn = jQuery('<div class="details"></div>');
		
		container.append(detCtn);
		detCtn.empty().append('<h2>' + image.src + '</h2>');
		
		var img = jQuery('<img />');
		img.attr('src', image.src);
		detCtn.append(img);
	
		return container;
	};
	
	function buildTransformPopup(transform) {
		var meshes = recurseTransforms(transform),
			meshList = new editor.ui.List(),
			container = jQuery('<div></div>'),
			detCtn = jQuery('<div><div class="details"></div><button class="back" href="#">Back</button></div>').hide(),
			backBtn = detCtn.find('.back'),
			detPnl = detCtn.find('.details');
		
		for (var ndx = 0, len = meshes.length; ndx < len; ndx++) {
			var mesh = meshes[ndx],
				name = mesh.name !== '' ? mesh.name : 'unnamed'; 
			
			if (name.match(shorthand.constants.HIGHLIGHT_PRE) === null) {
				var item = new editor.ui.ListItem();
				
				item.setText(name);
				item.attachObject({
					transform: transform,
					mesh: mesh
				});
				item.data('liWidget', item);
				item.container.bind('click', function(evt) {
					var item = jQuery(this).data('liWidget'),
						data = item.getAttachedObject();
					showMeshDetails(data.mesh, data.transform, detPnl);
					detCtn.show();
					meshList.setVisible(false);
				});
				
				meshList.add(item);
			}
		};
		
		backBtn.bind('click', function() {
			detCtn.hide();
			meshList.setVisible(true);
		});
		
		container.append(detCtn).append(meshList.getUI());
		
		return container;
	};
	
	function recurseTransforms(mesh) {
		var meshes = [],
			children = mesh.children;
		
		if (mesh.geometry) {
			meshes.push(mesh);	
		}
		
		for (var i = 0, il = children.length; i < il; i++) {
			meshes = meshes.concat(recurseTransforms(children[i]));
		}
		
		return meshes;
	};
	
	function showMeshDetails(mesh, transform, pnl) {
		var //shapeInfo = hemi.picking.pickManager.createShapeInfo(shape, null),
			box = mesh.geometry.boundingBox,
			minExtent = box.min,
			maxExtent = box.max,
			title = jQuery('<h2>' + mesh.name + '</h2>'),
			dl = jQuery('<dl></dl>'),
			liTemplate = jQuery.template(null, '<li><span class="label">${Label}</span>${Value}</li>'),
			minDt = jQuery('<dt>Min Extent</dt>'),
			minDd = jQuery('<dd><ul></ul></dd>'),
			maxDt = jQuery('<dt>Max Extent</dt>'),
			maxDd = jQuery('<dd><ul></ul></dd>'),
			minData = [
				{ Label: 'x', Value: editor.utils.roundNumber(minExtent.x, 7) },
				{ Label: 'y', Value: editor.utils.roundNumber(minExtent.y, 7) },
				{ Label: 'z', Value: editor.utils.roundNumber(minExtent.z, 7) }
			],
			maxData = [
				{ Label: 'x', Value: editor.utils.roundNumber(maxExtent.x, 7) },
				{ Label: 'y', Value: editor.utils.roundNumber(maxExtent.y, 7) },
				{ Label: 'z', Value: editor.utils.roundNumber(maxExtent.z, 7) }
			];
			
		dl.append(minDt).append(minDd).append(maxDt).append(maxDd);
		pnl.empty().append(title).append(dl);
		
		jQuery.tmpl(liTemplate, minData).appendTo(minDd.find('ul'));
		jQuery.tmpl(liTemplate, maxData).appendTo(maxDd.find('ul'));		
	};
	
	var DetailsWidget = function() {
		editor.ui.Widget.call(this, {
			name: 'detailsWidget',
			height: editor.ui.Height.MANUAL
		});
	};
		
	DetailsWidget.prototype = new editor.ui.Widget();
	DetailsWidget.prototype.constructor = DetailsWidget;
		
	DetailsWidget.prototype.buildPopup = function() {
		if (this.type === DetailsType.TRANSFORM) {
			return buildTransformPopup.call(this, this.obj);
		}
		else {
			return buildMaterialPopup.call(this, this.obj.material, 
				this.obj.owner);
		}
	};
	
	DetailsWidget.prototype.layout = function() {
		wgtSuper.layout.call(this);
		
		this.btn = jQuery('<button id="mbrDetailsBtn">View Shapes</button>');
		this.form = jQuery('<form></form>').submit(function() {
			return false;
		});
		
		this.form.append(this.btn);
		this.container.append(this.form);
		
		var popup = editor.ui.createTooltip({
				cls: 'mbrPopup',
				mouseHide: false
			}),
			wgt = this;
		
		this.btn.bind('click', function(evt) {
			var btn = jQuery(this).toggleClass('down');
			
			if (btn.hasClass('down')) {
				popup.show(btn, wgt.buildPopup(), null, {
					top: 5,
					left: 0
				});
			
				jQuery(document).bind('click.mbr', function(e) {
					var target = jQuery(e.target),
						parent = target.parents('.tooltip, #mbrDetailsBtn');
					
					if (parent.size() == 0 && target.attr('id') != 'mbrDetailsBtn') {
						popup.hide(0);
						jQuery(document).unbind('click.mbr');
						btn.removeClass('down');
					}
				});
			}
			else {
				popup.hide(0);
				jQuery(document).unbind('click.mbr');
			}
		});
	};
	
	DetailsWidget.prototype.reset = function() {
		if (this.btn.hasClass('down')) {
			this.btn.click();
		}
	};
	
	DetailsWidget.prototype.set = function(obj, type) {
		if (obj) {
			this.container.show();
		}
		else {
			this.container.hide();
		}
		
		this.type = type;
		this.obj = obj;
		
		this.btn.text(type === DetailsType.TRANSFORM ? 'View Shapes' : 
			'View Texture');
			
		if ((obj.material && obj.material.map == null) || obj.geometry == null) {
			this.btn.attr('disabled', 'disabled');
		}
		else {
			this.btn.removeAttr('disabled');
		}
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                             Hide/Show Widget                               //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var VisibilityWidget = function() {
		editor.ui.Widget.call(this, {
			name: 'visibilityWidget',
			height: editor.ui.Height.MANUAL
		});
	};
		
	VisibilityWidget.prototype = new editor.ui.Widget();
	VisibilityWidget.prototype.constructor = VisibilityWidget;
		
	VisibilityWidget.prototype.layout = function() {
		wgtSuper.layout.call(this);
		this.visBtn = jQuery('<button>Hide</button>');
		
		var form = jQuery('<form></form>').submit(function() {
				return false;
			}),
			wgt = this;
		
		form.append(this.visBtn);
		this.container.append(form);
		
		this.visBtn.bind('click', function() {
			wgt.notifyListeners(shorthand.events.ShowPicked, 
				!wgt.transform.visible);
			jQuery(this).text(wgt.transform.visible ? 'Hide' : 'Show');
		});
	};
	
	VisibilityWidget.prototype.reset = function() {
		this.set(null);
	};
	
	VisibilityWidget.prototype.set = function(transform) {
		this.transform = transform;			
		this.visBtn.text(this.transform == null || 
			this.transform.visible ? 'Hide' : 'Show');
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                   			  View			                                  //
////////////////////////////////////////////////////////////////////////////////////////////////////   	
	
	var BrowserView = function() {
		editor.ToolView.call(this, {
			toolName: 'Geometry Browser',
			toolTip: 'Browse through the transforms and materials of models and shapes',
			id: 'browser'
		});
		
		this.isDown = false;
		
		this.addPanel(new SidePanel());
		this.addPanel(new editor.ui.Panel({
			location: editor.ui.Location.TOP,
			classes: ['mbrTopPanel']
		}));
		this.addPanel(new editor.ui.Panel({
			location: editor.ui.Location.BOTTOM,
			classes: ['bottomPanel', 'mbrBottomPanel'],
			startsVisible: false
		}));
		
		this.sidePanel.addWidget(new ModelTreeWidget(), "Browser Tree");
		this.sidePanel.addWidget(new HiddenItemsWidget(), "Hidden Transforms");
		
		this.topPanel.addWidget(new LoaderWidget());
		
		this.bottomPanel.addWidget(new AdjustWidget());
		this.bottomPanel.addWidget(new OpacityWidget());
		this.bottomPanel.addWidget(new DetailsWidget());
		this.bottomPanel.addWidget(new VisibilityWidget());
	};
		
	BrowserView.prototype = new editor.ToolView();
	BrowserView.prototype.constructor = BrowserView;
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                				Controller		                                  //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var BrowserController = function() {
		editor.ToolController.call(this);
	};
	var brsCtrSuper = editor.ToolController.prototype;
		
	BrowserController.prototype = new editor.ToolController();
	BrowserController.prototype.constructor = BrowserController;
	
	/**
	 * Binds event and message handlers to the view and model this object
	 * references.
	 */
	BrowserController.prototype.bindEvents = function() {
		brsCtrSuper.bindEvents.call(this);
		
		var model = this.model,
			view = this.view,
			ldrWgt = view.topPanel.loaderWidget,
			mbrWgt = view.sidePanel.modelTreeWidget,
			hidWgt = view.sidePanel.hiddenItemsWidget,
			opaWgt = view.bottomPanel.opacityWidget,
			adjWgt = view.bottomPanel.adjustWidget,
			visWgt = view.bottomPanel.visibilityWidget,
			detWgt = view.bottomPanel.detailsWidget;			
		
		// for when the tool gets selected/deselected	
		view.addListener(editor.events.ToolModeSet, function(value) {
			var isDown = value.newMode === editor.ToolConstants.MODE_DOWN,
				wasDown = value.oldMode === editor.ToolConstants.MODE_DOWN,
				savedState = model.savedDrawState,
				handle = model.curHandle;
			
			model.enableSelection(isDown);
			
			if (isDown && savedState != null) {
				handle.setDrawState(savedState);
			}
			else if (!isDown && wasDown) {
				model.savedDrawState = model.curHandle.drawState;
				handle.setDrawState(editor.ui.trans.DrawState.NONE);
			}
			
			hidWgt.setVisible(isDown && hidWgt.hiddenItems.size() > 0);
		});	        
		
		// hidden list widget specific
		hidWgt.addListener(shorthand.events.SetPickable, function(data) {
			model.setTransformPickable(data.tran, data.pick);
		});
		hidWgt.addListener(shorthand.events.ShowHiddenItem, function(transform) {
	        model.showTransform(transform);
		});
		
		// loader widget specific
		ldrWgt.addListener(shorthand.events.LoadModel, function(data) {
			model.addModel(data.url, data.modelName);
		});
		ldrWgt.addListener(shorthand.events.UnloadModel, function(mdl) {
			model.removeModel(mdl);
		});
		
		// mdl browser widget specific
		mbrWgt.addListener(shorthand.events.SelectTreeItem, function(value) {
			if (value.type === 'transform') {
				if (!value.mouseEvent.shiftKey) {
					model.deselectAll();
				}
				
				model.selectTransform(value.transform);
			} else if (value.type === 'material') {
				model.deselectAll();
				detWgt.set(value, DetailsType.MATERIAL);
				view.bottomPanel.setVisible(true);
				// TODO: Do something useful like highlight the material so
				// that the user can see what shapes use it. ~ekitson
			}
		});			
		mbrWgt.addListener(shorthand.events.DeselectTreeItem, function(data) {
			if (data.type === 'transform') {
				model.deselectTransform(data.node);
			}
		});
		
		// bottom panel			  
	    adjWgt.addListener(shorthand.events.ManipState, function(state) {
			model.setManipState(state);
	    });
	    opaWgt.addListener(shorthand.events.SetTransOpacity, function(opacity) {
			model.setOpacity(opacity);
	    });
	    visWgt.addListener(shorthand.events.ShowPicked, function(value) {
			if (value) {
	            model.showSelected();
			} else {
	            model.hideSelected();
			}
		});
					
		// mbr model specific
		model.addListener(editor.events.Created, function(model) {
			ldrWgt.updateModelLoaded(model);
			mbrWgt.addModel(model);
		});
		model.addListener(shorthand.events.LoadException, function(url) {
			ldrWgt.updateLoadException(url);
		});
	    model.addListener(editor.events.Removing, function(model) {
	        mbrWgt.removeModel(model);
			hidWgt.removeOwner(model);
			ldrWgt.updateModelRemoved(model);
			adjWgt.reset();
			detWgt.reset();
			opaWgt.reset();
			view.bottomPanel.setVisible(false);
	    });
		
		model.addListener(shorthand.events.AddUserCreatedShape, function(shape) {
			var isDown = view.mode == editor.ToolConstants.MODE_DOWN;
			
			mbrWgt.addShape(shape);
			
			if (shape.transform.visible === false) {
				hidWgt.addHiddenItem(shape.transform, shape);
				hidWgt.setVisible(isDown);
			}
		});
		model.addListener(shorthand.events.RemoveUserCreatedShape, function(shape) {
			mbrWgt.removeShape(shape);
			hidWgt.removeOwner(shape);
		});	
		model.addListener(shorthand.events.ServerRunning, function(models) {
			ldrWgt.updateServerRunning(models);
		});
		model.addListener(shorthand.events.UpdateUserCreatedShape, function(shape) {
			mbrWgt.updateShape(shape);
		});
		model.addListener(shorthand.events.PickableSet, function(data) {
	        hidWgt.setPickable(data.tran, data.pick);
	    });
		model.addListener(shorthand.events.TransformDeselected, function(transform) {
			mbrWgt.deselectNode(getNodeId(transform));
		});
	    model.addListener(shorthand.events.TransformHidden, function(obj) {
			var isDown = view.mode == editor.ToolConstants.MODE_DOWN;
	        hidWgt.addHiddenItem(obj.transform, obj.owner);
			hidWgt.setVisible(isDown);
	    });
		model.addListener(shorthand.events.TransformSelected, function(transform) {
			mbrWgt.selectNode(getNodeId(transform));
			detWgt.set(transform, DetailsType.TRANSFORM);
			visWgt.set(transform);
			opaWgt.set(transform);
			
			if (view.mode === editor.ToolConstants.MODE_DOWN) {
				view.bottomPanel.setVisible(true);
			}
		});
	    model.addListener(shorthand.events.TransformShown, function(transform) {
	        hidWgt.removeHiddenItem(transform);
	    });
		
		
		if (!model.serverRunning) {
			ldrWgt.updateServerRunning(null);
		}
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                     			  			   Extra Scripts		  		                      //
////////////////////////////////////////////////////////////////////////////////////////////////////

	editor.getCss('js/editor/plugins/browser/css/style.css');
})();
