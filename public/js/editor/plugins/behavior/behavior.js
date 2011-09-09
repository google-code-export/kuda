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
//                     			   Helper Methods  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	var injectBehaviorWidget = function(view) {
		if (view.toolTitle.match(/Project|project/) != null) {
			return;
		}
		
		var panels = view.panels,
			done = false;
			
		for (var j = 0, jl = panels.length; j < jl && !done; j++) {
			var widgets = panels[j].widgets;
			
			for (var k = 0, kl = widgets.length; k < kl && !done; k++) {
				var widget = widgets[k];
				
				if (widget instanceof editor.ui.ListWidget) {
					var bhvWgt = shorthand.createBehaviorWidget();
					bhvWgt.addListener(editor.EventTypes.CreateBehavior, bhvMdl);
					bhvWgt.addListener(editor.EventTypes.UpdateBehavior, bhvMdl);
					
					// add the behavior widget
					view.sidePanel.addWidget(bhvWgt);
					
					// replace the createListItem method
					widget.behaviorWidget = bhvWgt;
					widget.createListItem = function() {
						return new shorthand.BhvListItem(this.behaviorWidget);
					};
					
					bhvWgt.parentPanel = view.sidePanel;
					bhvWgt.addListener(editor.events.WidgetVisible, function(obj) {
						var thisWgt = obj.widget,
							wgts = thisWgt.parentPanel.widgets;
						
						editor.ui.sizeAndPosition.call(bhvWgt);
						
						for (var ndx = 0, len = wgts.length; ndx < len; ndx++) {
							var wgt = wgts[ndx];
							
							if (wgt !== thisWgt) {
								wgt.setVisible(!obj.visible);
							}
						}
					});
					
					done = true;
				}
			}
		}
	};

