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
	"use strict";
	
	var shorthand = editor.tools.behavior;
	shorthand.treeData = shorthand.treeData || {};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var MSG_WILDCARD = shorthand.treeData.MSG_WILDCARD = 'Any';
	
	shorthand.treeData.chainTable = (function() {
		var chainTable = new Hashtable();
		// Animation
		chainTable.put('hemi.AnimationGroup' + '_' + 'start', [hemi.msg.start, hemi.msg.stop]); // Leads to stop()
		chainTable.put('hemi.AnimationGroup' + '_' + 'stop', [hemi.msg.stop]);
		// Burst
		chainTable.put('hemi.ParticleBurst' + '_' + 'trigger', [hemi.msg.burst]);
		// Emitter
		chainTable.put('hemi.ParticleEmitter' + '_' + 'hide', [hemi.msg.visible]);
		chainTable.put('hemi.ParticleEmitter' + '_' + 'show', [hemi.msg.visible]);
		// Trail
		chainTable.put('hemi.ParticleTrail' + '_' + 'start', [hemi.msg.start]);
		chainTable.put('hemi.ParticleTrail' + '_' + 'stop', [hemi.msg.stop]);
		// HudDisplay
		chainTable.put('hemi.HudDisplay' + '_' + 'clear', [hemi.msg.visible]); // Calls hide()
		chainTable.put('hemi.HudDisplay' + '_' + 'hide', [hemi.msg.visible]);
		chainTable.put('hemi.HudDisplay' + '_' + 'nextPage', [hemi.msg.visible]); // Calls showPage()
		chainTable.put('hemi.HudDisplay' + '_' + 'previousPage', [hemi.msg.visible]); // Calls showPage()
		chainTable.put('hemi.HudDisplay' + '_' + 'show', [hemi.msg.visible]); // Calls showPage()
		chainTable.put('hemi.HudDisplay' + '_' + 'showPage', [hemi.msg.visible]);
		// Mesh
		chainTable.put('hemi.Mesh' + '_' + 'move', [hemi.msg.start, hemi.msg.stop]); // Leads to stop
		chainTable.put('hemi.Mesh' + '_' + 'setMovable', [hemi.msg.move]);
		chainTable.put('hemi.Mesh' + '_' + 'setResizable', [hemi.msg.resize]);
		chainTable.put('hemi.Mesh' + '_' + 'turn', [hemi.msg.start, hemi.msg.stop]); // Leads to stop
		// Model
		chainTable.put('hemi.Model' + '_' + 'load', [hemi.msg.load]);
		chainTable.put('hemi.Model' + '_' + 'setFileName', [hemi.msg.load]); // Calls load()
		chainTable.put('hemi.Model' + '_' + 'unload', [hemi.msg.unload]);
		// State
		chainTable.put('hemi.State' + '_' + 'load', [hemi.msg.load]);
		chainTable.put('hemi.State' + '_' + 'nextState', [hemi.msg.load, hemi.msg.unload]); // Calls load(), unload()
		chainTable.put('hemi.State' + '_' + 'previousState', [hemi.msg.load, hemi.msg.unload]); // Calls load(), unload()
		chainTable.put('hemi.State' + '_' + 'unload', [hemi.msg.unload]);
		// Timer
		chainTable.put('hemi.Timer' + '_' + 'start', [hemi.msg.start, hemi.msg.stop]); // Leads to stop()
		chainTable.put('hemi.Timer' + '_' + 'stop', [hemi.msg.stop]);
		// Transform
		chainTable.put('hemi.Transform' + '_' + 'move', [hemi.msg.start, hemi.msg.stop]); // Leads to stop
		chainTable.put('hemi.Transform' + '_' + 'turn', [hemi.msg.start, hemi.msg.stop]); // Leads to stop
		// Camera
		chainTable.put('hemi.Camera' + '_' + 'moveOnCurve', [hemi.msg.start, hemi.msg.stop]); // Leads to update()
		chainTable.put('hemi.Camera' + '_' + 'moveToView', [hemi.msg.start, hemi.msg.stop]); // Leads to update()
		chainTable.put('hemi.Camera' + '_' + 'update', [hemi.msg.stop]);
		// Citizen
		chainTable.put('hemi.Citizen' + '_' + 'cleanup', [hemi.msg.cleanup]);
		
		return chainTable;
	})();
	
	var methodsToRemove = shorthand.treeData.methodsToRemove = [
        'constructor',
        'init',
        'onRender',
		'_getId',
		'_setId',
		'_toOctane'
	];
		
