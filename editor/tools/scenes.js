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
		
	var EMPTY_SCN_TXT = 'No scene selected';
	
    module.EventTypes = module.EventTypes || {};
	
	// model specific
	module.EventTypes.SceneAdded = "scenes.SceneAdded";
	module.EventTypes.SceneRemoved = "scenes.SceneRemoved";
	module.EventTypes.SceneUpdated = "scenes.SceneUpdated";
	module.EventTypes.ScnCitizenAdded = "scenes.ScnCitizenAdded";
	module.EventTypes.ScnEventCreated = "scenes.ScnEventCreated";
	
	// scene list widget specific
    module.EventTypes.AddScene = "scenes.AddScene";
	module.EventTypes.EditScene = "scenes.SelectScene";
    module.EventTypes.UpdateScene = "scenes.UpdateScene";
    module.EventTypes.RemoveScene = "scenes.RemoveScene";
    module.EventTypes.ReorderScene = "scenes.ReorderScene";
	
	// scene list item widget specific
	module.EventTypes.EditSceneEvent = "scenes.EditSceneEvent";
	module.EventTypes.RemoveSceneEvent = "scenes.RemoveSceneEvent";
	module.EventTypes.AddLoadEvent = "scenes.AddLoadEvent";
	module.EventTypes.AddUnLoadEvent = "scenes.AddUnLoadEvent";		
	
	// scene event editor widget specific
	module.EventTypes.CancelScnEvtEdit = "scenes.CancelScnEvtEdit";
	module.EventTypes.SaveSceneEvent = "scenes.SaveSceneEvent";
    