////////////////////////////////////////////////////////////////////////////////
//                     			   Initialization  		                      //
////////////////////////////////////////////////////////////////////////////////

	editor.tools = editor.tools || {};
	var shorthand = editor.tools.behavior = editor.tools.behavior || {},
		bhvMdl = null;
	
	shorthand.init = function() {		
		var tabpane = editor.ui.getTabPane('Behaviors');

		var bhvView = new BehaviorView(),
			bhvCtr = new BehaviorController();
		
		bhvMdl = new BehaviorModel();
		bhvCtr.setModel(bhvMdl);
		bhvCtr.setView(bhvView);
		
		tabpane.toolbar.add(bhvView);
	};	
	
	editor.addListener(editor.events.DoneLoading, function() {	
		// grab all views
		var views = editor.getViews(),
			models = editor.getModels();
		
		// for each view, if there is a list widget, insert a behavior widget
		// and replace the createListItem() method in the list widget
		for (var i = 0, il = views.length; i < il; i++) {
			injectBehaviorWidget(views[i]);
		}
		
		for (var i = 0, il = models.length; i < il; i++) {
			var mdl = models[i];
			
			if (!(mdl instanceof BehaviorModel)) {
				shorthand.treeModel.listenTo(mdl);
			}
		}
		
		shorthand.treeModel.addCitizen(hemi.world.camera);	
		
		editor.addListener(editor.events.PluginAdded, function(name) {
			var view = editor.getView('editor.tools.' + name);
			injectBehaviorWidget(view);
		});
		editor.addListener(editor.events.PluginRemoved, function(name) {
			
		});
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     			  Tool Definition  		                      //
////////////////////////////////////////////////////////////////////////////////
    
    editor.ToolConstants = editor.ToolConstants || {};
	editor.ToolConstants.SHAPE_PICK = "ShapePick";
	editor.ToolConstants.CAM_MOVE = "CameraMove";
	
    editor.EventTypes = editor.EventTypes || {};
	editor.EventTypes.ArgumentSet = "messaging.ArgumentSet";
	editor.EventTypes.TriggerSet = "messaging.TriggerSet";
	editor.EventTypes.ActionSet = "messaging.ActionSet";
    editor.EventTypes.EditTarget = "messaging.view.EditTarget";
    editor.EventTypes.RemoveTarget = "messaging.eventList.RemoveTarget";
    editor.EventTypes.SaveTarget = "messaging.view.SaveTarget";
	editor.EventTypes.SelectTrigger = "messaging.SelectTrigger";
	editor.EventTypes.SelectAction = "messaging.SelectAction";
	editor.EventTypes.SelectTarget = "messaging.SelectTarget";
	editor.EventTypes.CloneTarget = "messaging.CloneTarget";

	editor.EventTypes.CreateBehavior = "messaging.CreateBehavior";
	editor.EventTypes.UpdateBehavior = "messaging.UpdateBehavior";
	
	var TRIGGER_WRAPPER = '#causeTreeWrapper',
		ACTION_WRAPPER = '#effectTreeWrapper';
	    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////


    /**
     * A BehaviorModel
     */
    var BehaviorModel = editor.ToolModel.extend({
		init: function() {
			this._super('editor.tools.behavior');
			
			this.dispatchProxy = editor.getDispatchProxy();
			this.msgTarget = null;
			this.source = null;
			this.type = null;
			this.handler = null;
			this.method = null;
			this.args = new Hashtable();
			
			this.autoCompleteList = [{
				label: hemi.dispatch.MSG_ARG + 'data.',
				value: hemi.dispatch.MSG_ARG + 'data.',
				desc: 'message data object'
			}];
	    },
		
		copyTarget: function(msgTarget) {
			var spec = this.dispatchProxy.getTargetSpec(msgTarget),
				isValueCheck = msgTarget.handler instanceof hemi.handlers.ValueCheck,
				source, type, handler, method, argList;
			
			if (isValueCheck) {
				type = msgTarget.handler.values[0];
				handler = msgTarget.handler.handler;
				method = msgTarget.handler.func;
				argList = msgTarget.handler.args;
				
				if (spec.src === hemi.world.WORLD_ID) {
					source = editor.treeData.createShapePickCitizen(msgTarget.handler.citizen);
				} else {
					source = editor.treeData.createCamMoveCitizen(hemi.world.camera);
				}
			} else {
				source = spec.src;
				type = spec.msg;
				handler = msgTarget.handler;
				method = msgTarget.func;
				argList = msgTarget.args;
			}
			
			this.setTrigger(source, type);
			this.setAction(handler, method);
			
			if (argList != null) {
				var meta = editor.data.getMetaData(),
					citType = handler.getCitizenType(),
					params = meta.getParameters(citType, method);
				
				if (!params) {
					// If the metadata is missing, try the old way to get the
					// parameter names. Unfortunately this won't work if Hemi
					// is minified.
					params = editor.utils.getFunctionParams(handler[method]);
				}
				
				for (var ndx = 0, len = params.length; ndx < len; ndx++) {
					this.setArgument(params[ndx], argList[ndx]);
				}
			}
		},
		
		notify: function(eventType, data) {
			var args = data.args || [],
				trigger = data.trigger,
				action = data.action;
			
			if (eventType === editor.EventTypes.UpdateBehavior) {
				if (data.target !== null) {
					this.copyTarget(data.target);
				}
				
				this.msgTarget = data.target;
			}
			
			this.setTrigger(trigger.citizen, trigger.type);
			this.setAction(action.handler, action.method);
			
			for (var ndx = 0, len = args.length; ndx < len; ndx++) {
				var arg = args[ndx];
				
				this.setArgument(arg.name, arg.value);
			}
			
			this.save(data.name, data.type, data.actor);
		},
		
		removeTarget: function(target) {
			if (this.msgTarget === target) {
				this.msgTarget = null;
			}

	        this.notifyListeners(editor.events.Removed, target);	
			this.dispatchProxy.removeTarget(target);
			
			if (target.handler instanceof hemi.handlers.ValueCheck) {
				target.handler.cleanup();
			}
		},
		
	    save: function(name, opt_type, opt_actor) {
			var values = this.args.values(),
				args = [],
				editId = null,
				newTarget;
			
			if (this.msgTarget !== null) {
				this.dispatchProxy.removeTarget(this.msgTarget);
				
				if (this.msgTarget.handler instanceof hemi.handlers.ValueCheck) {
					this.msgTarget.handler.cleanup();
					this.msgTarget.citizen = null;
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
					this.source.citizen,
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
				var src = this.source === editor.treeData.MSG_WILDCARD ? hemi.dispatch.WILDCARD 
						: this.source.getId(),
					type = this.type === editor.treeData.MSG_WILDCARD ? hemi.dispatch.WILDCARD 
						: this.type;
				
				newTarget = this.dispatchProxy.registerTarget(
		            src,
		            type,
		            this.handler,
		            this.method,
		            args);
			}
			
			newTarget.name = name;
			newTarget.type = opt_type;
			
			var data = {
				target: newTarget,
				actor: opt_actor
			};
			
			if (this.msgTarget !== null) {
				newTarget.dispatchId = this.msgTarget.dispatchId;
				this.notifyListeners(editor.events.Updated, data);
			} else {
				this.notifyListeners(editor.events.Created, data);
			}
			
			this.msgTarget = null;
			this.args.each(function(key, value) {
				value.value = null;
			});
		},
	    
	    setAction: function(handler, method) {
	    	if (handler === this.handler && method === this.method) {
				return;
			}
	    	
	    	this.handler = handler;
	        this.method = method;
			this.args.clear();
			
			if (method !== null) {
				var meta = editor.data.getMetaData(),
					citType = this.handler.getCitizenType(),
					params = meta.getParameters(citType, method);
				
				if (!params) {
					// If the metadata is missing, try the old way to get the
					// parameter names. Unfortunately this won't work if Hemi
					// is minified.
					params = editor.utils.getFunctionParams(this.handler[method]);
				}
				
				for (var ndx = 0, len = params.length; ndx < len; ndx++) {
					var param = params[ndx];
					
		            this.args.put(param, {
						ndx: ndx,
						value: null
					});
				}
			}
			
			this.notifyListeners(editor.EventTypes.ActionSet, {
				handler: this.handler,
				method: this.method
			});
	    },
		
		setArgument: function(argName, argValue) {
	        var arg = this.args.get(argName);
	        
	        if (arg != null) {
	            arg.value = argValue;
	        }
	        
//	        this.args.put(argName, arg);
			this.notifyListeners(editor.EventTypes.ArgumentSet, {
				name: argName,
				value: argValue
			});
		},
	    
	    setTrigger: function(source, type) {
			if (source === this.source && type === this.type) {
				return;
			}
	    	
	    	if (source === null || source.getId != null) {
				this.source = source;
			} else if (source === hemi.dispatch.WILDCARD || source === editor.treeData.MSG_WILDCARD) {
				this.source = editor.treeData.MSG_WILDCARD;
			} else {
				this.source = hemi.world.getCitizenById(source);
			}
			
			if (type === hemi.dispatch.WILDCARD || type === editor.treeData.MSG_WILDCARD) {
				this.type = editor.treeData.MSG_WILDCARD;
			} else {
				this.type = type;
			}
			
			this.notifyListeners(editor.EventTypes.TriggerSet, {
				source: this.source,
				message: this.type
			});
	    },
		
		worldCleaned: function() {
			var targets = this.dispatchProxy.getTargets();
			
			for (var ndx = 0, len = targets.length; ndx < len; ndx++) {
	            var target = targets[ndx];
	            this.notifyListeners(editor.events.Removed, target);
	        }
			
			this.dispatchProxy.cleanup();
			
			this.source = null;
			this.type = null;
			this.handler = null;
			this.method = null;
			this.args.clear();
			this.msgTarget = null;
	    },
		
		worldLoaded: function() {
			var targets = this.dispatchProxy.getTargets();
			
			for (var ndx = 0, len = targets.length; ndx < len; ndx++) {
				var target = targets[ndx];
				
				if (target.name.match(editor.ToolConstants.EDITOR_PREFIX) === null) {
					this.notifyListeners(editor.events.Created, {
						target: target
					});
				}
	        }
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                              Private Methods                               //
////////////////////////////////////////////////////////////////////////////////   
	
		
	var	getChainMessages = function(citizen, method) {
		var type = citizen.getCitizenType ? citizen.getCitizenType() : citizen.name,
			key = type + '_' + method,
			msgList = editor.treeData.chainTable.get(key),
			messages;
		
		if (citizen.parent != null) {
			messages = getChainMessages(citizen.parent, method);
		} else {
			messages = [];
		}
		
		if (msgList !== null) {
			messages = messages.concat(msgList);
		}
		
		return messages;
	};
	
////////////////////////////////////////////////////////////////////////////////
//                               Table Widget                                 //
////////////////////////////////////////////////////////////////////////////////

   	var TableWidget = editor.ui.Widget.extend({
		init: function() {
			this.behaviors = new Hashtable();
			
			this._super({
				name: 'behaviorTableWidget'
			});
		},
		
		add: function(msgTarget, spec) {
			var data = editor.tools.behavior.expandBehaviorData(msgTarget, spec),
				row = this.table.fnAddData([
					editor.tools.behavior.getTriggerName(data).join('.'),
					editor.tools.behavior.getActionName(data).join('.'),
					msgTarget.name,
					'<td> \
					<button class="editBtn">Edit</button>\
					<button class="chainBtn">Chain</button>\
					<button class="cloneBtn">Clone</button>\
					<button class="removeBtn">Remove</button>\
					</td>'
				]),
				tr = jQuery(this.table.fnGetNodes(row)),
				td = tr.find('td.editHead'),			
				msgs = getChainMessages(data.handler, data.method),
				wgt = this;
				
			tr.data('behavior', msgTarget);
			this.behaviors.put(msgTarget.dispatchId, tr[0]);
			
			td.find('.editBtn').bind('click', function(evt) {
				var bhv = tr.data('behavior');					
				wgt.notifyListeners(editor.EventTypes.SelectTarget, bhv);
			});
			
			if (msgs.length > 0) {
				td.find('.chainBtn').data('chainMsgs', msgs)
				.bind('click', function(evt) {
					var tr = jQuery(this).parents('tr'),
						target = tr.data('behavior'),
						handler = target.handler,
						messages = jQuery(this).data('chainMsgs');
					
					if (handler instanceof hemi.handlers.ValueCheck) {
						target = handler;
						handler = target.handler;
					}
					
					// special case
					if (target.func === 'moveToView') {
						handler = editor.treeData.createCamMoveCitizen(hemi.world.camera);
						messages = [parseInt(target.args[0].replace(
							hemi.dispatch.ID_ARG, ''))];
					}
					wgt.notifyListeners(editor.EventTypes.SelectTrigger, {
						source: handler,
						messages: messages
					});
				});
			} else {
				td.find('.chainBtn').attr('disabled', 'disabled');
			}
			
			td.find('.cloneBtn').bind('click', function(evt) {
				var tr = jQuery(this).parents('tr'),
					target = tr.data('behavior');
				
				wgt.notifyListeners(editor.EventTypes.CloneTarget, {
					target: target,
					name: 'Copy of ' + target.name
				});
				
			});
			td.find('.removeBtn').bind('click', function(evt) {
				var tr = jQuery(this).parents('tr'),
					target = tr.data('behavior');
					
				wgt.notifyListeners(editor.EventTypes.RemoveTarget, target);
			});
			
			this.invalidate();
		},
		
		finishLayout: function() {
			this._super();
			
			this.tableElem = jQuery('<table></table>');
			this.container.append(this.tableElem);
			
			this.table = this.tableElem.dataTable({
				'bAutoWidth': false,
				'aoColumns' : [
					{ 'sTitle': 'Trigger' },
					{ 'sTitle': 'Action' },
					{ 'sTitle': 'Behavior' },
					{ 
						'sTitle': '', 
						'sClass': 'editHead'
					}
				]
			});
		},
		
		remove: function(msgTarget) {
			var tr = this.behaviors.remove(msgTarget.dispatchId);
			this.table.fnDeleteRow(tr);
			
			this.invalidate();
		},
		
		update: function(msgTarget, spec) {
			var data = editor.tools.behavior.expandBehaviorData(msgTarget, spec),
				row = this.behaviors.get(msgTarget.dispatchId); 
				
			this.table.fnUpdate([
				editor.tools.behavior.getTriggerName(data).join('.'),
				editor.tools.behavior.getActionName(data).join('.'),
				msgTarget.name
			], row);
			
			this.invalidate();
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////   

	var BehaviorView = editor.ToolView.extend({
		init: function() {
			this._super({
				toolName: 'Behaviors',
				toolTip: 'Overview of behaviors',
				elemId: 'behaviorBtn',
				id: 'editor.tools.behavior'
			});
			
			this.addPanel(new editor.ui.Panel({
				location: editor.ui.Location.TOP,
				classes: ['bhvTopPanel', 'noSpecialButtons'],
				name: 'topPanel'
			}));
			this.addPanel(new editor.ui.Panel({
				location: editor.ui.Location.BOTTOM,
				classes: ['bhvBottomPanel'],
				name: 'bottomPanel'
			}));
						
			this.topPanel.addWidget(editor.tools.behavior.createBehaviorWidget());			
			this.bottomPanel.addWidget(new TableWidget());
			
			this.topPanel.behaviorWidget.setVisible(true);
		}
	});
	
	
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The BehaviorController facilitates BehaviorModel and BehaviorView
     * communication by binding event and message handlers.
     */
    var BehaviorController = editor.ToolController.extend({
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
				tblWgt = view.bottomPanel.behaviorTableWidget,
				bhvWgt = view.topPanel.behaviorWidget,
				controller = this;
			
			bhvWgt.addListener(editor.EventTypes.CreateBehavior, model);
			bhvWgt.addListener(editor.EventTypes.UpdateBehavior, model);
			
			// view specific
			tblWgt.addListener(editor.EventTypes.CloneTarget, function(data) {
				model.copyTarget(data.target);
				model.save(data.name);
			})
			tblWgt.addListener(editor.EventTypes.RemoveTarget, function(target) {
				model.removeTarget(target);
			});			
			tblWgt.addListener(editor.EventTypes.SelectTarget, function(target) {	
				var spec = model.dispatchProxy.getTargetSpec(target);
				
				bhvWgt.setTarget(target, spec);
			});
			tblWgt.addListener(editor.EventTypes.SelectTrigger, function(data) {
				bhvWgt.setTrigger(data.source, data.messages);
			});
			
			// model specific	
			model.addListener(editor.events.Created, function(data) {
				var target = data.target,
					spec = model.dispatchProxy.getTargetSpec(target),
					li = editor.tools.behavior.getBehaviorListItem(data.actor);
				
				tblWgt.add(target, spec);
					
				if (li) {
					li.add(target, spec, data.actor);
				}
				
				bhvWgt.setVisible(false);
			});			
			model.addListener(editor.events.Removed, function(target) {
				tblWgt.remove(target);
				
				var li = editor.tools.behavior.getBehaviorListItem(target.actor);
				
				if (li) {
					li.remove(target);
				}
			});			
			model.addListener(editor.events.Updated, function(data) {
				var target = data.target,
					spec = model.dispatchProxy.getTargetSpec(target),
					li = editor.ui.getBehaviorListItem(data.actor);
				
				tblWgt.update(target, spec);
				
				if (li) {
					li.update(target, spec, data.actor);
				}
			});
			
			// behavior widget specific
			editor.tools.behavior.addBehaviorListItemListener(
				editor.EventTypes.ListItemEdit, function(obj) {
					var spec = model.dispatchProxy.getTargetSpec(obj.target);
						
					bhvWgt.setActor(obj.actor, obj.target.type, obj.target, spec);
					bhvWgt.setVisible(true);
				});
			editor.tools.behavior.addBehaviorListItemListener(
				editor.EventTypes.ListItemRemove, function(target) {
					model.removeTarget(target);
				});
				
			bhvWgt.cancelBtn.text('Clear');
			bhvWgt.setVisible = function(visible) {
				
			};
		}
	});

////////////////////////////////////////////////////////////////////////////////
//                     			  	Extra Scripts  		                      //
////////////////////////////////////////////////////////////////////////////////

	editor.getScript('js/editor/plugins/behavior/js/objectPicker.js');
	editor.getScript('js/editor/plugins/behavior/js/param.js');
	editor.getScript('js/editor/plugins/behavior/js/treeData.js');
	editor.getScript('js/editor/plugins/behavior/js/behaviorTrees.js');
	editor.getScript('js/editor/plugins/behavior/js/behaviorWidget.js');
	editor.getCss('js/editor/plugins/behavior/css/style.css');
})();