////////////////////////////////////////////////////////////////////////////////////////////////////
// Local Variables
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var commonMethods = {
		'hemi.AnimationGroup': ['reset', 'start', 'stop'],
		'hemi.Audio': ['pause', 'play', 'seek', 'setVolume'],
		'hemi.ParticleSystem': ['pause', 'play', 'start', 'stop'],
		'hemi.Burst': ['trigger'],
		'hemi.Emitter': ['hide', 'show'],
		'hemi.Trail': ['start', 'stop'],
		'hemi.HudDisplay': ['hide', 'nextPage', 'previousPage', 'show'],
		'hemi.Theme': ['load'],
		'hemi.Model': ['load', 'unload'],
		'hemi.Rotator': ['disable', 'enable', 'rotate', 'setAccel',
			'setAngle', 'setVel'],
		'hemi.Translator': ['disable', 'enable', 'move', 'setAccel',
			'setPos', 'setVel'],
		'hemi.State': ['load', 'nextState', 'previousState', 'unload'],
		'hemi.Camera': ['disableControl', 'enableControl', 'moveOnCurve',
			'moveToView', 'orbit', 'rotate', 'truck'],
		'hemi.Transform': ['move', 'turn', 'cancelInteraction', 'cancelMoving', 'cancelTurning', 
			'setMovable', 'setMoving', 'setPickable', 'setTurnable', 'setTurning', 'setResizable',
			'setVisible']
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Methods
////////////////////////////////////////////////////////////////////////////////////////////////////

	var isCommon = function(citizen, method) {
		var type = citizen._octaneType ? citizen._octaneType : citizen.name,
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
		} else if (citizen._octaneType !== undefined) {
			nodeName += citizen._octaneType.split('.').pop();
		}
		
		if (config.id != null) {
			nodeName += '_' + config.id;
		}
		if (config.option != null) {
			nodeName += '_' + config.option;
		}
		
		return nodeName.replace(' ', '_').replace('.', '_');
	};
	
	var getNodePath = function(nodeName) {
		var ndx = nodeName.indexOf('_'),
			names = [];
		
		ndx = nodeName.indexOf('_', ndx + 1);
		ndx = nodeName.indexOf('_', ndx + 1);
		
		if (ndx > -1) {
			names.push(nodeName.substr(0, ndx));
			ndx = nodeName.indexOf('_', ndx + 1);
			
			if (ndx > -1) {
				names.push(nodeName.substr(0, ndx));
			}
		}
		
		return names;
	};
	
	var createCitizenJson = function(citizen, prefix) {
		var name = getNodeName(citizen, {
			option: null,
			prefix: prefix,
			id: citizen._getId()
		});
		
		return {
			data: citizen.name || '',
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
	
	var createShapeTransformJson = function(tCit, prefix, method) {
		var shape = tCit.citizen;
		
		return {
			data: shape.name || '',
			attr: {
				id: getNodeName(tCit, {
					option: null,
					prefix: prefix,
					id: tCit._getId()
				}),
				rel: 'citizen'
			},
			children: [shorthand.treeData[method](shape.mesh, prefix)],
			state: 'closed',
			metadata: {
				type: 'citizen',
				citizen: tCit
			}
		};
	};
	
	var createModelTransformJson = function(tCit, prefix, method) {
		var model = tCit.citizen,
			list = [],
			transforms = [];
		
		THREE.SceneUtils.traverseHierarchy(model.root, function(transform) {
			list.push(transform);	
		});
		
		for (var ndx = 0, len = list.length; ndx < len; ndx++) {
			transforms.push(shorthand.treeData[method](list[ndx], prefix));
		}
		
		return {
			data: model.name || '',
			attr: {
				id: getNodeName(tCit, {
					option: null,
					prefix: prefix,
					id: tCit._getId()
				}),
				rel: 'citizen'
			},
			children: transforms,
			state: 'closed',
			metadata: {
				type: 'citizen',
				citizen: tCit
			}
		};
	};
	
	shorthand.treeData.getNodeName = getNodeName;
	shorthand.treeData.getNodePath = getNodePath;
	shorthand.treeData.createCitizenJson = createCitizenJson;
	shorthand.treeData.isCommon = isCommon;
	
	shorthand.treeData.createShapePickCitizen = function(model) {
		return {
			shapePick: true,
			name: 'Picked Shape:',
			citizen: model,
			_octaneType: shorthand.constants.SHAPE_PICK,
			_getId: function() {
				return this.citizen._getId();
			}
		};
	};
	
	shorthand.treeData.createTransformCitizen = function(model) {
		return {
			isTransform: true,
			name: 'Transforms',
			citizen: model,
			_octaneType: shorthand.constants.TRANSFORM,
			_getId: function() {
				return this.citizen._getId();
			}
		};
	};
	
	shorthand.treeData.createCamMoveCitizen = function(camera) {
		return {
			camMove: true,
			name: 'Camera Move:',
			citizen: camera,
			_octaneType: shorthand.constants.CAM_MOVE,
			_getId: function() {
				return this.citizen._getId();
			}
		};
	};
	
	shorthand.treeData.createOctaneTypeJson = function(citizen, prefix) {
		var type = citizen._octaneType.split('.').pop(),
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
	
	shorthand.treeData.createTriggerJson = function(citizen, prefix) {
		var id = citizen._getId(),
			name = getNodeName(citizen, {
				option: MSG_WILDCARD,
				prefix: prefix,
				id: id
			}),
			msgs = [{
				data: '[any trigger]',
				attr: {
					id: name,
					rel: 'message'
				},
				metadata: {
					type: 'message',
					parent: citizen,
					msg: MSG_WILDCARD
				}
			}],
			msgSent = citizen._msgSent;
		
		for (var ndx = 0, len = msgSent ? msgSent.length : 0; ndx < len; ndx++) {
			var msg = msgSent[ndx];
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
	
	shorthand.treeData.createActionJson = function(citizen, prefix) {
		var methods = [],
			moreMethods = [],
			id = citizen._getId(),
			node;
		
		for (var propName in citizen) {
			var prop = citizen[propName];
			
			if (jQuery.isFunction(prop) && methodsToRemove.indexOf(propName) === -1) {
				var name = getNodeName(citizen, {
						option: propName,
						prefix: prefix,
						id: id
					});
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
		
		node = createCitizenJson(citizen, prefix);
		node.children = methods;
		node.state = 'closed';
		return node;
	};
	
	shorthand.treeData.createModuleJson = function(module, prefix) {
		var methods = [],
			name;
		
		for (var propName in module) {
			var prop = module[propName];
			
			if (jQuery.isFunction(prop) && methodsToRemove.indexOf(propName) === -1) {
				name = getNodeName(module, {
					option: propName,
					prefix: prefix,
					id: module._getId()
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
		
		name = getNodeName(module, {
			prefix: prefix,
			id: module._getId()
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
	
	shorthand.treeData.createCamMoveJson = function(cmCit, prefix) {
		var camera = cmCit.citizen,
			viewpoints = hemi.world.getViewpoints(),
			nodes = [];
		
		for (var ndx = 0, len = viewpoints.length; ndx < len; ndx++) {
			var node = shorthand.treeData.createViewpointJson(cmCit,
					viewpoints[ndx], prefix);
			nodes.push(node);
		}
		
		var name = getNodeName(cmCit, {
			option: null,
			prefix: prefix,
			id: cmCit._getId()
		});
		
		return {
			data: camera.name || '',
			attr: {
				id: name,
				rel: 'citizen'
			},
			children: nodes,
			state: 'closed',
			metadata: {
				type: 'citizen',
				citizen: cmCit
			}
		};
	};
	
	shorthand.treeData.createCamMoveTypeJson = function(cmCit, prefix) {
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
	
	shorthand.treeData.createViewpointJson = function(cmCit, viewpoint, prefix) {
		var name = getNodeName(cmCit, {
				option: viewpoint._getId(),
				prefix: prefix,
				id: cmCit._getId()
			});
			
		return {
			data: viewpoint.name || '',
			attr: {
				id: name,
				rel: 'message'
			},
			metadata: {
				type: 'message',
				parent: cmCit,
				msg: viewpoint._getId()
			}
		};
	};
	
	shorthand.treeData.createModelPickJson = function(spCit, prefix) {
		var model = spCit.citizen,
			id = spCit._getId(),
			meshes = [],
			meshJson = [],
			name;

		findMeshes(model.root, meshes);

		for (var i = 0, il = meshes.length; i < il; ++i) {
			var mesh = meshes[i];
			name = getNodeName(spCit, {
				option: mesh.name || '',
				prefix: prefix,
				id: id
			});

			meshJson.push({
				data: mesh.name || '',
				attr: {
					id: name,
					rel: 'message'
				},
				metadata: {
					type: 'message',
					parent: spCit,
					msg: mesh.name || ''
				}
			});
		}

		name = getNodeName(spCit, {
			option: null,
			prefix: prefix,
			id: id
		});

		return {
			data: model.name || '',
			attr: {
				id: name,
				rel: 'citizen'
			},
			children: meshJson,
			state: 'closed',
			metadata: {
				type: 'citizen',
				citizen: spCit
			}
		};
	};
	
	shorthand.treeData.createModelTransformTriggerJson = function(tCit, prefix) {
		return createModelTransformJson(tCit, prefix, 'createTriggerJson');
	};
	
	shorthand.treeData.createModelTransformActionJson = function(tCit, prefix) {
		return createModelTransformJson(tCit, prefix, 'createActionJson');
	};
	
	shorthand.treeData.createShapePickJson = function(spCit, prefix) {
		var shape = spCit.citizen,
			id = spCit._getId(),
			name = getNodeName(spCit, {
				option: shape.name || '',
				prefix: prefix,
				id: id
			}),
			children = [{
				data: shape.name || '',
				attr: {
					id: name,
					rel: 'message'
				},
				metadata: {
					type: 'message',
					parent: spCit,
					msg: shape.mesh.name || ''
				}
			}];
		
		name = getNodeName(spCit, {
			option: null,
			prefix: prefix,
			id: id
		});
		
		return {
			data: shape.name || '',
			attr: {
				id: name,
				rel: 'citizen'
			},
			children: children,
			state: 'closed',
			metadata: {
				type: 'citizen',
				citizen: spCit
			}
		};
	};
	
	shorthand.treeData.createShapeTransformTriggerJson = function(tCit, prefix) {
		return createShapeTransformJson(tCit, prefix, 'createTriggerJson');
	};
	
	shorthand.treeData.createShapeTransformActionJson = function(tCit, prefix) {
		return createShapeTransformJson(tCit, prefix, 'createActionJson');
	};
	
	shorthand.treeData.createShapePickTypeJson = function(spCit, prefix) {
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
	
	shorthand.treeData.createTransformTypeJson = function(tCit, prefix) {
		var name = getNodeName(tCit, {
			option: null,
			prefix: prefix
		});
		
		return {
			data: 'Transforms',
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
	
	shorthand.treeData.createWildcardJson = function(prefix) {
		var name = getNodeName(MSG_WILDCARD, {
				option: MSG_WILDCARD,
				prefix: prefix
			}),
			msgs = [{
				data: '[any trigger]',
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

	function findMeshes(transform, meshes) {
		var children = transform.children;

		if (transform.geometry) {
			meshes.push(transform);
		}

		for (var i = 0, il = children.length; i < il; ++i) {
			findMeshes(children[i], meshes);
		}
	}

})();