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
	
	module.EventTypes.Scenes = {
		// model specific
		SceneAdded: "scenes.SceneAdded",
		SceneRemoved: "scenes.SceneRemoved",
		SceneUpdated: "scenes.SceneUpdated",
		ScnCitizenAdded: "scenes.ScnCitizenAdded",
		ScnCitizenRemoved: "scenes.ScnCitizenRemoved",
		ScnCitizenUpdated: "scenes.ScnCitizenUpdated",
		ScnEventCreated: "scenes.ScnEventCreated",
		
		// scene list widget specific
	    AddScene: "scenes.AddScene",
		EditScene: "scenes.SelectScene",
	    UpdateScene: "scenes.UpdateScene",
	    RemoveScene: "scenes.RemoveScene",
	    ReorderScene: "scenes.ReorderScene",
		
		// scene list item widget specific
		EditSceneEvent: "scenes.EditSceneEvent",
		RemoveSceneEvent: "scenes.RemoveSceneEvent",
		AddLoadEvent: "scenes.AddLoadEvent",
		AddUnLoadEvent: "scenes.AddUnLoadEvent",		
		
		// scene event editor widget specific
		CancelScnEvtEdit: "scenes.CancelScnEvtEdit",
		SaveSceneEvent: "scenes.SaveSceneEvent"
	};
    	
	var CITIZEN_WRAPPER = '#scnEvtCitizensPnl';
    
