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
    editor.tools = editor.tools || {};
    
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

	editor.EventTypes.CreateBehavior = "messaging.CreateBehavior";
	editor.EventTypes.UpdateBehavior = "messaging.UpdateBehavior";
	
	var TRIGGER_WRAPPER = '#causeTreeWrapper',
		ACTION_WRAPPER = '#effectTreeWrapper';
	
////////////////////////////////////////////////////////////////////////////////
//                                 Utilities                                  //
////////////////////////////////////////////////////////////////////////////////
		
	editor.tools.DispatchProxy = function() {
		// The set of MessageSpecs (and MessageTargets) being created by the
		// messaging tool
		this.worldSpecs = new hemi.utils.Hashtable();
		// The set of MessageSpecs used by the editor
		this.editorSpecs = null;
	};
	
	editor.tools.DispatchProxy.prototype = {
		swap: function() {
			if (this.editorSpecs === null) {
				this.editorSpecs = hemi.dispatch.msgSpecs;
				hemi.dispatch.msgSpecs = this.worldSpecs;
			}
		},
		
		unswap: function() {
			if (this.editorSpecs !== null) {
				hemi.dispatch.msgSpecs = this.editorSpecs;
				this.editorSpecs = null;
			}
		},
		
		getTargetSpec: function(target) {
			this.swap();
			var ret = hemi.dispatch.getTargetSpec(target);
			this.unswap();
			return ret;
		},
		
		getTargets: function(attributes, wildcards) {
			this.swap();
			var ret = hemi.dispatch.getTargets(attributes, wildcards);
			this.unswap();
			return ret;
		},
		
		registerTarget: function(src, msg, handler, opt_func, opt_args) {
			this.swap();
			var ret = hemi.dispatch.registerTarget(src, msg, handler, opt_func, 
				opt_args);
			this.unswap();
			return ret;
		},
		
		removeTarget: function(target, opt_attributes) {
			this.swap();
			var ret = hemi.dispatch.removeTarget(target, opt_attributes);
			this.unswap();
			return ret;
		},
		
		cleanup: function() {
			this.swap();
			hemi.dispatch.cleanup();
			this.unswap();
		},
		
		toOctane: function() {
			this.swap();
			var ret = hemi.dispatch.toOctane();
			this.unswap();
			return ret;
		}
	};
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////


    /**
     * A BehaviorModel
     */
    editor.tools.BehaviorModel = editor.ToolModel.extend({
		init: function() {
			this._super('editor.tools.behavior');
			
			this.dispatchProxy = new editor.tools.DispatchProxy();
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
//                              Creation Widget                               //
////////////////////////////////////////////////////////////////////////////////   
	
	// use the behavior widget, but style it differently
	
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
				wgt = this;
				
			tr.data('behavior', msgTarget);
			this.behaviors.put(msgTarget.dispatchId, tr);
			
			td.find('.editBtn').bind('click', function(evt) {
				var bhv = tr.data('behavior');					
				wgt.notifyListeners(editor.EventTypes.SelectTarget, bhv);
			});
			td.find('.chainBtn').bind('click', function(evt) { 
				var tr = jQuery(this).parents('tr');
				
			});
			td.find('.cloneBtn').bind('click', function(evt) {
				var tr = jQuery(this).parents('tr');
				
			});
			td.find('.removeBtn').bind('click', function(evt) {
				var tr = jQuery(this).parents('tr');
				
			});
			
			this.invalidate();
		},
		
		finishLayout: function() {
			this._super();
			
			this.tableElem = jQuery('<table></table>');
			this.container.append(this.tableElem);
			
			this.table = this.tableElem.dataTable({
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
		},
		
		update: function(msgTarget, spec) {
			var data = editor.tools.behavior.expandBehaviorData(msgTarget, spec),
				row = this.behaviors.get(msgTarget.dispatchId); 
				
			this.table.fnUpdate([
				editor.tools.behavior.getTriggerName(data).join('.'),
				editor.tools.behavior.getActionName(data).join('.'),
				msgTarget.name
			], row);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////   

//	editor.tools.EventListItemWidget = editor.ui.ListItemWidget.extend({
//		init: function(eventsPanel) {
//			this.eventsPanel = eventsPanel;
//			this.subList = null;
//			this.children = [];
//			this._super();
//		},
//		
//		layout: function() {
//			this.container = jQuery('<div class="msgEdtListItm"></div>');
//			this.title = jQuery('<span class="msgEdtItemTitle"></span>');
//			this.buttonDiv = jQuery('<div class="msgEdtButtons"></div>');
//			this.removeBtn = jQuery('<button class="removeBtn" title="Remove">Remove</button>');
//			this.editBtn = jQuery('<button class="editBtn" title="Edit">Edit</button>');
//			this.chainBtn = jQuery('<button class="chainBtn" title="Chain">Chain</button>');
//			this.cloneBtn = jQuery('<button class="cloneBtn" title="Clone">Clone</button>');
//			
//			this.buttonDiv.append(this.editBtn).append(this.chainBtn)
//				.append(this.cloneBtn).append(this.removeBtn);
//			this.container.append(this.title).append(this.buttonDiv);
//			
//			var wgt = this;
//		},
//	
//		setText: function(text) {
//			this.title.text(text);
//		},
//	
//		setSubList: function(list) {
//			this.subList = list;
//			this.getUI().parent().append(this.subList.getUI());
//		},
//	
//		addChild: function(child) {
//			this.children.push(child);
//		},
//	
//		removeChild: function(child) {
//	        var ndx = this.children.indexOf(child);
//	        
//	        if (ndx != -1) {
//	            this.children.splice(ndx, 1);
//	        }
//		}
//	});
//
//    /*
//     * Configuration object for the BehaviorView.
//     */
//    editor.tools.BehaviorViewDefaults = {
//        toolName: 'Behaviors',
//        toolTip: 'Behavior Editing: Create and edit behaviors',
//        widgetId: 'messagingBtn',
//        listInstructions: "List is empty.  Click 'Create New Behavior' to add to this list."
//    };
//    
//    /**
//     * The BehaviorView controls the dialog and toolbar widget for the 
//     * animation tool.
//     * 
//     * @param {Object} options configuration options.  Uses 
//     *         editor.tools.BehaviorViewDefaults as default options
//     */
//    editor.tools.BehaviorView = editor.ToolView.extend({
//		init: function(options) {
//	        var newOpts = jQuery.extend({}, editor.tools.BehaviorViewDefaults, 
//				options);
//	        this._super(newOpts);
//			
//			this.triggersTree = editor.ui.createTriggersTree();
//			this.actionsTree = editor.ui.createActionsTree();
//			this.chainParent = null;
//			
//			this.eventList = new editor.ui.ListWidget({
//				widgetId: 'msgEvtList',
//				prefix: 'msgEvt',
//				type: editor.ui.ListType.UNORDERED
//			});
//			
//			var pnl = this.mainPanel = new editor.ui.Component({
//				id: 'msgPnl',
//				uiFile: 'js/editor/tools/html/messaging.htm',
//				immediateLayout: false
//			});
//				
//			var view = this;
//				
//			this.prm = new editor.ui.Parameters({
//				containerId: 'msgEdtTargetParams',
//				prefix: 'msgEdt'
//			});
//			
//			this.layoutMainPanel();
//			
//			this.triggersTree.addListener(editor.EventTypes.Trees.TreeCreated, 
//				function(treeUI) {
//					var causeWrapper = pnl.find(TRIGGER_WRAPPER);				
//					causeWrapper.append(treeUI);
//			
//					view.triggersTree.bindSelect(function(evt, data) {
//						var elem = data.rslt.obj,
//							metadata = elem.data('jstree'),
//							tree = view.triggersTree.getUI(),
//							isRestricted = tree.hasClass('restricted'),
//							isSelectable = elem.children('a').hasClass('restrictedSelectable'),
//							src = null,
//							msg = null;
//						
//						if (tree.jstree('is_open', elem)) {
//							tree.jstree('close_node', elem);
//						} else if (isSelectable || !isRestricted) {
//							if (metadata.type === 'message') {
//								src = metadata.parent;
//								msg = metadata.msg;
//							} else {
//								tree.jstree('open_node', elem, false, false);
//							}
//						}
//						
//						view.notifyListeners(editor.EventTypes.SelectTrigger, {
//							source: src,
//							message: msg
//						});
//					});
//				});
//				
//			this.actionsTree.addListener(editor.EventTypes.Trees.TreeCreated, 
//				function(treeUI) {
//					var effectWrapper = pnl.find(ACTION_WRAPPER);				
//					effectWrapper.append(treeUI);
//			
//					view.actionsTree.bindSelect(function(evt, data) {
//						var elem = data.rslt.obj,
//							elemId = elem.attr('id'),
//							metadata = elem.data('jstree'),
//							tree = view.actionsTree.getUI(),
//							cit = null,
//							meth = null;
//						
//						if (tree.jstree('is_open', elem)) {
//							tree.jstree('close_node', elem);
//						} else {
//							if (metadata.type === 'method') {
//								var path = tree.jstree('get_path', elem, true),
//									parentName = path[path.length - 2] + '_',
//									parId = metadata.parent.getId() + '';
//								
//								parentName = parentName.replace(parId + '_MORE', parId);
//								cit = metadata.parent;
//								meth = elemId.replace(parentName, '');
//							} else {
//								tree.jstree('open_node', elem, false, false);
//							}
//						}
//						
//						view.notifyListeners(editor.EventTypes.SelectAction, {
//							handler: cit,
//							method: meth
//						});
//					});
//				});
//	    },
//		
//		addTarget: function(target) {
//			var pnl = this.mainPanel,
//				eventsPanel = pnl.find('#msgEvents'),
//				li = new editor.tools.EventListItemWidget(eventsPanel),
//				editListPnl = pnl.find('#msgEvents .msgColWrapper'),
//				editorPnl = pnl.find('#msgEditor'),
//				editorNameInput = editorPnl.find('#msgEdtName'),
//				view = this;
//			
//			var lastChild = function(item) {
//				if (item.children.length > 0) {
//					return lastChild(item.children[item.children.length - 1]);
//				}
//				else {
//					return item;
//				}
//			};
//			
//			var unchain = function(item, level) {
//				// get children
//				var children = item.children;
//				
//				for (var ndx = 0, len = children.length; ndx < len; ndx++) {
//					unchain(children[ndx], level + 1);
//				}
//				
//				item.getUI().data('level', level)
//					.find('span').css('paddingLeft', level * 20 + 'px');
//			};
//			
//			if (view.chainParent != null) {
//				var level = view.chainParent.data('level') + 1,
//					lastItem = lastChild(view.chainParent);
//				
//				this.eventList.after(li, lastItem);
//				li.getUI().data('chainParent', view.chainParent)
//					.data('level', level)
//					.find('span').css('paddingLeft', level * 20 + 'px');
//				
//				view.chainParent.addChild(li);
//				view.chainParent = null;
//			}
//			else {
//				this.eventList.add(li);
//				li.data('level', 0);
//			}
//			
//			li.setId('msgTarget_' + target.dispatchId);
//			li.attachObject(target);
//			li.setText(target.name);
//			
//			// now bind the appropriate buttons
//			li.title.bind('click', function(evt) {
//				view.notifyListeners(editor.EventTypes.SelectTarget, {
//					target: li.getAttachedObject(),
//					edit: false
//				});
//			});
//			
//			li.removeBtn.bind('click', function(evt) {
//				while (li.children.length > 0) {
//					var child = li.children[0];
//					unchain(child, 0);
//					li.removeChild(child);
//				}
//				
//				// remove from parent
//				var par = li.data('chainParent');
//				
//				if (par != null) {
//					par.removeChild(li);
//				}
//				
//				// now notify others
//				view.notifyListeners(editor.EventTypes.RemoveTarget, 
//					li.getAttachedObject());
//			});
//				
//			li.editBtn.bind('click', function(evt) {
//				var target = li.getAttachedObject();
//				view.notifyListeners(editor.EventTypes.SelectTarget, {
//					target: target,
//					edit: true
//				});
//				
//				editListPnl.hide();
//				editorNameInput.val(target.name);
//				view.updateSaveButton();
//				editorPnl.show();
//			});
//			
//			var handler = target.handler,
//				method = target.func;
//			
//			if (handler instanceof hemi.handlers.ValueCheck) {
//				method = handler.func;
//				handler = handler.handler;
//			}
//			
//			var msgs = this.getChainMessages(handler, method);
//			
//			if (msgs.length > 0) {
//				li.chainBtn.data('chainMsgs', msgs)
//				.bind('click', function(evt) {
//					var target = li.getAttachedObject(),
//						handler = target.handler,
//						messages = jQuery(this).data('chainMsgs');
//					
//					if (handler instanceof hemi.handlers.ValueCheck) {
//						target = handler;
//						handler = target.handler;
//					}
//					
//					// special case
//					if (target.func === 'moveToView') {
//						handler = editor.treeData.createCamMoveCitizen(hemi.world.camera);
//						messages = [parseInt(target.args[0].replace(
//							hemi.dispatch.ID_ARG, ''))];
//					}
//					view.triggersTree.restrictSelection(handler, messages);
//					view.chainParent = li;
//					view.notifyListeners(editor.EventTypes.SelectTrigger, {
//						source: handler,
//						message: messages[0]
//					});
//					view.notifyListeners(editor.EventTypes.SelectAction, {
//						handler: null,
//						method: null
//					});
//					
//					editListPnl.hide();
//					editorPnl.show();
//				});
//			} else {
//				li.chainBtn.attr('disabled', 'disabled');
//			}
//			
//			li.cloneBtn.bind('click', function(evt) {
//				var target = li.getAttachedObject();
//				
//				view.notifyListeners(editor.EventTypes.SelectTarget, {
//					target: target,
//					edit: false
//				});
//				
//				view.chainParent = li.data('chainParent');
//				view.notifyListeners(editor.EventTypes.SaveTarget,
//					{name: 'Copy of ' + target.name});
//			});
//		},
//		
//		getChainMessages: function(citizen, method) {
//			var type = citizen.getCitizenType ? citizen.getCitizenType() : citizen.name,
//				key = type + '_' + method,
//				msgList = editor.treeData.chainTable.get(key),
//				messages;
//			
//			if (citizen.parent != null) {
//				messages = this.getChainMessages(citizen.parent, method);
//			} else {
//				messages = [];
//			}
//			
//			if (msgList !== null) {
//				messages = messages.concat(msgList);
//			}
//			
//			return messages;
//		},
//		
//		layoutMainPanel: function() {
//			var pnl = this.mainPanel,
//				evtLst = this.eventList,
//				view = this;
//				
//			pnl.finishLayout = function() {
//				var editListPnl = pnl.find('#msgEvents .msgColWrapper'),
//					editorPnl = pnl.find('#msgEditor'),
//					editorForm = editorPnl.find('form'),
//					editorNameInput = editorPnl.find('#msgEdtName'),
//					editorSaveBtn = editorPnl.find('#msgEdtSaveBtn'),
//					editorCancelBtn = editorPnl.find('#msgEdtCancelBtn'),
//					addBtn = pnl.find('#msgAddEventBtn'),
//					replacementPnl = jQuery('#o3d'),
//					list = pnl.find('#msgEdtTargetParamsList'),
//					panelUI = pnl.getUI();
//				
//				list.append(view.prm.getUI());
//				
//				editListPnl.append(evtLst.getUI());
//				editorForm.bind('submit', function(evt) {
//					return false;
//				});
//				
//				addBtn.bind('click', function(evt) {
//					editListPnl.hide();
//					editorPnl.show();
//					view.notifyListeners(editor.EventTypes.SelectTarget, {
//						target: null,
//						edit: false
//					});
//				});
//				
//				editorNameInput.bind('keyup', function(evt) {
//					view.updateSaveButton();
//				});
//				
//				editorSaveBtn.bind('click', function(evt) {
//					var data = {
//						args: view.prm.getArguments(),
//						name: editorNameInput.val()
//					};
//					
//					if (view.chainParent != null) {
//						var li = view.chainParent,
//							target = li.getAttachedObject(),
//							handler = target.handler,
//							messages = li.chainBtn.data('chainMsgs');
//						
//						if (handler instanceof hemi.handlers.ValueCheck) {
//							target = handler;
//							handler = target.handler;
//						}
//						
//						// special case
//						if (target.func === 'moveToView') {
//							handler = editor.treeData.createCamMoveCitizen(hemi.world.camera);
//							messages = [parseInt(target.args[0].replace(
//								hemi.dispatch.ID_ARG, ''))];
//						}
//						
//						view.triggersTree.unrestrictSelection(handler, messages);
//					}
//					
//					view.notifyListeners(editor.EventTypes.SaveTarget, 
//						data);
//					editorNameInput.val('');
//				});
//				
//				editorCancelBtn.bind('click', function(evt) {
//					if (view.chainParent != null) {
//						var li = view.chainParent,
//							target = li.getAttachedObject(),
//							handler = target.handler,
//							messages = li.chainBtn.data('chainMsgs');
//						
//						if (handler instanceof hemi.handlers.ValueCheck) {
//							target = handler;
//							handler = target.handler;
//						}
//						
//						// special case
//						if (target.func === 'moveToView') {
//							handler = editor.treeData.createCamMoveCitizen(hemi.world.camera);
//							messages = [parseInt(target.args[0].replace(
//								hemi.dispatch.ID_ARG, ''))];
//						}
//						
//						view.triggersTree.unrestrictSelection(handler, messages);
//						view.chainParent = null;
//					}
//					
//					editorPnl.hide();
//					editorNameInput.val('');
//					editListPnl.show();
//				});
//				
//				panelUI.bind('editor.mainView.resize', function(evt) {
//					var height = panelUI.height(),
//						columns = panelUI.find('.msgColumn'),
//						containers = columns.find('.msgColWrapper'),
//						headerHeight = panelUI.find('.msgColTitle').first().outerHeight();
//						
//					columns.height(height);
//					containers.height(height - headerHeight);
//				});
//				
//				replacementPnl.after(panelUI);
//			};
//			
//			pnl.layout();
//		},
//		
//		removeTarget: function(target) {
//			this.eventList.remove('msgTarget_' + target.dispatchId);
//		},
//		
//		updateSaveButton: function() {
//			var saveButton = this.mainPanel.find('#msgEdtSaveBtn'),
//				causeText = this.mainPanel.find('#msgEdtCauseTxt').text(),
//				effectText = this.mainPanel.find('#msgEdtEffectTxt').text(),
//				name = this.mainPanel.find('#msgEdtName').val();
//			
//			if (name === '' || causeText === '' || effectText === '') {
//				saveButton.attr('disabled', 'disabled');
//			} else {
//				saveButton.removeAttr('disabled');
//			}
//		},
//		
//		updateTarget: function(target) {
//			this.eventList.edit(
//				'msgTarget_' + target.dispatchId,
//				target,
//				target.name);
//		},
//		
//		selectAction: function(citizen, method) {
//			var actionText = jQuery('#msgEdtEffectTxt');
//			
//			if (citizen === null || method === null) {
//				actionText.text('');
//			} else {
//				actionText.text(citizen.name + ' ' + method);
//			}
//			
//			this.actionsTree.select(citizen, method);
//		},
//		
//		selectTrigger: function(citizen, message) {
//			var triggerText = jQuery('#msgEdtCauseTxt');
//			
//			if (citizen === null || message === null) {
//				triggerText.text('');
//			} else {
//				var name = citizen === editor.treeData.MSG_WILDCARD ? citizen : citizen.name,
//					msg;
//				
//				if (citizen.camMove) {
//					var viewpoint = hemi.world.getCitizenById(message);
//					msg = viewpoint.name;
//				} else {
//					msg = message;
//				}
//				
//				triggerText.text(name + ' ' + msg);
//			}
//			
//			this.triggersTree.select(citizen, message);
//		}
//	});

	editor.tools.BehaviorView = editor.ToolView.extend({
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
    editor.tools.BehaviorController = editor.ToolController.extend({
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
//			view.addListener(editor.EventTypes.ToolModeSet, function(data) {
//				var isDown = data.newMode === editor.ToolConstants.MODE_DOWN;
//			});			
//			view.addListener(editor.EventTypes.RemoveTarget, function(data) {
//				model.removeTarget(data);
//			});			
//			view.addListener(editor.EventTypes.SaveTarget, function(data) {
//				var args = data.args || [];
//				
//				for (var i = 0, il = args.length; i < il; i++) {
//					var arg = args[i];
//					model.setArgument(arg.name, arg.value);
//				}
//				
//				model.save(data.name);
//			});
//			view.addListener(editor.EventTypes.SelectAction, function(data) {
//				model.setAction(data.handler, data.method);
//			});
			tblWgt.addListener(editor.EventTypes.SelectTarget, function(target) {				
				var spec = model.dispatchProxy.getTargetSpec(target);
					
				bhvWgt.setTarget(target, spec);
			});
//			view.addListener(editor.EventTypes.SelectTrigger, function(data) {
//				model.setTrigger(data.source, data.message);
//			});
			
			// model specific
//			model.addListener(editor.EventTypes.ArgumentSet, function(data) {
//				view.prm.setArgument(data.name, data.value);
//			});			
//			model.addListener(editor.EventTypes.TriggerSet, function(data) {
//				view.selectTrigger(data.source, data.message);
//				view.updateSaveButton();
//			});			
//			model.addListener(editor.EventTypes.ActionSet, function(data) {
//				var handler = data.handler,
//					method = data.method;
//					
//				view.selectAction(handler, method);
//				view.updateSaveButton();
//				
//				if (handler && method) {
//					var args = [],
//				 		vals = [];
//					
//					model.args.each(function(key, value) {
//						args[value.ndx] = key;
//						vals[value.ndx] = value.value;
//					});
//					view.prm.populateArgList(handler, method, args, vals);
//				}
//			});			
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
				view.removeTarget(target);
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
	
    return module;
})(editor || {});