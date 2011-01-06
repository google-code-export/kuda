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
	module.tools.ToolConstants.SHAPE_PICK = "ShapePick";
	module.tools.ToolConstants.CAM_MOVE = "CameraMove";
	
    module.EventTypes = module.EventTypes || {};
	module.EventTypes.ArgumentSet = "messaging.ArgumentSet";
	module.EventTypes.CauseSet = "messaging.CauseSet";
	module.EventTypes.CitizenAdded = "messaging.CitizenAdded";
	module.EventTypes.CitizenRemoved = "messaging.CitizenRemoved";
	module.EventTypes.CitizenUpdated = "messaging.CitizenUpdated";
	module.EventTypes.EffectSet = "messaging.EffectSet";
	module.EventTypes.TargetCreated = "messaging.TargetCreated";
    module.EventTypes.TargetRemoved = "messaging.TargetRemoved";
    module.EventTypes.TargetUpdated = "messaging.TargetUpdated";
    module.EventTypes.EditTarget = "messaging.view.EditTarget";
    module.EventTypes.RemoveTarget = "messaging.eventList.RemoveTarget";
    module.EventTypes.SaveTarget = "messaging.view.SaveTarget";
	module.EventTypes.SelectCause = "messaging.SelectCause";
	module.EventTypes.SelectEffect = "messaging.SelectEffect";
	module.EventTypes.SelectTarget = "messaging.SelectTarget";
	module.EventTypes.SetArgument = "messaging.SetArgument";
	
	var methodsToRemove = [
        'constructor',
		'getId',
		'setId',
		'getCitizenType',
		'setCitizenType',
		'toOctane'
	];
	
	var CAUSE_PREFIX = 'ca_',
		CAUSE_WRAPPER = '#causeTreeWrapper',
		EFFECT_PREFIX = 'ef_',
		EFFECT_WRAPPER = '#effectTreeWrapper',
		CITIZEN_PREFIX = 'ci_',
		CITIZEN_WRAPPER = '#msgEdtCitizensPnl',
		MSG_WILDCARD = 'Any';
	