////////////////////////////////////////////////////////////////////////////////
//                             Helper Methods                                 //
////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * Returns the list of parameters for a function
	 */
	var getFunctionParams = function(func) {
		return func.toString().match(/\((.*?)\)/)[1].match(/[\w]+/g) || [];
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
	    
	    addScene: function(sceneName) {
			var scene = new hemi.scene.Scene();
			scene.name = sceneName;
			
			if (this.lastScene) {
				this.lastScene.next = scene;
				scene.prev = this.lastScene;
			}
			this.lastScene = scene;
			this.notifyListeners(module.EventTypes.Scenes.SceneAdded, scene);
	    },
	    
	    removeScene: function(scene) {
			if (this.lastScene === scene) {
				this.lastScene = scene.prev;
			}
			
			scene.cleanup();
			this.notifyListeners(module.EventTypes.Scenes.SceneRemoved, scene);
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
			this.notifyListeners(module.EventTypes.Scenes.SceneUpdated, this.editScene);
			this.editScene = null;
		},
	    
	    worldCleaned: function() {
			this.notifyListeners(module.EventTypes.WorldCleaned, null);
	    },
		    
	    worldLoaded: function() {
			var scenes = hemi.world.getScenes(),
				nextScene = null;
			
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
				this.notifyListeners(module.EventTypes.Scenes.SceneAdded, nextScene);
				var target = hemi.dispatch.getTargets({
							src: nextScene
						}),
					spec = hemi.dispatch.getSpec(target);
					
				this.notifyListeners(module.EventTypes.Scenes.ScnEventCreated, {
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
				
				wgt.notifyListeners(module.EventTypes.Scenes.EditSceneEvent, {
					scene: scn,
					event: evt,
					type: typ
				});
			});
			
			li.removeBtn.bind('click', function(evt) {
				var evt = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.Scenes.RemoveSceneEvent, evt);
			});
		},
		
		createAddBtnLi: function() {
			var li = new module.ui.ListItemWidget();
			li.addBtn = jQuery('<button class="addBtn">Add</button>');
			li.container.append(li.addBtn).addClass('add');
			
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
				wgt.notifyListeners(module.EventTypes.Scenes.AddLoadEvent, 
					wgt.getAttachedObject());
			});
			this.unloadAdd.addBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.Scenes.AddUnLoadEvent, 
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
				wgt.notifyListeners(module.EventTypes.Scenes.EditScene, scn);
				wgt.addBtn.text(SAVE_TXT).data('isEditing', true)
					.data('scene', scn).removeAttr('disabled');
			});
			
			li.removeBtn.bind('click', function(evt) {
				var scn = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.Scenes.RemoveScene, scn);
				
				if (wgt.addBtn.data('scene') === scn) {
					wgt.addBtn.text(ADD_TXT).data('isEditing', false)
						.data('scene', null);
					wgt.nameInput.val('').width(ADD_WIDTH);
				}
			});
		},
		
		createListItemWidget: function() {
			return new module.tools.ScnListItemWidget();
		},
		
		finishLayout: function() {
			this._super();		
			var wgt = this;	
			
			this.list.getUI().bind('sortupdate', function(evt, ui) {
				var elem = ui.item,
					scene = elem.data('obj'),
					prev = elem.prev().data('obj'),
					next = elem.next().data('obj');
				
				wgt.notifyListeners(module.EventTypes.Scenes.ReorderScene, {
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
			this.addBtn = jQuery('<button id="scnCreate" class="inlineBtn">Add Scene</button>');
			var wgt = this;
			
			this.addBtn.bind('click', function(evt) {
				var btn = jQuery(this),
					name = wgt.nameInput.val(),
					isEditing = btn.data('isEditing'),
					msgType = isEditing ? module.EventTypes.Scenes.UpdateScene 
						: module.EventTypes.Scenes.AddScene,
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
			
			this.nameInput.bind('keyup', function(evt) {
				var elem = jQuery(this);
				if (elem.val() !== '') {
					wgt.addBtn.removeAttr('disabled');
				} else {
					wgt.addBtn.attr('disabled', 'disabled');
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
		uiFile: 'js/editor/tools/html/scenesForm.htm',
		manualVisible: true
	};
	
	module.tools.ScnEvtEdtSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
					module.tools.ScnEvtEdtSBWidgetDefaults, options),
				wgt = this;
				
			this.actionsTree = module.ui.createActionsTree(true);
			this.citizensTree = module.ui.createCitizensTree();
			
			this.citizensTree.addListener(module.EventTypes.Trees.TreeCreated, 
				function(treeUI) {
					var citizenWrapper = wgt.find(CITIZEN_WRAPPER);				
					citizenWrapper.append(treeUI);
				});
			
		    this._super(newOpts);
		},
		
		canSave: function() {
			var isSaveable = this.actionChooser.getSelection()  != null 
				&& this.name.val() !== '';
				
			if (isSaveable) {
				this.saveBtn.removeAttr('disabled');
			}
			else {
				this.saveBtn.attr('disabled', 'disabled');
			}
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
						wgt.citizensTree.currentParamIpt = null;
						
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
						
						wgt.citizensTree.currentParamIpt = btn.data('paramIn');
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
				
	            var windowHeight = window.innerHeight ? window.innerHeight 
						: document.documentElement.offsetHeight,
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
			
			this.actionChooser = new module.ui.TreeSelector({
				buttonId: 'scnEvtTreeSelector',
				containerClass: 'scnEvtEffectDiv',
				tree: this.actionsTree,
				select: function(data, selector) {
					var elem = data.rslt.obj,
						metadata = elem.data('jstree'),
						path = wgt.actionChooser.tree.jstree('get_path', elem);
					
					if (metadata.type === 'citType' 
							|| metadata.type === 'citizen') {
						selector.tree.jstree('open_node', elem, false, false);
						return false;
					}
					else {					
						var cit = metadata.parent,
							method = path[path.length-1];
							
						wgt.fillParams(getFunctionParams(cit[method]));
						selector.input.val(path.join('.').replace('.More...', ''));
						selector.setSelection({
							obj: cit,
							method: method 
						});
						wgt.canSave();
						
						return true;
					}
				}
			});
			
			container.append(this.actionChooser.getUI());
			
			this.find('form').submit(function() { return false; });
			
			this.cancelBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.Scenes.CancelScnEvtEdit, null);
			});
			
			this.saveBtn.bind('click', function(evt) {
				var selVal = wgt.actionChooser.getSelection(),
					saveObj = jQuery.extend(selVal, {
						args: wgt.getArgs(),
						type: wgt.type,
						name: wgt.name.val(),
						scene: wgt.scene
					});
				wgt.notifyListeners(module.EventTypes.Scenes.SaveSceneEvent, saveObj);
			});
			
			this.name.bind('keyup', function(evt) {
				wgt.canSave();
			});
			
			var citizenWrapper = this.find(CITIZEN_WRAPPER);			
			citizenWrapper.css('position', 'absolute').data('curElem', null)
				.hide();
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
			this.actionChooser.reset();
			this.list.empty();
			this.paramsSet.hide();
			this.saveBtn.attr('disabled', 'disabled');
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
				
				this.actionChooser.select(node);
				
				for (var ndx = 0, len = target.args.length; ndx < len; ndx++) {
					this.curArgs[ndx].val(target.args[ndx]);
				}
				
				this.name.val(target.name);
			}
		},
		
		setArgument: function(argName, argValue) {
			var id = '#scnEvtParam_' + argName,
				input = this.mainPanel.find(id);
			input.val(argValue);
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
					scnWgt.addListener(module.EventTypes.Scenes.AddLoadEvent, 
						function(scn) {
							// show the editor
							edtWgt.setVisible(true);
							edtWgt.set(scn, hemi.msg.load);
							// hide the scene list
							scnLst.setVisible(false);
						});
					scnWgt.addListener(module.EventTypes.Scenes.AddUnLoadEvent, 
						function(scn) {
							// show the editor
							edtWgt.setVisible(true);
							edtWgt.set(scn, hemi.msg.unload);
							// hide the scene list
							scnLst.setVisible(false);
						});
					scnWgt.addListener(module.EventTypes.Scenes.EditSceneEvent, 
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
					scnWgt.addListener(module.EventTypes.Scenes.RemoveSceneEvent, 
						function(scnEvt) {
							// let the model know
							msgMdl.removeTarget(scnEvt);
						});
				};
			
			// special listener for when the tool button is clicked
	        view.addListener(module.EventTypes.ToolModeSet, function(value) {
	            var isDown = value.newMode === module.tools.ToolConstants.MODE_DOWN;
	        });
	        			
			// scene list widget specific
			scnLst.addListener(module.EventTypes.Scenes.AddScene, function(sceneName) {
				model.addScene(sceneName);
			});			
			scnLst.addListener(module.EventTypes.Scenes.EditScene, function(scene) {
				model.setScene(scene);
			});			
			scnLst.addListener(module.EventTypes.Scenes.RemoveScene, function(scene) {
				// get the scene's events
				var targets = msgMdl.dispatchProxy.getTargets(scene.getId());
				
				for (var ndx = 0, len = targets.length; ndx < len; ndx++) {
					msgMdl.removeTarget(targets[ndx]);
				}
				model.removeScene(scene);
			});			
			scnLst.addListener(module.EventTypes.Scenes.ReorderScene, function(scnObj) {
				model.reorderScenes(scnObj.scene, scnObj.prev, scnObj.next);
			});			
			scnLst.addListener(module.EventTypes.Scenes.UpdateScene, function(scnObj) {
				model.updateScene(scnObj.name);
				model.setScene(null);
			});
			
			// edit widget specific
			edtWgt.addListener(module.EventTypes.Scenes.CancelScnEvtEdit, function() {
				msgMdl.msgTarget = null;
				edtWgt.reset();
				edtWgt.setVisible(false);
				scnLst.setVisible(true);
			});
			edtWgt.addListener(module.EventTypes.Scenes.SaveSceneEvent, function(saveObj) {
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
			
			// edit widget trees specific
			edtWgt.actionsTree.addListener(module.EventTypes.Trees.SelectAction, 
				function(data){
					model.setMessageHandler(data.citizen);
					model.setMethod(data.method);
				});	
			
			// model specific
			model.addListener(module.EventTypes.Scenes.SceneAdded, function(scene) {
				var li = scnLst.add(scene);
				addSceneListeners(li);
			});		
			model.addListener(module.EventTypes.Scenes.SceneUpdated, function(scene) {
				scnLst.update(scene);
			});		
			model.addListener(module.EventTypes.Scenes.SceneRemoved, function(scene) {
				model.editScene = null;
				scnLst.remove(scene);
			});					
			model.addListener(module.EventTypes.WorldCleaned, function() {
				scnLst.clear();
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
