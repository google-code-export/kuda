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
	module.ui = module.ui || {};
	
	module.EventTypes = module.EventTypes || {};
	module.EventTypes.Trees = {
		// model specific
		CitizenAdded: 'Trees.CitizenAdded',
		CitizenRemoved: 'Trees.CitizenRemoved',
		CitizenUpdated: 'Trees.CitizenUpdated',
		
		// view specific
		SelectAction: 'Trees.SelectAction',
		SelectCitizen: 'Trees.SelectCitizen',
		SelectTrigger: 'Trees.SelectTrigger',
		TreeCreated: 'Trees.TreeCreated'
	};
	
	var TRIGGER_PREFIX = 'tr_',
		ACTION_PREFIX = 'ac_',
		CITIZEN_PREFIX = 'ci_';
	
////////////////////////////////////////////////////////////////////////////////
//                                 Tree Model                                 //
////////////////////////////////////////////////////////////////////////////////
	
	var TreeModel = module.utils.Listenable.extend({
		init: function() {
			this._super();
			this.citizenTypes = new Hashtable();
			
			hemi.world.subscribe(hemi.msg.cleanup, this, 'worldCleaned');
			hemi.world.subscribe(hemi.msg.ready, this, 'worldLoaded');
		},
		
		addCitizen: function(citizen) {
			if (citizen instanceof hemi.handlers.ValueCheck) {
				return;
			}
			
			var type = citizen.getCitizenType().split('.').pop(),
				citizens = this.citizenTypes.get(type),
				createType = citizens === null,
				add = createType;
			
			if (createType) {
				this.citizenTypes.put(type, [citizen]);
			} else {
				add = citizens.indexOf(citizen) === -1;
				
				if (add) {
					citizens.push(citizen);
					this.citizenTypes.put(type, citizens);
				}
			}
			
			if (add) {
				this.notifyListeners(module.EventTypes.Trees.CitizenAdded, {
					citizen: citizen,
					createType: createType
				});
			}
		},
		
		filterType: function(type) {
			var cits = this.citizenTypes.get(type);
			
			if (cits !== null && cits.length > 0) {
				this.notifyListeners(module.EventTypes.Trees.FilterByType, {
					type: type,
					citizens: cits
				});
			}
		},
		
		removeCitizen: function(citizen) {
			var type = citizen.getCitizenType().split('.').pop(),
				citizens = this.citizenTypes.get(type),
				removeType = citizens !== null && citizens.length === 1,
				remove = removeType;
			
			if (removeType) {
				this.citizenTypes.remove(type);
			} else if (citizens !== null) {
				var ndx = citizens.indexOf(citizen);
				
				if (ndx !== -1) {
					remove = true;
					citizens.splice(ndx, 1);
					this.citizenTypes.put(type, citizens);
				}
			}
			
			if (remove) {
				this.notifyListeners(module.EventTypes.Trees.CitizenRemoved, {
					citizen: citizen,
					removeType: removeType
				});
			}
		},
		
		updateCitizen: function(citizen) {
			this.notifyListeners(module.EventTypes.Trees.CitizenUpdated, citizen);
		},
		
		worldCleaned: function() {
			
		},
		
		worldLoaded: function() {
			var citizens = hemi.world.getCitizens();
			
			for (var ndx = 0, len = citizens.length; ndx < len; ndx++) {
				var citizen = citizens[ndx];
				
				if (citizen.name.match(module.tools.ToolConstants.EDITOR_PREFIX) === null) {
					this.addCitizen(citizen);
				}
			}
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                 Tree View                                  //
////////////////////////////////////////////////////////////////////////////////
	var idCounter = 0,
		tooltip = editor.ui.createTooltip();
	
	var TreeView = module.ui.Component.extend({
		init: function(type) {
			this._super();
			this.type = type;
			this.tree = null;
			this.tooltips = new Hashtable(); 
			this.currentTooltip = null;
			this.currentTimeout = null;
			this.currentDehover = null;
			this.id = idCounter++;
			
			var addOn = this.id + '_',
				view = this;
			this.pre = type + addOn;
			
			this.addListener(module.EventTypes.Trees.TreeCreated, function(tree) {
				tree.bind('hover_node.jstree', function(evt, data) {
					var elem = data.rslt.obj,
						id = elem.attr('id'),
						desc = view.tooltips.get(id);
					
					if (view.currentTooltip !== id && desc != null) {		
						view.currentTooltip = id;	
						
						var t = setTimeout(function() {
							elem.data('timeout', null);
							tooltip.setContainerClass('tree');
							tooltip.show(elem, desc);
						}, 500);
						
						elem.data('timeout', t);
					}
				})
				.bind('dehover_node.jstree', function(evt, data) {
					var elem = data.rslt.obj,
						timeout = elem.data('timeout');
						
					if (timeout != null) {
						clearTimeout(timeout);
					}
				})
				.bind('select_node.jstree', function(evt, data) {		
					var elem = data.rslt.obj,
						timeout = elem.data('timeout');
									
					if (view.currentTooltip != null) {
						clearTimeout(timeout);
						tooltip.hide(100);
						view.currentTooltip = null;
					}
				})
				.bind('mouseout', function(evt) {
					if (view.currentTooltip != null && !tooltip.isAnimating) {
						tooltip.hide(100);
						view.currentTooltip = null;
					}
				});
			});
		},
		
		bindSelect: function(func) {
			this.tree.bind('select_node.jstree', func);
		},
		
		clearFilter: function() {
			var tree = jQuery.jstree._reference(this.tree),
				nodes = tree._get_children(-1),
				mainNode = tree._get_node('#' + this.filterId);
				
			nodes.show();
			mainNode.removeClass('jstree-last');
		},
		
		deselect: function(data) {				
			switch (this.type) {
				case TRIGGER_PREFIX:
					deselectTrigger.call(this, data);
					break;
				case ACTION_PREFIX:
					deselectAction.call(this, data);
					break;
			}
		},
		
		filter: function(type) {
			var id = module.treeData.getNodeName({
					getCitizenType: function() { return type; }
				}, {
					prefix: this.pre
				}),
				tree = jQuery.jstree._reference(this.tree),
				nodes = tree._get_children(-1),
				mainNode = tree._get_node('#' + id);
				
			nodes.hide();
			if (mainNode) {
				mainNode.show().addClass('jstree-last');
			}
			else {
				throw type + " can't be found";
			}
			
			this.filterId = id;
		},
		
		notify: function(eventType, value) {
			if (eventType === module.EventTypes.Trees.CitizenAdded) {
				var citizen = value.citizen, 
					createType = value.createType;
					
				switch (this.type) {
					case CITIZEN_PREFIX:
						addCitizen.call(this, citizen, createType);
						break;
					case TRIGGER_PREFIX:
						addTrigger.call(this, citizen, createType);
						break;
					case ACTION_PREFIX:
						addAction.call(this, citizen, createType);
						break;
				}
			}
			else if (eventType === module.EventTypes.Trees.CitizenRemoved) {
				var citizen = value.citizen, 
					removeType = value.removeType;
					
				switch (this.type) {
					case CITIZEN_PREFIX:
						removeCitizen.call(this, citizen, removeType);
						break;
					case TRIGGER_PREFIX:
						removeTrigger.call(this, citizen, removeType);
						break;
					case ACTION_PREFIX:
						removeAction.call(this, citizen, removeType);
						break;
				}
			}
			else if (eventType === module.EventTypes.Trees.CitizenUpdated) {
				this.update(value);
			}
		},
		
		restrictSelection: function(citizen, options) {
			var id = citizen.getId ? citizen.getId() : null;
			var nodeName = module.treeData.getNodeName(citizen, {
					prefix: this.pre,
					id: id
				});
			
			generateNodes.call(this, nodeName, true);
			var node = jQuery('#' + nodeName, this.tree);
			this.tree.jstree('open_node', node, false, true);
			this.tree.addClass('restricted');
			
			for (var ndx = 0, len = options.length; ndx < len; ndx++) {
				nodeName = module.treeData.getNodeName(citizen, {
					option: options[ndx],
					prefix: this.pre,
					id: id
				});
				
				node = jQuery('#' + nodeName, this.tree);
				node.find('a').addClass('restrictedSelectable');
			}
		},
		
		select: function(citizen, option) {
			if (citizen === null || option === null) {
				this.tree.jstree('deselect_all');
			} else {
				var nodeName = module.treeData.getNodeName(citizen, {
						option: option,
						prefix: this.pre,
						id: citizen.getId ? citizen.getId() : null
					});
				
				generateNodes.call(this, nodeName, false);
				var node = jQuery('#' + nodeName);
				
				if (this.tree.jstree('is_leaf', node)) {
					this.tree.jstree('select_node', node, true);
				} else {
					this.tree.jstree('open_node', node, true);
				}
				
				this.tree.parent().scrollTo(node, 400);
			}
		},
		
		unrestrictSelection: function(citizen, msgs) {
			var id = citizen.getId ? citizen.getId() : null;
			this.tree.removeClass('restricted');
			
			for (var ndx = 0, len = msgs.length; ndx < len; ndx++) {
				var nodeName = module.treeData.getNodeName(citizen, {
						option: msgs[ndx],
						prefix: this.pre,
						id: id
					}),
					node = jQuery('#' + nodeName, this.tree);
				
				node.find('a').removeClass('restrictedSelectable');
			}
		},
		
		update: function(citizen) {
			var nodeName = module.treeData.getNodeName(citizen, {
						option: null,
						prefix: this.pre,
						id: citizen.getId()
					});
			
			generateNodes.call(this, nodeName, true);
			var node = jQuery('#' + nodeName, this.tree);
			this.tree.jstree('rename_node', node, citizen.name);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                         Tree View Private Methods                          //
////////////////////////////////////////////////////////////////////////////////
		
	var addAction = function(citizen, createType) {
			if (createType) {
				addActionType.call(this, citizen);
			}
			
			var actionNode = module.treeData.createActionJson(citizen, 
					this.pre),
				type = citizen.getCitizenType().split('.').pop();
				
			this.tree.jstree('create_node', '#' + this.pre + type, 'inside', {
				json_data: actionNode
			});
			
			for (propName in citizen) {
				var prop = citizen[propName];
				
				if (jQuery.isFunction(prop)) {
					addToolTip.call(this, citizen, propName);
				}
			}
		},
		
		addActionType = function(citizen) {
			var json = module.treeData.createCitizenTypeJson(citizen, 
				this.pre);
			
			if (this.tree == null) {
				createActionTree.call(this, [json]);
			} else {
				this.tree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			}
			
			addToolTip.call(this, citizen);
		},
		
		addCitizen = function(citizen, createType) {
			if (createType) {
				addCitizenType.call(this, citizen);
			}
			
			var citizenNode = module.treeData.createCitizenJson(citizen, 
					this.pre),
				type = citizen.getCitizenType().split('.').pop();
				
			this.tree.jstree('create_node', '#' + this.pre + type, 'inside', {
				json_data: citizenNode
			});
		},	
		
		addCitizenType = function(citizen) {
			var json = module.treeData.createCitizenTypeJson(citizen, 
				this.pre);
			
			if (this.tree == null) {
				createCitizenTree.call(this, [json]);
			} else {
				this.tree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			}
		},
		
		addToolTip = function(citizen, opt_func) {
			var nodeId = module.treeData.getNodeName(citizen, {
						prefix: this.pre,
						option: opt_func,
						id: opt_func ? citizen.getId() : null
					}),
				type = citizen.getCitizenType(),
				desc;
			
			if (opt_func) {
				desc = module.data.getMetaData().getDescription(type, opt_func);
			} else if (type === module.tools.ToolConstants.SHAPE_PICK) {
				desc = 'A Picked Shape is triggered when the user clicks on a shape that is part of a Model.';
			} else if (type === module.tools.ToolConstants.CAM_MOVE) {
				desc = 'A Camera Move is triggered when a Camera arrives at a Viewpoint.';
			} else {
				desc = module.data.getMetaData().getDescription(type);
			}
			
			if (desc != null) {
				this.tooltips.put(nodeId, desc);
			}
		},
		
		addTrigger = function(citizen, createType) {
			if (createType) {
				addTriggerType.call(this, citizen);
			}
			
			var triggerNode = module.treeData.createTriggerJson(citizen, 
					this.pre),
				type = citizen.getCitizenType().split('.').pop(),
				name = module.treeData.getNodeName(citizen, {
						option: module.treeData.MSG_WILDCARD,
						prefix: this.pre,
						id: citizen.getId()
					});
			
			this.tooltips.put(name, 'any of the triggers for the ' + type);
			
			this.tree.jstree('create_node', '#' + this.pre + type, 'inside', {
				json_data: triggerNode
			});
			
			if (citizen instanceof hemi.model.Model) {
				var spc = module.treeData.createShapePickCitizen(citizen);
					triggerNode = module.treeData.createShapePickJson(spc, 
						this.pre);
					type = spc.getCitizenType().split('.').pop();
				
				this.tree.jstree('create_node', '#' + this.pre + type, 'inside', {
					json_data: triggerNode
				});
			} else if (citizen instanceof hemi.view.Camera) {
				var cmc = module.treeData.createCamMoveCitizen(citizen),
					triggerNode = module.treeData.createCamMoveJson(cmc, 
						this.pre);
					type = cmc.getCitizenType().split('.').pop();
				
				this.tree.jstree('create_node', '#' + this.pre + type, 'inside', {
					json_data: triggerNode
				});
			} else if (citizen instanceof hemi.view.Viewpoint) {
				// In future if we support multiple cameras, this will need to
				// be updated
				var cmc = module.treeData.createCamMoveCitizen(hemi.world.camera),
					nodeName = module.treeData.getNodeName(cmc, {
						option: null,
						prefix: this.pre,
						id: cmc.getId()
					}),
					node = jQuery('#' + nodeName);
				
				if (node.length > 0) {
					triggerNode = module.treeData.createViewpointJson(cmc, 
						citizen, this.pre);
					
					this.tree.jstree('create_node', node, 'inside', {
						json_data: triggerNode
					});
				}
			}
			
			for (var i = 0, il = citizen.msgSent.length; i < il; ++i) {
				addTriggerToolTip.call(this, citizen, citizen.msgSent[i]);
			}
		},
		
		addTriggerToolTip = function(citizen, msg) {
			var nodeId = module.treeData.getNodeName(citizen, {
					prefix: this.pre,
					option: msg,
					id: citizen.getId()
				});
			
			msg = msg.split('.').pop();
			var desc = module.data.getMetaData().getMsgDescription(citizen.getCitizenType(), msg);
			
			if (desc != null) {
				this.tooltips.put(nodeId, desc);
			}
		},
		
		addTriggerType = function(citizen) {
			var json = module.treeData.createCitizenTypeJson(citizen, this.pre);
			
			if (this.tree == null) {
				createTriggerTree.call(this, [json]);
			} else {
				this.tree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			}
			
			addToolTip.call(this, citizen);
			
			if (citizen instanceof hemi.model.Model) {
				var spc = module.treeData.createShapePickCitizen(citizen);
					json = module.treeData.createShapePickTypeJson(spc, 
						this.pre);
				
				this.tree.jstree('create_node', -1, 'last', {
					json_data: json
				});
				
				addToolTip.call(this, spc);
			} else if (citizen instanceof hemi.view.Camera) {
				var cmc = module.treeData.createCamMoveCitizen(citizen);
				json = module.treeData.createCamMoveTypeJson(cmc, this.pre);
				
				this.tree.jstree('create_node', -1, 'last', {
					json_data: json
				});
				
				addToolTip.call(this, cmc);
			}
		},
		
		createActionTree = function(json) {
			this.tree = jQuery('<div class="sharedTree"></div>');
			this.container = this.tree;
			
			this.tree.jstree({
				'json_data': {
					'data': json,
					'progressive_render': true
				},
				'types': {
					'types': {
						'method': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-80px 0'
							}
						},
						'citizen': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-48px 0'
							}
						},
						'citType': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-64px 0'
							}
						},
						'other': {}
					}
				},
				'themes': {
					'dots': false
				},
				'ui': {
					'select_limit': 1,
					'selected_parent_close': 'false'
				},
				'plugins': ['json_data', 'sort', 'themes', 'types', 'ui']
			});	
			
			this.notifyListeners(module.EventTypes.Trees.TreeCreated, this.tree);
		},
		
		createCitizenTree = function(json) {
			this.tree = jQuery('<div></div>');
			this.container = this.tree;
			
			this.tree.jstree({
				'json_data': {
					'data': json,
					'progressive_render': true
				},
				'types': {
					'types': {
						'citizen': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-48px 0'
							}
						},
						'citType': {
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
					'select_limit': 1,
					'selected_parent_close': 'false'
				},
				'plugins': ['json_data', 'sort', 'themes', 'types', 'ui']
			});
			
			this.notifyListeners(module.EventTypes.Trees.TreeCreated, this.tree);
		},
				
		createTriggerTree = function(json) {
			var wildcardTrigger = module.treeData.createWildcardJson(this.pre);
			
			json.unshift(wildcardTrigger);
			this.tree = jQuery('<div class="sharedTree"></div>');
			this.container = this.tree;
			
			this.tree.jstree({
				'json_data': {
					'data': json,
					'progressive_render': true
				},
				'types': {
					'types': {
						'message': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-80px 0'
							}
						},
						'citizen': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-48px 0'
							}
						},
						'citType': {
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
					'select_limit': 1,
					'selected_parent_close': 'false'
				},
				'plugins': ['json_data', 'sort', 'themes', 'types', 'ui']
			});
			
			var wildcard = module.treeData.MSG_WILDCARD,
				name = module.treeData.getNodeName(wildcard, {
					option: wildcard,
					prefix: this.pre
				});
			
			this.tooltips.put(name, 'any trigger from any source');
			
			name = module.treeData.getNodeName(wildcard, {
				option: null,
				prefix: this.pre
			});
			
			this.tooltips.put(name, 'a trigger from any source');
			
			this.notifyListeners(module.EventTypes.Trees.TreeCreated, this.tree);
		},
		
		deselectAction = function(data) {
			var citizen = data.citizen, 
				method = data.method,
				nodeName = module.treeData.getNodeName(citizen, {
					option: method,
					prefix: this.pre,
					id: citizen.getId()
				}),
	        	node = jQuery('#' + nodeName),
				actionText = jQuery('#msgEdtEffectTxt');
			
			this.tree.jstree('deselect_node', node);
			actionText.text('');
		},
		
		deselectTrigger = function(data) {
			var citizen = data.citizen, 
				message = data.message,
				id = citizen.getId ? citizen.getId() : null,
				nodeName = module.treeData.getNodeName(citizen, {
					option: message,
					prefix: this.pre,
					id: id
				}),
	        	node = jQuery('#' + nodeName),
				triggerText = jQuery('#msgEdtCauseTxt');
			
			this.tree.jstree('deselect_node', node);
			triggerText.text('');
		},
		
		generateNodes = function(nodeName, closePath) {
			var paths = module.treeData.getNodePath(nodeName),
				toClose = [];
			
			for (var i = 0; i < paths.length; ++i) {
				var node = jQuery('#' + paths[i], this.tree);
				
				if (closePath && this.tree.jstree('is_closed', node)) {
					toClose.unshift(node);
				}
				
				this.tree.jstree('open_node', node, false, true);
			}
			
			for (var i = 0; i < toClose.length; ++i) {
				this.tree.jstree('close_node', toClose[i], true);
			}
		},
		
		removeAction = function(citizen, removeType) {
			var nodeName = module.treeData.getNodeName(citizen, {
				option: null,
				prefix: this.pre,
				id: citizen.getId()
			});
			
			var node = jQuery('#' + nodeName);
			this.tree.jstree('delete_node', node);
			
			if (removeType) {
				removeActionType.call(this, citizen);
			}
		},
		
		removeActionType = function(citizen) {
			var nodeName = module.treeData.getNodeName(citizen, {
				option: null,
				prefix: this.pre
			});
			
			var node = jQuery('#' + nodeName);
			this.tree.jstree('delete_node', node);
		},
		
		removeCitizen = function(citizen, removeType) {
			var nodeName = module.treeData.getNodeName(citizen, {
				option: null,
				prefix: this.pre,
				id: citizen.getId()
			});
			
			var node = jQuery('#' + nodeName);
			this.tree.jstree('delete_node', node);
			
			if (removeType) {
				removeCitizenType.call(this, citizen);
			}
		},
		
		removeCitizenType = function(citizen) {
			var nodeName = module.treeData.getNodeName(citizen, {
				option: null,
				prefix: this.pre
			});
			
			var node = jQuery('#' + nodeName);
			this.tree.jstree('delete_node', node);
		},
		
		removeTrigger = function(citizen, removeType) {
			var id = citizen.getId ? citizen.getId() : null,
				nodeName = module.treeData.getNodeName(citizen, {
					option: null,
					prefix: this.pre,
					id: id
				});
			
			var node = jQuery('#' + nodeName);
			this.tree.jstree('delete_node', node);
			
			if (citizen instanceof hemi.model.Model) {
				var spc = module.treeData.createShapePickCitizen(citizen);
				nodeName = module.treeData.getNodeName(spc, {
					option: null,
					prefix: this.pre,
					id: id
				});
				
				node = jQuery('#' + nodeName);
				this.tree.jstree('delete_node', node);
			} else if (citizen instanceof hemi.view.Camera) {
				var cmc = module.treeData.createCamMoveCitizen(citizen);
				nodeName = module.treeData.getNodeName(cmc, {
					option: null,
					prefix: this.pre,
					id: id
				});
				
				node = jQuery('#' + nodeName);
				this.tree.jstree('delete_node', node);
			} else if (citizen instanceof hemi.view.Viewpoint) {
				// In future if we support multiple cameras, this will need to
				// be updated
				var cmc = module.treeData.createCamMoveCitizen(hemi.world.camera);
				nodeName = module.treeData.getNodeName(cmc, {
					option: id,
					prefix: this.pre,
					id: id
				});
				
				node = jQuery('#' + nodeName);
				this.tree.jstree('delete_node', node);
			}
			
			if (removeType) {
				removeTriggerType.call(this, citizen);
			}
		},
		
		removeTriggerType = function(citizen) {
			var nodeName = module.treeData.getNodeName(citizen, {
				option: null,
				prefix: this.pre
			});
			
			var node = jQuery('#' + nodeName);
			this.tree.jstree('delete_node', node);
			
			if (citizen instanceof hemi.model.Model) {
				var spc = module.treeData.createShapePickCitizen(citizen);
				nodeName = module.treeData.getNodeName(spc, {
					option: null,
					prefix: this.pre
				});
				
				node = jQuery('#' + nodeName);
				this.tree.jstree('delete_node', node);
			} else if (citizen instanceof hemi.view.Camera) {
				var cmc = module.treeData.createCamMoveCitizen(citizen);
				nodeName = module.treeData.getNodeName(cmc, {
					option: null,
					prefix: this.pre
				});
				
				node = jQuery('#' + nodeName);
				this.tree.jstree('delete_node', node);
			}
		};
	
