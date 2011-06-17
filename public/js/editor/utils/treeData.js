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
	
////////////////////////////////////////////////////////////////////////////////
//                                 Constants                                  //
////////////////////////////////////////////////////////////////////////////////
	
	var TRIGGER_PREFIX = module.treeData.TRIGGER_PREFIX = 'tr_',
		ACTION_PREFIX = module.treeData.ACTION_PREFIX = 'ac_',
		CITIZEN_PREFIX = module.treeData.CITIZEN_PREFIX = 'ci_',
		MSG_WILDCARD = module.treeData.MSG_WILDCARD = 'Any';
	
	module.treeData.chainTable = (function() {
		var chainTable = new Hashtable();
		// Animation
		chainTable.put('hemi.animation.Animation' + '_' + 'onRender', [hemi.msg.stop]); // Calls stop()
		chainTable.put('hemi.animation.Animation' + '_' + 'start', [hemi.msg.start, hemi.msg.stop]); // Leads to stop()
		chainTable.put('hemi.animation.Animation' + '_' + 'stop', [hemi.msg.stop]);
		// Burst
		chainTable.put('hemi.effect.Burst' + '_' + 'trigger', [hemi.msg.burst]);
		// Emitter
		chainTable.put('hemi.effect.Emitter' + '_' + 'hide', [hemi.msg.visible]);
		chainTable.put('hemi.effect.Emitter' + '_' + 'show', [hemi.msg.visible]);
		// Trail
		chainTable.put('hemi.effect.Trail' + '_' + 'start', [hemi.msg.start]);
		chainTable.put('hemi.effect.Trail' + '_' + 'stop', [hemi.msg.stop]);
		// HudDisplay
		chainTable.put('hemi.hud.HudDisplay' + '_' + 'clearPages', [hemi.msg.visible]); // Calls hide()
		chainTable.put('hemi.hud.HudDisplay' + '_' + 'hide', [hemi.msg.visible]);
		chainTable.put('hemi.hud.HudDisplay' + '_' + 'nextPage', [hemi.msg.visible]); // Calls showPage()
		chainTable.put('hemi.hud.HudDisplay' + '_' + 'previousPage', [hemi.msg.visible]); // Calls showPage()
		chainTable.put('hemi.hud.HudDisplay' + '_' + 'show', [hemi.msg.visible]); // Calls showPage()
		chainTable.put('hemi.hud.HudDisplay' + '_' + 'showPage', [hemi.msg.visible]);
		// Draggable
		chainTable.put('hemi.manip.Draggable' + '_' + 'onMouseMove', [hemi.msg.drag]);
		chainTable.put('hemi.manip.Draggable' + '_' + 'onPick', [hemi.msg.drag]); // Calls onMouseMove()
		// Model
		chainTable.put('hemi.model.Model' + '_' + 'incrementAnimationTime', [hemi.msg.animate]); // Calls setAnimationTime()
		chainTable.put('hemi.model.Model' + '_' + 'load', [hemi.msg.load]); // Calls loadConfig()
		chainTable.put('hemi.model.Model' + '_' + 'loadConfig', [hemi.msg.load]);
		chainTable.put('hemi.model.Model' + '_' + 'setAnimationTime', [hemi.msg.animate]);
		chainTable.put('hemi.model.Model' + '_' + 'setFileName', [hemi.msg.load]); // Calls loadModel()
		chainTable.put('hemi.model.Model' + '_' + 'unload', [hemi.msg.unload]);
		// Rotator
		chainTable.put('hemi.motion.Rotator' + '_' + 'rotate', [hemi.msg.start, hemi.msg.stop]); // Leads to onRender()
		chainTable.put('hemi.motion.Rotator' + '_' + 'onRender', [hemi.msg.stop]);
		// Translator
		chainTable.put('hemi.motion.Translator' + '_' + 'move', [hemi.msg.start, hemi.msg.stop]); // Leads to onRender()
		chainTable.put('hemi.motion.Translator' + '_' + 'onRender', [hemi.msg.stop]);
		// Scene
		chainTable.put('hemi.scene.Scene' + '_' + 'load', [hemi.msg.load]);
		chainTable.put('hemi.scene.Scene' + '_' + 'nextScene', [hemi.msg.load, hemi.msg.unload]); // Calls load(), unload()
		chainTable.put('hemi.scene.Scene' + '_' + 'previousScene', [hemi.msg.load, hemi.msg.unload]); // Calls load(), unload()
		chainTable.put('hemi.scene.Scene' + '_' + 'unload', [hemi.msg.unload]);
		// Camera
		chainTable.put('hemi.view.Camera' + '_' + 'moveOnCurve', [hemi.msg.start, hemi.msg.stop]); // Leads to update()
		chainTable.put('hemi.view.Camera' + '_' + 'moveToView', [hemi.msg.start, hemi.msg.stop]); // Leads to update()
		chainTable.put('hemi.view.Camera' + '_' + 'onRender', [hemi.msg.stop]); // Calls update()
		chainTable.put('hemi.view.Camera' + '_' + 'update', [hemi.msg.stop]);
		// Citizen
		chainTable.put('hemi.world.Citizen' + '_' + 'cleanup', [hemi.msg.cleanup]);
		
		return chainTable;
	})();
	
	var methodsToRemove = module.treeData.methodsToRemove = [
        'constructor',
		'getId',
		'setId',
		'getCitizenType',
		'setCitizenType',
		'toOctane'
	];
		
