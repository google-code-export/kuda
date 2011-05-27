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
	module.ui = module.ui || {}
	
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
		CITIZEN_PREFIX = 'ci_',
		MSG_WILDCARD = 'Any';
	
	var methodsToRemove = [
        'constructor',
		'getId',
		'setId',
		'getCitizenType',
		'setCitizenType',
		'toOctane'
	];
	
	var commonMethods = {
		'hemi.animation.Animation': ['reset', 'start', 'stop'],
		'hemi.audio.Audio': ['pause', 'play', 'seek', 'setVolume'],
		'hemi.effect.Burst': ['trigger'],
		'hemi.effect.Emitter': ['hide', 'show'],
		'hemi.effect.Trail': ['start', 'stop'],
		'hemi.hud.HudDisplay': ['hide', 'nextPage', 'previousPage', 'show'],
		'hemi.hud.Theme': ['load'],
		'hemi.manip.Draggable': ['disable', 'enable'],
		'hemi.manip.Scalable': ['disable', 'enable'],
		'hemi.manip.Turnable': ['disable', 'enable'],
		'hemi.model.Model': ['load', 'unload'],
		'hemi.motion.Rotator': ['disable', 'enable', 'setAccel', 'setAngle',
			'setVel'],
		'hemi.motion.Translator': ['disable', 'enable', 'setAccel', 'setPos',
			'setVel'],
		'hemi.scene.Scene': ['load', 'nextScene', 'previousScene', 'unload'],
		'hemi.view.Camera': ['disableControl', 'enableControl', 'moveToView',
			'orbit', 'rotate', 'setLight', 'truck']
	};
	
