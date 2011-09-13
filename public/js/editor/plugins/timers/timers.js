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

	editor.tools.timers = editor.tools.timers || {};

	editor.tools.timers.init = function() {
		var tabpane = editor.ui.getTabPane('Behaviors'),
			tmrMdl = new TimersModel(),
			tmrView = new TimersView(),
			tmrCtr = new TimersController();
		
		tmrCtr.setModel(tmrMdl);
		tmrCtr.setView(tmrView);
		
		tabpane.toolbar.add(tmrView);
	};

////////////////////////////////////////////////////////////////////////////////
//								Tool Definition								  //
////////////////////////////////////////////////////////////////////////////////
    
    editor.EventTypes = editor.EventTypes || {};
	
	// model specific
	editor.EventTypes.TimerSet = 'timer.set';
	
	// view specific
	
	// create timer sidebar widget specific
	editor.EventTypes.SaveTimer = 'timer.save';
	
	// timer list sidebar widget specific
	editor.EventTypes.EditTimer = 'timer.edit';
	editor.EventTypes.RemoveTimer = 'timer.remove';
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * An TimerModel handles the creation, updating, and removal of 
     * Timer
     */
    var TimersModel = editor.ToolModel.extend({
		init: function() {
			this._super('timers');
			
			this.currentTimer = null;
	    },
		
		create: function() {
			if (!this.currentTimer) {
				this.currentTimer = new hemi.time.Timer();
			}
		},
		
		edit: function(timer) {
			this.currentTimer = timer;
			this.notifyListeners(editor.EventTypes.TimerSet, timer);
		},
		
		remove: function(timer) {
			timer.cleanup();
			this.notifyListeners(editor.events.Removed, timer);
		},
		
		save: function(name, startTime) {
			var msgType = this.currentTimer ? editor.events.Updated : 
				editor.events.Created;
			
			this.create();
			this.currentTimer.name = name;
			this.currentTimer.startTime = startTime;
			
			this.notifyListeners(msgType, this.currentTimer);
			this.currentTimer = null;
		},
			
		worldCleaned: function() {
			var timers = hemi.world.getTimers();
			
			for (var ndx = 0, len = timers.length; ndx < len; ndx++) {
				this.notifyListeners(editor.events.Removed, timers[ndx]);
			}
	    },
	    
	    worldLoaded: function() {
			var timers = hemi.world.getTimers();
			
			for (var ndx = 0, len = timers.length; ndx < len; ndx++) {
				this.notifyListeners(editor.events.Created, timers[ndx]);
			}
	    }
	});
   	
////////////////////////////////////////////////////////////////////////////////
//                     	   Create Timer Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
		
	var CreateWidget = editor.ui.FormWidget.extend({
		init: function() {
			this._super({
				name: 'createTimerWidget',
				uiFile: 'js/editor/plugins/timers/html/timersForms.htm',
				manualVisible: true
			});
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
			var validator = editor.ui.createDefaultValidator(),
				wgt = this;
			
			this.form = this.find('form');
			this.saveBtn = this.find('#tmrSaveBtn');
			this.cancelBtn = this.find('#tmrCancelBtn');
			this.nameIpt = new editor.ui.Input({
				container: wgt.find('#tmrName'),
				type: 'string'
			});
			this.startTimeIpt = new editor.ui.Input({
				container: wgt.find('#tmrStartTime'),
				validator: validator
			});
			
			this.form.submit(function() { return false; });
			
			this.form.find('input[type="text"]').bind('keyup', function() {
				wgt.checkSaveButton();
			});
			
			this.saveBtn.bind('click', function() {
				var data = {
						startTime: wgt.startTimeIpt.getValue(),
						name: wgt.nameIpt.getValue()
					};
				
				wgt.reset();
				wgt.notifyListeners(editor.EventTypes.SaveTimer, data); 
			});
			
			this.cancelBtn.bind('click', function() {
				wgt.reset();
				wgt.notifyListeners(editor.EventTypes.EditTimer, null);
			});
			
			this.addInputsToCheck(this.startTimeIpt);
			this.addInputsToCheck(this.nameIpt);
			
			this._super();
			editor.ui.sizeAndPosition.call(this);
		},
		
		edit: function(timer) {
			this.startTimeIpt.setValue(timer.startTime);
			this.nameIpt.setValue(timer.name);
			this.checkSaveButton();
		},
		
		reset: function() {
			this.startTimeIpt.reset();
			this.nameIpt.reset();
			this.checkSaveButton();
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	 	Timer List Sidebar Widget                        //
////////////////////////////////////////////////////////////////////////////////     
	
	var ListWidget = editor.ui.ListWidget.extend({
		init: function() {
		    this._super({
				name: 'timerListWidget',
				listId: 'timerList',
				prefix: 'tmrLst',
				title: 'Timers',
				instructions: 'Add timers above.'
			});
			
		    editor.ui.sizeAndPosition.call(this);
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
		
		getOtherHeights: function() {
			return this.buttonDiv.outerHeight(true);
		}
	});
         
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    

    /**
     * The TimersView controls the dialog and toolbar widget for the 
     * animation tool.
     */
    var TimersView = editor.ToolView.extend({
		init: function() {
	        this._super({
	            toolName: 'Timers',
	    		toolTip: 'Create and edit timers',
	    		elemId: 'timersBtn',
	    		id: 'timers'
	        });
	        
	        this.addPanel(new editor.ui.Panel({
				name: 'sidePanel',
				classes: ['tmrSidePanel']
			}));
			
			this.sidePanel.addWidget(new CreateWidget());
			this.sidePanel.addWidget(new ListWidget());
	    }
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The TimerController facilitates TimerModel and TimerView
     * communication by binding event and message handlers.
     */
    var TimersController = editor.ToolController.extend({
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
				crtWgt = view.sidePanel.createTimerWidget,
				lstWgt = view.sidePanel.timerListWidget;
			
			// create widget specific
			crtWgt.addListener(editor.EventTypes.SaveTimer, function(data) {
				model.save(data.name, data.startTime);
			});
			
			// list widget specific
			lstWgt.addListener(editor.EventTypes.EditTimer, function(timer) {
				model.edit(timer);
			});
			lstWgt.addListener(editor.EventTypes.RemoveTimer, function(timer) {
				model.remove(timer);
			});
			
			// model specific
			model.addListener(editor.events.Created, function(timer) {
				lstWgt.add(timer);
			});
			model.addListener(editor.events.Removed, function(timer) {
				lstWgt.remove(timer);
			});
			model.addListener(editor.EventTypes.TimerSet, function(timer) {
				crtWgt.edit(timer);
			});
			model.addListener(editor.events.Updated, function(timer) {
				lstWgt.update(timer);
			});
	    }
	});
    
})();