////////////////////////////////////////////////////////////////////////////////
//                               Local Variables                              //
////////////////////////////////////////////////////////////////////////////////
	
	var commonMethods = {
		'hemi.animation.Animation': ['reset', 'start', 'stop'],
		'hemi.audio.Audio': ['pause', 'play', 'seek', 'setVolume'],
		'hemi.curve.GpuParticleSystem': ['pause', 'play', 'start', 'stop'],
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
		'hemi.view.Camera': ['disableControl', 'enableControl', 'moveOnCurve',
			'moveToView', 'orbit', 'rotate', 'setLight', 'truck']
	};
	
////////////////////////////////////////////////////////////////////////////////
//                                  Methods                                   //
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
	module.treeData.isCommon = isCommon;
	
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
	
	module.treeData.createTriggerJson = function(citizen, prefix) {
		var id = citizen.getId(),
			name = getNodeName(citizen, {
				option: MSG_WILDCARD,
				prefix: prefix,
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
					prefix: prefix,
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
		
		var node = createCitizenJson(citizen, prefix);
		node.children = msgs;
		node.state = 'closed';
		return node;
	};
	
	module.treeData.createActionJson = function(citizen, prefix) {
		var methods = [],
			moreMethods = [],
			id = citizen.getId();
		
		for (propName in citizen) {
			var prop = citizen[propName];
			
			if (jQuery.isFunction(prop) && methodsToRemove.indexOf(propName) === -1) {
				var name = getNodeName(citizen, {
						option: propName,
						prefix: prefix,
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
					prefix: prefix,
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
		
		var node = createCitizenJson(citizen, prefix);
		node.children = methods;
		node.state = 'closed';
		return node;
	};
	
	module.treeData.createModuleJson = function(module, prefix) {
		var methods = [];
		
		for (propName in module) {
			var prop = module[propName];
			
			if (jQuery.isFunction(prop) && methodsToRemove.indexOf(propName) === -1) {
				var name = getNodeName(module, {
					option: propName,
					prefix: prefix,
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
			prefix: prefix,
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
	
	module.treeData.createCamMoveJson = function(cmCit, prefix) {
		var camera = cmCit.citizen,
			viewpoints = hemi.world.getViewpoints(),
			vpList = [];
		
		for (var ndx = 0, len = viewpoints.length; ndx < len; ndx++) {
			var node = module.treeData.createViewpointJson(cmCit, viewpoints[ndx]);
			viewpoints.push(node);
		}
		
		var name = getNodeName(cmCit, {
			option: null,
			prefix: prefix,
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
	
	module.treeData.createCamMoveTypeJson = function(cmCit, prefix) {
		var name = getNodeName(cmCit, {
			option: null,
			prefix: prefix
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
	
	module.treeData.createViewpointJson = function(cmCit, viewpoint, prefix) {
		var name = getNodeName(cmCit, {
				option: viewpoint.getId(),
				prefix: prefix,
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
	
	module.treeData.createShapePickJson = function(spCit, prefix) {
		var model = spCit.citizen,
			id = spCit.getId(),
			shapes = [];
		
		for (var ndx = 0, len = model.shapes.length; ndx < len; ndx++) {
			var shape = model.shapes[ndx],
				name = getNodeName(spCit, {
					option: shape.name,
					prefix: prefix,
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
			prefix: prefix,
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
	
	module.treeData.createShapePickTypeJson = function(spCit, prefix) {
		var name = getNodeName(spCit, {
			option: null,
			prefix: prefix
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
	
	module.treeData.createWildcardJson = function(prefix) {
		var name = getNodeName(MSG_WILDCARD, {
				option: MSG_WILDCARD,
				prefix: prefix
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
					prefix: prefix
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
			prefix: prefix
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
