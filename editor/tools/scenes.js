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
			this.lastScene = null;
			this.editScene = null;
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
		
		addSceneEvent: function(scene, eventParams) {
			// TODO
		},
	    
	    removeScene: function(scene) {
			if (this.lastScene === scene) {
				this.lastScene = scene.prev;
			}
			
			scene.cleanup();
			this.notifyListeners(module.EventTypes.SceneRemoved, scene);
	    },
		
		removeSceneEvent: function(sceneEvent) {
			// TODO
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
				this.notifyListeners(module.EventTypes.SceneAdded, nextScene);
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
		SAVE_WIDTH = 170,
		ScnEvtType = {
			LOAD: 'load',
			UNLOAD: 'unload'
		};
		
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
			
			if (type === ScnEvtType.LOAD) {
				this.loadList.before(li, this.loadAdd);
			}
			else {
				this.unloadList.before(li, this.unloadAdd);
			}
			
			this.events.put(event.getId(), {
				type: type,
				li: li
			});
		},
		
		bindButtons: function(li) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var evt = li.getAttachedObject();
				
				wgt.notifyListeners(module.EventTypes.EditSceneEvent, evt);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var evt = li.getAttachedObject();
				wgt.remove(evt);
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
				var tgt = evt.target;
				
				if (tgt !== wgt.editBtn[0] && tgt !== wgt.removeBtn[0]
						&& tgt !== wgt.loadAdd.addBtn[0]
						&& tgt !== wgt.unloadAdd.addBtn[0]
						&& !wgt.isSorting) {
					arrow.toggle(100);
					evtList.slideToggle(200);
				}
			});		
			
			this.loadAdd.container.parent().addClass('button');
			this.unloadAdd.container.parent().addClass('button');	
		},
		
		remove: function(event) {
			var evtObj = this.events.get(event.getId());
			
			if (evtObj.type === ScnEvtType.LOAD) {
				this.loadList.remove(evtObj.li);
			}
			else {
				this.unloadList.remove(evtObj.li);
			}
			
			this.events.remove(event.getId());
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
			var evtObj = this.events.get(event.getId()),
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
	        	view = this.view,
				scnLst = view.sceneListSBWidget,
	        	that = this,
				addSceneListeners = function(scnWgt) {
					scnWgt.addListener(module.EventTypes.AddLoadEvent, 
						function(scn) {
							// show the editor
							// hide the scene list
							scnLst.setVisible(false);
						});
					scnWgt.addListener(module.EventTypes.AddUnloadEvent, 
						function(scn) {
							// show the editor
							// hide the scene list
							scnLst.setVisible(false);
						});
					scnWgt.addListener(module.EventTypes.EditSceneEvent, 
						function(scnEvt) {
							// show the editor
							// set the editor values
							// hide the scene list
							scnLst.setVisible(false);
						});
					scnWgt.addListener(module.EventTypes.RemoveSceneEvent, 
						function(scnEvt) {
							// let the model know
							model.removeSceneEvent(scnEvt);
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
			scnLst.addListener(module.EventTypes.RemoveScene, function(scene) {
				model.removeScene(scene);
			});			
			scnLst.addListener(module.EventTypes.ReorderScene, function(scnObj) {
				model.reorderScenes(scnObj.scene, scnObj.prev, scnObj.next);
			});			
			scnLst.addListener(module.EventTypes.EditScene, function(scene) {
				model.setScene(scene);
			});			
			scnLst.addListener(module.EventTypes.UpdateScene, function(scnObj) {
				model.updateScene(scnObj.name);
				model.setScene(null);
			});
			
			// model specific
			model.addListener(module.EventTypes.SceneAdded, function(scene) {
				var li = scnLst.add(scene);
				that.addSceneListeners(li);
			});			
			model.addListener(module.EventTypes.SceneUpdated, function(scene) {
				scnLst.update(scene);
			});		
			model.addListener(module.EventTypes.SceneRemoved, function(scene) {
				scnLst.remove(scene);
			});				
			model.addListener(module.EventTypes.WorldCleaned, function() {
				scnLst.list.clear();
			});
	    }
	});
    
    return module;
})(editor || {});
