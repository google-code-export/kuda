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
	module.ui = module.ui || {};
	
	module.EventTypes.Behavior = {
		Cancel: 'behavior.cancel',
		Save: 'behavior.save',
		Update: 'behavior.update',
		
		// list widget specific
		ListItemEdit: 'behavior.listitemedit',
		ListItemRemove: 'behavior.listitemremove'
	};
	
////////////////////////////////////////////////////////////////////////////////
//                                Constants	    	                          //
////////////////////////////////////////////////////////////////////////////////
	
	module.ui.BehaviorTypes = {
		TRIGGER: 'trigger',
		ACTION: 'action',
		NA: 'na'
	};
	
////////////////////////////////////////////////////////////////////////////////
//                              Widget Helpers                                //
////////////////////////////////////////////////////////////////////////////////
		
	var expandTargetData = function(msgTarget, spec) {
			var isValueCheck = msgTarget.handler instanceof hemi.handlers.ValueCheck,
				meta = editor.data.getMetaData(),
				args = [],
				source, type, handler, method, argList, argNames;
			
			if (isValueCheck) {
				type = msgTarget.handler.values[0];
				handler = msgTarget.handler.handler;
				method = msgTarget.handler.func;
				argList = msgTarget.handler.args;
				
				if (spec.src === hemi.world.WORLD_ID) {
					source = module.treeData.createShapePickCitizen(msgTarget.handler.citizen);
				} else {
					source = module.treeData.createCamMoveCitizen(hemi.world.camera);
				}
			} else {
				source = spec.src;
				type = spec.msg;
				handler = msgTarget.handler;
				method = msgTarget.func;
				argList = msgTarget.args;
			}
			
			argNames = meta.getParameters(
				handler.getCitizenType(), method);
				
			for (var i = 0, il = argNames.length; i < il; i++) {
				args.push({
					name: argNames[i],
					value: argList[i]
				});
			} 
			
			return {
				source: source,
				type: type,
				handler: handler,
				method: method,
				args: args
			};
		},
		
		getMessages = function(citizen) {
			var msgs = [],
				id = citizen.getId();
			
			if (citizen.msgSent) {
				msgs.push('Any');
				
				for (var ndx = 0, len = citizen.msgSent.length; ndx < len; ndx++) {
					msgs.push(citizen.msgSent[ndx]);
				}
			}
			
			return msgs;
		},
		
		getMethods = function(citizen) {		
			var methods = [],
				hasMore = false;

			for (propName in citizen) {
				var prop = citizen[propName];
				
				if (jQuery.isFunction(prop) && module.treeData.methodsToRemove.indexOf(propName) === -1) {					
					hasMore = !module.treeData.isCommon(citizen, propName);
					methods.push(propName);
				}
			}
			
			if (hasMore) {
				methods.push('MORE');
			}
			
			return methods;
		},
		
		getCitType = function(source) {
			var cit = hemi.utils.isNumeric(source) ? 
					hemi.world.getCitizenById(source) : source;
					
			return cit.getCitizenType().split('.').pop();
		},
		
		getName = function(msgTarget, spec, actor) {
			var data = expandTargetData(msgTarget, spec),
				citType = getCitType(data.source),
				isId = hemi.utils.isNumeric(data.type),
				name =  isId ? hemi.world.getCitizenById(data.type).name :
					data.source.name,
				name = [citType, name];
				
				if (!isId) {
					name.push(data.type);
				}
				
			return name;
		},
		
		openNode = function(tree, citizen, prefix) {
			var nodeName = module.treeData.getNodeName(citizen, {
					prefix: prefix,
					id: citizen.getId()
				}),
				node = jQuery('#' + nodeName),
				path = tree.jstree('get_path', node, true);
			
			for (var i = 0, il = path.length; i < il; i++) {
				var n = jQuery('#' + path[i]);
				tree.jstree('open_node', n, false, true);
			}	
		},
		
		reset = function(tree) {
			tree.removeClass('restricted');
			tree.find('a').removeClass('restrictedSelectable');
			tree.jstree('close_all');
		},
			
		restrictSelection = function(tree, citizen, prefix, options) {
			tree.addClass('restricted');
			var nodeName = module.treeData.getNodeName(citizen, {
					option: null,
					prefix: prefix,
					id: id
				}),
				node = jQuery('#' + nodeName),
				path = tree.jstree('get_path', node, true);
				
			for (var i = 0, il = path.length; i < il; i++) {
				var n = jQuery('#' + path[i]);
				n.find('a').addClass('restrictedSelectable');
			}
					
			for (var ndx = 0, len = options.length; ndx < len; ndx++) {
				var id = citizen.getId ? citizen.getId() : null;
				nodeName = module.treeData.getNodeName(citizen, {
					option: options[ndx],
					prefix: prefix,
					id: id
				});
				node = jQuery('#' + nodeName);
				
				node.find('a').addClass('restrictedSelectable');
			}
		},
		
		setByMsgTarget = function(msgTarget, spec, actor) {
			var data = expandTargetData(msgTarget, spec),
				source = hemi.utils.isNumeric(data.source) ? 
					hemi.world.getCitizenById(data.source) : data.source;
					
			var nodeName = module.treeData.getNodeName(source, {
						option: data.type,
						prefix: this.trgTree.pre,
						id: source.getId()
					}),				
				trgT = this.trgTree.getUI(),
				axnT = this.axnTree.getUI();
			
			openNode(trgT, actor, this.trgTree.pre);
			this.trgChooser.select(nodeName);
			
			nodeName = module.treeData.getNodeName(data.handler, {
				option: data.method,
				prefix: this.axnTree.pre,
				id: data.handler.getId()
			});
			
			openNode(axnT, data.handler, this.axnTree.pre);
			this.axnChooser.select(nodeName);	
						
			for (var i = 0, il = data.args.length; i < il; i++) {
				var a = data.args[i];				
				this.prms.setArgument(a.name, a.value);
			}
			
			this.nameIpt.val(msgTarget.name);
			this.msgTarget = msgTarget;
			this.checkSaveButton();
		},
		
		setBySavedData = function(data, actor) {			
			if (data.trigger) {
				var msg = data.trigger.type, 
					cit = data.trigger.citizen,
					nodeName = module.treeData.getNodeName(cit, {
						option: msg,
						prefix: this.trgTree.pre,
						id: cit.getId()
					});
				
				this.trgChooser.select(nodeName);
				openNode(this.trgTree.getUI(), cit, this.trgTree.pre);
			}
			if (data.action) {
				var handler = data.action.handler,
					func = data.action.method,
					nodeName = module.treeData.getNodeName(handler, {
						option: [func],
						prefix: this.axnTree.pre,
						id: handler.getId()
					});
				
				openNode(this.axnTree.getUI(), handler, this.axnTree.pre);
				this.axnChooser.select(nodeName);
			}
			if (data.args) {					
				for (var i = 0, il = data.args.length; i < il; i++) {
					var a = data.args[i];				
					this.prms.setArgument(a.name, a.value);
				}
			}
			
			this.nameIpt.val(data.name);
			this.checkSaveButton();			
		},
		
		unrestrictSelection = function(tree, citizen, prefix, options) {
			tree.removeClass('restricted');
			var nodeName = module.treeData.getNodeName(citizen, {
					option: null,
					prefix: prefix,
					id: id
				}),
				node = jQuery('#' + nodeName),
				path = tree.jstree('get_path', node, true);
				
			for (var i = 0, il = path.length; i < il; i++) {
				var n = jQuery('#' + path[i]);
				n.find('a').removeClass('restrictedSelectable');
			}
			
			for (var ndx = 0, len = options.length; ndx < len; ndx++) {
				var id = citizen.getId ? citizen.getId() : null;
				nodeName = module.treeData.getNodeName(citizen, {
					option: options[ndx],
					prefix: prefix,
					id: id
				});
				node = jQuery('#' + nodeName);
				
				node.find('a').removeClass('restrictedSelectable');
			}
		};
	
