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
	
////////////////////////////////////////////////////////////////////////////////
//                     			   Initialization  		                      //
////////////////////////////////////////////////////////////////////////////////

	var shorthand = editor.tools.browser = editor.tools.browser || {};

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
	
////////////////////////////////////////////////////////////////////////////////
//                     			  Tool Definition  		                      //
////////////////////////////////////////////////////////////////////////////////
	
    editor.ToolConstants = editor.ToolConstants || {};
	editor.ToolConstants.EDITOR_PREFIX = 'EditorCitizen:';
    editor.ToolConstants.SEL_HIGHLIGHT = 'selectorHighlight';
    editor.ToolConstants.X_AXIS = 'x';
    editor.ToolConstants.Y_AXIS = 'y';
    editor.ToolConstants.Z_AXIS = 'z';
    editor.ToolConstants.XY_PLANE = 'xyPlane';
    editor.ToolConstants.XZ_PLANE = 'xzPlane';
    editor.ToolConstants.YZ_PLANE = 'yzPlane';
	
	shorthand.events = {
		// browser model events
		AddUserCreatedShape: "browser.AddUserCreatedShape",
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
	
	// TODO: We need a better way of testing for our highlight shapes than
	// searching for this prefix.
	HIGHLIGHT_PRE = 'kuda_highlight_';
	
	
////////////////////////////////////////////////////////////////////////////////
//                          	Helper Methods                                //
////////////////////////////////////////////////////////////////////////////////
		
	var createJsonObj = function(node, parentNode) {
			var c = getNodeChildren(node),
				nodeType = getNodeType(node),
				children = [];
			
			if (parentNode == null) {
				parentNode = node;
			}
			
			for (var i = 0; c && i < c.length; i++) {
				var nodeJson = createJsonObj(c[i], parentNode);
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
			
			if (jQuery.isFunction(node.getCitizenType)) {
				var type = node.getCitizenType().split('.').pop();
				
				switch(type) {
					case 'Model':
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
						break;
					case 'Shape':
					    children = [{
								name: 'Transforms',
								children: [node.getTransform()],
								className: 'directory',
								nodeId: getCitNodeId(node) + '_trans'
							}];
						break;
					default:
						children = null;
						break;
				}
			} else {
				children = node.children;
			}
			
			return children;
		},
		
		getCitNodeId = function(cit) {
			var type = cit.getCitizenType(),
				id = 'br_';
			
			if (type === 'hemi.model.Model') {
				id += 'models_';
			} else if (type === 'hemi.shape.Shape') {
				id += 'shapes_';
			}
			
			id += cit.getId();
			return id;
		},
	
		getNodeId = function(obj) {
			var isCitizen = jQuery.isFunction(obj.getCitizenType),
				id = '';
			
			if (isCitizen) {
				id = getCitNodeId(obj);
			} else if (obj.clientId) {
				var cit = hemi.world.getCitizenById(obj.getParam('ownerId').value);
				id = getCitNodeId(cit);
				
				if (obj.className === 'Material') {
					id += '_mats_' + obj.clientId;
				} else {
					var ids = [],
						tran = obj;
					
					while (tran !== hemi.model.modelRoot && tran !== hemi.shape.root) {
						ids.push('_' + tran.clientId);
						tran = tran.parent;
					}
					
					id += '_trans';
					
					while (ids.length > 0) {
						id += ids.pop();
					}
				}
			} else if (obj.className === 'directory') {
				id = obj.nodeId;
			}
			
			return id;
		},
		
		getNodeType = function(node) {
			var isCitizen = jQuery.isFunction(node.getCitizenType);
			
			if (isCitizen) {
				return 'citizen';
			}
			return node.className.split('.').pop().toLowerCase();
		};
	
////////////////////////////////////////////////////////////////////////////////
//                            Browser Model                                   //
////////////////////////////////////////////////////////////////////////////////
	
	var BrowserModel = editor.ToolModel.extend({
		init: function() {
			this._super('browser');
	        
			this.selected = new Hashtable();
	        this.highlightedShapes = new Hashtable();
			this.currentShape = null;
			this.currentHighlightShape = null;
			this.currentTransform = null;
			this.msgHandler = null;
			this.shapHighlightMat = null;
	        this.tranHighlightMat = null;
			this.curHandle = new editor.ui.TransHandles();
			this.models = [];
	        
	        this.initSelectorUI();
			var mdl = this;
			
			hemi.msg.subscribe(hemi.msg.load,
				function(msg) {
					if (msg.src instanceof hemi.model.Model) {
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
		},
		
		addModel: function(url) {
			var model = new hemi.model.Model();				
			model.setFileName(url);
		},
		
		addShape: function(shape) {
			this.notifyListeners(shorthand.events.AddUserCreatedShape, shape);
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
				this.notifyListeners(shorthand.events.ShapeSelected, null);
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
					this.curHandle.setDrawState(editor.ui.trans.DrawState.NONE);
					this.curHandle.setTransform(null);
					this.notifyListeners(shorthand.events.ShapeSelected, null);
					this.unhighlightTransform(transform);
					this.notifyListeners(shorthand.events.TransformDeselected, transform);
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
			var mdl = this;
			
			this.selected.each(function(key, value) {
				var owner = hemi.world.getCitizenById(key);
				
				for (var ndx = 0, len = value.length; ndx < len; ndx++) {
					mdl.hideTransform(value[ndx], owner);
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
            this.notifyListeners(shorthand.events.TransformHidden, {
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
			this.tranHighlightMat.name = editor.ToolConstants.SEL_HIGHLIGHT;
			this.shapHighlightMat.state = state;
			this.shapHighlightMat.name = editor.ToolConstants.SEL_HIGHLIGHT + 'Shape';
		},
		
		isSelected: function(transform, opt_owner) {
			var transforms;
			
			if (opt_owner != null) {
				transforms = this.selected.get(opt_owner.getId());
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
			var transforms = this.selected.get(model.getId());
			
			while (transforms && transforms.length > 0) {
				this.deselectTransform(transforms[0], model);
			}
			model.cleanup();
			
			this.notifyListeners(editor.events.Removing, model);
		},
		
		removeShape: function(shape) {
			this.deselectTransform(shape.getTransform());
			this.notifyListeners(shorthand.events.RemoveUserCreatedShape, shape);
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
				this.notifyListeners(shorthand.events.ShapeSelected, {
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
			this.notifyListeners(shorthand.events.TransformSelected, transform);
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
            this.notifyListeners(shorthand.events.PickableSet, {
				tran: transform,
				pick: pickable
			});
		},
	    
	    showSelected: function() {
			var mdl = this;
			
			this.selected.each(function(key, value) {
				var owner = hemi.world.getCitizenById(key);
				
				for (var ndx = 0, len = value.length; ndx < len; ndx++) {
					mdl.showTransform(value[ndx], owner);
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
            this.notifyListeners(shorthand.events.TransformShown, transform);
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
		
		unload: function(modelId) {
		},
		
		updateShape: function(shape) {
			this.notifyListeners(shorthand.events.UpdateUserCreatedShape, shape);
		},
			
		worldCleaned: function() {
			var models = hemi.world.getCitizens({
					citizenType: hemi.model.Model.prototype.citizenType
				}),
				shapes = hemi.world.getCitizens({
					citizenType: hemi.shape.Shape.prototype.citizenType
				});
			
			// turn off handles
			this.curHandle.setDrawState(editor.ui.trans.DrawState.NONE);
			
			for (var i = 0, il = models.length; i < il; ++i) {
				this.notifyListeners(editor.events.Removing, models[i]);
			}
			
			for (var i = 0, il = shapes.length; i < il; ++i) {
				this.notifyListeners(shorthand.events.RemoveUserCreatedShape, shapes[i]);
			}
		},
			
		worldLoaded: function() {
			
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                      	  		Side Panel		     	                  //
////////////////////////////////////////////////////////////////////////////////

	var SidePanel = editor.ui.Panel.extend({
		init: function() {
			this._super({
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
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                      	  Widget Private Methods     	                  //
////////////////////////////////////////////////////////////////////////////////  
	
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
	
	
////////////////////////////////////////////////////////////////////////////////
//                            	Model Tree Widget                             //
//////////////////////////////////////////////////////////////////////////////// 
	
	
	var ModelTreeWidget = editor.ui.Widget.extend({
		init: function(options) {
	        this._super({
				name: 'modelTreeWidget'
			});
		},
		
		addModel: function(model) {
			var modelData = createJsonObj(model);
			
			this.tree.jstree('create_node', this.tree.find('#br_models'), 
				'inside', {
					json_data: modelData
				});
		},
		
		addShape: function(shape) {
			var shapeData = createJsonObj(shape);
			
			this.tree.jstree('create_node', this.tree.find('#br_shapes'), 
				'inside', {
					json_data: shapeData
				});
		},
		
		deselectNode: function(nodeName) {
	        var node = this.tree.find('#' + nodeName);
			this.tree.jstree('deselect_node', node);
		},
		
		finishLayout: function() {
			this._super();	
				
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
		},
		
		removeModel: function(model) {
			var node = this.tree.find('#' + getNodeId(model));
			this.tree.jstree('delete_node', node);
		},
		
		removeShape: function(shape) {
			var node = this.tree.find('#' + getNodeId(shape));
			this.tree.jstree('delete_node', node);
		},
		
		selectNode: function(nodeName) {
			generateNodes.call(this, nodeName, false);
			
			var node = this.tree.find('#' + nodeName);
			this.tree.jstree('select_node', node, false);
		},
		
		sizeAndPosition: function() {
			brSizeAndPosition.call(this);
		},
		
		updateShape: function(shape) {
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
				name: 'hiddenItemsWidget'
			});
			
			this.hiddenItems = new Hashtable();		
			this.ownerTransHash = new Hashtable();
		},
		
		finishLayout: function() {
			this._super();
			
			this.list = new editor.ui.List({
				listId: 'mbrHiddenList',
				prefix: 'mbrHidLst',
				type: editor.ui.ListType.UNORDERED
			});
			
			this.container.append(this.list.getUI());
		},
		
	    addHiddenItem: function(transform, owner) {
			if (!this.hiddenItems.containsKey(transform.clientId)) {
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
		},
		
		sizeAndPosition: function() {
			brSizeAndPosition.call(this);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                           Model Loading Widget                             //
////////////////////////////////////////////////////////////////////////////////

	var LoaderWidget = editor.ui.Widget.extend({
		init: function() {
			this._super({
				name: 'loaderWidget',
				height: editor.ui.Height.MANUAL
			});
		},
		
		createImportPanel: function() {			
			var msg = this.msgPanel,
				pnl = this.find('#mbrImportPnl'),
				btn = pnl.find('button'),
				wgt = this;				
			
			btn.bind('click', function(evt) {
				fileInput.click();
			})
			.file()
			.choose(function(evt, input) {
				msg.text('Uploading Model...').slideDown(200, function() {
					wgt.invalidate();
				});
				
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
							msg.text('').slideUp(200, function() {
								wgt.invalidate();
							});
							populateUnloadPanel.call(wgt);
						});
					},
					error: function(xhr, status, err) {
						msg.text(xhr.responseText).addClass('errMsg').show();
						wgt.invalidate();
					}
				});
			});
			
			// We need to hide the file div because it interferes with the mouse
			// events for the minMax button.
			var fileInput = jQuery(':input[type="file"]'),
				fileDiv = fileInput.parent().parent();
			
			fileDiv.hide();
		},
		
		createLoadPanel: function() {				
			var pnl = this.find('#mbrLoadPnl'),
				sel = pnl.find('select'),
				ipt = pnl.find('input').hide(),
				msg = this.msgPanel,
				wgt = this;	
		
			sel.bind('change', function() {
				if (sel.val() !== '-1') {
					msg.text('Loading Model...').slideDown(200, function() {
						wgt.invalidate();
					});
					var val = ipt.is(':visible') ? ipt.val() : sel.val();
					
					wgt.notifyListeners(shorthand.events.LoadModel, val);
				}
			});	
		},
		
		createUnloadPanel: function() {			
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
		},
		
		finishLayout: function() {
			this._super();
			this.container.append('<p id="mbrMsg"></p> \
				<form id="mbrLoadPnl"> \
					<input type="text" id="loadMdlSel" /> \
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
			this.createImportPanel();
			this.createLoadPanel();
			this.createUnloadPanel();
		},
		
		updateModelLoaded: function(model) {
			var wgt = this,
				sel = this.find('#mbrLoadPnl select');
			
			this.msgPanel.text('').hide(200, function() {
				wgt.invalidate();		
				sel.val(-1);
			});
			
			populateUnloadPanel.call(wgt);
		},
		
		updateModelRemoved: function(model) {
			this.msgPanel.text('').slideUp(200);
			populateUnloadPanel.call(this);
		},
		
		updateServerRunning: function(models) {
			var importPnl = this.find('#mbrImportPnl'),
				loadPnl = this.find('#mbrLoadPnl'),
				sel = loadPnl.find('select'),
				ipt = loadPnl.find('input');
				
			if (models == null) {
				importPnl.hide();
				sel.hide();
				ipt.show();
				
				this.invalidate();
			}
			else {									
				importPnl.show();	
			
				ipt.hide();
				sel.empty().show() 
					.append('<option value="-1">Load a Model</option>');
					
				for (var i = 0, il = models.length; i < il; i++) {
					var mdl = models[i];
					var prj = jQuery('<option value="' + mdl.url + '">' + mdl.name + '</option>');
					sel.append(prj);
				}
				
				this.invalidate();
			}
		}
	});
	
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
				name: 'adjustWidget',
				height: editor.ui.Height.MANUAL
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
		},
		
		reset: function() {
			this.scaleBtn.removeClass('down');
			this.rotateBtn.removeClass('down');
			this.transBtn.removeClass('down');
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                              Opacity Widget                                //
////////////////////////////////////////////////////////////////////////////////    
	
	var OpacityWidget = editor.ui.Widget.extend({
		init: function() {
			this._super({
				name: 'opacityWidget',
				height: editor.ui.Height.MANUAL
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
					wgt.notifyListeners(shorthand.events.SetTransOpacity, 
						ui.value/100);
				}
			})
			.find('.ui-slider-handle').append('<span></span>');
			
			this.container.append(label).append(this.slider)
				.addClass('opacity');
		},
		
		reset: function() {
			this.slider.slider('value', 100);
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
				detPnl = detCtn.find('.details');
			
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
					item = new editor.ui.ListItem();
				
				item.setText(name);
				item.attachObject({
					model: model,
					texture: tex
				});
				item.data('liWidget', item);
				item.container.bind('click', function(evt) {
					var item = jQuery(this).data('liWidget'),
						data = item.getAttachedObject();
						
					showMaterialDetails(data.texture, data.model, detPnl);
					detCtn.show();
					texList.setVisible(false);
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
				detPnl = detCtn.find('.details');
			
			for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
				var shape = shapes[ndx],
					name = shape.name !== '' ? shape.name : 'unnamed'; 
				
				if (name.match(HIGHLIGHT_PRE) === null) {
					var item = new editor.ui.ListItem();
					
					item.setText(name);
					item.attachObject({
						transform: transform,
						shape: shape
					});
					item.data('liWidget', item);
					item.container.bind('click', function(evt) {
						var item = jQuery(this).data('liWidget'),
							data = item.getAttachedObject();
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
				minDt = jQuery('<dt>Min Extent</dt>'),
				minDd = jQuery('<dd><ul></ul></dd>'),
				maxDt = jQuery('<dt>Max Extent</dt>'),
				maxDd = jQuery('<dd><ul></ul></dd>'),
				minData = [
					{ Label: 'x', Value: editor.utils.roundNumber(minExtent[0], 7) },
					{ Label: 'y', Value: editor.utils.roundNumber(minExtent[1], 7) },
					{ Label: 'z', Value: editor.utils.roundNumber(minExtent[2], 7) }
				],
				maxData = [
					{ Label: 'x', Value: editor.utils.roundNumber(maxExtent[0], 7) },
					{ Label: 'y', Value: editor.utils.roundNumber(maxExtent[1], 7) },
					{ Label: 'z', Value: editor.utils.roundNumber(maxExtent[2], 7) }
				];
				
			dl.append(minDt).append(minDd).append(maxDt).append(maxDd);
			pnl.empty().append(title).append(dl);
			
			jQuery.tmpl(liTemplate, minData).appendTo(minDd.find('ul'));
			jQuery.tmpl(liTemplate, maxData).appendTo(maxDd.find('ul'));			
		};
	
	var DetailsWidget = editor.ui.Widget.extend({
		init: function() {
			this._super({
				name: 'detailsWidget',
				height: editor.ui.Height.MANUAL
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
		},
		
		reset: function() {
			if (this.btn.hasClass('down')) {
				this.btn.click();
			}
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
				name: 'visibilityWidget',
				height: editor.ui.Height.MANUAL
			});
		},
		
		finishLayout: function() {
			this._super();			
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
		},
		
		reset: function() {
			this.set(null);
		},
		
		set: function(transform) {
			this.transform = transform;			
			this.visBtn.text(this.transform == null || 
				this.transform.visible ? 'Hide' : 'Show');
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    	
	
	var BrowserView = editor.ToolView.extend({
		init: function() {
			this._super({
				toolName: 'Geometry Browser',
				toolTip: 'Browse through the transforms and materials of models and shapes',
				elemId: 'browserBtn',
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
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////
	
	var BrowserController = editor.ToolController.extend({
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
			ldrWgt.addListener(shorthand.events.LoadModel, function(url) {
				model.addModel(url);
			});
			ldrWgt.addListener(shorthand.events.UnloadModel, function(model) {
				model.removeModel(model);
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
				
				if (view.mode === editor.ToolConstants.MODE_DOWN) {
					view.bottomPanel.setVisible(true);
				}
			});
	        model.addListener(shorthand.events.TransformShown, function(transform) {
	            hidWgt.removeHiddenItem(transform);
	        });
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     			  	Extra Scripts  		                      //
////////////////////////////////////////////////////////////////////////////////

	editor.getCss('js/editor/plugins/browser/css/style.css');
})();
