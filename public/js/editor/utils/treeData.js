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

var editor = (function(module, jQuery) {
	module.treeData = module.treeData || {};
	
	var TRIGGER_PREFIX = module.treeData.TRIGGER_PREFIX = 'tr_',
		ACTION_PREFIX = module.treeData.ACTION_PREFIX = 'ac_',
		CITIZEN_PREFIX = module.treeData.CITIZEN_PREFIX = 'ci_',
		MSG_WILDCARD = module.treeData.MSG_WILDCARD = 'Any';
	
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
	
	module.treeData.getNodeName = getNodeName;
	module.treeData.createCitizenJson = createCitizenJson;
	
	module.treeData.createShapePickCitizen = function(model) {
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
	
	module.treeData.createCamMoveCitizen = function(camera) {
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
	
	module.treeData.createCitizenTypeJson = function(citizen, prefix) {
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
	
	module.treeData.createTriggerJson = function(citizen) {
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
	
	module.treeData.createActionJson = function(citizen) {
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
	
	module.treeData.createModuleJson = function(module) {
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
	
	module.treeData.createCamMoveJson = function(cmCit) {
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
	
	module.treeData.createCamMoveTypeJson = function(cmCit) {
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
	
	module.treeData.createViewpointJson = function(cmCit, viewpoint) {
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
	
	module.treeData.createShapePickJson = function(spCit) {
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
	
	module.treeData.createShapePickTypeJson = function(spCit) {
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
	
	module.treeData.createWildcardJson = function() {
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
	
	return module;
})(editor || {}, jQuery);