////////////////////////////////////////////////////////////////////////////////
//                                	Widget		                              //
////////////////////////////////////////////////////////////////////////////////
		
	var BehaviorWidget = module.ui.FormSBWidget.extend({
		init: function() {
			this._super({
				name: 'behaviorSBWidget',
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
			this.container = jQuery('<div id="behaviorWgt"></div>');
			var form = jQuery('<form class="noSteps" action="" method="post"></form>'), 
				triggerFieldset = jQuery('<fieldset><legend>Select a Trigger</legend><ol></ol></fieldset>'), 
				actionFieldset = jQuery('<fieldset><legend>Select an Action</legend><ol></ol></fieldset>'), 
				paramsFieldset = jQuery('<fieldset id="behaviorAxnParams"><legend>Set Action Parameters</legend><ol><li></li></ol></fieldset>'), 
				saveFieldset = jQuery('<fieldset><legend>Save Behavior</legend><ol>' +
					'<li>' +
					'    <label>Name:</label>' +
					'    <input type="text" class="nameField" autocomplete="off" />' +
					'	 <div class="buttons">' +
					'        <button class="saveBtn" disabled="disabled">Save</button>' +
					'        <button class="cancelBtn">Cancel</button>' +
					'	</div>' +
					'</li></ol></fieldset>'), 
				nameIpt = saveFieldset.find('.nameField'), 
				saveBtn = saveFieldset.find('.saveBtn'), 
				cancelBtn = saveFieldset.find('.cancelBtn'),
				wgt = this, 
				selFcn = function(data, selector){
					var elem = data.rslt.obj, 
						metadata = elem.data('jstree'), 
						path = selector.tree.jstree('get_path', elem),
						isRestricted = selector.tree.hasClass('restricted'),
						isSelectable = elem.children('a').hasClass('restrictedSelectable');
					
					if (metadata.type === 'citType' ||
							metadata.type === 'citizen') {
						selector.tree.jstree('open_node', elem, false, false);
						return false;
					}
					else {
						var data = {};
						
						if (!isSelectable && isRestricted) {
							return false;
						}
						else {
							if (selector === wgt.axnChooser) {
								var handler = metadata.parent,
									method = path[path.length-1],
									args = module.utils.getFunctionParams(handler[method]);
								if (args.length > 0) {
									wgt.prmFieldset.show(200);
								}
								else {
									wgt.prmFieldset.hide();
								}
								wgt.prms.populateArgList(handler, method);
								data.handler = handler;
								data.method = method;
							}
							else {
								data.citizen = metadata.parent;
								data.type = metadata.msg;
							}
							selector.input.val(path.join('.').replace('.More...', ''));
							selector.setSelection(data);
							
							wgt.checkSaveButton();
							return true;
						}
					}
				};
			
			this.trgFieldset = triggerFieldset;
			this.axnFieldset = actionFieldset;
			this.prmFieldset = paramsFieldset;
			this.savFieldset = saveFieldset;
			this.saveBtn = saveBtn;
			this.nameIpt = nameIpt;
			
			this.axnTree = module.ui.createActionsTree();
			this.trgTree = module.ui.createTriggersTree();
							
			this.prms = new module.ui.Parameters({
					prefix: 'bhvEdt'
				});
			
			paramsFieldset.find('li').append(this.prms.getUI());
				
			this.trgChooser = new module.ui.TreeSelector({
				tree: this.trgTree,
				select: selFcn
			}); 
			
			this.axnChooser = new module.ui.TreeSelector({
				tree: this.axnTree,
				select: selFcn
			});
			
			this.axnTree.addListener(module.EventTypes.Trees.TreeCreated, 
				function(treeUI) {
					var li = jQuery('<li></li>');
					
					li.append(wgt.axnChooser.getUI())
					actionFieldset.find('ol').append(li);
				});
				
			this.trgTree.addListener(module.EventTypes.Trees.TreeCreated, 
				function(treeUI) {
					var li = jQuery('<li></li>');
					
					li.append(wgt.trgChooser.getUI())
					triggerFieldset.find('ol').append(li);
				});
			
			saveBtn.bind('click', function(evt) {
				var data = {
					trigger: wgt.trgChooser.getSelection(),
					action: wgt.axnChooser.getSelection(),
					args: wgt.prms.getArguments(),
					name: nameIpt.val(),
					type: wgt.type,
					target: wgt.msgTarget,
					actor: wgt.actor
				},
				msgType = wgt.msgTarget ? module.EventTypes.Behavior.Update :
					module.EventTypes.Behavior.Save;
				
				wgt.notifyListeners(msgType, data);
				wgt.reset();
			});
			
			cancelBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.Behavior.Cancel);
				wgt.reset();
			});
			
			nameIpt.bind('keyup', function(evt) {				
				wgt.checkSaveButton();
			});
			
			form.submit(function() { return false; });
			
			form.append(triggerFieldset).append(actionFieldset)
				.append(paramsFieldset).append(saveFieldset);
			this.container.append(form);
			
			// save checking
			var trgChecker = new module.ui.InputChecker(this.trgChooser),
				axnChecker = new module.ui.InputChecker(this.axnChooser);
			
			trgChecker.saveable = axnChecker.saveable = function() {
				return this.input.getSelection() != null;
			};
			
			this.addInputsToCheck(nameIpt);
			this.addInputsToCheck(trgChecker);
			this.addInputsToCheck(axnChecker);
		},
		
		reset: function() {
			this.trgChooser.reset();
			this.axnChooser.reset();
			this.prms.reset();
			this.nameIpt.val('');
			
			this.trgFieldset.hide();
			this.axnFieldset.hide();
			this.prmFieldset.hide();
			this.savFieldset.hide();
			
			reset(this.trgTree.getUI());
			reset(this.axnTree.getUI());
			
			this.msgTarget = null;
		},
		
		setActor: function(actor, type, data, opt_spec) {
			this.reset();
			
			this.type = type;
			this.actor = actor;
			
			// special cases
			if (actor instanceof hemi.view.Viewpoint) {
				var vp = actor;
				
				switch(type) {
					case module.ui.BehaviorTypes.ACTION:
						actor = hemi.world.camera;	
						
						if (!data) {
							data = {};							
							data.action = {
								handler: actor,
								method: 'moveToView'
							};
							data.args = [{
								name: 'view',
								value: 'id:' + vp.getId()
							}];
						}
						break;
					case module.ui.BehaviorTypes.TRIGGER:	
						var cmc = module.treeData.createCamMoveCitizen(hemi.world.camera);
						actor = cmc;
						
						if (!data) {
							data = {};
							data.trigger = {
								citizen: cmc,
								type: vp.getId()
							};
						}
						break;
				}
			} 
			
		    this.axnFieldset.show();
			this.trgFieldset.show();
			this.savFieldset.show();
			
			switch(type) {
				case module.ui.BehaviorTypes.ACTION:
					// get the list of functions
					restrictSelection(this.axnTree.getUI(), actor, 
						this.axnTree.pre, getMethods(actor));
					// open up to the actor's node
					openNode(this.axnTree.getUI(), actor, this.axnTree.pre);
					break;
				case module.ui.BehaviorTypes.TRIGGER:
					restrictSelection(this.trgTree.getUI(), actor, 
						this.trgTree.pre, getMessages(actor));	
					openNode(this.trgTree.getUI(), actor, this.trgTree.pre);		    
					break;
			}
			
			if (data instanceof hemi.dispatch.MessageTarget) {
				setByMsgTarget.call(this, data, opt_spec, actor);
			}
			else if (data != null) {
				setBySavedData.call(this, data, actor);
			}
		},
		
		setCurrentView: function(view) {
			if (this.currentView && view != this.currentView) {
				// save the data
				var meta = this.getViewMeta(this.currentView);
				
				meta.state = {
					actor: this.actor,
					type: this.type,
					data: {
						trigger: this.trgChooser.getSelection(),
						action: this.axnChooser.getSelection(),
						args: this.prms.getArguments(),
						name: this.nameIpt.val()
					}
				}
				
				// load up the new data if it exists
				meta = this.getViewMeta(view);
				
				if (meta && meta.state && meta.widgetShouldBeVisible) {
					this.setActor(meta.state.actor, meta.state.type, 
						meta.state.data);
				}
			}
			
			this._super(view);
		},
		
		setVisible: function(visible, etc) {
			this._super(visible, etc);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                            Behavior List Widget	                          //
////////////////////////////////////////////////////////////////////////////////
	
	module.ui.BhvListItemWidget = module.ui.EditableListItemWidget.extend({
		init: function() {
			this._super();
			
			this.isSorting = false;
			this.targets = new Hashtable();
		},
		
		add: function(msgTarget, spec, actor) {
			var li = new module.ui.EditableListItemWidget(),
				name = getName(msgTarget, spec, actor);
			
			li.setText(name.join('.') + ': ' + msgTarget.name);
			li.attachObject(msgTarget);
			
			this.bindButtons(li);
			this.list.add(li);
			
			this.targets.put(msgTarget.dispatchId, li);
		},
		
		attachObject: function(obj) {
			this._super(obj);
			
			behaviorLiTable.put(obj, this);
		},
		
		bindButtons: function(li) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var msgTarget = li.getAttachedObject(),
					obj = wgt.getAttachedObject();
				
				behaviorLiNotifier.notifyListeners(
					module.EventTypes.Behavior.ListItemEdit, {
						actor: obj,
						target: msgTarget
					});
			});
			
			li.removeBtn.bind('click', function(evt) {
				var msgTarget = li.getAttachedObject();
				msgTarget.actor = wgt.getAttachedObject();
				behaviorLiNotifier.notifyListeners(
					module.EventTypes.Behavior.ListItemRemove, msgTarget);
			});
		},
		
		finishLayout: function() {
			this._super();
			
			this.behaviorBtn = jQuery('<button class="behaviorBtn">Edit Behavior</button>');
			this.editBtn.after(this.behaviorBtn);
			
			this.behaviorBtn.bind('click', function() {
				module.ui.showBehaviorMenu(jQuery(this), 
					wgt.getAttachedObject());
			});
			
			// attach the sub lists
			var loadHeader = jQuery('<h2>Attached Behaviors:</h2>'),
				evtList = jQuery('<div class="bhvListWrapper"></div>'),
				arrow = jQuery('<div class="bhvListArrow"></div>'),
				wgt = this;
			
			this.list = new module.ui.ListWidget({
				widgetClass: 'bhvList',
				prefix: 'bhvLst'
			});
			
			evtList.append(loadHeader).append(this.list.getUI())
				.hide();
			arrow.hide();
			this.container.append(arrow).append(evtList);
			
			this.container.bind('click', function(evt) {
				var tgt = jQuery(evt.target);
				
				if (evt.target.tagName !== 'BUTTON'
						&& tgt.parents('.bhvListWrapper').size() === 0
						&& !tgt.hasClass('bhvListWrapper')
						&& !wgt.isSorting) {
					arrow.toggle(100);
					evtList.slideToggle(200);
				}
			});		
		},
		
		remove: function(msgTarget) {
			var li = this.targets.get(msgTarget.dispatchId);
			
			this.list.remove(li);
			
			this.targets.remove(msgTarget.dispatchId);
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
		
		update: function(msgTarget, spec, actor) {
			var li = this.targets.get(msgTarget.dispatchId),
				name = getName(msgTarget, spec, actor);
			
			li.attachObject(msgTarget);
			li.setText(name.join('.') + ': ' + msgTarget.name);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                	   Setup	                              //
////////////////////////////////////////////////////////////////////////////////
	
	var behaviorWidget = null,
		behaviorLiTable = new Hashtable(),
		behaviorLiNotifier = new module.utils.Listenable(),
		behaviorMenu = new module.ui.PopupMenu(),
		addTriggerMnuItm = new module.ui.MenuItem({
			title: 'Trigger a behavior',
			action: function(evt) {
				behaviorWidget.setActor(behaviorMenu.actor, 
					module.ui.BehaviorTypes.TRIGGER);
				behaviorWidget.setVisible(true);
			}
		}),
		addActionMnuItm = new module.ui.MenuItem({
			title: 'Respond to a trigger',
			action: function(evt) {
				behaviorWidget.setActor(behaviorMenu.actor, 
					module.ui.BehaviorTypes.ACTION);
				behaviorWidget.setVisible(true);
			}
		});
		
	behaviorMenu.addMenuItem(addTriggerMnuItm);
	behaviorMenu.addMenuItem(addActionMnuItm);
	behaviorMenu.container.attr('id', 'behaviorMenu');
	
	module.ui.getBehaviorWidget = function() {
		var body = jQuery('body'),
			menuAdded = body.data('menuAdded');
			
		if (!menuAdded) {
			body.append(behaviorMenu.getUI()).data('menuAdded', true);
			behaviorWidget = new BehaviorWidget();
		}
		
		return behaviorWidget;
	};
		
	module.ui.showBehaviorMenu = function(parBtn, actor, view) {		
		var position = parBtn.offset();
		
		position.top += parBtn.outerHeight();
		position.left -= behaviorMenu.container.outerWidth() - parBtn.outerWidth();
		behaviorMenu.show(position, parBtn);
		behaviorMenu.actor = actor;
	};
	
	module.ui.getBehaviorListItem = function(actor) {
		return actor ? behaviorLiTable.get(actor) : null;
	};
	
	module.ui.addBehaviorListItemListener = function(eventType, listener) {
		behaviorLiNotifier.addListener(eventType, listener);
	};
	
	module.ui.removeBehaviorListItemListener = function(listener) {
		behaviorLiNotifier.removeListener(listener);
	};
	
	return module;
})(editor || {})
