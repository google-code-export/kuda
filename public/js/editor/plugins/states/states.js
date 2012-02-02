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

	var shorthand = editor.tools.states;

	shorthand.init = function() {
		var navPane = editor.ui.getNavPane('Behaviors'),
			statesMdl = new StatesModel(),
			statesView = new StatesView(),
			statesCtr = new StatesController();
		
		statesCtr.setModel(statesMdl);
		statesCtr.setView(statesView);
		
		navPane.add(statesView);
	};

////////////////////////////////////////////////////////////////////////////////
//								Tool Definition								  //
////////////////////////////////////////////////////////////////////////////////
	
	shorthand.events = {
		// state list widget specific
		ReorderState: "states.ReorderState",
		SaveState: "states.SaveState"
	};
	
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
	var StatesModel = function() {
		editor.ToolModel.call(this,'states');
		this.lastState = null;
		this.editState = null;
	};
	
	StatesModel.prototype = new editor.ToolModel();
	StatesModel.prototype.constructor = StatesModel;
	
	StatesModel.prototype.removeState = function(state) {
		if (this.lastState === state) {
			this.lastState = state.prev;
		}
		
		if (this.editState === state) {
			this.setState(null);
		}
		
		this.notifyListeners(editor.events.Removing, state);
		state.cleanup();
	};
	
	StatesModel.prototype.reorderStates = function(state, previous, next) {
		var oldPrev = state.prev,
			oldNext = state.next;
		
		if (oldPrev) {
			oldPrev.next = oldNext;
		}
		if (oldNext) {
			oldNext.prev = oldPrev;
		}
		state.prev = previous;
		state.next = next;
		
		if (previous) {
			previous.next = state;
		}
		if (next) {
			next.prev = state;
		}
	};
	
	StatesModel.prototype.setState = function(state) {
		this.editState = state;
		this.notifyListeners(editor.events.Editing, state);
	};
	
	StatesModel.prototype.saveState = function(stateName) {
		if (this.editState) {
			this.editState.name = stateName;
			this.notifyListeners(editor.events.Updated, this.editState);
			this.editState = null;
		} else {
			var state = new hemi.State();
			state.name = stateName;
			
			if (this.lastState) {
				this.lastState.next = state;
				state.prev = this.lastState;
			}

			this.lastState = state;
			this.notifyListeners(editor.events.Created, state);
		}
	};
	
	StatesModel.prototype.worldCleaned = function() {
		var states = hemi.world.getStates();
			
		for (var i = 0, il = states.length; i < il; i++) {
			this.notifyListeners(editor.events.Removing, states[i]);
		}
	};
	
	StatesModel.prototype.worldLoaded = function() { 
		var states = hemi.world.getStates(),
			nextState = null;
		
		for (var ndx = 0, len = states.length; ndx < len; ndx++) {
			var state = states[ndx];
			
			if (state.prev === null) {
				nextState = state;
			}
			
			if (state.next === null) {
				this.lastState = state;
			}
		}
		
		while (nextState !== null) {
			this.notifyListeners(editor.events.Created, nextState);
			nextState = nextState.next;
		}    
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     	    States List Sidebar Widget                        //
////////////////////////////////////////////////////////////////////////////////     
	
	var ADD_TXT = "Add State",
		SAVE_TXT = "Save State";
	var StatesListWidget = function() {
		editor.ui.ListWidget.call(this, {
			name: 'stateListWidget',
			listId: 'stateList',
			prefix: 'stateLst',
			title: 'States',
			instructions: "Type in a name and click 'Add State' to add a new state.  Click and drag a state to reorder it in the list",
			type: editor.ui.ListType.ORDERED,
			sortable: true,
			height: editor.ui.Height.FULL
		});
	};
	
	var listWgtSuper = editor.ui.ListWidget.prototype;
	
	StatesListWidget.prototype = new editor.ui.ListWidget();
	StatesListWidget.prototype.constructor = StatesListWidget;
	
	StatesListWidget.prototype.layout = function() {
		listWgtSuper.layout.call(this);
		
		this.form = jQuery('<form method="post"></form>');
		this.nameInput = jQuery('<input type="text" id="stateName" />');
		this.addBtn = jQuery('<button id="stateCreate" class="inlineBtn">Add State</button>');
		
		this.form.append(this.nameInput).append(this.addBtn)
		.bind('submit', function(evt) {
			return false;
		});
		
		this.instructions.after(this.form);
		
		var wgt = this;	
		
		this.list.getUI().bind('sortupdate', function(evt, ui) {
			var elem = ui.item,
				state = elem.children('div').data('obj'),
				prev = elem.prev().children('div').data('obj'),
				next = elem.next().children('div').data('obj');
			
			wgt.notifyListeners(shorthand.events.ReorderState, {
				state: state,
				prev: prev ? prev : null,
				next: next ? next : null
			});
		});
		
		this.addBtn.bind('click', function(evt) {
			var btn = jQuery(this),
				name = wgt.nameInput.val();
				
			wgt.notifyListeners(shorthand.events.SaveState, name);
			wgt.nameInput.val('').removeClass('save');
			btn.attr('disabled', 'disabled').text(ADD_TXT);
		})
		.attr('disabled', 'disabled');
		
		this.nameInput.bind('keyup', function(evt) {
			var elem = jQuery(this);
			if (elem.val() !== '') {
				wgt.addBtn.removeAttr('disabled');
			} else {
				wgt.addBtn.attr('disabled', 'disabled');
			}
		});
	};
	
	StatesListWidget.prototype.set = function(state) {
		if (state) {
			this.nameInput.val(state.name).addClass('save');
			this.addBtn.text(SAVE_TXT).removeAttr('disabled');
		} else {
			this.nameInput.val('').removeClass('save');
			this.addBtn.text(ADD_TXT).attr('disabled', 'disabled');
		}    
	};
		
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    
	var StatesView = function() {
		editor.ToolView.call(this, {
				toolName: 'States',
				toolTip: 'Create and edit states',
				id: 'states'
		});
		
		this.addPanel(new editor.ui.Panel({
			name: 'sidePanel',
			classes: ['stateSidePanel']
		}));
			
		this.sidePanel.addWidget(new StatesListWidget());
	};
	StatesView.prototype = new editor.ToolView();
	StatesView.prototype.constructor = StatesView;
	
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

	/**
	 * The StatesController facilitates StatesModel and StatesView communication
	 * by binding event and message handlers.
	 */
	var StatesController = function() {
		editor.ToolController.call(this);
	};
	 
	var statesCtrSuper = editor.ToolController.prototype;
	
	StatesController.prototype = new editor.ToolController();
	StatesController.prototype.construtor = StatesController;
	
		/**
		 * Binds event and message handlers to the view and model this object 
		 * references.  
		 */
		 
	StatesController.prototype.bindEvents = function() {
		statesCtrSuper.bindEvents.call(this);
		
		var model = this.model,
			view = this.view,
			lstWgt = view.sidePanel.stateListWidget;
			
		// state list widget specific
		lstWgt.addListener(editor.events.Edit, function(state) {
			model.setState(state);
		});			
		lstWgt.addListener(editor.events.Remove, function(state) {
			model.removeState(state);
		});			
		lstWgt.addListener(shorthand.events.ReorderState, function(stateObj) {
			model.reorderStates(stateObj.state, stateObj.prev, stateObj.next);
		});			
		lstWgt.addListener(shorthand.events.SaveState, function(name) {
			model.saveState(name);
		});
		
		// model specific
		model.addListener(editor.events.Created, function(state) {
			lstWgt.add(state);
		});
		model.addListener(editor.events.Editing, function(state) {
			lstWgt.set(state);
		});
		model.addListener(editor.events.Updated, function(state) {
			lstWgt.update(state);
		});
		model.addListener(editor.events.Removing, function(state) {
			lstWgt.remove(state);
		});
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     			  	Extra Scripts  		                      //
////////////////////////////////////////////////////////////////////////////////

	editor.getCss('js/editor/plugins/states/css/style.css');
})();
