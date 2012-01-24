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

////////////////////////////////////////////////////////////////////////////////////////////////////
//											  Initialization									  //
////////////////////////////////////////////////////////////////////////////////////////////////////

	var shorthand = editor.tools.timers;

	shorthand.init = function() {
		var navPane = editor.ui.getNavPane('Behaviors'),
			tmrMdl = new TimersModel(),
			tmrView = new TimersView(),
			tmrCtr = new TimersController();
		
		tmrCtr.setModel(tmrMdl);
		tmrCtr.setView(tmrView);
		
		navPane.add(tmrView);
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
//											  Tool Definition									  //
////////////////////////////////////////////////////////////////////////////////////////////////////
    
	shorthand.events = {
		// create timer widget specific
		SaveTimer: 'timer.save'
	};
    
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                   			   Model		                                  //
////////////////////////////////////////////////////////////////////////////////////////////////////
    
    /**
     * An TimerModel handles the creation, updating, and removal of 
     * Timer
     */
    var TimersModel = function() {
		editor.ToolModel.call(this, 'timers');
		
		this.currentTimer = null;
    };
		
	TimersModel.prototype = new editor.ToolModel();
	TimersModel.prototype.constructor = TimersModel;
		
	TimersModel.prototype.create = function() {
		if (!this.currentTimer) {
			this.currentTimer = new hemi.Timer();
		}
	};
	
	TimersModel.prototype.edit = function(timer) {
		this.currentTimer = timer;
		if (timer != null) {
			this.notifyListeners(editor.events.Editing, timer);
		}
	};
	
	TimersModel.prototype.remove = function(timer) {
		timer.cleanup();
		this.notifyListeners(editor.events.Removing, timer);
	};
	
	TimersModel.prototype.save = function(name, startTime) {
		var msgType = this.currentTimer ? editor.events.Updated : 
			editor.events.Created;
		
		this.create();
		this.currentTimer.name = name;
		this.currentTimer.startTime = startTime;
		
		this.notifyListeners(msgType, this.currentTimer);
		this.currentTimer = null;
	};
		
	TimersModel.prototype.worldCleaned = function() {
		var timers = hemi.world.getTimers();
		
		for (var ndx = 0, len = timers.length; ndx < len; ndx++) {
			this.notifyListeners(editor.events.Removing, timers[ndx]);
		}
    };
    
    TimersModel.prototype.worldLoaded = function() {
		var timers = hemi.world.getTimers();
		
		for (var ndx = 0, len = timers.length; ndx < len; ndx++) {
			this.notifyListeners(editor.events.Created, timers[ndx]);
		}
    };
   	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                     	   				Create Timer Sidebar Widget      		                  //
////////////////////////////////////////////////////////////////////////////////////////////////////
		
	var CreateWidget = function() {
		editor.ui.FormWidget.call(this, {
			name: 'createTimerWidget',
			uiFile: 'js/editor/plugins/timers/html/timersForms.htm',
			manualVisible: true
		});
	};
	var crtWgtSuper = editor.ui.FormWidget.prototype;
		
	CreateWidget.prototype = new editor.ui.FormWidget();
	CreateWidget.prototype.constructor = CreateWidget;
		
	CreateWidget.prototype.checkSaveButton = function() {
		var btn = this.saveBtn,
			saveable = this.checkSaveable();
		
		if (saveable) {
			btn.removeAttr('disabled');
		}
		else {
			btn.attr('disabled', 'disabled');
		}
	};
	
	CreateWidget.prototype.layout = function() {
		crtWgtSuper.layout.call(this);
		
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
			wgt.notifyListeners(shorthand.events.SaveTimer, data); 
		});
		
		this.cancelBtn.bind('click', function() {
			wgt.reset();
			wgt.notifyListeners(editor.events.Edit, null);
		});
		
		this.addInputsToCheck(this.startTimeIpt);
		this.addInputsToCheck(this.nameIpt);
	};
	
	CreateWidget.prototype.edit = function(timer) {
		this.startTimeIpt.setValue(timer.startTime);
		this.nameIpt.setValue(timer.name);
		this.checkSaveButton();
	};
	
	CreateWidget.prototype.reset = function() {
		this.startTimeIpt.reset();
		this.nameIpt.reset();
		this.checkSaveButton();
	};
         
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                   			  View	                                		  //
////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * The TimersView controls the dialog and toolbar widget for the 
     * animation tool.
     */
    var TimersView = function() {
        editor.ToolView.call(this, {
            toolName: 'Timers',
    		toolTip: 'Create and edit timers',
    		id: 'timers'
        });
        
        this.addPanel(new editor.ui.Panel({
			name: 'sidePanel',
			classes: ['tmrSidePanel']
		}));
		
		this.sidePanel.addWidget(new CreateWidget());
		this.sidePanel.addWidget(new editor.ui.ListWidget({
			name: 'timerListWidget',
			listId: 'timerList',
			prefix: 'tmrLst',
			title: 'Timers',
			instructions: 'Add timers above.'
		}));
    };
	
	TimersView.prototype = new editor.ToolView();
	TimersView.prototype.constructor = TimersView;
    
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                				Controller		                                  //
////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * The TimerController facilitates TimerModel and TimerView
     * communication by binding event and message handlers.
     */
    var TimersController = function() {
		editor.ToolController.call(this);
	};
	var tmrCtrSuper = editor.ToolController.prototype;
		
	TimersController.prototype = new editor.ToolController();
	TimersController.prototype.constructor = TimersController;
	    
    /**
     * Binds event and message handlers to the view and model this object 
     * references.  
     */
    TimersController.prototype.bindEvents = function() {
        tmrCtrSuper.bindEvents.call(this);
        
        var model = this.model,
        	view = this.view,
			crtWgt = view.sidePanel.createTimerWidget,
			lstWgt = view.sidePanel.timerListWidget;
		
		// create widget specific
		crtWgt.addListener(editor.events.Edit, function(timer) {
			model.edit(timer);
		});
		crtWgt.addListener(shorthand.events.SaveTimer, function(data) {
			model.save(data.name, data.startTime);
		});
		
		// list widget specific
		lstWgt.addListener(editor.events.Edit, function(timer) {
			model.edit(timer);
		});
		lstWgt.addListener(editor.events.Remove, function(timer) {
			model.remove(timer);
		});
		
		// model specific
		model.addListener(editor.events.Created, function(timer) {
			lstWgt.add(timer);
		});
		model.addListener(editor.events.Editing, function(timer) {
			crtWgt.edit(timer);
		});
		model.addListener(editor.events.Removing, function(timer) {
			lstWgt.remove(timer);
		});
		model.addListener(editor.events.Updated, function(timer) {
			lstWgt.update(timer);
		});
    };
    
})();