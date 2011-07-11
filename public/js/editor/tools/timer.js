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
    
    module.EventTypes = module.EventTypes || {};
	
	// model specific
	module.EventTypes.TimerCreated = 'timer.created';
	module.EventTypes.TimerRemoved = 'timer.removed';
	module.EventTypes.TimerSet = 'timer.set';
	module.EventTypes.TimerUpdated = 'timer.updated';
	
	// view specific
	
	// create timer sidebar widget specific
	module.EventTypes.CreateTimer = 'timer.create';
	module.EventTypes.UpdateTimer = 'timer.update';
	
	// timer list sidebar widget specific
	module.EventTypes.EditTimer = 'timer.edit';
	module.EventTypes.NewTimer = 'timer.new';
	module.EventTypes.RemoveTimer = 'timer.remove';
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * An TimerModel handles the creation, updating, and removal of 
     * Timer
     */
    module.tools.TimersModel = module.tools.ToolModel.extend({
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
			this.notifyListeners(module.EventTypes.TimerSet, timer);
		},
		
		remove: function(timer) {
			timer.cleanup();
			this.notifyListeners(module.EventTypes.TimerRemoved, timer);
		},
		
		reset: function() {
			this.currentTimer = null;
			this.isUpdate = false;
		},
		
		save: function(name, startTime) {
			this.create();
			
			var msgType = this.isUpdate ? module.EventTypes.TimerUpdated : 
				module.EventTypes.TimerCreated;
				
			this.currentTimer.name = name;
			this.currentTimer.startTime = startTime;
			
			this.notifyListeners(msgType, this.currentTimer);
			
			this.reset();
		},
			
		worldCleaned: function() {
			this.notifyListeners(module.EventTypes.WorldCleaned, null);
	    },
	    
	    worldLoaded: function() {
			var timers = hemi.world.getTimers();
			
			for (var ndx = 0, len = timers.length; ndx < len; ndx++) {
				this.notifyListeners(module.EventTypes.TimerCreated, timers[ndx]);
			}
	    }
	});
   	
////////////////////////////////////////////////////////////////////////////////
//                     	   Create Timer Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
		
	/*
	 * Configuration object for the CreatTmrSBWidget.
	 */
	module.tools.CreateTmrSBWidgetDefaults = {
		name: 'createTimerSBWidget',
		uiFile: 'js/editor/tools/html/timersForms.htm',
		manualVisible: true
	};
	
	module.tools.CreatTmrSBWidget = module.ui.FormSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.CreateTmrSBWidgetDefaults, options);
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
			
			var validator = module.ui.createDefaultValidator(),
				wgt = this;
			
			this.form.submit(function() { return false; });
			
			this.form.find('input[type="text"]').bind('keyup', function() {
				wgt.checkSaveButton();
			});
			
			this.saveBtn.bind('click', function() {
				var data = {
						startTime: parseInt(wgt.startTimeIpt.val()),
						name: wgt.nameIpt.val()
					},
					msgType = wgt.isUpdate ? module.EventTypes.UpdateTimer : 
						module.EventTypes.CreateTimer;
					
				wgt.notifyListeners(msgType, data); 
			});
			
			this.cancelBtn.bind('click', function() {
				wgt.notifyListeners(module.EventTypes.Cancel);
			});
			
			validator.setElements(this.startTimeIpt);
			
			this.addInputsToCheck(this.startTimeIpt);
			this.addInputsToCheck(this.nameIpt);
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
	module.tools.TmrListSBWidgetDefaults = {
		name: 'timerListSBWidget',
		listId: 'timerList',
		prefix: 'tmrLst',
		title: 'Timer',
		instructions: "Click 'Create Timer' to create a new timer."
	};
	
	module.tools.TmrListSBWidget = module.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.TmrListSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.items = new Hashtable();		
		},
		
		layoutExtra: function() {
			this.buttonDiv = jQuery('<div class="buttons"></div>');
			this.createBtn = jQuery('<button id="createTimer">Create Timer</button>');
			var wgt = this;
						
			this.createBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.NewTimer, null);
			});
			
			this.buttonDiv.append(this.createBtn);
			
			return this.buttonDiv;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var timer = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.EditTimer, timer);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var timer = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.RemoveTimer, timer);
			});
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
    module.tools.TimersViewDefaults = {
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
    module.tools.TimersView = module.tools.ToolView.extend({
		init: function(options) {
	        var newOpts = jQuery.extend({}, module.tools.TimersViewDefaults, options);
	        this._super(newOpts);
			
			this.addSidebarWidget(new module.tools.CreatTmrSBWidget());
			this.addSidebarWidget(new module.tools.TmrListSBWidget());
	    }
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The TimerController facilitates TimerModel and TimerView
     * communication by binding event and message handlers.
     */
    module.tools.TimersController = module.tools.ToolController.extend({
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
	        	that = this;
	                	        
			// special listener for when the toolbar button is clicked
	        view.addListener(module.EventTypes.ToolModeSet, function(value) {
	            var isDown = value.newMode === module.tools.ToolConstants.MODE_DOWN;
	        });
			
			// create widget specific
			crtWgt.addListener(module.EventTypes.Cancel, function() {
				crtWgt.setVisible(false);
				lstWgt.setVisible(true);
			});
			crtWgt.addListener(module.EventTypes.CreateTimer, function(data) {
				model.save(data.name, data.startTime);
			});
			crtWgt.addListener(module.EventTypes.UpdateTimer, function(data) {
				model.save(data.name, data.startTime);
			});
			
			// list widget specific
			lstWgt.addListener(module.EventTypes.EditTimer, function(timer) {
				model.edit(timer);
			});
			lstWgt.addListener(module.EventTypes.RemoveTimer, function(timer) {
				model.remove(timer);
			});
			lstWgt.addListener(module.EventTypes.NewTimer, function(data) {
				crtWgt.reset();
				crtWgt.setVisible(true);
				lstWgt.setVisible(false);
			});
			
			// model specific
			model.addListener(module.EventTypes.TimerCreated, function(timer) {
				lstWgt.add(timer);
				crtWgt.setVisible(false);
				lstWgt.setVisible(true);
			});
			model.addListener(module.EventTypes.TimerRemoved, function(timer) {
				lstWgt.remove(timer);
			});
			model.addListener(module.EventTypes.TimerSet, function(timer) {
				crtWgt.edit(timer);
				crtWgt.setVisible(true);
				lstWgt.setVisible(false);
			});
			model.addListener(module.EventTypes.TimerUpdated, function(timer) {
				lstWgt.update(timer);
				crtWgt.setVisible(false);
				lstWgt.setVisible(true);
			});
	    }
	});
    
    return module;
})(editor || {});