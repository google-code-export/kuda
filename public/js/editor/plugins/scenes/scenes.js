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
//								Initialization								  //
////////////////////////////////////////////////////////////////////////////////

	editor.tools.scenes = editor.tools.scenes || {};

	editor.tools.scenes.init = function() {
		var tabpane = editor.ui.getTabPane('Behaviors'),
			scnMdl = new ScenesModel(),
			scnView = new ScenesView(),
			scnCtr = new ScenesController();
		
		scnCtr.setModel(scnMdl);
		scnCtr.setView(scnView);
		
		tabpane.toolbar.add(scnView);
	};

////////////////////////////////////////////////////////////////////////////////
//								Tool Definition								  //
////////////////////////////////////////////////////////////////////////////////
	
	editor.EventTypes = editor.EventTypes || {};
	
	editor.EventTypes.Scenes = {
		// scene list widget specific
	    AddScene: "scenes.AddScene",
		EditScene: "scenes.SelectScene",
	    UpdateScene: "scenes.UpdateScene",
	    RemoveScene: "scenes.RemoveScene",
	    ReorderScene: "scenes.ReorderScene"
	};
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * A ScenesModel ...
     */
    var ScenesModel = editor.ToolModel.extend({
		init: function() {
			this._super('scenes');
			this.citizenTypes = new Hashtable();
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
			this.notifyListeners(editor.events.Created, scene);
	    },
	    
	    removeScene: function(scene) {
			if (this.lastScene === scene) {
				this.lastScene = scene.prev;
			}
			
			scene.cleanup();
			this.notifyListeners(editor.events.Removed, scene);
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
			this.notifyListeners(editor.events.Updated, this.editScene);
			this.editScene = null;
		},
	    
	    worldCleaned: function() {
			this.notifyListeners(editor.events.WorldCleaned, null);
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
				this.notifyListeners(editor.events.Created, nextScene);
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
	
	var ListWidget = editor.ui.ListWidget.extend({
		init: function() {
		    this._super({
				name: 'scnListWidget',
				listId: 'sceneList',
				prefix: 'scnLst',
				title: 'Scenes',
				instructions: "Type in a name and click 'Create Scene' to add a new scene.  Click and drag a scene to reorder it in the list",
				type: editor.ui.ListType.ORDERED,
				sortable: true
			});
			
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
				wgt.notifyListeners(editor.EventTypes.Scenes.EditScene, scn);
				wgt.addBtn.text(SAVE_TXT).data('isEditing', true)
					.data('scene', scn).removeAttr('disabled');
			});
			
			li.removeBtn.bind('click', function(evt) {
				var scn = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.Scenes.RemoveScene, scn);
				
				if (wgt.addBtn.data('scene') === scn) {
					wgt.addBtn.text(ADD_TXT).data('isEditing', false)
						.data('scene', null);
					wgt.nameInput.val('').width(ADD_WIDTH);
				}
			});
		},
		
		finishLayout: function() {
			this._super();		
			var wgt = this;	
			
			this.list.getUI().bind('sortupdate', function(evt, ui) {
				var elem = ui.item,
					scene = elem.data('obj'),
					prev = elem.prev().data('obj'),
					next = elem.next().data('obj');
				
				wgt.notifyListeners(editor.EventTypes.Scenes.ReorderScene, {
					scene: scene,
					prev: prev ? prev : null,
					next: next ? next : null
				});
			});
			
		    editor.ui.sizeAndPosition.call(this);
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
					msgType = isEditing ? editor.EventTypes.Scenes.UpdateScene 
						: editor.EventTypes.Scenes.AddScene,
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
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    
    
    var ScenesView = editor.ToolView.extend({
		init: function() {
	        this._super({
	            toolName: 'Scenes',
	    		toolTip: 'Create and edit scenes',
	    		elemId: 'scenesBtn',
	    		id: 'scenes'
	        });
	        
	        this.addPanel(new editor.ui.Panel({
				name: 'sidePanel',
				classes: ['scnSidePanel']
			}));
			
			this.sidePanel.addWidget(new ListWidget());
	    }
	});	
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The ScenesController facilitates ScenesModel and ScenesView communication
     * by binding event and message handlers.
     */
    var ScenesController = editor.ToolController.extend({
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
				lstWgt = view.sidePanel.scnListWidget;
			
			// scene list widget specific
			lstWgt.addListener(editor.EventTypes.Scenes.AddScene, function(sceneName) {
				model.addScene(sceneName);
			});			
			lstWgt.addListener(editor.EventTypes.Scenes.EditScene, function(scene) {
				model.setScene(scene);
			});			
			lstWgt.addListener(editor.EventTypes.Scenes.RemoveScene, function(scene) {
				model.removeScene(scene);
			});			
			lstWgt.addListener(editor.EventTypes.Scenes.ReorderScene, function(scnObj) {
				model.reorderScenes(scnObj.scene, scnObj.prev, scnObj.next);
			});			
			lstWgt.addListener(editor.EventTypes.Scenes.UpdateScene, function(scnObj) {
				model.updateScene(scnObj.name);
			});
			
			// model specific
			model.addListener(editor.events.Created, function(scene) {
				lstWgt.add(scene);
			});		
			model.addListener(editor.events.Updated, function(scene) {
				lstWgt.update(scene);
			});		
			model.addListener(editor.events.Removed, function(scene) {
				lstWgt.remove(scene);
			});
	    }
	});
    
})();