////////////////////////////////////////////////////////////////////////////////
//                         		  Helper Methods   	                          //
////////////////////////////////////////////////////////////////////////////////

	var populateTree = function(tree) {
		var treeModel = module.ui.treeModel,
			table = treeModel.citizenTypes,
			keys = table.keys();
			
		treeModel.addListener(module.EventTypes.Trees.CitizenAdded, tree);
		treeModel.addListener(module.EventTypes.Trees.CitizenRemoved, tree);
		treeModel.addListener(module.EventTypes.Trees.CitizenUpdated, tree);
			
		for (var i = 0, il = keys.length; i < il; i++) {
			var list = table.get(keys[i]);
			
			for (var j = 0, jl = list.length; j < jl; j++) {
				var cit = list[j],
					createType = j === 0;
				
				tree.notify(module.EventTypes.Trees.CitizenAdded, {
					citizen: cit,
					createType: createType
				});
			}
		}
	};
	
	module.ui.treeModel = new TreeModel();
	
	module.ui.createCitizensTree = function() {
		var tree = new TreeView(CITIZEN_PREFIX);
		
		populateTree(tree);
		return tree;
	};
	
	module.ui.createActionsTree = function() {
		var tree = new TreeView(ACTION_PREFIX);
		
		populateTree(tree);
		return tree;
	};
	
	module.ui.createTriggersTree = function() {
		var tree = new TreeView(TRIGGER_PREFIX);
		
		populateTree(tree);
		return tree;
	};
	
	
	return module;
})(editor || {});