////////////////////////////////////////////////////////////////////////////////
//                             Helper Methods                                 //
////////////////////////////////////////////////////////////////////////////////
	
	var CAUSE_PREFIX = 'scnCa_',
		CAUSE_WRAPPER = '#causeTreeWrapper',
		EFFECT_PREFIX = 'scnEf_',
		EFFECT_WRAPPER = '#effectTreeWrapper',
		CITIZEN_PREFIX = 'scnCi_',
		CITIZEN_WRAPPER = '#scnEvtCitizensPnl',
		MSG_WILDCARD = 'Any';
		
	var methodsToRemove = [
        'constructor',
		'getId',
		'setId',
		'getCitizenType',
		'setCitizenType',
		'toOctane'
	];
	
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
	
	/**
	 * Returns the list of parameters for a function
	 */
	var getFunctionParams = function(func) {
		return func.toString().match(/\((.*?)\)/)[1].match(/[\w]+/g) || [];
    };
	
	var getNodeName = function(citizen, config) {
		var nodeName = config.prefix;
		
		if (citizen === null) {
			return null;
		} else if (citizen === MSG_WILDCARD) {
			nodeName += citizen;
		} else if (citizen.getCitizenType !== undefined) {
			nodeName += citizen.getCitizenType().split('.').pop();
		} else if (citizen.name) {
			nodeName += citizen.name;
		}
		
		if (config.id != null) {
			nodeName += '_' + config.id;
		}
		if (config.option != null) {
			nodeName += '_' + config.option;
		}
		
		return nodeName.replace(' ', '_').replace('.', '_');
	};
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * A SceneMgrModel ...
     *  
     * @param {hemi.world.World} world the world object, which has references to
     *         all relevant objects (like models)
     */
    module.tools.SceneMgrModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
			this.citizenTypes = new Hashtable();
			this.lastScene = null;
			this.editScene = null;
			
			// TODO: share the dispatch proxy with messaging
			this.dispatchProxy = new module.tools.DispatchProxy();
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
				this.notifyListeners(module.EventTypes.ScnCitizenAdded, {
					citizen: citizen,
					createType: createType
				});
			}
		},
	    
	    addScene: function(sceneName) {
			var scene = new hemi.scene.Scene();
			scene.name = sceneName;
			
			if (this.lastScene) {
				this.lastScene.next = scene;
				scene.prev = this.lastScene;
			}
			this.lastScene = scene;
			this.notifyListeners(module.EventTypes.SceneAdded, scene);
	    },
		
		cancelSceneEventEdit: function() {
			this.isUpdatingScnEvt = false;
			this.sceneEvent = null;
		},
	    
	    removeScene: function(scene) {
			if (this.lastScene === scene) {
				this.lastScene = scene.prev;
			}
			
			scene.cleanup();
			this.notifyListeners(module.EventTypes.SceneRemoved, scene);
	    },
		
		reorderScenes: function(scene, previous, next) {
			var oldPrev = scene.prev,
				oldNext = scene.next;
			
			if (oldPrev) {
				oldPrev.next = oldNext;
			}
			if (oldNext) {
				oldNext.prev = oldPrev;
			}
			scene.prev = previous;
			scene.next = next;
			
			if (previous) {
				previous.next = scene;
			}
			if (next) {
				next.prev = scene;
			}
		},
		
		setScene: function(scene) {
			this.editScene = scene;
		},
		
		updateScene: function(sceneName) {
			this.editScene.name = sceneName;
			this.notifyListeners(module.EventTypes.SceneUpdated, this.editScene);
		},
		
		updateSceneEvent: function(sceneEvent, eventParams) {
			// TODO
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
			this.notifyListeners(module.EventTypes.WorldCleaned, null);
	    },
		    
	    worldLoaded: function() {
			var citizens = hemi.world.getCitizens(),
				scenes = hemi.world.getScenes(),
				nextScene = null;
			
			for (var ndx = 0, len = citizens.length; ndx < len; ndx++) {
				var citizen = citizens[ndx];
				
				if (citizen.name.match(module.tools.ToolConstants.EDITOR_PREFIX) === null) {
					this.addCitizen(citizen);
				}
			}
			
			for (var ndx = 0, len = scenes.length; ndx < len; ndx++) {
				var scene = scenes[ndx];
				
				if (scene.prev === null) {
					nextScene = scene;
				}
				
				if (scene.next === null) {
					this.lastScene = scene;
				}
			}
			
			while (nextScene !== null) {
				this.notifyListeners(module.EventTypes.SceneAdded, nextScene);
				var target = hemi.dispatch.getTargets({
							src: nextScene
						}),
					spec = hemi.dispatch.getSpec(target);
					
				this.notifyListeners(module.EventTypes.ScnEventCreated, {
					scene: nextScene,
					type: spec.msg,
					msgTarget: target
				});
				
				nextScene = nextScene.next;
			}
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	    Scenes List Sidebar Widget                        //
////////////////////////////////////////////////////////////////////////////////     
	
	var ADD_TXT = "Add Scene",
		SAVE_TXT = "Save Scene",
		ADD_WIDTH = 180,
		SAVE_WIDTH = 170;
		
	module.tools.ScnListItemWidget = module.ui.EditableListItemWidget.extend({
		init: function() {
			this._super();
			
			this.isSorting = false;
			this.events = new Hashtable();
		},
		
		add: function(event, type) {
			var li = new module.ui.EditableListItemWidget();
			
			li.setText(event.name);
			li.attachObject(event);
			
			this.bindButtons(li);
			
			if (type === hemi.msg.load) {
				this.loadList.before(li, this.loadAdd);
			}
			else {
				this.unloadList.before(li, this.unloadAdd);
			}
			
			this.events.put(event.dispatchId, {
				type: type,
				li: li
			});
		},
		
		bindButtons: function(li) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var evt = li.getAttachedObject(),
					scn = wgt.getAttachedObject(),
					typ = wgt.events.get(evt.dispatchId).type;
				
				wgt.notifyListeners(module.EventTypes.EditSceneEvent, {
					scene: scn,
					event: evt,
					type: typ
				});
			});
			
			li.removeBtn.bind('click', function(evt) {
				var evt = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.RemoveSceneEvent, evt);
			});
		},
		
		createAddBtnLi: function() {
			var li = new module.ui.ListItemWidget();
			li.addBtn = jQuery('<button>Add</button>');
			li.container.append(li.addBtn);
			
			return li;
		},
		
		finishLayout: function() {
			this._super();
			
			// attach the sub lists
			var loadHeader = jQuery('<h2>Load Events:</h2>'),
				unloadHeader = jQuery('<h2>Unload Events:</h2>'),
				evtList = jQuery('<div class="scnEvtListWrapper"></div>'),
				arrow = jQuery('<div class="scnEvtListArrow"></div>'),
				wgt = this;
			
			this.loadAdd = this.createAddBtnLi();
			this.unloadAdd = this.createAddBtnLi();
			
			this.loadAdd.addBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.AddLoadEvent, 
					wgt.getAttachedObject());
			});
			this.unloadAdd.addBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.AddUnLoadEvent, 
					wgt.getAttachedObject());
			});
			
			this.loadList = new module.ui.ListWidget({
				widgetClass: 'scnEvtList',
				prefix: 'scnEvtLst'
			});
			this.unloadList = new module.ui.ListWidget({
				widgetClass: 'scnEvtList',
				prefix: 'scnEvtLst'
			});
			
			this.loadList.add(this.loadAdd);
			this.unloadList.add(this.unloadAdd);
			evtList.append(loadHeader).append(this.loadList.getUI())
				.append(unloadHeader).append(this.unloadList.getUI())
				.hide();
			arrow.hide();
			this.container.append(arrow).append(evtList);
			
			this.container.bind('mouseup', function(evt) {
				var tgt = jQuery(evt.target);
				
				if (evt.target.tagName !== 'BUTTON'
						&& tgt.parents('.scnEvtListWrapper').size() === 0
						&& !tgt.hasClass('scnEvtListWrapper')
						&& !wgt.isSorting) {
					arrow.toggle(100);
					evtList.slideToggle(200);
				}
			});		
			
			this.loadAdd.container.parent().addClass('button');
			this.unloadAdd.container.parent().addClass('button');	
		},
		
		remove: function(event) {
			var evtObj = this.events.get(event.dispatchId);
			
			if (evtObj.type === hemi.msg.load) {
				this.loadList.remove(evtObj.li);
			}
			else {
				this.unloadList.remove(evtObj.li);
			}
			
			this.events.remove(event.dispatchId);
		},
		
		setParent: function(parent) {
			this._super();
			var wgt = this;
			
			// need to check for sorting
			if (parent) {
				parent.list.bind('sortstart', function(evt, ui){
					wgt.isSorting = true;
				});
				parent.list.bind('sortstop', function(evt, ui){
					wgt.isSorting = false;
				});
			}
		},
		
		update: function(event) {
			var evtObj = this.events.get(event.dispatchId),
				li = evtObj.li;
			
			li.attachObject(event);
			li.setText(event.name);
		}
	});
		
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.ScnListSBWidgetDefaults = {
		name: 'sceneListSBWidget',
		listId: 'sceneList',
		prefix: 'scnLst',
		title: 'Scenes',
		instructions: "Type in a name and click 'Create Scene' to add a new scene.  Click and drag a scene to reorder it in the list",
		type: module.ui.ListType.ORDERED,
		sortable: true
	};
	
	module.tools.ScnListSBWidget = module.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.ScnListSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.items = new Hashtable();		
		},
		
		add: function(obj) {
			var li = this._super(obj);
			
			this.items.put(obj.getId(), li);
			
			return li;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var scn = li.getAttachedObject();
				
				wgt.nameInput.val(scn.name).width(SAVE_WIDTH);
				wgt.notifyListeners(module.EventTypes.EditScene, scn);
				wgt.addBtn.text(SAVE_TXT).data('isEditing', true)
					.data('scene', scn).removeAttr('disabled');
			});
			
			li.removeBtn.bind('click', function(evt) {
				var scn = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.RemoveScene, scn);
			});
		},
		
		createListItemWidget: function() {
			return new module.tools.ScnListItemWidget();
		},
		
		finishLayout: function() {
			this._super();			
			
			this.list.getUI().bind('sortupdate', function(evt, ui) {
				var elem = ui.item,
					scene = elem.data('obj'),
					prev = elem.prev().data('obj'),
					next = elem.next().data('obj');
				
				wgt.notifyListeners(module.EventTypes.ReorderScene, {
					scene: scene,
					prev: prev ? prev : null,
					next: next ? next : null
				});
			});
		},
		
		getOtherHeights: function() {
			return this.form.outerHeight(true);
		},
		
		getListItem: function(obj) {
			if (obj instanceof hemi.dispatch.MessageTarget) {
				var items = this.items.values(),
					found = -1,
					itm = null;
				
				for (var ndx = 0, len = items.length; ndx < len && found === -1; ndx++) {
					var item = items[ndx];
					
					if (item.events.containsKey(obj.dispatchId)) {
						found = ndx;
					}
				}
				
			 	if (found !== -1) {
					itm = items[found];
				}
				
				return itm;
			}
			else { // it's a scene
				return this.items.get(obj.getId());
			}
		},
		
		layoutExtra: function() {
			this.form = jQuery('<form method="post"></form>');
			this.nameInput = jQuery('<input type="text" id="scnName" />');
			this.addBtn = jQuery('<button id="scnCreate">Add Scene</button>');
			var wgt = this;
			
			this.addBtn.bind('click', function(evt) {
				var btn = jQuery(this),
					name = wgt.nameInput.val(),
					isEditing = btn.data('isEditing'),
					msgType = isEditing ? module.EventTypes.UpdateScene 
						: module.EventTypes.AddScene,
					data = isEditing ? {
						scene: btn.data('scene'),
						name: name
					} : name;
					
				wgt.notifyListeners(msgType, data);
				wgt.nameInput.val('').width(ADD_WIDTH);
				btn.attr('disabled', 'disabled').text(ADD_TXT)
					.data('isEditing', false).data('scene', null);
			})
			.attr('disabled', 'disabled');
			
			this.form.append(this.nameInput).append(this.addBtn)
			.bind('submit', function(evt) {
				return false;
			});
			
			this.nameInput.bind('keypress', function(evt) {
				var elem = jQuery(this);
				if (elem.val().length > 0) {
					wgt.addBtn.removeAttr('disabled');
				}
			})
			.width(ADD_WIDTH);
			
			return this.form;
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	Scene Event Editor Sidebar Widget                     //
////////////////////////////////////////////////////////////////////////////////     
    
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.ScnEvtEdtSBWidgetDefaults = {
		name: 'scnEvtEdtSBWidget',
		uiFile: 'editor/tools/html/scenesForm.htm',
		manualVisible: true
	};
	
	module.tools.ScnEvtEdtSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.ScnEvtEdtSBWidgetDefaults, options);
		    this._super(newOpts);
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
			
			if (this.citizenTree == null) {
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
				
			this.effectChooser.tree.jstree('create_node', '#' + EFFECT_PREFIX + type, 'inside', {
				json_data: effectNode
			});
		},
		
		addEffectType: function(citizen) {
			var json = createCitizenTypeJson(citizen, EFFECT_PREFIX);
			
			this.effectChooser.tree.jstree('create_node', -1, 'last', {
				json_data: json
			});
		},
		
		canSave: function() {
			var isSaveable = this.effectChooser.getValue()  != null 
				&& this.name.val() !== '';
				
			if (isSaveable) {
				this.saveBtn.removeAttr('disabled');
			}
			else {
				this.saveBtn.attr('disabled', 'disabled');
			}
		},
		
		createCitizenTree: function(json) {
			var that = this,
				citizenWrapper = this.find(CITIZEN_WRAPPER);
				
			this.citizenTree = jQuery('<div id="scnEvtCitizensTree"></div>');
			citizenWrapper.append(this.citizenTree);
			
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
			
			citizenWrapper.css('position', 'absolute').data('curElem', null)
				.hide();
		},
		
		fillParams: function(args, vals) {
			var wgt = this, 
				toggleFcn = function(evt){
					var citTreePnl = wgt.find(CITIZEN_WRAPPER), 
						oldElem = citTreePnl.data('curElem'), 
						elem = jQuery(this).parent(), 
						btn = elem.children('button'), 
						ipt = elem.children('input');
					
					if (citTreePnl.is(':visible') && oldElem 
							&& elem[0] === oldElem[0]) {
						citTreePnl.hide(200).data('curElem', null);
						wgt.currentParamIn = null;
						
						jQuery(document).unbind('click.scnEvtCitTree');
						citTreePnl.data('docBound', false);
					}
					else {
						var position = ipt.offset(), 
							isDocBound = citTreePnl.data('docBound');
						
						position.top += ipt.outerHeight();
						citTreePnl.hide().show(200).data('curElem', elem).offset(position);
						
						if (!isDocBound) {
							jQuery(document).bind('click.scnEvtCitTree', function(evt){
								var target = jQuery(evt.target), 
									parent = target.parents(CITIZEN_WRAPPER), 
									id = target.attr('id');
								
								if (parent.size() == 0 
										&& id != 'scnEvtCitizensPnl' 
										&& !target.hasClass('scnEvtCitTreeBtn')
										&& !target.hasClass('scnEvtCitTreeIpt')) {
									citTreePnl.hide();
								}
							});
							citTreePnl.data('docBound', true);
						}
						
						wgt.currentParamIn = btn.data('paramIn');
					}
				};
			
			this.list.empty();
			this.curArgs = [];
			
			if (args.length > 0) {
				this.paramsSet.show(100);
			}
			else {
				this.paramsSet.hide(100);
			}
			
			for (var ndx = 0, len = args.length; ndx < len; ndx++) {
				var li = jQuery('<li></li>'),
					ip = jQuery('<input type="text" class="scnEvtCitTreeIpt"></input>'),
					lb = jQuery('<label></label>'),
					cb = jQuery('<button class="scnEvtCitTreeBtn">Citizens</button>'),
					arg = args[ndx],
					id = 'scnEvtParam_' + arg;
				
	            this.list.append(li);
	            li.append(lb).append(ip).append(cb);
				
	            var windowHeight = window.innerHeight ? window.innerHeight : document.documentElement.offsetHeight,
					position = li.offset(),
					height = windowHeight - position.top;			
				
				cb.data('paramIn', ip).bind('click', toggleFcn);
				ip.bind('click', toggleFcn);
				
				lb.text(arg + ':');
				lb.attr('for', id);
				ip.attr('id', id).data('name', arg).css('maxHeight', height);
				
				if (vals && vals[ndx] !== null) {
					ip.val(vals[ndx]);
				} else {
					ip.val('');
				}
				
				this.curArgs.push(ip);
			}
		},
		
		finishLayout: function() {
			this._super();
			
			var wgt = this,
				container = this.find('#scnEvtEffectContainer');
			
			this.saveBtn = this.find('#scnEvtSaveBtn');
			this.cancelBtn = this.find('#scnEvtCancelBtn');
			this.name = this.find('#scnEvtName');
			this.list = this.find('#scnEvtTargetParams');
			this.paramsSet = this.find('#scnEvtParams');
			
			this.paramsSet.hide();
			
			this.effectChooser = new module.ui.TreeSelector({
				buttonId: 'scnEvtTreeSelector',
				containerClass: 'scnEvtEffectDiv',
				types: {
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
				},
				json: createModuleJson(hemi.audio),
				select: function(data, selector) {
					var elem = data.rslt.obj,
						metadata = elem.data('jstree'),
						path = wgt.effectChooser.tree.jstree('get_path', elem);
					
					if (metadata.type === 'citType' 
							|| metadata.type === 'citizen') {
						selector.tree.jstree('open_node', elem, false, false);
						return false;
					}
					else {					
						var cit = metadata.parent,
							method = path[path.length-1];
							
						wgt.fillParams(getFunctionParams(cit[method]));
						selector.input.val(path.join('.'));
						selector.setSelection({
							obj: cit,
							method: method 
						});
						wgt.canSave();
						
						return true;
					}
				}
			});
			
			container.append(this.effectChooser.getUI());
			
			this.find('form').submit(function() { return false; });
			
			this.cancelBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.CancelScnEvtEdit, null);
			});
			
			this.saveBtn.bind('click', function(evt) {
				var selVal = wgt.effectChooser.getValue(),
					saveObj = jQuery.extend(selVal, {
						args: wgt.getArgs(),
						type: wgt.type,
						name: wgt.name.val(),
						scene: wgt.scene
					});
				wgt.notifyListeners(module.EventTypes.SaveSceneEvent, saveObj);
			});
			
			this.name.bind('keyup', function(evt) {
				wgt.canSave();
			});
		},		
		
		getArgs: function() {
			var argsIpt = this.curArgs,
				args = [];
			
			for (var ndx = 0, len = argsIpt.length; ndx < len; ndx++) {
				var ipt = argsIpt[ndx],
					val = ipt.val();
				
				if (hemi.utils.isNumeric(val)) {
					val = parseFloat(val);
				}
				
				args.push({
					name: ipt.data('name'),
					value: val
				});				
			}
			
			return args;
		},
		
		reset: function() {
			this.scene = null;
			this.type = null;
			this.name.val('');
			this.curArgs = [];
			this.effectChooser.reset();
			this.list.empty();
			this.paramsSet.hide();
		},
		
		set: function(scene, type, target) {
			this.scene = scene;
			this.type = type;
			
			if (target) {				
				var node = getNodeName(target.handler, {
					option: target.func,
					prefix: EFFECT_PREFIX,
					id: target.handler.getId()
				});
				
				this.effectChooser.select(node);
				
				for (var ndx = 0, len = target.args.length; ndx < len; ndx++) {
					this.curArgs[ndx].val(target.args[ndx]);
				}
				
				this.name.val(target.name);
			}
		},
		
		validate: function() {	
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    
    
    /*
     * Configuration object for the SceneMgrView.
     */
    module.tools.SceneMgrViewDefaults = {
        toolName: 'Scenes',
		toolTip: 'Scenes: Create and edit scenes',
		widgetId: 'scenesBtn',
		axnBarId: 'scnActionBar'
    };
    
    module.tools.SceneMgrView = module.tools.ToolView.extend({
		init: function(options) {
	        var newOpts = jQuery.extend({}, module.tools.SceneMgrViewDefaults, options);
	        this._super(newOpts);
			this.editItemId = null;
			
			this.addSidebarWidget(new module.tools.ScnListSBWidget());
			this.addSidebarWidget(new module.tools.ScnEvtEdtSBWidget());
	    }
	});	
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The SceneMgrController facilitates AnimatorModel and AnimatorView
     * communication by binding event and message handlers.
     */
    module.tools.SceneMgrController = module.tools.ToolController.extend({
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
				msgMdl = this.messagingModel,
	        	view = this.view,
				scnLst = view.sceneListSBWidget,
				edtWgt = view.scnEvtEdtSBWidget,
	        	that = this,
				addSceneListeners = function(scnWgt) {
					scnWgt.addListener(module.EventTypes.AddLoadEvent, 
						function(scn) {
							// show the editor
							edtWgt.setVisible(true);
							edtWgt.set(scn, hemi.msg.load);
							// hide the scene list
							scnLst.setVisible(false);
						});
					scnWgt.addListener(module.EventTypes.AddUnLoadEvent, 
						function(scn) {
							// show the editor
							edtWgt.setVisible(true);
							edtWgt.set(scn, hemi.msg.unload);
							// hide the scene list
							scnLst.setVisible(false);
						});
					scnWgt.addListener(module.EventTypes.EditSceneEvent, 
						function(scnEvt) {
							// show the editor
							edtWgt.setVisible(true);
							// set the editor values
							edtWgt.set(scnEvt.scene, scnEvt.type, scnEvt.event);
							// let the model know
							msgMdl.copyTarget(scnEvt.event);
							msgMdl.msgTarget = scnEvt.event;
							// hide the scene list
							scnLst.setVisible(false);
						});
					scnWgt.addListener(module.EventTypes.RemoveSceneEvent, 
						function(scnEvt) {
							// let the model know
							msgMdl.removeTarget(scnEvt);
						});
				};
			
			// special listener for when the tool button is clicked
	        view.addListener(module.EventTypes.ToolModeSet, function(value) {
	            var isDown = value == module.tools.ToolConstants.MODE_DOWN;
	        });
	        			
			// scene list widget specific
			scnLst.addListener(module.EventTypes.AddScene, function(sceneName) {
				model.addScene(sceneName);
			});			
			scnLst.addListener(module.EventTypes.EditScene, function(scene) {
				model.setScene(scene);
			});			
			scnLst.addListener(module.EventTypes.RemoveScene, function(scene) {
				// get the scene's events
				var targets = msgMdl.dispatchProxy.getTargets(scene.getId());
				
				for (var ndx = 0, len = targets.length; ndx < len; ndx++) {
					msgMdl.removeTarget(targets[ndx]);
				}
				model.removeScene(scene);
			});			
			scnLst.addListener(module.EventTypes.ReorderScene, function(scnObj) {
				model.reorderScenes(scnObj.scene, scnObj.prev, scnObj.next);
			});			
			scnLst.addListener(module.EventTypes.UpdateScene, function(scnObj) {
				model.updateScene(scnObj.name);
				model.setScene(null);
			});
			
			// edit widget specific
			edtWgt.addListener(module.EventTypes.CancelScnEvtEdit, function() {
				msgMdl.msgTarget = null;
				edtWgt.reset();
				edtWgt.setVisible(false);
				scnLst.setVisible(true);
			});
			edtWgt.addListener(module.EventTypes.SaveSceneEvent, function(saveObj) {
				var args = saveObj.args || [];
				
				msgMdl.setMessageSource(saveObj.scene);
				msgMdl.setMessageType(saveObj.type);
				msgMdl.setMessageHandler(saveObj.obj);
				msgMdl.setMethod(saveObj.method);
				
				for (var ndx = 0, len = args.length; ndx < len; ndx++) {
					var arg = args[ndx];
					
					msgMdl.setArgument(arg.name, arg.value);
				}
				
				msgMdl.save(saveObj.name);
			});
			
			// model specific
			model.addListener(module.EventTypes.SceneAdded, function(scene) {
				var li = scnLst.add(scene);
				addSceneListeners(li);
			});		
			model.addListener(module.EventTypes.SceneUpdated, function(scene) {
				scnLst.update(scene);
			});		
			model.addListener(module.EventTypes.SceneRemoved, function(scene) {
				scnLst.remove(scene);
			});		
			model.addListener(module.EventTypes.ScnCitizenAdded, function(citData) {
				edtWgt.addEffect(citData.citizen, citData.createType);
				edtWgt.addCitizen(citData.citizen, citData.createType);
			});			
			model.addListener(module.EventTypes.WorldCleaned, function() {
				scnLst.list.clear();
			});
			
			// messaging model specific
			msgMdl.addListener(module.EventTypes.TargetCreated, function(target) {
				var spec = msgMdl.dispatchProxy.getTargetSpec(target),
					scn = hemi.world.getCitizenById(spec.src),
					li = scnLst.getListItem(scn),
	            	isDown = view.mode == module.tools.ToolConstants.MODE_DOWN;
				
				if (li) {
					li.add(target, spec.msg);
					
					edtWgt.reset();
					edtWgt.setVisible(false);
					scnLst.setVisible(isDown && true);
				}
			});
			msgMdl.addListener(module.EventTypes.TargetRemoved, function(target) {
				var li = scnLst.getListItem(target);
				
				if (li) {
					li.remove(target);
				}
			});
			msgMdl.addListener(module.EventTypes.TargetUpdated, function(target) {
				var spec = msgMdl.dispatchProxy.getTargetSpec(target),
					scn = hemi.world.getCitizenById(spec.src),
					li = scnLst.getListItem(scn),
	            	isDown = view.mode == module.tools.ToolConstants.MODE_DOWN;
				
				if (li) {
					li.update(target);
					
					edtWgt.reset();
					edtWgt.setVisible(false);
					scnLst.setVisible(isDown && true);
				}
			});
	    },
		
		/**
		 * Overrides editor.tools.ToolController.checkBindEvents()
		 *
		 * Returns true if the messaging model, scenes model, and view are all
		 * set.
		 *
		 * @return true if messaging model, scenes model, and view are all
		 *      set, false otherwise.
		 */
		checkBindEvents: function() {
			return this.messagingModel && this.model && this.view;
		},
		
		setMessagingModel: function(mdl) {
			this.messagingModel = mdl;
			
			if (this.checkBindEvents()) {
				this.bindEvents();
			}
		}
	});
    
    return module;
})(editor || {});
