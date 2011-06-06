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
		
	var getMessages = function(citizen) {
			var msgs = ['Any'],
				id = citizen.getId();
			
			for (var ndx = 0, len = citizen.msgSent.length; ndx < len; ndx++) {	
				msgs.push(citizen.msgSent[ndx]);
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
			
			for (var ndx = 0, len = options.length; ndx < len; ndx++) {
				var id = citizen.getId ? citizen.getId() : null,
					nodeName = module.treeData.getNodeName(citizen, {
						option: options[ndx],
						prefix: prefix,
						id: id
					}),
					node = jQuery('#' + nodeName);
				
				node.find('a').addClass('restrictedSelectable');
			}
		},
		
		unrestrictSelection = function(tree, citizen, prefix, options) {
			tree.removeClass('restricted');
			
			for (var ndx = 0, len = options.length; ndx < len; ndx++) {
				var id = citizen.getId ? citizen.getId() : null,
					nodeName = module.treeData.getNodeName(citizen, {
						option: options[ndx],
						prefix: prefix,
						id: id
					}),
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
						var obj1 = metadata.parent, 
							obj2 = path[path.length - 1],
							data = {};
						
						if (!isSelectable && isRestricted) {
							return false;
						}
						else {
							if (selector === wgt.axnChooser) {
								var args = module.utils.getFunctionParams(obj1[obj2]);
								if (args.length > 0) {
									wgt.prmFieldset.show(200);
								}
								else {
									wgt.prmFieldset.hide(200);
								}
								wgt.prmWgt.fillParams(args);
								data.handler = obj1;
								data.method = obj2;
							}
							else {
								data.citizen = obj1;
								data.type = obj2;
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
			
			this.axnTree = module.ui.createActionsTree(true);
			this.trgTree = module.ui.createTriggersTree(true);
							
			this.prmWgt = new module.ui.ParamWidget({
					prefix: 'bhvEdt'
				});
			
			paramsFieldset.find('li').append(this.prmWgt.getUI());
				
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
					args: wgt.prmWgt.getArgs(),
					name: nameIpt.val(),
					type: wgt.type,
					target: wgt.target
				},
				msgType = wgt.target ? module.EventTypes.Behavior.Update :
					module.EventTypes.Behavior.Save;
				
				wgt.notifyListeners(msgType, data);
				wgt.reset();
				wgt.setVisible(false);
			});
			
			cancelBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.Behavior.Cancel);
				wgt.reset();
				wgt.setVisible(false);
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
			this.prmWgt.reset();
			this.nameIpt.val('');
			
			this.trgFieldset.hide();
			this.axnFieldset.hide();
			this.prmFieldset.hide();
			this.savFieldset.hide();
			
			reset(this.trgTree.getUI());
			reset(this.axnTree.getUI());
			
			this.target = null;
		},
		
		setActor: function(actor, type, msgTarget, msg) {
			this.reset();
			
			this.type = type;
			this.actor = actor;
			
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
			
			if (msgTarget) {
				var nodeName = module.treeData.getNodeName(actor, {
						option: [msg == 'Any' ? msg : 'hemi.' + msg],
						prefix: this.trgTree.pre,
						id: actor.getId()
					}),
				trgT = this.trgTree.getUI(),
				axnT = this.axnTree.getUI(),
				isValueCheck = msgTarget instanceof hemi.handlers.ValueCheck,
				handler = isValueCheck ? msgTarget.handler.handler : msgTarget.handler,
				func =  isValueCheck? msgTarget.handler.func : msgTarget.func,
				vals = isValueCheck ? msgTarget.handler.args : msgTarget.args,
				args = module.utils.getFunctionParams(handler[func]);
				
				openNode(trgT, actor, this.trgTree.pre);
				this.trgChooser.select(nodeName);
				
				nodeName = module.treeData.getNodeName(handler, {
					option: [func],
					prefix: this.axnTree.pre,
					id: handler.getId()
				});
				
				openNode(axnT, handler, this.axnTree.pre);
				this.axnChooser.select(nodeName);
				
				this.prmWgt.fillParams(args, vals);
				this.nameIpt.val(msgTarget.name);
				this.target = msgTarget;
			}
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
		
		add: function(msgTarget, actor, msg) {
			var li = new module.ui.EditableListItemWidget(),
				citType = actor.getCitizenType().split('.').pop(),
				name = [citType, actor.name, msg.split('.').pop()];
			
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
			
			this.container.bind('mouseup', function(evt) {
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
		
		update: function(msgTarget, actor, msg) {
			var li = this.targets.get(msgTarget.dispatchId),
				type = actor.getCitizenType().split('.').pop(),
				name = [type, actor.name, msg.split('.').pop()];
			
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
		
	module.ui.showBehaviorMenu = function(parBtn, actor) {		
		var position = parBtn.offset();
		
		position.top += parBtn.outerHeight();
		position.left -= behaviorMenu.container.outerWidth() - parBtn.outerWidth();
		behaviorMenu.show(position, parBtn);
		behaviorMenu.actor = actor;
	};
	
	module.ui.getBehaviorListItem = function(actor) {
		return behaviorLiTable.get(actor);
	};
	
	module.ui.addBehaviorListItemListener = function(eventType, listener) {
		behaviorLiNotifier.addListener(eventType, listener);
	};
	
	module.ui.removeBehaviorListItemListener = function(listener) {
		behaviorLiNotifier.removeListener(listener);
	};
	
	return module;
})(editor || {})
