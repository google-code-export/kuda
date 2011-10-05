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

	var shorthand = editor.tools.scenes = editor.tools.scenes || {};

	shorthand.init = function() {
		var navPane = editor.ui.getNavPane('Behaviors'),
			scnMdl = new ScenesModel(),
			scnView = new ScenesView(),
			scnCtr = new ScenesController();
		
		scnCtr.setModel(scnMdl);
		scnCtr.setView(scnView);
		
		navPane.add(scnView);
	};

////////////////////////////////////////////////////////////////////////////////
//								Tool Definition								  //
////////////////////////////////////////////////////////////////////////////////
	
	shorthand.events = {
		// scene list widget specific
	    ReorderScene: "scenes.ReorderScene",
	    SaveScene: "scenes.SaveScene"
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
	    
	    removeScene: function(scene) {
			if (this.lastScene === scene) {
				this.lastScene = scene.prev;
			}
			if (this.editScene === scene) {
				this.setScene(null);
			}
			
			this.notifyListeners(editor.events.Removing, scene);
			scene.cleanup();
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
			this.notifyListeners(editor.events.Editing, scene);
		},
		
		saveScene: function(sceneName) {
			if (this.editScene) {
				this.editScene.name = sceneName;
				this.notifyListeners(editor.events.Updated, this.editScene);
				this.editScene = null;
			} else {
				var scene = new hemi.scene.Scene();
				scene.name = sceneName;
				
				if (this.lastScene) {
					this.lastScene.next = scene;
					scene.prev = this.lastScene;
				}
				
				this.lastScene = scene;
				this.notifyListeners(editor.events.Created, scene);
			}
		},
	    
	    worldCleaned: function() {
			var scenes = hemi.world.getScenes();
			
			for (var i = 0, il = scenes.length; i < il; i++) {
				this.notifyListeners(editor.events.Removing, scenes[i]);
			}
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
		SAVE_TXT = "Save Scene";
	
	var ListWidget = editor.ui.ListWidget.extend({
		init: function() {
		    this._super({
				name: 'scnListWidget',
				listId: 'sceneList',
				prefix: 'scnLst',
				title: 'Scenes',
				instructions: "Type in a name and click 'Add Scene' to add a new scene.  Click and drag a scene to reorder it in the list",
				type: editor.ui.ListType.ORDERED,
				sortable: true,
				height: editor.ui.Height.FULL
			});
		},
		
		finishLayout: function() {
			this._super();		
			var wgt = this;	
			
			this.list.getUI().bind('sortupdate', function(evt, ui) {
				var elem = ui.item,
					scene = elem.children('div').data('obj'),
					prev = elem.prev().children('div').data('obj'),
					next = elem.next().children('div').data('obj');
				
				wgt.notifyListeners(shorthand.events.ReorderScene, {
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
			this.addBtn = jQuery('<button id="scnCreate" class="inlineBtn">Add Scene</button>');
			var wgt = this;
			
			this.addBtn.bind('click', function(evt) {
				var btn = jQuery(this),
					name = wgt.nameInput.val();
					
				wgt.notifyListeners(shorthand.events.SaveScene, name);
				wgt.nameInput.val('').removeClass('save');
				btn.attr('disabled', 'disabled').text(ADD_TXT);
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
			});
			
			return this.form;
		},
		
		set: function(scene) {
			if (scene) {
				this.nameInput.val(scene.name).addClass('save');
				this.addBtn.text(SAVE_TXT).removeAttr('disabled');
			} else {
				this.nameInput.val('').removeClass('save');
				this.addBtn.text(ADD_TXT).attr('disabled', 'disabled');
			}
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
			lstWgt.addListener(editor.events.Edit, function(scene) {
				model.setScene(scene);
			});			
			lstWgt.addListener(editor.events.Remove, function(scene) {
				model.removeScene(scene);
			});			
			lstWgt.addListener(shorthand.events.ReorderScene, function(scnObj) {
				model.reorderScenes(scnObj.scene, scnObj.prev, scnObj.next);
			});			
			lstWgt.addListener(shorthand.events.SaveScene, function(name) {
				model.saveScene(name);
			});
			
			// model specific
			model.addListener(editor.events.Created, function(scene) {
				lstWgt.add(scene);
			});
			model.addListener(editor.events.Editing, function(scene) {
				lstWgt.set(scene);
			});
			model.addListener(editor.events.Updated, function(scene) {
				lstWgt.update(scene);
			});
			model.addListener(editor.events.Removing, function(scene) {
				lstWgt.remove(scene);
			});
	    }
	});
    
////////////////////////////////////////////////////////////////////////////////
//                     			  	Extra Scripts  		                      //
////////////////////////////////////////////////////////////////////////////////

	editor.getCss('js/editor/plugins/scenes/css/style.css');
})();
