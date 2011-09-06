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

var editor = (function(editor) {
    editor.tools = editor.tools || {};
    
    editor.EventTypes = editor.EventTypes || {};
	
	// model specific
	editor.EventTypes.TimerCreated = 'timer.created';
	editor.EventTypes.TimerRemoved = 'timer.removed';
	editor.EventTypes.TimerSet = 'timer.set';
	editor.EventTypes.TimerUpdated = 'timer.updated';
	
	// view specific
	
	// create timer sidebar widget specific
	editor.EventTypes.SaveTimer = 'timer.save';
	
	// timer list sidebar widget specific
	editor.EventTypes.EditTimer = 'timer.edit';
	editor.EventTypes.NewTimer = 'timer.new';
	editor.EventTypes.RemoveTimer = 'timer.remove';
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * An TimerModel handles the creation, updating, and removal of 
     * Timer
     */
    editor.tools.TimersModel = editor.tools.ToolModel.extend({
		init: function() {
			this._super();
			
			this.currentTimer = null;
	    },
		
		create: function() {
			if (!this.currentTimer) {
				this.currentTimer = new hemi.time.Timer();
			}
		},
		
		edit: function(timer) {
			this.currentTimer = timer;
			this.isUpdate = true;
			this.notifyListeners(editor.EventTypes.TimerSet, timer);
		},
		
		remove: function(timer) {
			timer.cleanup();
			this.notifyListeners(editor.EventTypes.TimerRemoved, timer);
		},
		
		reset: function() {
			this.currentTimer = null;
			this.isUpdate = false;
		},
		
		save: function(name, startTime) {
			this.create();
			
			var msgType = this.isUpdate ? editor.EventTypes.TimerUpdated : 
				editor.EventTypes.TimerCreated;
				
			this.currentTimer.name = name;
			this.currentTimer.startTime = startTime;
			
			this.notifyListeners(msgType, this.currentTimer);
			
			this.reset();
		},
			
		worldCleaned: function() {
			var timers = hemi.world.getTimers();
			
			for (var ndx = 0, len = timers.length; ndx < len; ndx++) {
				this.notifyListeners(editor.EventTypes.TimerRemoved, timers[ndx]);
			}
	    },
	    
	    worldLoaded: function() {
			var timers = hemi.world.getTimers();
			
			for (var ndx = 0, len = timers.length; ndx < len; ndx++) {
				this.notifyListeners(editor.EventTypes.TimerCreated, timers[ndx]);
			}
	    }
	});
   	
////////////////////////////////////////////////////////////////////////////////
//                     	   Create Timer Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
		
	/*
	 * Configuration object for the CreatTmrSBWidget.
	 */
	editor.tools.CreateTmrSBWidgetDefaults = {
		name: 'createTimerSBWidget',
		uiFile: 'js/editor/tools/html/timersForms.htm',
		manualVisible: true
	};
	
	editor.tools.CreatTmrSBWidget = editor.ui.FormSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				editor.tools.CreateTmrSBWidgetDefaults, options);
		    this._super(newOpts);
		},
		
		checkSaveButton: function() {
			var btn = this.saveBtn,
				saveable = this.checkSaveable();
			
			if (saveable) {
				btn.removeAttr('disabled');
			}
			else {
				btn.attr('disabled', 'disabled');
			}
		},
		
		finishLayout: function() {
			this.form = this.find('form');
			this.saveBtn = this.find('#tmrSaveBtn');
			this.cancelBtn = this.find('#tmrCancelBtn');
			this.nameIpt = this.find('#tmrName');
			this.startTimeIpt = this.find('#tmrStartTime');
			
			var validator = editor.ui.createDefaultValidator(),
				wgt = this;
			
			this.form.submit(function() { return false; });
			
			this.form.find('input[type="text"]').bind('keyup', function() {
				wgt.checkSaveButton();
			});
			
			this.saveBtn.bind('click', function() {
				var data = {
						startTime: parseInt(wgt.startTimeIpt.val()),
						name: wgt.nameIpt.val()
					};
					
				wgt.notifyListeners(editor.EventTypes.SaveTimer, data); 
			});
			
			this.cancelBtn.bind('click', function() {
				wgt.notifyListeners(editor.events.Cancel);
			});
			
			validator.setElements(this.startTimeIpt);
			
			this.addInputsToCheck(this.startTimeIpt);
			this.addInputsToCheck(this.nameIpt);
			
			this._super();
		},
		
		edit: function(timer) {
			this.reset();
			this.startTimeIpt.val(timer.startTime);
			this.nameIpt.val(timer.name);
			this.isUpdate = true;
			this.checkSaveButton();
		},
		
		reset: function() {
			this.startTimeIpt.val('');
			this.nameIpt.val('');
			this.isUpdate = false;
			this.checkSaveButton();
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	 	Timer List Sidebar Widget                        //
////////////////////////////////////////////////////////////////////////////////     
	
	/*
	 * Configuration object for the TmrListSBWidget.
	 */
	editor.tools.TmrListSBWidgetDefaults = {
		name: 'timerListSBWidget',
		listId: 'timerList',
		prefix: 'tmrLst',
		title: 'Timer',
		instructions: "Click 'Create Timer' to create a new timer."
	};
	
	editor.tools.TmrListSBWidget = editor.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, editor.tools.TmrListSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.items = new Hashtable();		
		},
		
		layoutExtra: function() {
			this.buttonDiv = jQuery('<div class="buttons"></div>');
			this.createBtn = jQuery('<button id="createTimer">Create Timer</button>');
			var wgt = this;
						
			this.createBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.EventTypes.NewTimer, null);
			});
			
			this.buttonDiv.append(this.createBtn);
			
			return this.buttonDiv;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var timer = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.EditTimer, timer);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var timer = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.RemoveTimer, timer);
			});
		},
		
		createListItemWidget: function() {
			return new editor.ui.BhvListItemWidget();
		},
		
		getOtherHeights: function() {
			return this.buttonDiv.outerHeight(true);
		}
	});
         
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    

    /*
     * Configuration object for the TimerView.
     */
    editor.tools.TimersViewDefaults = {
        toolName: 'Timer',
		toolTip: 'Timer: Create and edit timers',
		widgetId: 'timersBtn',
		axnBarId: 'tmrActionBar'
    };
    
    /**
     * The TimerView controls the dialog and toolbar widget for the 
     * animation tool.
     * 
     * @param {Object} options configuration options.  Uses 
     *         editor.tools.TimerViewDefaults as default options
     */
    editor.tools.TimersView = editor.tools.ToolView.extend({
		init: function(options) {
	        var newOpts = jQuery.extend({}, editor.tools.TimersViewDefaults, options);
	        this._super(newOpts);
			
			this.addSidebarWidget(new editor.tools.CreatTmrSBWidget());
			this.addSidebarWidget(new editor.tools.TmrListSBWidget());
			this.addSidebarWidget(editor.ui.getBehaviorWidget());
	    }
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The TimerController facilitates TimerModel and TimerView
     * communication by binding event and message handlers.
     */
    editor.tools.TimersController = editor.tools.ToolController.extend({
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
				crtWgt = view.createTimerSBWidget,
				lstWgt = view.timerListSBWidget,
				bhvWgt = view.behaviorSBWidget;
			
			// create widget specific
			crtWgt.addListener(editor.events.Cancel, function() {
				crtWgt.setVisible(false);
				lstWgt.setVisible(true);
			});
			crtWgt.addListener(editor.EventTypes.SaveTimer, function(data) {
				crtWgt.setVisible(false);
				lstWgt.setVisible(true);
				
				model.save(data.name, data.startTime);
			});
			
			// list widget specific
			lstWgt.addListener(editor.EventTypes.EditTimer, function(timer) {
				crtWgt.setVisible(true);
				lstWgt.setVisible(false);
				
				model.edit(timer);
			});
			lstWgt.addListener(editor.EventTypes.RemoveTimer, function(timer) {
				model.remove(timer);
			});
			lstWgt.addListener(editor.EventTypes.NewTimer, function(data) {
				crtWgt.reset();
				crtWgt.setVisible(true);
				lstWgt.setVisible(false);
			});
			
			// model specific
			model.addListener(editor.EventTypes.TimerCreated, function(timer) {
				lstWgt.add(timer);
			});
			model.addListener(editor.EventTypes.TimerRemoved, function(timer) {
				lstWgt.remove(timer);
			});
			model.addListener(editor.EventTypes.TimerSet, function(timer) {
				crtWgt.edit(timer);
			});
			model.addListener(editor.EventTypes.TimerUpdated, function(timer) {
				lstWgt.update(timer);
			});
			
			// behavior widget specific
			bhvWgt.addListener(editor.EventTypes.Sidebar.WidgetVisible, function(obj) {
				if (obj.updateMeta) {
					var isDown = view.mode === editor.tools.ToolConstants.MODE_DOWN;
					
					lstWgt.setVisible(!obj.visible && isDown);
				}
			});
	    }
	});
    
    return editor;
})(editor || {});