////////////////////////////////////////////////////////////////////////////////
//                                 Utilities                                  //
////////////////////////////////////////////////////////////////////////////////
	var createShapePickCitizen = function(model) {
		var spc = {
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
		
		return spc;
	};
	
	var createCamMoveCitizen = function(camera) {
		var cmc = {
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
		
		return cmc;
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
		
		var node = {
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
		
		return node;
	};
	
	var createCitizenJson = function(citizen, prefix) {
		var name = getNodeName(citizen, {
			option: null,
			prefix: prefix,
			id: citizen.getId()
		});
		
		var node = {
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
		
		return node;
	};
	
	var createCauseJson = function(citizen) {
		var id = citizen.getId(),
			name = getNodeName(citizen, {
				option: MSG_WILDCARD,
				prefix: CAUSE_PREFIX,
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
					prefix: CAUSE_PREFIX,
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
		
		var node = createCitizenJson(citizen, CAUSE_PREFIX);
		node.children = msgs;
		node.state = 'closed';
		return node;
	};
	
	var createEffectJson = function(citizen) {
		var methods = [],
			id = citizen.getId();
		
		for (propName in citizen) {
			var prop = citizen[propName];
			
			if (jQuery.isFunction(prop) && methodsToRemove.indexOf(propName) === -1) {
				var name = getNodeName(citizen, {
					option: propName,
					prefix: EFFECT_PREFIX,
					id: id
				});
				
				methods.push({
					data: propName,
					attr: {
						id: name,
						rel: 'method'
					},
					metadata: {
						type: 'method',
						parent: citizen
					}
				});
			}
		}
		
		var node = createCitizenJson(citizen, EFFECT_PREFIX);
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
					prefix: EFFECT_PREFIX,
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
			prefix: EFFECT_PREFIX,
			id: module.getId()
		});
		
		var node = {
			data: module.name,
			attr: {
				id: name,
				rel: 'citType'
			},
			metadata: {
				type: 'citType',
				citizen: module
			}
		};
		
		node.children = methods;
		node.state = 'closed';
		return node;
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
			prefix: CAUSE_PREFIX,
			id: cmCit.getId()
		});
		
		var node = {
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
		
		return node;
	};
	
	var createCamMoveTypeJson = function(cmCit) {
		var name = getNodeName(cmCit, {
			option: null,
			prefix: CAUSE_PREFIX
		});
		
		var node = {
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
		
		return node;
	};
	
	var createViewpointJson = function(cmCit, viewpoint) {
		var name = getNodeName(cmCit, {
				option: viewpoint.getId(),
				prefix: CAUSE_PREFIX,
				id: cmCit.getId()
			}),
			node = {
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
		
		return node;
	};
	
	var createShapePickJson = function(spCit) {
		var model = spCit.citizen,
			id = spCit.getId(),
			shapes = [];
		
		for (var ndx = 0, len = model.shapes.length; ndx < len; ndx++) {
			var shape = model.shapes[ndx],
				name = getNodeName(spCit, {
					option: shape.name,
					prefix: CAUSE_PREFIX,
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
			prefix: CAUSE_PREFIX,
			id: id
		});
		
		var node = {
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
		
		return node;
	};
	
	var createShapePickTypeJson = function(spCit) {
		var name = getNodeName(spCit, {
			option: null,
			prefix: CAUSE_PREFIX
		});
		
		var node = {
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
		
		return node;
	};
	
	var createWildcardJson = function() {
		var name = getNodeName(MSG_WILDCARD, {
				option: MSG_WILDCARD,
				prefix: CAUSE_PREFIX
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
					prefix: CAUSE_PREFIX
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
			prefix: CAUSE_PREFIX
		});
		
		var node = {
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
		
		return node;
	};
	
	var createChainTable = function() {
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
		chainTable.put('hemi.model.Model' + '_' + 'loadConfig', [hemi.msg.load]);
		chainTable.put('hemi.model.Model' + '_' + 'loadModel', [hemi.msg.load]); // Calls loadConfig()
		chainTable.put('hemi.model.Model' + '_' + 'setAnimationTime', [hemi.msg.animate]);
		chainTable.put('hemi.model.Model' + '_' + 'setFileName', [hemi.msg.load]); // Calls loadModel()
		// Rotator
		chainTable.put('hemi.motion.Rotator' + '_' + 'rotate', [hemi.msg.start, hemi.msg.stop]); // Leads to onRender()
		chainTable.put('hemi.motion.Rotator' + '_' + 'onRender', [hemi.msg.stop]);
		// Translator
		chainTable.put('hemi.motion.Translator' + '_' + 'move', [hemi.msg.start, hemi.msg.stop]); // Leads to onRender()
		chainTable.put('hemi.motion.Translator' + '_' + 'onRender', [hemi.msg.stop]);
		// Scene
		chainTable.put('hemi.scene.Scene' + '_' + 'load', [hemi.msg.load]);
		chainTable.put('hemi.scene.Scene' + '_' + 'nextScene', [hemi.msg.load]); // Calls load(), unload()
		chainTable.put('hemi.scene.Scene' + '_' + 'previousScene', [hemi.msg.load]); // Calls load(), unload()
		chainTable.put('hemi.scene.Scene' + '_' + 'unload', [hemi.msg.load]);
		// Camera
		chainTable.put('hemi.view.Camera' + '_' + 'moveOnCurve', [hemi.msg.start, hemi.msg.stop]); // Leads to update()
		chainTable.put('hemi.view.Camera' + '_' + 'moveToView', [hemi.msg.start, hemi.msg.stop]); // Leads to update()
		chainTable.put('hemi.view.Camera' + '_' + 'onRender', [hemi.msg.stop]); // Calls update()
		chainTable.put('hemi.view.Camera' + '_' + 'update', [hemi.msg.stop]);
		// Citizen
		chainTable.put('hemi.world.Citizen' + '_' + 'cleanup', [hemi.msg.cleanup]);
		
		return chainTable;
	};
	
	/**
	 * Returns the list of parameters for a function
	 */
	var getFunctionParams = function(func) {
		return func.toString().match(/\((.*?)\)/)[1].match(/[\w]+/g) || [];
    };
	
	module.tools.DispatchProxy = function() {
		// The set of MessageSpecs (and MessageTargets) being created by the
		// messaging tool
		this.worldSpecs = new hemi.utils.Hashtable();
		// The set of MessageSpecs used by the editor
		this.editorSpecs = null;
	};
	
	module.tools.DispatchProxy.prototype = {
		swap: function() {
			if (this.editorSpecs === null) {
				this.editorSpecs = hemi.dispatch.msgSpecs;
				hemi.dispatch.msgSpecs = this.worldSpecs;
			}
		},
		
		unswap: function() {
			if (this.editorSpecs !== null) {
				hemi.dispatch.msgSpecs = this.editorSpecs;
				this.editorSpecs = null;
			}
		},
		
		getTargetSpec: function(target) {
			this.swap();
			var ret = hemi.dispatch.getTargetSpec(target);
			this.unswap();
			return ret;
		},
		
		getTargets: function(attributes, wildcards) {
			this.swap();
			var ret = hemi.dispatch.getTargets(attributes, wildcards);
			this.unswap();
			return ret;
		},
		
		registerTarget: function(src, msg, handler, opt_func, opt_args) {
			this.swap();
			var ret = hemi.dispatch.registerTarget(src, msg, handler, opt_func, opt_args);
			this.unswap();
			return ret;
		},
		
		removeTarget: function(target, opt_attributes) {
			this.swap();
			var ret = hemi.dispatch.removeTarget(target, opt_attributes);
			this.unswap();
			return ret;
		},
		
		cleanup: function() {
			this.swap();
			hemi.dispatch.cleanup();
			this.unswap();
		},
		
		toOctane: function(){
			this.swap();
			var ret = hemi.dispatch.toOctane();
			this.unswap();
			return ret;
		}
	};
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////


    /**
     * A MessagingModel
     */
    module.tools.MessagingModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
			
			this.citizenTypes = new Hashtable();
			this.dispatchProxy = new module.tools.DispatchProxy();
			this.msgTarget = null;
			this.source = null;
			this.type = null;
			this.handler = null;
			this.method = null;
			this.args = new Hashtable();
			
			this.autoCompleteList = [{
				label: hemi.dispatch.MSG_ARG + 'data.',
				value: hemi.dispatch.MSG_ARG + 'data.',
				desc: 'message data object'
			}];
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
				this.notifyListeners(module.EventTypes.CitizenAdded, {
					citizen: citizen,
					createType: createType
				});
			}
		},
		
		copyTarget: function(msgTarget) {
			var spec = this.dispatchProxy.getTargetSpec(msgTarget),
				isValueCheck = msgTarget.handler instanceof hemi.handlers.ValueCheck,
				source, type, handler, method, argList;
			
			if (isValueCheck) {
				type = msgTarget.handler.values[0];
				handler = msgTarget.handler.handler;
				method = msgTarget.handler.func;
				argList = msgTarget.handler.args;
				
				if (spec.src === hemi.world.WORLD_ID) {
					var modelName = type.split('.').shift(),
						models = hemi.world.getModels({name:modelName});
					
					source = createShapePickCitizen(models[0]);
				} else {
					source = createCamMoveCitizen(hemi.world.camera);
				}
			} else {
				source = spec.src;
				type = spec.msg;
				handler = msgTarget.handler;
				method = msgTarget.func;
				argList = msgTarget.args;
			}
			
			this.setMessageSource(source);
			this.setMessageType(type);
			this.setMessageHandler(handler);
			this.setMethod(method);
			
			if (argList != null) {
				var params = getFunctionParams(this.handler[this.method]);
				
				for (var ndx = 0, len = params.length; ndx < len; ndx++) {
					this.setArgument(params[ndx], argList[ndx]);
				}
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
				this.notifyListeners(module.EventTypes.CitizenRemoved, {
					citizen: citizen,
					removeType: removeType
				});
			}
		},
		
		removeTarget: function(target) {
			if (this.msgTarget === target) {
				this.msgTarget = null;
			}
			
			this.dispatchProxy.removeTarget(target);
			
			if (target.handler instanceof hemi.handlers.ValueCheck) {
				target.handler.cleanup();
			}
			
	        this.notifyListeners(module.EventTypes.TargetRemoved, target);
		},
		
		updateCitizen: function(citizen) {
			this.notifyListeners(module.EventTypes.CitizenUpdated, citizen);
		},
	    
	    setMessageSource: function(source) {
			if (source === null || source.getId != null) {
				this.source = source;
			} else if (source === hemi.dispatch.WILDCARD || source === MSG_WILDCARD) {
				this.source = MSG_WILDCARD;
			} else {
				this.source = hemi.world.getCitizenById(source);
			}
	    },
	    
	    setMessageType: function(type) {
			if (type === hemi.dispatch.WILDCARD || type === MSG_WILDCARD) {
				this.type = MSG_WILDCARD;
			} else {
				this.type = type;
			}
			
			this.notifyListeners(module.EventTypes.CauseSet, {
				source: this.source,
				message: this.type
			});
	    },
	    
	    setMessageHandler: function(handler) {
			this.handler = handler;
	    },
	    
	    setMethod: function(method) {
	        this.method = method;
			this.args.clear();
			
			if (method !== null) {
				var methodParams = getFunctionParams(this.handler[method]);
				
				for (var ndx = 0, len = methodParams.length; ndx < len; ndx++) {
					var param = methodParams[ndx];
					
		            this.args.put(param, {
						ndx: ndx,
						value: null
					});
				}
			}
			
			this.notifyListeners(module.EventTypes.EffectSet, {
				handler: this.handler,
				method: this.method
			});
	    },
		
		setArgument: function(argName, argValue) {
	        var arg = this.args.get(argName);
	        
	        if (arg != null) {
	            arg.value = argValue;
	        }
	        
	        this.args.put(argName, arg);
			this.notifyListeners(module.EventTypes.ArgumentSet, {
				name: argName,
				value: argValue
			});
		},
		
	    save: function(name) {
			var values = this.args.values(),
				args = [],
				editId = null,
				newTarget;
			
			if (this.msgTarget !== null) {
				this.dispatchProxy.removeTarget(this.msgTarget);
				
				if (this.msgTarget.handler instanceof hemi.handlers.ValueCheck) {
					this.msgTarget.handler.cleanup();
				}
				
				this.msgTarget.cleanup();
			}
			
			for (var ndx = 0, len = values.length; ndx < len; ndx++) {
				var val = values[ndx];
				args[val.ndx] = val.value;
			}
			
			if (this.source.shapePick) {
				this.dispatchProxy.swap();
				newTarget = hemi.handlers.handlePick(
					this.type,
					this.handler,
					this.method,
					args);
				this.dispatchProxy.unswap();
			}
			else if (this.source.camMove) {
				this.dispatchProxy.swap();
				var viewpoint = hemi.world.getCitizenById(this.type);
				newTarget = hemi.handlers.handleCameraMove(
					hemi.world.camera,
					viewpoint,
					this.handler,
					this.method,
					args);
				this.dispatchProxy.unswap();
			}
			else {
				var src = this.source === MSG_WILDCARD ? hemi.dispatch.WILDCARD : this.source.getId(),
					type = this.type === MSG_WILDCARD ? hemi.dispatch.WILDCARD : this.type;
				
				newTarget = this.dispatchProxy.registerTarget(
		            src,
		            type,
		            this.handler,
		            this.method,
		            args);
			}
			
			newTarget.name = name;
			
			if (this.msgTarget !== null) {
				newTarget.dispatchId = this.msgTarget.dispatchId;
				this.notifyListeners(module.EventTypes.TargetUpdated, newTarget);
			} else {
				this.notifyListeners(module.EventTypes.TargetCreated, newTarget);
			}
			
			this.msgTarget = null;
			this.args.each(function(key, value) {
				value.value = null;
			});
		},
		
		worldCleaned: function() {
			var targets = this.dispatchProxy.getTargets();
			
			for (var ndx = 0, len = targets.length; ndx < len; ndx++) {
	            var target = targets[ndx];
	            this.notifyListeners(module.EventTypes.TargetRemoved, target);
	        }
			
			this.dispatchProxy.cleanup();
			var citizens = hemi.world.getCitizens();
			
			for (var ndx = 0, len = citizens.length; ndx < len; ndx++) {
				this.removeCitizen(citizens[ndx]);
			}
			
			this.source = null;
			this.type = null;
			this.handler = null;
			this.method = null;
			this.args.clear();
			this.msgTarget = null;
	    },
		
		worldLoaded: function() {
			var citizens = hemi.world.getCitizens(),
				targets = this.dispatchProxy.getTargets();
			
			for (var ndx = 0, len = citizens.length; ndx < len; ndx++) {
				var citizen = citizens[ndx];
				
				if (citizen.name.match(module.tools.ToolConstants.EDITOR_PREFIX) === null) {
					this.addCitizen(citizen);
				}
			}
			
			for (var ndx = 0, len = targets.length; ndx < len; ndx++) {
				var target = targets[ndx];
				
				if (target.name.match(module.tools.ToolConstants.EDITOR_PREFIX) === null) {
					this.notifyListeners(module.EventTypes.TargetCreated, target);
				}
	        }
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////   

	module.tools.EventListItemWidget = module.ui.ListItemWidget.extend({
		init: function(eventsPanel) {
			this.eventsPanel = eventsPanel;
			this.subList = null;
			this.children = [];
			this._super();
		},
		
		layout: function() {
			this.container = jQuery('<div class="msgEdtListItm"></div>');
			this.title = jQuery('<span class="msgEdtItemTitle"></span>');
			this.buttonDiv = jQuery('<div class="msgEdtButtons"></div>');
			this.removeBtn = jQuery('<button class="msgEdtRemoveBtn dialogBtn" title="Remove">Remove</button>');
			this.editBtn = jQuery('<button class="msgEdtEditBtn dialogBtn" title="Edit">Edit</button>');
			this.chainBtn = jQuery('<button class="msgEdtChainBtn dialogBtn" title="Chain">Chain</button>');
			this.cloneBtn = jQuery('<button class="msgEdtCloneBtn dialogBtn" title="Clone">Clone</button>');
			
			this.buttonDiv.append(this.editBtn).append(this.chainBtn)
				.append(this.cloneBtn).append(this.removeBtn);
			this.container.append(this.title).append(this.buttonDiv);
			
			var wgt = this;
		},
	
		setText: function(text) {
			this.title.text(text);
		},
	
		setSubList: function(list) {
			this.subList = list;
			this.getUI().parent().append(this.subList.getUI());
		},
	
		addChild: function(child) {
			this.children.push(child);
		},
	
		removeChild: function(child) {
	        var ndx = this.children.indexOf(child);
	        
	        if (ndx != -1) {
	            this.children.splice(ndx, 1);
	        }
		}
	});

    /*
     * Configuration object for the MessagingView.
     */
    module.tools.MessagingViewDefaults = {
        toolName: 'Messaging',
        toolTip: 'Message Targets: Create and edit message targets',
        widgetId: 'messagingBtn',
        listInstructions: "List is empty.  Click 'Create New Message Target' to add to this list."
    };
    
    /**
     * The MessagingView controls the dialog and toolbar widget for the 
     * animation tool.
     * 
     * @param {Object} options configuration options.  Uses 
     *         editor.tools.MessagingViewDefaults as default options
     */
    module.tools.MessagingView = module.tools.ToolView.extend({
		init: function(options) {
	        var newOpts = jQuery.extend({}, module.tools.MessagingViewDefaults, options);
	        this._super(newOpts);
			
			this.causeTree = null;
			this.effectTree = null;
			this.citizenTree = null;
			this.lastCause = null;
			this.lastEffect = null;
			this.currentParamIn = null;
			this.chainParent = null;
			this.chainTable = createChainTable();
			
			this.eventList = new module.ui.ListWidget({
				widgetId: 'msgEvtList',
				prefix: 'msgEvt',
				type: module.ui.ListType.UNORDERED
			});
			
			this.mainPanel = new module.ui.Component({
				id: 'msgPnl',
				uiFile: 'editor/tools/html/messaging.htm',
				immediateLayout: false
			});
			
			this.layoutMainPanel();
	    },
		
		layoutMainPanel: function() {
			var pnl = this.mainPanel,
				evtLst = this.eventList,
				view = this;
				
			pnl.finishLayout = function() {
				var causeWrapper = pnl.find(CAUSE_WRAPPER),
					citizenWrapper = pnl.find(CITIZEN_WRAPPER),
					effectWrapper = pnl.find(EFFECT_WRAPPER),
					editListPnl = pnl.find('#msgEvents .msgColWrapper'),
					editorPnl = pnl.find('#msgEditor'),
					editorForm = editorPnl.find('form'),
					editorNameInput = editorPnl.find('#msgEdtName'),
					editorSaveBtn = editorPnl.find('#msgEdtSaveBtn'),
					editorCancelBtn = editorPnl.find('#msgEdtCancelBtn'),
					addBtn = pnl.find('#msgAddEventBtn'),
					replacementPnl = jQuery('#o3d'),
					panelUI = pnl.getUI();
				
				causeWrapper.append(view.causeTree);
				citizenWrapper.append(view.citizenTree);
				effectWrapper.append(view.effectTree);
				
				editListPnl.append(evtLst.getUI());
				editorForm.bind('submit', function(evt) {
					return false;
				});
				
				addBtn.bind('click', function(evt) {
					editListPnl.hide();
					editorPnl.show();
					view.notifyListeners(module.EventTypes.SelectTarget, {
						target: null,
						edit: false
					});
				});
				
				editorNameInput.bind('keyup', function(evt) {
					view.updateSaveButton();
				});
				
				editorSaveBtn.bind('click', function(evt) {
					if (view.chainParent != null) {
						var li = view.chainParent,
							target = li.getAttachedObject(),
							handler = target.handler,
							messages = li.chainBtn.data('chainMsgs');
						
						if (handler instanceof hemi.handlers.ValueCheck) {
							target = handler;
							handler = target.handler;
						}
						
						// special case
						if (target.func === 'moveToView') {
							handler = createCamMoveCitizen(hemi.world.camera);
							messages = [parseInt(target.args[0].replace(hemi.dispatch.ID_ARG, ''))];
						}
						
						view.unrestrictSelection(view.causeTree, handler, messages);
					}
					
					view.notifyListeners(module.EventTypes.SaveTarget, editorNameInput.val());
					editorNameInput.val('');
				});
				
				editorCancelBtn.bind('click', function(evt) {
					if (view.chainParent != null) {
						var li = view.chainParent,
							target = li.getAttachedObject(),
							handler = target.handler,
							messages = li.chainBtn.data('chainMsgs');
						
						if (handler instanceof hemi.handlers.ValueCheck) {
							target = handler;
							handler = target.handler;
						}
						
						// special case
						if (target.func === 'moveToView') {
							handler = createCamMoveCitizen(hemi.world.camera);
							messages = [parseInt(target.args[0].replace(hemi.dispatch.ID_ARG, ''))];
						}
						
						view.unrestrictSelection(view.causeTree, handler, messages);
						view.chainParent = null;
					}
					
					editorPnl.hide();
					editorNameInput.val('');
					editListPnl.show();
				});
				
				panelUI.bind('editor.mainView.resize', function(evt) {
					var height = panelUI.height(),
						columns = panelUI.find('.msgColumn'),
						containers = columns.find('.msgColWrapper'),
						headerHeight = panelUI.find('.msgColTitle').first().outerHeight();
						
					columns.height(height);
					containers.height(height - headerHeight);
				});
				
				replacementPnl.after(panelUI);
			};
			
			pnl.layout();
		},
		
		addCause: function(citizen, createType) {
			if (createType) {
				this.addCauseType(citizen);
			}
			
			var causeNode = createCauseJson(citizen),
				type = citizen.getCitizenType().split('.').pop();
				
			this.causeTree.jstree('create_node', '#' + CAUSE_PREFIX + type, 'inside', {
				json_data: causeNode
			});
			
			if (citizen instanceof hemi.model.Model) {
				var spc = createShapePickCitizen(citizen);
				causeNode = createShapePickJson(spc);
				type = spc.getCitizenType().split('.').pop();
				
				this.causeTree.jstree('create_node', '#' + CAUSE_PREFIX + type, 'inside', {
					json_data: causeNode
				});
			} else if (citizen instanceof hemi.view.Camera) {
				var cmc = createCamMoveCitizen(citizen);
				causeNode = createCamMoveJson(cmc);
				type = cmc.getCitizenType().split('.').pop();
				
				this.causeTree.jstree('create_node', '#' + CAUSE_PREFIX + type, 'inside', {
					json_data: causeNode
				});
			} else if (citizen instanceof hemi.view.Viewpoint) {
				// In future if we support multiple cameras, this will need to
				// be updated
				var cmc = createCamMoveCitizen(hemi.world.camera),
					nodeName = getNodeName(cmc, {
						option: null,
						prefix: CAUSE_PREFIX,
						id: cmc.getId()
					}),
					node = jQuery('#' + nodeName);
				
				if (node.length > 0) {
					causeNode = createViewpointJson(cmc, citizen);
					
					this.causeTree.jstree('create_node', node, 'inside', {
						json_data: causeNode
					});
				}
			}
		},
		
		addCauseType: function(citizen) {
			var json = createCitizenTypeJson(citizen, CAUSE_PREFIX);
			
			if (this.causeTree === null) {
				this.createCauseTree([json]);
			} else {
				this.causeTree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			}
			
			if (citizen instanceof hemi.model.Model) {
				var spc = createShapePickCitizen(citizen);
				json = createShapePickTypeJson(spc);
				
				this.causeTree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			} else if (citizen instanceof hemi.view.Camera) {
				var cmc = createCamMoveCitizen(citizen);
				json = createCamMoveTypeJson(cmc);
				
				this.causeTree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			}
		},
		
		addCitizen: function(citizen, createType) {
			if (createType) {
				this.addCitizenType(citizen);
			}
			
			var citizenNode = createCitizenJson(citizen, CITIZEN_PREFIX),
				type = citizen.getCitizenType().split('.').pop();
				
			this.citizenTree.jstree('create_node', '#' + CITIZEN_PREFIX + type, 'inside', {
				json_data: citizenNode
			});
		},
		
		addCitizenType: function(citizen) {
			var json = createCitizenTypeJson(citizen, CITIZEN_PREFIX);
			
			if (this.citizenTree === null) {
				this.createCitizenTree([json]);
			} else {
				this.citizenTree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			}
		},
		
		addEffect: function(citizen, createType) {
			if (createType) {
				this.addEffectType(citizen);
			}
			
			var effectNode = createEffectJson(citizen),
				type = citizen.getCitizenType().split('.').pop();
				
			this.effectTree.jstree('create_node', '#' + EFFECT_PREFIX + type, 'inside', {
				json_data: effectNode
			});
		},
		
		addEffectType: function(citizen) {
			var json = createCitizenTypeJson(citizen, EFFECT_PREFIX),
				audioJson = createModuleJson(hemi.audio);
			
			if (this.effectTree === null) {
				this.createEffectTree([json, audioJson]);
			} else {
				this.effectTree.jstree('create_node', -1, 'last', {
					json_data: json
				});
			}
		},
				
		createCauseTree: function(json) {
			var that = this,
				wildcardCause = createWildcardJson();
			
			json.unshift(wildcardCause);
			this.causeTree = jQuery('<div id="causeTree"></div>');
			
			this.causeTree.bind('select_node.jstree', function(evt, data) {
				var elem = data.rslt.obj,
					metadata = elem.data('jstree'),
					elemId = elem.attr('id'),
					isRestricted = that.causeTree.hasClass('restricted'),
					isSelectable = elem.children('a').hasClass('restrictedSelectable');
				
				if (that.lastCause === elemId) {
					that.causeTree.jstree('close_node', elem);
					that.lastCause = null;
				} else {
					that.lastCause = elemId;
					
					if (isSelectable || !isRestricted) {
						if (metadata.type === 'message') {
							that.notifyListeners(module.EventTypes.SelectCause, {
								source: metadata.parent,
								message: metadata.msg
							});
						}
						else if (metadata.type === 'citizen') {
							that.causeTree.jstree('open_node', elem, false, false);
							that.notifyListeners(module.EventTypes.SelectCause, {
								source: metadata.citizen,
								message: null
							});
						}
						else if (metadata.type === 'citType') {
							that.causeTree.jstree('open_node', elem, false, false);
							that.notifyListeners(module.EventTypes.SelectCause, {
								source: null,
								message: null
							});
						}
					}
				}
			})
			.jstree({
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
		},
		
		createCitizenTree: function(json) {
			var that = this;
			this.citizenTree = jQuery('<div id="msgEdtCitizensTree"></div>');
			
			this.citizenTree.bind('select_node.jstree', function(evt, data) {
				var elem = data.rslt.obj,
					metadata = elem.data('jstree'),
					paramIn = that.currentParamIn,
					citParam;
					
				if (metadata.type === 'citizen') {
					citParam = hemi.dispatch.ID_ARG + metadata.citizen.getId();
					jQuery(this).parent().hide(200);
					that.citizenTree.jstree('close_all').jstree('deselect_all');
					that.currentParamIn = null;
				} else if (metadata.type === 'citType') {
					citParam = '';
					that.citizenTree.jstree('toggle_node', elem);
				}
				
				if (paramIn !== null) {
					paramIn.val(citParam);
					
					that.notifyListeners(module.EventTypes.SetArgument, {
						name: paramIn.data('paramName'),
						value: citParam
					});
				}
			})
			.jstree({
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
		},
		
		createEffectTree: function(json) {
			var that = this;
			this.effectTree = jQuery('<div id="effectTree"></div>');
			
			this.effectTree.bind('select_node.jstree', function(evt, data) {
				var elem = data.rslt.obj,
					metadata = elem.data('jstree'),
					elemId = elem.attr('id');
				
				if (that.lastEffect === elemId) {
					that.effectTree.jstree('close_node', elem);
					that.lastEffect = null;
				} else {
					that.lastEffect = elemId;
					
					if (metadata.type === 'method') {
						var path = that.effectTree.jstree('get_path', elem, true);
						var parentName = path[path.length - 2] + '_';
						var name = elem.attr('id').replace(parentName, '');
						
						that.notifyListeners(module.EventTypes.SelectEffect, {
							citizen: metadata.parent,
							method: name
						});
					} else if (metadata.type === 'citizen') {
						that.effectTree.jstree('open_node', elem, false, false);
						that.notifyListeners(module.EventTypes.SelectEffect, {
							citizen: metadata.citizen,
							method: null
						});
					} else if (metadata.type === 'citType') {
						that.effectTree.jstree('open_node', elem, false, false);
						that.notifyListeners(module.EventTypes.SelectEffect, {
							citizen: null,
							method: null
						});
					}
				}
			})
			.jstree({
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
		},
		
		getChainMessages: function(citizen, method) {
			var type = citizen.getCitizenType ? citizen.getCitizenType() : citizen.name,
				key = type + '_' + method,
				msgList = this.chainTable.get(key),
				messages;
			
			if (citizen.parent != null) {
				messages = this.getChainMessages(citizen.parent, method);
			} else {
				messages = [];
			}
			
			if (msgList !== null) {
				messages = messages.concat(msgList);
			}
			
			return messages;
		},
		
		selectCause: function(citizen, message) {
			var nodeName = null,
				causeText = jQuery('#msgEdtCauseTxt');
			
			if (citizen === null || message === null) {
				causeText.text('');
			} else {
				var name = citizen === MSG_WILDCARD ? citizen : citizen.name,
					msg;
				
				nodeName = getNodeName(citizen, {
					option: message,
					prefix: CAUSE_PREFIX,
					id: citizen.getId ? citizen.getId() : null
				});
				
				if (citizen.camMove) {
					var viewpoint = hemi.world.getCitizenById(message);
					msg = viewpoint.name;
				} else {
					msg = message;
				}
				
				causeText.text(name + ' ' + msg);
			}
			
			if (nodeName === null) {
				this.causeTree.jstree('deselect_all');
			} else {
				var elem = jQuery('#' + nodeName),
					elemId = elem.attr('id');
					
				if (this.lastCause !== elemId) {
					var path = this.causeTree.jstree('get_path', elem, true);
					
					for (var i = 0; i < path.length; i++) {
						var node = jQuery('#' + path[i]);
						this.causeTree.jstree('open_node', node, false, true);
					}
					
					this.causeTree.jstree('select_node', elem, true);
					jQuery(CAUSE_WRAPPER).scrollTo(elem, 400);
				}
			}
			
			this.updateSaveButton();
		},
		
		selectEffect: function(citizen, method) {
			var nodeName = null,
				effectText = jQuery('#msgEdtEffectTxt');
			
			if (citizen === null || method === null) {
				effectText.text('');
			} else {
				nodeName = getNodeName(citizen, {
					option: method,
					prefix: EFFECT_PREFIX,
					id: citizen.getId ? citizen.getId() : null
				});
				
				effectText.text(citizen.name + ' ' + method);
			}
			
			if (nodeName === null) {
				this.effectTree.jstree('deselect_all');
			} else {
				var elem = jQuery('#' + nodeName),
					elemId = elem.attr('id');
					
				if (this.lastEffect !== elemId) {
					var path = this.effectTree.jstree('get_path', elem, true);
					
					for (var i = 0; i < path.length; i++) {
						var node = jQuery('#' + path[i]);
						this.effectTree.jstree('open_node', node, false, true);
					}
					
					this.effectTree.jstree('select_node', elem, true);
					jQuery(EFFECT_WRAPPER).scrollTo(elem, 400);
				}
			}
			
			this.updateSaveButton();
		},
		
		deselectCause: function(citizen, message) {
			var id = citizen.getId ? citizen.getId() : null,
				nodeName = getNodeName(citizen, {
					option: message,
					prefix: CAUSE_PREFIX,
					id: id
				}),
	        	node = jQuery('#' + nodeName),
				causeText = jQuery('#msgEdtCauseTxt');
			
			this.causeTree.jstree('deselect_node', node);
			causeText.text('');
		},
		
		deselectEffect: function(citizen, method) {
			var nodeName = getNodeName(citizen, {
					option: method,
					prefix: EFFECT_PREFIX,
					id: citizen.getId()
				}),
	        	node = jQuery('#' + nodeName),
				effectText = jQuery('#msgEdtEffectTxt');
			
			this.effectTree.jstree('deselect_node', node);
			effectText.text('');
		},
		
		restrictSelection: function(tree, citizen, msgs) {
			tree.addClass('restricted');
			
			for (var ndx = 0, len = msgs.length; ndx < len; ndx++) {
				var id = citizen.getId ? citizen.getId() : null,
					nodeName = getNodeName(citizen, {
						option: msgs[ndx],
						prefix: CAUSE_PREFIX,
						id: id
					}),
					node = jQuery('#' + nodeName);
				
				node.find('a').addClass('restrictedSelectable');
			}
		},
		
		unrestrictSelection: function(tree, citizen, msgs) {
			tree.removeClass('restricted');
			
			for (var ndx = 0, len = msgs.length; ndx < len; ndx++) {
				var id = citizen.getId ? citizen.getId() : null,
					nodeName = getNodeName(citizen, {
						option: msgs[ndx],
						prefix: CAUSE_PREFIX,
						id: id
					}),
					node = jQuery('#' + nodeName);
				
				node.find('a').removeClass('restrictedSelectable');
			}
		},
		
		removeCause: function(citizen, removeType) {
			var id = citizen.getId ? citizen.getId() : null,
				nodeName = getNodeName(citizen, {
					option: null,
					prefix: CAUSE_PREFIX,
					id: id
				});
			
			var node = jQuery('#' + nodeName);
			this.causeTree.jstree('delete_node', node);
			
			if (citizen instanceof hemi.model.Model) {
				var spc = createShapePickCitizen(citizen);
				nodeName = getNodeName(spc, {
					option: null,
					prefix: CAUSE_PREFIX,
					id: id
				});
				
				node = jQuery('#' + nodeName);
				this.causeTree.jstree('delete_node', node);
			} else if (citizen instanceof hemi.view.Camera) {
				var cmc = createCamMoveCitizen(citizen);
				nodeName = getNodeName(cmc, {
					option: null,
					prefix: CAUSE_PREFIX,
					id: id
				});
				
				node = jQuery('#' + nodeName);
				this.causeTree.jstree('delete_node', node);
			} else if (citizen instanceof hemi.view.Viewpoint) {
				// In future if we support multiple cameras, this will need to
				// be updated
				var cmc = createCamMoveCitizen(hemi.world.camera);
				nodeName = getNodeName(cmc, {
					option: id,
					prefix: CAUSE_PREFIX,
					id: id
				});
				
				node = jQuery('#' + nodeName);
				this.causeTree.jstree('delete_node', node);
			}
			
			if (removeType) {
				this.removeCauseType(citizen);
			}
		},
		
		removeCauseType: function(citizen) {
			var nodeName = getNodeName(citizen, {
				option: null,
				prefix: CAUSE_PREFIX
			});
			
			var node = jQuery('#' + nodeName);
			this.causeTree.jstree('delete_node', node);
			
			if (citizen instanceof hemi.model.Model) {
				var spc = createShapePickCitizen(citizen);
				nodeName = getNodeName(spc, {
					option: null,
					prefix: CAUSE_PREFIX
				});
				
				node = jQuery('#' + nodeName);
				this.causeTree.jstree('delete_node', node);
			} else if (citizen instanceof hemi.view.Camera) {
				var cmc = createCamMoveCitizen(citizen);
				nodeName = getNodeName(cmc, {
					option: null,
					prefix: CAUSE_PREFIX
				});
				
				node = jQuery('#' + nodeName);
				this.causeTree.jstree('delete_node', node);
			}
		},
		
		removeCitizen: function(citizen, removeType) {
			var nodeName = getNodeName(citizen, {
				option: null,
				prefix: CITIZEN_PREFIX,
				id: citizen.getId()
			});
			
			var node = jQuery('#' + nodeName);
			this.citizenTree.jstree('delete_node', node);
			
			if (removeType) {
				this.removeCitizenType(citizen);
			}
		},
		
		removeCitizenType: function(citizen) {
			var nodeName = getNodeName(citizen, {
				option: null,
				prefix: CITIZEN_PREFIX
			});
			
			var node = jQuery('#' + nodeName);
			this.citizenTree.jstree('delete_node', node);
		},
		
		removeEffect: function(citizen, removeType) {
			var nodeName = getNodeName(citizen, {
				option: null,
				prefix: EFFECT_PREFIX,
				id: citizen.getId()
			});
			
			var node = jQuery('#' + nodeName);
			this.effectTree.jstree('delete_node', node);
			
			if (removeType) {
				this.removeEffectType(citizen);
			}
		},
		
		removeEffectType: function(citizen) {
			var nodeName = getNodeName(citizen, {
				option: null,
				prefix: EFFECT_PREFIX
			});
			
			var node = jQuery('#' + nodeName);
			this.effectTree.jstree('delete_node', node);
		},
		
		addTarget: function(target) {
			var pnl = this.mainPanel,
				eventsPanel = pnl.find('#msgEvents'),
				li = new module.tools.EventListItemWidget(eventsPanel),
				editListPnl = pnl.find('#msgEvents .msgColWrapper'),
				editorPnl = pnl.find('#msgEditor'),
				editorNameInput = editorPnl.find('#msgEdtName'),
				view = this;
			
			var lastChild = function(item) {
				if (item.children.length > 0) {
					return lastChild(item.children[item.children.length - 1]);
				}
				else {
					return item;
				}
			};
			
			var unchain = function(item, level) {
				// get children
				var children = item.children;
				
				for (var ndx = 0, len = children.length; ndx < len; ndx++) {
					unchain(children[ndx], level + 1);
				}
				
				item.getUI().data('level', level)
					.find('span').css('paddingLeft', level * 20 + 'px');
			};
			
			if (view.chainParent != null) {
				var level = view.chainParent.data('level') + 1,
					lastItem = lastChild(view.chainParent);
				
				this.eventList.insert(li, lastItem);
				li.getUI().data('chainParent', view.chainParent)
					.data('level', level)
					.find('span').css('paddingLeft', level * 20 + 'px');
				
				view.chainParent.addChild(li);
				view.chainParent = null;
			}
			else {
				this.eventList.add(li);
				li.data('level', 0);
			}
			
			li.setId('msgTarget_' + target.dispatchId);
			li.attachObject(target);
			li.setText(target.name);
			
			// now bind the appropriate buttons
			li.title.bind('click', function(evt) {
				view.notifyListeners(module.EventTypes.SelectTarget, {
					target: li.getAttachedObject(),
					edit: false
				});
			});
			
			li.removeBtn.bind('click', function(evt) {
				while (li.children.length > 0) {
					var child = li.children[0];
					unchain(child, 0);
					li.removeChild(child);
				}
				
				// remove from parent
				var par = li.data('chainParent');
				
				if (par != null) {
					par.removeChild(li);
				}
				
				// now notify others
				view.notifyListeners(module.EventTypes.RemoveTarget, li.getAttachedObject());
			});
				
			li.editBtn.bind('click', function(evt) {
				var target = li.getAttachedObject();
				view.notifyListeners(module.EventTypes.SelectTarget, {
					target: target,
					edit: true
				});
				
				editListPnl.hide();
				editorNameInput.val(target.name);
				view.updateSaveButton();
				editorPnl.show();
			});
			
			var handler = target.handler,
				method = target.func;
			
			if (handler instanceof hemi.handlers.ValueCheck) {
				method = handler.func;
				handler = handler.handler;
			}
			
			var msgs = this.getChainMessages(handler, method);
			
			if (msgs.length > 0) {
				li.chainBtn.data('chainMsgs', msgs)
				.bind('click', function(evt){
					var target = li.getAttachedObject(),
						handler = target.handler,
						messages = jQuery(this).data('chainMsgs');
					
					if (handler instanceof hemi.handlers.ValueCheck) {
						target = handler;
						handler = target.handler;
					}
					
					// special case
					if (target.func === 'moveToView') {
						handler = createCamMoveCitizen(hemi.world.camera);
						messages = [parseInt(target.args[0].replace(hemi.dispatch.ID_ARG, ''))];
					}
					view.restrictSelection(view.causeTree, handler, messages);
					view.chainParent = li;
					view.notifyListeners(module.EventTypes.SelectCause, {
						source: handler,
						message: messages[0]
					});
					
					editListPnl.hide();
					editorPnl.show();
				});
			} else {
				li.chainBtn.attr('disabled', 'disabled');
			}
			
			li.cloneBtn.bind('click', function(evt) {
				var target = li.getAttachedObject();
				
				view.notifyListeners(module.EventTypes.SelectTarget, {
					target: target,
					edit: false
				});
				
				view.chainParent = li.data('chainParent');
				view.notifyListeners(module.EventTypes.SaveTarget, 'Copy of ' + target.name);
			});
		},
		
		removeTarget: function(target) {
			this.eventList.remove('msgTarget_' + target.dispatchId);
		},
		
		updateCause: function(citizen) {
			var nodeName = getNodeName(citizen, {
					option: null,
					prefix: CAUSE_PREFIX,
					id: citizen.getId()
				}),
				node = jQuery('#' + nodeName);
			
			this.causeTree.jstree('rename_node', node, citizen.name);
		},
		
		updateCitizen: function(citizen) {
			var nodeName = getNodeName(citizen, {
					option: null,
					prefix: CITIZEN_PREFIX,
					id: citizen.getId()
				}),
				node = jQuery('#' + nodeName);
			
			this.citizenTree.jstree('rename_node', node, citizen.name);
		},
		
		updateEffect: function(citizen) {
			var nodeName = getNodeName(citizen, {
					option: null,
					prefix: EFFECT_PREFIX,
					id: citizen.getId()
				}),
				node = jQuery('#' + nodeName);
			
			this.effectTree.jstree('rename_node', node, citizen.name);
		},
		
		updateTarget: function(target) {
			this.eventList.edit(
				'msgTarget_' + target.dispatchId,
				target,
				target.name);
		},
		
		updateSaveButton: function() {
			var saveButton = this.mainPanel.find('#msgEdtSaveBtn'),
				causeText = this.mainPanel.find('#msgEdtCauseTxt').text(),
				effectText = this.mainPanel.find('#msgEdtEffectTxt').text(),
				name = this.mainPanel.find('#msgEdtName').val();
			
			if (name === '' || causeText === '' || effectText === '') {
				saveButton.attr('disabled', 'disabled');
			} else {
				saveButton.removeAttr('disabled');
			}
		},
		
		fillParams: function(argHash, autocomplete) {
			var list = this.mainPanel.find('#msgEdtTargetParams'),
				args = [],
				that = this;
			
			list.empty();
			argHash.each(function(key, value) {
				args[value.ndx] = {
					name: key,
					val: value.value
				};
			});
			
			for (var ndx = 0, len = args.length; ndx < len; ndx++) {
				var li = jQuery('<li></li>'),
					ip = jQuery('<input type="text"></input>'),
					lb = jQuery('<label></label>'),
					cb = jQuery('<button class="msgEdtCitTreeBtn dialogBtn">Citizens</button>'),
					arg = args[ndx],
					id = 'msgParam_' + arg.name;
				
	            list.append(li);
	            li.append(lb).append(ip).append(cb);
				
	            var windowHeight = window.innerHeight ? window.innerHeight : document.documentElement.offsetHeight,
					position = li.offset(),
					height = windowHeight - position.top;			
				
				cb.data('paramIn', ip)
				.bind('click', function(evt) {
					var citTreePnl = jQuery(CITIZEN_WRAPPER),
						oldElem = citTreePnl.data('curElem'),
						elem = jQuery(this);
					
					if (citTreePnl.is(':visible') && elem[0] === oldElem[0]) {
						citTreePnl.hide(200).data('curElem', null);
						that.currentParamIn = null;
						
						jQuery(document).unbind('click.msgCitTree');
						citTreePnl.data('docBound', false);
					}
					else {
						var position = elem.offset(),
							isDocBound = citTreePnl.data('docBound');
						
						position.top += elem.outerHeight();
						citTreePnl.hide().show(200).data('curElem', elem)
							.offset(position).css('right', position.left);
						
						if (!isDocBound) {
							jQuery(document).bind('click.msgCitTree', function(evt){
								var target = jQuery(evt.target),
									parent = target.parents(CITIZEN_WRAPPER),
									id = target.attr('id');
								
								if (parent.size() == 0 
									&& id != 'msgEdtCitizensPnl' 
									&& !target.hasClass('msgEdtCitTreeBtn')) {
									citTreePnl.hide();
								}
							});
							citTreePnl.data('docBound', true);
						}
						
						that.currentParamIn = elem.data('paramIn');
					}
				});
				
				lb.text(arg.name + ':');
				lb.attr('for', id);
				ip.attr('id', id)
				.data('paramName', arg.name)
				.css('maxHeight', height)
				.blur(function(event, ui) {
					var elem = jQuery(this),
						val = elem.val();
					
					if (hemi.utils.isNumeric(val)) {
						val = parseFloat(val);
					}
					
					that.notifyListeners(module.EventTypes.SetArgument, {
						name: elem.data('paramName'),
						value: val
					});
					return false;
				})
				.autocomplete({
					source: autocomplete,
					focus: function(event, ui) {
						var elem = jQuery(this),
							val = ui.item.value;
						elem.val(ui.item.label);
						
						if (hemi.utils.isNumeric(val)) {
							val = parseFloat(val);
						}
						
						that.notifyListeners(module.EventTypes.SetArgument, {
							name: elem.data('paramName'),
							value: val
						});
						return false;
					},
					select: function(event, ui) {
	                    var elem = jQuery(this),
							val = ui.item.value;
						elem.val(ui.item.label);
						
						if (hemi.utils.isNumeric(val)) {
							val = parseFloat(val);
						}
						
						that.notifyListeners(module.EventTypes.SetArgument, {
							name: elem.data('paramName'),
							value: val
						});
						return false;
					}
				})
				.data('autocomplete')._renderItem = function(ul, item) {
					return jQuery('<li></li>')
		            .data('item.autocomplete', item)
					.append('<a>' + item.label + '<br/><span class="ui-autocomplete-desc">' + item.desc + '</span></a>')
					.appendTo(ul);
				};
				
				if (arg.val !== null) {
					ip.val(arg.val);
				} else {
					ip.val('');
				}
			}
		},
		
		setArgument: function(argName, argValue) {
			var id = '#msgParam_' + argName,
				input = this.mainPanel.find(id);
			input.val(argValue);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The MessagingController facilitates MessagingModel and MessagingView
     * communication by binding event and message handlers.
     */
    module.tools.MessagingController = module.tools.ToolController.extend({
		init: function() {
			this._super();
    	},
    
		/**
	     * Binds event and message handlers to the view and model this object 
	     * references.  
	     */        
		bindEvents: function(){
			this._super();
			
			var model = this.model;
			var view = this.view;
			var controller = this;
			
			view.addListener(module.EventTypes.ToolModeSet, function(data){
				var isDown = data == module.tools.ToolConstants.MODE_DOWN, 
					pnl = jQuery('#o3d'), 
					vwr = view.mainPanel.getUI(), 
					columns = vwr.find('.msgColumn');
				view.mainPanel.setVisible(isDown);
				
				if (isDown) {
					pnl.removeClass('mainView').addClass('hiddenView');
					vwr.addClass('mainView').removeClass('hiddenView');
					view.getSidebar().setVisible(false);
				}
				else {
					pnl.addClass('mainView').removeClass('hiddenView');
					vwr.removeClass('mainView').addClass('hiddenView');
					view.getSidebar().setVisible(true);
				}
				
				vwr.bind('editor.mainView.resize', function(evt) {
					var vwrCols = vwr.children('.msgColumn'),
						width = vwr.parent().width(),
						borderWidth = 0,
						paddingWidth = 0,
						marginWidth = 0,
						colWidth = 0;
					
					vwrCols.each(function(index) {
						var elem = jQuery(this);
						
						borderWidth += parseInt(elem.css('borderLeftWidth'))
							+ parseInt(elem.css('borderRightWidth'));
						paddingWidth += parseInt(elem.css('paddingLeft'))
							+ parseInt(elem.css('paddingRight'));
						marginWidth += parseInt(elem.css('marginLeft'))
							+ parseInt(elem.css('marginRight'));
					});
					
					colWidth = (width - borderWidth - marginWidth 
						- paddingWidth) / vwrCols.length;
					
					vwrCols.width(colWidth);
				});
				
				jQuery(window).trigger('resize');
			});
			
			view.addListener(module.EventTypes.RemoveTarget, function(data){
				model.removeTarget(data);
			});
			
			view.addListener(module.EventTypes.SaveTarget, function(targetName){
				model.save(targetName);
			});
			
			view.addListener(module.EventTypes.SelectCause, function(data){
				model.setMessageSource(data.source);
				model.setMessageType(data.message);
			});
			
			view.addListener(module.EventTypes.SelectEffect, function(data){
				model.setMessageHandler(data.citizen);
				model.setMethod(data.method);
			});
			
			view.addListener(module.EventTypes.SelectTarget, function(data){
				if (data.target !== null) {
					model.copyTarget(data.target);
				}
				
				model.msgTarget = data.edit ? data.target : null;
			});
			
			view.addListener(module.EventTypes.SetArgument, function(data){
				model.setArgument(data.name, data.value);
			});
			
			model.addListener(module.EventTypes.ArgumentSet, function(data){
				view.setArgument(data.name, data.value);
			});
			
			model.addListener(module.EventTypes.CauseSet, function(data){
				view.selectCause(data.source, data.message);
			});
			
			model.addListener(module.EventTypes.CitizenAdded, function(data){
				view.addCitizen(data.citizen, data.createType);
				view.addCause(data.citizen, data.createType);
				view.addEffect(data.citizen, data.createType);
			});
			
			model.addListener(module.EventTypes.CitizenRemoved, function(data){
				view.removeCitizen(data.citizen, data.removeType);
				view.removeCause(data.citizen, data.removeType);
				view.removeEffect(data.citizen, data.removeType);
			});
			
			model.addListener(module.EventTypes.CitizenUpdated, function(citizen){
				view.updateCitizen(citizen);
				view.updateCause(citizen);
				view.updateEffect(citizen);
			});
			
			model.addListener(module.EventTypes.EffectSet, function(data){
				view.selectEffect(data.handler, data.method);
				view.fillParams(model.args, model.autoCompleteList);
			});
			
			model.addListener(module.EventTypes.TargetCreated, function(target){
				view.addTarget(target);
				var editorPnl = view.mainPanel.find('#msgEditor'), editListPnl = view.mainPanel.find('#msgEvents .msgColWrapper');
				
				editorPnl.hide();
				editListPnl.show();
			});
			
			model.addListener(module.EventTypes.TargetRemoved, function(data){
				view.removeTarget(data);
			});
			
			model.addListener(module.EventTypes.TargetUpdated, function(target){
				view.updateTarget(target);
				var editorPnl = view.mainPanel.find('#msgEditor'), editListPnl = view.mainPanel.find('#msgEvents .msgColWrapper');
				
				editorPnl.hide();
				editListPnl.show();
			});
		}
	});
	
    return module;
})(editor || {});