////////////////////////////////////////////////////////////////////////////////
//                                 Utilities                                  //
////////////////////////////////////////////////////////////////////////////////

	var isCommon = function(citizen, method) {
		var type = citizen.getCitizenType ? citizen.getCitizenType() : citizen.name,
			methList = commonMethods[type],
			common = false;
		
		if (citizen.parent != null) {
			common = isCommon(citizen.parent, method);
		}
		
		if (!common && methList != null) {
			common = methList.indexOf(method) !== -1;
		}
		
		return common;
	};
	
	var createShapePickCitizen = function(model) {
		return {
			shapePick: true,
			name: 'Picked Shape:',
			citizen: model,
			getCitizenType: function() {
				return module.tools.ToolConstants.SHAPE_PICK;
			},
			getId: function() {
				return this.citizen.getId();
			}
		};
	};
	
	var createCamMoveCitizen = function(camera) {
		return {
			camMove: true,
			name: 'Camera Move:',
			citizen: camera,
			getCitizenType: function() {
				return module.tools.ToolConstants.CAM_MOVE;
			},
			getId: function() {
				return this.citizen.getId();
			}
		};
	};
	
	var getNodeName = function(citizen, config) {
		var nodeName = config.prefix;
		
		if (citizen === null) {
			return null;
		} else if (citizen === MSG_WILDCARD) {
			nodeName += citizen;
		} else if (citizen.getCitizenType !== undefined) {
			nodeName += citizen.getCitizenType().split('.').pop();
		}
		
		if (config.id != null) {
			nodeName += '_' + config.id;
		}
		if (config.option != null) {
			nodeName += '_' + config.option;
		}
		
		return nodeName.replace(' ', '_').replace('.', '_');
	};
	
	var createCitizenTypeJson = function(citizen, prefix) {
		var type = citizen.getCitizenType().split('.').pop(),
			name = getNodeName(citizen, {
				option: null,
				prefix: prefix
			});
		
		return {
			data: type,
			attr: {
				id: name,
				rel: 'citType'
			},
			state: 'closed',
			children: [],
			metadata: {
				type: 'citType'
			}
		};
	};
	
	var createCitizenJson = function(citizen, prefix) {
		var name = getNodeName(citizen, {
			option: null,
			prefix: prefix,
			id: citizen.getId()
		});
		
		return {
			data: citizen.name,
			attr: {
				id: name,
				rel: 'citizen'
			},
			metadata: {
				type: 'citizen',
				citizen: citizen
			}
		};
	};
	
	var createTriggerJson = function(citizen) {
		var id = citizen.getId(),
			name = getNodeName(citizen, {
				option: MSG_WILDCARD,
				prefix: TRIGGER_PREFIX,
				id: id
			}),
			msgs = [{
				data: '[Any message]',
				attr: {
					id: name,
					rel: 'message'
				},
				metadata: {
					type: 'message',
					parent: citizen,
					msg: MSG_WILDCARD
				}
			}];
		
		for (var ndx = 0, len = citizen.msgSent.length; ndx < len; ndx++) {
			var msg = citizen.msgSent[ndx],
				name = getNodeName(citizen, {
					option: msg,
					prefix: TRIGGER_PREFIX,
					id: id
				});
			
			msgs.push({
				data: msg.split('.').pop(),
				attr: {
					id: name,
					rel: 'message'
				},
				metadata: {
					type: 'message',
					parent: citizen,
					msg: msg
				}
			});
		}
		
		var node = createCitizenJson(citizen, TRIGGER_PREFIX);
		node.children = msgs;
		node.state = 'closed';
		return node;
	};
	
	var createActionJson = function(citizen) {
		var methods = [],
			moreMethods = [],
			id = citizen.getId();
		
		for (propName in citizen) {
			var prop = citizen[propName];
			
			if (jQuery.isFunction(prop) && methodsToRemove.indexOf(propName) === -1) {
				var name = getNodeName(citizen, {
						option: propName,
						prefix: ACTION_PREFIX,
						id: id
					}),
					node = {
						data: propName,
						attr: {
							id: name,
							rel: 'method'
						},
						metadata: {
							type: 'method',
							parent: citizen
						}
					};
				
				if (isCommon(citizen, propName)) {
					methods.push(node);
				} else {
					moreMethods.push(node);
				}
			}
		}
		
		if (methods.length > 0) {
			var moreName = getNodeName(citizen, {
					option: null,
					prefix: ACTION_PREFIX,
					id: id
				}) + '_MORE';
			var moreNode = {
				data: 'More...',
				attr: {
					id: moreName,
					rel: 'other'
				},
				state: 'closed',
				children: moreMethods,
				metadata: {
					type: 'citType'
				}
			};
			methods.push(moreNode);
		} else {
			methods = moreMethods;
		}
		
		var node = createCitizenJson(citizen, ACTION_PREFIX);
		node.children = methods;
		node.state = 'closed';
		return node;
	};
	
	var createModuleJson = function(module) {
		var methods = [];
		
		for (propName in module) {
			var prop = module[propName];
			
			if (jQuery.isFunction(prop) && methodsToRemove.indexOf(propName) === -1) {
				var name = getNodeName(module, {
					option: propName,
					prefix: ACTION_PREFIX,
					id: module.getId()
				});
				
				methods.push({
					data: propName,
					attr: {
						id: name,
						rel: 'method'
					},
					metadata: {
						type: 'method',
						parent: module
					}
				});
			}
		}
		
		var name = getNodeName(module, {
			prefix: ACTION_PREFIX,
			id: module.getId()
		});
		
		return {
			data: module.name,
			attr: {
				id: name,
				rel: 'citType'
			},
			metadata: {
				type: 'citType',
				citizen: module
			},
			children: methods,
			state: 'closed'
		};
	};
	
	var createCamMoveJson = function(cmCit) {
		var camera = cmCit.citizen,
			viewpoints = hemi.world.getViewpoints(),
			vpList = [];
		
		for (var ndx = 0, len = viewpoints.length; ndx < len; ndx++) {
			var node = createViewpointJson(cmCit, viewpoints[ndx]);
			viewpoints.push(node);
		}
		
		var name = getNodeName(cmCit, {
			option: null,
			prefix: TRIGGER_PREFIX,
			id: cmCit.getId()
		});
		
		return {
			data: camera.name,
			attr: {
				id: name,
				rel: 'citizen'
			},
			children: viewpoints,
			state: 'closed',
			metadata: {
				type: 'citizen',
				citizen: cmCit
			}
		};
	};
	
	var createCamMoveTypeJson = function(cmCit) {
		var name = getNodeName(cmCit, {
			option: null,
			prefix: TRIGGER_PREFIX
		});
		
		return {
			data: 'Camera Move',
			attr: {
				id: name,
				rel: 'citType'
			},
			state: 'closed',
			children: [],
			metadata: {
				type: 'citType'
			}
		};
	};
	
	var createViewpointJson = function(cmCit, viewpoint) {
		var name = getNodeName(cmCit, {
				option: viewpoint.getId(),
				prefix: TRIGGER_PREFIX,
				id: cmCit.getId()
			});
			
		return {
			data: viewpoint.name,
			attr: {
				id: name,
				rel: 'message'
			},
			metadata: {
				type: 'message',
				parent: cmCit,
				msg: viewpoint.getId()
			}
		};
	};
	
	var createShapePickJson = function(spCit) {
		var model = spCit.citizen,
			id = spCit.getId(),
			shapes = [];
		
		for (var ndx = 0, len = model.shapes.length; ndx < len; ndx++) {
			var shape = model.shapes[ndx],
				name = getNodeName(spCit, {
					option: shape.name,
					prefix: TRIGGER_PREFIX,
					id: id
				});
			
			shapes.push({
				data: shape.name,
				attr: {
					id: name,
					rel: 'message'
				},
				metadata: {
					type: 'message',
					parent: spCit,
					msg: shape.name
				}
			});
		}
		
		var name = getNodeName(spCit, {
			option: null,
			prefix: TRIGGER_PREFIX,
			id: id
		});
		
		return {
			data: model.name,
			attr: {
				id: name,
				rel: 'citizen'
			},
			children: shapes,
			state: 'closed',
			metadata: {
				type: 'citizen',
				citizen: spCit
			}
		};
	};
	
	var createShapePickTypeJson = function(spCit) {
		var name = getNodeName(spCit, {
			option: null,
			prefix: TRIGGER_PREFIX
		});
		
		return {
			data: 'Picked Shape',
			attr: {
				id: name,
				rel: 'citType'
			},
			state: 'closed',
			children: [],
			metadata: {
				type: 'citType'
			}
		};
	};
	
	var createWildcardJson = function() {
		var name = getNodeName(MSG_WILDCARD, {
				option: MSG_WILDCARD,
				prefix: TRIGGER_PREFIX
			}),
			msgs = [{
				data: '[Any message]',
				attr: {
					id: name,
					rel: 'message'
				},
				metadata: {
					type: 'message',
					parent: MSG_WILDCARD,
					msg: MSG_WILDCARD
				}
			}];
		
		for (var ndx in hemi.msg) {
			var msg = hemi.msg[ndx];
			
			if (!jQuery.isFunction(msg)) {
				name = getNodeName(MSG_WILDCARD, {
					option: msg,
					prefix: TRIGGER_PREFIX
				});
				
				msgs.push({
					data: msg.split('.').pop(),
					attr: {
						id: name,
						rel: 'message'
					},
					metadata: {
						type: 'message',
						parent: MSG_WILDCARD,
						msg: msg
					}
				});
			}
		}
		
		name = getNodeName(MSG_WILDCARD, {
			option: null,
			prefix: TRIGGER_PREFIX
		});
		
		return {
			data: '[Any source]',
			attr: {
				id: name,
				rel: 'citizen'
			},
			state: 'closed',
			children: msgs,
			metadata: {
				type: 'citizen',
				citizen: MSG_WILDCARD
			}
		};
	};
	
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
	
	var TreeView = module.ui.Component.extend({
		init: function(type, noBind) {
			this._super();
			this.type = type;
			this.noBind = noBind || false;
			this.tree = null;
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
				this.update(value.citizen);
			}
		},
		
		select: function(data) {					
			switch (this.type) {
				case TRIGGER_PREFIX:
					selectTrigger.call(this, data);
					break;
				case ACTION_PREFIX:
					selectAction.call(this, data);
					break;
			}
		},
		
		update: function(citizen) {
			var nodeName = getNodeName(citizen, {
						option: null,
						prefix: this.type,
						id: citizen.getId()
					}),
				node = jQuery('#' + nodeName);
			
			this.tree.jstree('rename_node', node, citizen.name);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                View Helpers                                //
////////////////////////////////////////////////////////////////////////////////
		
	var addAction = function(citizen, createType) {
			if (createType) {
				addActionType.call(this, citizen);
			}
			
			var actionNode = createActionJson(citizen),
				type = citizen.getCitizenType().split('.').pop();
				
			this.tree.jstree('create_node', '#' + ACTION_PREFIX + type, 'inside', {
				json_data: actionNode
			});
		},
		
		addActionType = function(citizen) {
			var json = createCitizenTypeJson(citizen, ACTION_PREFIX);
			
			if (this.tree == null) {
				createActionTree.call(this, [json]);
			} else {
				this.tree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			}
		},
		
		addCitizen = function(citizen, createType) {
			if (createType) {
				addCitizenType.call(this, citizen);
			}
			
			var citizenNode = createCitizenJson(citizen, CITIZEN_PREFIX),
				type = citizen.getCitizenType().split('.').pop();
				
			this.tree.jstree('create_node', '#' + CITIZEN_PREFIX + type, 'inside', {
				json_data: citizenNode
			});
		},	
		
		addCitizenType = function(citizen) {
			var json = createCitizenTypeJson(citizen, CITIZEN_PREFIX);
			
			if (this.tree == null) {
				createCitizenTree.call(this, [json]);
			} else {
				this.tree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			}
		},
		
		addTrigger = function(citizen, createType) {
			if (createType) {
				addTriggerType.call(this, citizen);
			}
			
			var triggerNode = createTriggerJson(citizen),
				type = citizen.getCitizenType().split('.').pop();
				
			this.tree.jstree('create_node', '#' + TRIGGER_PREFIX + type, 'inside', {
				json_data: triggerNode
			});
			
			if (citizen instanceof hemi.model.Model) {
				var spc = createShapePickCitizen(citizen);
				triggerNode = createShapePickJson(spc);
				type = spc.getCitizenType().split('.').pop();
				
				this.tree.jstree('create_node', '#' + TRIGGER_PREFIX + type, 'inside', {
					json_data: triggerNode
				});
			} else if (citizen instanceof hemi.view.Camera) {
				var cmc = createCamMoveCitizen(citizen);
				triggerNode = createCamMoveJson(cmc);
				type = cmc.getCitizenType().split('.').pop();
				
				this.tree.jstree('create_node', '#' + TRIGGER_PREFIX + type, 'inside', {
					json_data: triggerNode
				});
			} else if (citizen instanceof hemi.view.Viewpoint) {
				// In future if we support multiple cameras, this will need to
				// be updated
				var cmc = createCamMoveCitizen(hemi.world.camera),
					nodeName = getNodeName(cmc, {
						option: null,
						prefix: TRIGGER_PREFIX,
						id: cmc.getId()
					}),
					node = jQuery('#' + nodeName);
				
				if (node.length > 0) {
					triggerNode = createViewpointJson(cmc, citizen);
					
					this.tree.jstree('create_node', node, 'inside', {
						json_data: triggerNode
					});
				}
			}
		},
		
		addTriggerType = function(citizen) {
			var json = createCitizenTypeJson(citizen, TRIGGER_PREFIX);
			
			if (this.tree == null) {
				createTriggerTree.call(this, [json]);
			} else {
				this.tree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			}
			
			if (citizen instanceof hemi.model.Model) {
				var spc = createShapePickCitizen(citizen);
				json = createShapePickTypeJson(spc);
				
				this.tree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			} else if (citizen instanceof hemi.view.Camera) {
				var cmc = createCamMoveCitizen(citizen);
				json = createCamMoveTypeJson(cmc);
				
				this.tree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			}
		},
		
		createActionTree = function(json) {
			var that = this;
				
			this.tree = jQuery('<div id="effectTree"></div>');
			this.container = this.tree;
			
			this.tree.jstree({
				'json_data': {
					'data': json
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
			
			if (!this.noBind) {
				this.tree.bind('select_node.jstree', function(evt, data) {
					var elem = data.rslt.obj,
						metadata = elem.data('jstree'),
						elemId = elem.attr('id'),
						msgType = module.EventTypes.Trees.SelectAction;
					
					if (that.lastAction === elemId) {
						that.tree.jstree('close_node', elem);
						that.lastAction = null;
					} else {
						that.lastAction = elemId;
						
						if (metadata.type === 'method') {
							var path = that.tree.jstree('get_path', elem, true);
							var parentName = path[path.length - 2] + '_';
							var parId = metadata.parent.getId() + '';
							parentName = parentName.replace(parId + '_MORE', parId);
							var name = elemId.replace(parentName, '');
							
							that.notifyListeners(msgType, {
								citizen: metadata.parent,
								method: name
							});
						} else if (metadata.type === 'citizen') {
							that.tree.jstree('open_node', elem, false, false);
							that.notifyListeners(msgType, {
								citizen: metadata.citizen,
								method: null
							});
						} else if (metadata.type === 'citType') {
							that.tree.jstree('open_node', elem, false, false);
							that.notifyListeners(msgType, {
								citizen: null,
								method: null
							});
						}
					}
				});				
			}
			
			this.notifyListeners(module.EventTypes.Trees.TreeCreated, this.tree);
		},
		
		createCitizenTree = function(json) {
			var that = this;
				
			this.tree = jQuery('<div id="msgEdtCitizensTree"></div>');
			this.container = this.tree;
			
			this.tree.jstree({
				'json_data': {
					'data': json
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
			
			if (!this.noBind) {
				this.tree.bind('select_node.jstree', function(evt, data) {
					var elem = data.rslt.obj,
						metadata = elem.data('jstree'),
						paramIpt = that.currentParamIpt,
						citParam;
						
					if (metadata.type === 'citizen') {
						citParam = hemi.dispatch.ID_ARG + metadata.citizen.getId();
						jQuery(this).parent().hide(200);
						that.tree.jstree('close_all').jstree('deselect_all');
						that.currentParamIpt = null;
					} else if (metadata.type === 'citType') {
						citParam = '';
						that.tree.jstree('toggle_node', elem);
					}
					
					if (paramIpt != null) {
						paramIpt.val(citParam);
						
						that.notifyListeners(module.EventTypes.Trees.SelectCitizen, {
							name: paramIpt.data('paramName'),
							value: citParam
						});
					}
				});			
			}
			
			this.notifyListeners(module.EventTypes.Trees.TreeCreated, this.tree);
		},
				
		createTriggerTree = function(json) {
			var that = this,
				wildcardTrigger = createWildcardJson();
			
			json.unshift(wildcardTrigger);
			this.tree = jQuery('<div id="causeTree"></div>');
			this.container = this.tree;
			
			this.tree.jstree({
				'json_data': {
					'data': json
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
			
			if (!this.noBind) {
				this.tree.bind('select_node.jstree', function(evt, data) {
					var elem = data.rslt.obj,
						metadata = elem.data('jstree'),
						elemId = elem.attr('id'),
						isRestricted = that.tree.hasClass('restricted'),
						isSelectable = elem.children('a').hasClass('restrictedSelectable'),
						msgType = module.EventTypes.Trees.SelectTrigger;
					
					if (that.lastTrigger === elemId) {
						that.tree.jstree('close_node', elem);
						that.lastTrigger = null;
					} else {
						that.lastTrigger = elemId;
						
						if (isSelectable || !isRestricted) {
							if (metadata.type === 'message') {
								that.notifyListeners(msgType, {
									source: metadata.parent,
									message: metadata.msg
								});
							}
							else if (metadata.type === 'citizen') {
								that.tree.jstree('open_node', elem, false, false);
								that.notifyListeners(msgType, {
									source: metadata.citizen,
									message: null
								});
							}
							else if (metadata.type === 'citType') {
								that.tree.jstree('open_node', elem, false, false);
								that.notifyListeners(msgType, {
									source: null,
									message: null
								});
							}
						}
					}
				});
			}
			
			this.notifyListeners(module.EventTypes.Trees.TreeCreated, this.tree);
		},
		
		deselectAction = function(data) {
			var citizen = data.citizen, 
				method = data.method,
				nodeName = getNodeName(citizen, {
					option: method,
					prefix: ACTION_PREFIX,
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
				nodeName = getNodeName(citizen, {
					option: message,
					prefix: TRIGGER_PREFIX,
					id: id
				}),
	        	node = jQuery('#' + nodeName),
				triggerText = jQuery('#msgEdtCauseTxt');
			
			this.tree.jstree('deselect_node', node);
			triggerText.text('');
		},
		
		removeAction = function(citizen, removeType) {
			var nodeName = getNodeName(citizen, {
				option: null,
				prefix: ACTION_PREFIX,
				id: citizen.getId()
			});
			
			var node = jQuery('#' + nodeName);
			this.tree.jstree('delete_node', node);
			
			if (removeType) {
				removeActionType.call(this, citizen);
			}
		},
		
		removeActionType = function(citizen) {
			var nodeName = getNodeName(citizen, {
				option: null,
				prefix: ACTION_PREFIX
			});
			
			var node = jQuery('#' + nodeName);
			this.tree.jstree('delete_node', node);
		},
		
		removeCitizen = function(citizen, removeType) {
			var nodeName = getNodeName(citizen, {
				option: null,
				prefix: CITIZEN_PREFIX,
				id: citizen.getId()
			});
			
			var node = jQuery('#' + nodeName);
			this.tree.jstree('delete_node', node);
			
			if (removeType) {
				removeCitizenType.call(this, citizen);
			}
		},
		
		removeCitizenType = function(citizen) {
			var nodeName = getNodeName(citizen, {
				option: null,
				prefix: CITIZEN_PREFIX
			});
			
			var node = jQuery('#' + nodeName);
			this.tree.jstree('delete_node', node);
		},
		
		removeTrigger = function(citizen, removeType) {
			var id = citizen.getId ? citizen.getId() : null,
				nodeName = getNodeName(citizen, {
					option: null,
					prefix: TRIGGER_PREFIX,
					id: id
				});
			
			var node = jQuery('#' + nodeName);
			this.tree.jstree('delete_node', node);
			
			if (citizen instanceof hemi.model.Model) {
				var spc = createShapePickCitizen(citizen);
				nodeName = getNodeName(spc, {
					option: null,
					prefix: TRIGGER_PREFIX,
					id: id
				});
				
				node = jQuery('#' + nodeName);
				this.tree.jstree('delete_node', node);
			} else if (citizen instanceof hemi.view.Camera) {
				var cmc = createCamMoveCitizen(citizen);
				nodeName = getNodeName(cmc, {
					option: null,
					prefix: TRIGGER_PREFIX,
					id: id
				});
				
				node = jQuery('#' + nodeName);
				this.tree.jstree('delete_node', node);
			} else if (citizen instanceof hemi.view.Viewpoint) {
				// In future if we support multiple cameras, this will need to
				// be updated
				var cmc = createCamMoveCitizen(hemi.world.camera);
				nodeName = getNodeName(cmc, {
					option: id,
					prefix: TRIGGER_PREFIX,
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
			var nodeName = getNodeName(citizen, {
				option: null,
				prefix: TRIGGER_PREFIX
			});
			
			var node = jQuery('#' + nodeName);
			this.tree.jstree('delete_node', node);
			
			if (citizen instanceof hemi.model.Model) {
				var spc = createShapePickCitizen(citizen);
				nodeName = getNodeName(spc, {
					option: null,
					prefix: TRIGGER_PREFIX
				});
				
				node = jQuery('#' + nodeName);
				this.tree.jstree('delete_node', node);
			} else if (citizen instanceof hemi.view.Camera) {
				var cmc = createCamMoveCitizen(citizen);
				nodeName = getNodeName(cmc, {
					option: null,
					prefix: TRIGGER_PREFIX
				});
				
				node = jQuery('#' + nodeName);
				this.tree.jstree('delete_node', node);
			}
		},
		
		selectAction = function(data) {
			var citizen = data.handler, 
				method = data.method,
				nodeName = null,
				actionText = jQuery('#msgEdtEffectTxt');
			
			if (citizen === null || method === null) {
				actionText.text('');
			} else {
				nodeName = getNodeName(citizen, {
					option: method,
					prefix: ACTION_PREFIX,
					id: citizen.getId ? citizen.getId() : null
				});
				
				actionText.text(citizen.name + ' ' + method);
			}
			
			if (nodeName === null) {
				this.tree.jstree('deselect_all');
			} else {
				var elem = jQuery('#' + nodeName),
					elemId = elem.attr('id');
					
				if (this.lastAction !== elemId) {
					var path = this.tree.jstree('get_path', elem, true);
					
					for (var i = 0; i < path.length; i++) {
						var node = jQuery('#' + path[i]);
						this.tree.jstree('open_node', node, false, true);
					}
					
					this.tree.jstree('select_node', elem, true);
					this.tree.parent().scrollTo(elem, 400);
				}
			}
		},
		
		selectTrigger = function(data) {
			var citizen = data.source, 
				message = data.message,
				nodeName = null,
				triggerText = jQuery('#msgEdtCauseTxt');
			
			if (citizen === null || message === null) {
				triggerText.text('');
			} else {
				var name = citizen === MSG_WILDCARD ? citizen : citizen.name,
					msg;
				
				nodeName = getNodeName(citizen, {
					option: message,
					prefix: TRIGGER_PREFIX,
					id: citizen.getId ? citizen.getId() : null
				});
				
				if (citizen.camMove) {
					var viewpoint = hemi.world.getCitizenById(message);
					msg = viewpoint.name;
				} else {
					msg = message;
				}
				
				triggerText.text(name + ' ' + msg);
			}
			
			if (nodeName === null) {
				this.tree.jstree('deselect_all');
			} else {
				var elem = jQuery('#' + nodeName),
					elemId = elem.attr('id');
					
				if (this.lastTrigger !== elemId) {
					var path = this.tree.jstree('get_path', elem, true);
					
					for (var i = 0; i < path.length; i++) {
						var node = jQuery('#' + path[i]);
						this.tree.jstree('open_node', node, false, true);
					}
					
					this.tree.jstree('select_node', elem, true);
					this.tree.parent().scrollTo(elem, 400);
				}
			}
		};
	
	module.ui.TreeModel = new TreeModel();
	
	module.ui.createCitizensTree = function(noBind) {
		var tree = new TreeView(CITIZEN_PREFIX, noBind);
		module.ui.TreeModel.addListener(module.EventTypes.Trees.CitizenAdded, tree);
		module.ui.TreeModel.addListener(module.EventTypes.Trees.CitizenRemoved, tree);
		module.ui.TreeModel.addListener(module.EventTypes.Trees.CitizenUpdated, tree);
		
		return tree;
	};
	
	module.ui.createActionsTree = function(noBind) {
		var tree = new TreeView(ACTION_PREFIX, noBind);
		module.ui.TreeModel.addListener(module.EventTypes.Trees.CitizenAdded, tree);
		module.ui.TreeModel.addListener(module.EventTypes.Trees.CitizenRemoved, tree);
		module.ui.TreeModel.addListener(module.EventTypes.Trees.CitizenUpdated, tree);
		
		return tree;
	};
	
	module.ui.createTriggersTree = function(noBind) {
		var tree = new TreeView(TRIGGER_PREFIX, noBind);
		module.ui.TreeModel.addListener(module.EventTypes.Trees.CitizenAdded, tree);
		module.ui.TreeModel.addListener(module.EventTypes.Trees.CitizenRemoved, tree);
		module.ui.TreeModel.addListener(module.EventTypes.Trees.CitizenUpdated, tree);
		
		return tree;
	};
	
	
	return module;
})(editor || {})
