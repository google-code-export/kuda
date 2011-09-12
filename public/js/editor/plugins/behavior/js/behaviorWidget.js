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
	var shorthand = editor.tools.behavior = editor.tools.behavior || {};
	
	editor.EventTypes.ListItemEdit = 'behavior.listitemedit';
	editor.EventTypes.ListItemRemove = 'behavior.listitemremove';
	
////////////////////////////////////////////////////////////////////////////////
//                                Constants	    	                          //
////////////////////////////////////////////////////////////////////////////////
	
	shorthand.BehaviorTypes = {
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
					source = editor.treeData.createShapePickCitizen(msgTarget.handler.citizen);
				} else {
					source = editor.treeData.createCamMoveCitizen(hemi.world.camera);
				}
			} else {
				source = spec.src === hemi.dispatch.WILDCARD ? editor.treeData.MSG_WILDCARD : spec.src;
				type = spec.msg === hemi.dispatch.WILDCARD ? editor.treeData.MSG_WILDCARD : spec.msg;
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
				
				if (jQuery.isFunction(prop) && editor.treeData.methodsToRemove.indexOf(propName) === -1) {					
					hasMore = !editor.treeData.isCommon(citizen, propName);
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
		
		getTriggerName = function(data) {
			var source = data.source,
				nameArr;
			
			if (source === editor.treeData.MSG_WILDCARD) {
				nameArr = ['[any source]', data.type];
			} else {
				var citType = getCitType(source),
					isId = hemi.utils.isNumeric(source),
					name = isId ? hemi.world.getCitizenById(source).name :
						source.name;
				
				nameArr = [citType, name, data.type];
			}
				
			return nameArr;
		},
		
		openNode = function(tree, citizen, prefix) {
			var nodeName = editor.treeData.getNodeName(citizen, {
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
		
		setByMsgTarget = function(msgTarget, spec) {
			var data = expandTargetData(msgTarget, spec),
				source = hemi.utils.isNumeric(data.source) ? 
					hemi.world.getCitizenById(data.source) : data.source;
					
			var nodeName = editor.treeData.getNodeName(source, {
						option: data.type,
						prefix: this.trgTree.pre,
						id: source.getId ? source.getId() : null
					}),				
				trgT = this.trgTree.getUI(),
				axnT = this.axnTree.getUI();
			
			openNode(trgT, source, this.trgTree.pre);
			this.trgChooser.select(nodeName);
			
			nodeName = editor.treeData.getNodeName(data.handler, {
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
			this.prmInstructions.hide();
		},
		
		setBySavedData = function(data, actor) {			
			if (data.trigger) {
				var msg = data.trigger.type, 
					cit = data.trigger.citizen,
					nodeName = editor.treeData.getNodeName(cit, {
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
					nodeName = editor.treeData.getNodeName(handler, {
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
		};
	
////////////////////////////////////////////////////////////////////////////////
//                         	 Custom Tree Selector	                          //
////////////////////////////////////////////////////////////////////////////////
		
	
	var BhvTreeSelector = editor.ui.TreeSelector.extend({
		init: function(options) {
			this._super(options);
		},
		
		setTree: function(tree) {
			var wgt = this,
				pnl = this.panel;
			
			tree.addListener(editor.EventTypes.Trees.TreeCreated, 
				function(treeUI) {
					wgt.tree = treeUI;
					wgt.tree.bind('select_node.jstree', wgt.selFcn).addClass('treeSelectorTree');
			
					wgt.panel.append(wgt.tree);
									
					wgt.input.attr('placeholder', 'Select an item');
				});
		
			this.treeBorder = Math.ceil(parseFloat(pnl.css('borderRightWidth'))) 
				+ Math.ceil(parseFloat(pnl.css('borderLeftWidth')));
			this.treePadding = Math.ceil(parseFloat(pnl.css('paddingLeft'))) 
				+ Math.ceil(parseFloat(pnl.css('paddingRight')));
				
			this.input.attr('placeholder', 'No items to select');
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                	Widget		                              //
////////////////////////////////////////////////////////////////////////////////
		
	var BehaviorWidget = editor.ui.FormWidget.extend({
		init: function() {
			this._super({
				name: 'behaviorWidget'
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
			var form = jQuery('<form class="noSteps" action="" method="post"></form>'), 
				triggerFieldset = jQuery('<fieldset><legend>Select a Trigger</legend><ol></ol></fieldset>'), 
				actionFieldset = jQuery('<fieldset><legend>Select an Action</legend><ol></ol></fieldset>'), 
				paramsFieldset = jQuery('<fieldset id="behaviorAxnParams"><legend>Set Action Parameters</legend><ol><li></li></ol></fieldset>'), 
				saveFieldset = jQuery('<fieldset><legend>Save Behavior</legend><ol>' +
					'<li>' +
					'    <input type="text" class="nameField" autocomplete="off" placeholder="Name"/>' +
					'	 <div class="buttons">' +
					'        <button class="saveBtn" disabled="disabled">Save</button>' +
					'        <button class="cancelBtn">Cancel</button>' +
					'	</div>' +
					'</li></ol></fieldset>'), 
				nameIpt = saveFieldset.find('.nameField'), 
				saveBtn = saveFieldset.find('.saveBtn'), 
				cancelBtn = saveFieldset.find('.cancelBtn'),
				paramsIns = jQuery('<p>Select an action first</p>'),
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
									args = editor.utils.getFunctionParams(handler[method]);
								if (args.length > 0) {
									wgt.prmFieldset.show(200);
								}
								else {
									wgt.prmFieldset.hide();
								}
								wgt.prms.populateArgList(handler, method, args);
								wgt.prmInstructions.hide();
								wgt.invalidate();
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
			this.cancelBtn = cancelBtn;
			this.nameIpt = nameIpt;
			this.prmInstructions = paramsIns;
			
			this.axnTree = shorthand.createActionsTree();
			this.trgTree = shorthand.createTriggersTree();
							
			this.prms = new shorthand.Parameters({
					prefix: 'bhvEdt'
				});
			
			paramsFieldset.find('li').append(this.prms.getUI());
			paramsFieldset.find('legend').after(paramsIns);
				
			this.trgChooser = new BhvTreeSelector({
				tree: this.trgTree,
				select: selFcn
			}); 
			
			this.axnChooser = new BhvTreeSelector({
				tree: this.axnTree,
				select: selFcn
			});
			
			var li = jQuery('<li></li>');
			
			li.append(this.axnChooser.getUI());
			actionFieldset.find('ol').append(li);
			
			li = jQuery('<li></li>');
			
			li.append(this.trgChooser.getUI());
			triggerFieldset.find('ol').append(li);
			
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
					msgType = wgt.msgTarget ? editor.EventTypes.UpdateBehavior :
						editor.EventTypes.CreateBehavior;
				
				wgt.notifyListeners(msgType, data);
				wgt.reset();
				wgt.setVisible(false);
			});
			
			cancelBtn.bind('click', function(evt) {
				wgt.reset();
				wgt.setVisible(false);
			});
			
			nameIpt.bind('keyup', function(evt) {				
				wgt.checkSaveButton();
			});
			
			form.submit(function() { return false; });
			
			form.append(triggerFieldset).append(actionFieldset)
				.append(paramsFieldset).append(saveFieldset);
			this.container.append('<h1>Create Behavior</h1>').append(form);
			
			// save checking
			var trgChecker = new editor.ui.InputChecker(this.trgChooser),
				axnChecker = new editor.ui.InputChecker(this.axnChooser);
			
			trgChecker.saveable = axnChecker.saveable = function() {
				return this.input.getSelection() != null;
			};
			
			this.addInputsToCheck(nameIpt);
			this.addInputsToCheck(trgChecker);
			this.addInputsToCheck(axnChecker);
			this._super();
			this.setVisible(false);
		},
		
		reset: function() {
			this.trgChooser.reset();
			this.axnChooser.reset();
			this.prms.reset();
			this.prmInstructions.show();
			this.nameIpt.val('');
			
			reset(this.trgTree.getUI());
			reset(this.axnTree.getUI());
			
			this.checkSaveButton();
			this.msgTarget = null;
			this.invalidate();
		},
		
		setActor: function(actor, type, data, opt_spec) {
			this.reset();
			
			this.type = type;
			this.actor = actor;
			
			// special cases
			if (actor instanceof hemi.view.Viewpoint) {
				var vp = actor;
				
				switch(type) {
					case shorthand.BehaviorTypes.ACTION:
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
							this.prms.populateArgList(data.action.handler,
									data.action.method, data.args);
						}
						break;
					case shorthand.BehaviorTypes.TRIGGER:	
						var cmc = editor.treeData.createCamMoveCitizen(hemi.world.camera);
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
				case shorthand.BehaviorTypes.ACTION:
					// get the list of functions
					this.axnTree.restrictSelection(actor, getMethods(actor));
					// open up to the actor's node
					openNode(this.axnTree.getUI(), actor, this.axnTree.pre);
					break;
				case shorthand.BehaviorTypes.TRIGGER:
					this.trgTree.restrictSelection(actor, getMessages(actor));
					openNode(this.trgTree.getUI(), actor, this.trgTree.pre);		    
					break;
			}
			
			if (data instanceof hemi.dispatch.MessageTarget) {
				setByMsgTarget.call(this, data, opt_spec);
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
				};
				
				// load up the new data if it exists
				meta = this.getViewMeta(view);
				
				if (meta && meta.state && meta.widgetShouldBeVisible) {
					this.setActor(meta.state.actor, meta.state.type, 
						meta.state.data);
				}
			}
			
			this._super(view);
		},
		
		setTarget: function(msgTarget, spec) {
			setByMsgTarget.call(this, msgTarget, spec);
		},
		
		setTrigger: function(source, messages) {
			this.trgTree.restrictSelection(source, messages);
			openNode(this.trgTree.getUI(), source, this.trgTree.pre);
			
			var nodeId = editor.treeData.getNodeName(source, {
				option: messages[0],
				prefix: this.trgTree.pre,
				id: source.getId ? source.getId() : null
			});
			
			this.trgChooser.select(nodeId);
		},
		
		setVisible: function(visible, etc) {
			this._super(visible, etc);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                            Behavior List Widget	                          //
////////////////////////////////////////////////////////////////////////////////
	
	shorthand.BhvListItem = editor.ui.EditableListItem.extend({
		init: function(behaviorWidget) {
			this._super();
			
			this.isSorting = false;
			this.targets = new Hashtable();
			this.behaviorWidget = behaviorWidget;
		},
		
		add: function(msgTarget, spec, actor) {
			var li = new editor.ui.EditableListItem(),
				data = expandTargetData(msgTarget, spec),				
				name = getTriggerName(data);
			
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
					editor.EventTypes.ListItemEdit, {
						actor: obj,
						target: msgTarget
					});
			});
			
			li.removeBtn.bind('click', function(evt) {
				var msgTarget = li.getAttachedObject();
				msgTarget.actor = wgt.getAttachedObject();
				behaviorLiNotifier.notifyListeners(
					editor.EventTypes.ListItemRemove, msgTarget);
			});
		},
		
		finishLayout: function() {
			this._super();
			
			this.behaviorBtn = jQuery('<button class="behaviorBtn">Edit Behavior</button>');
			this.editBtn.after(this.behaviorBtn);
			
			this.behaviorBtn.bind('click', function() {
				shorthand.showBehaviorMenu(jQuery(this), 
					wgt.getAttachedObject(),
					wgt.behaviorWidget);
			});
			
			// attach the sub lists
			var loadHeader = jQuery('<h2>Attached Behaviors:</h2>'),
				evtList = jQuery('<div class="bhvListWrapper"></div>'),
				arrow = jQuery('<div class="bhvListArrow"></div>'),
				wgt = this;
			
			this.list = new editor.ui.List({
				cssClass: 'bhvList',
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
				data = expandTargetData(msgTarget, spec),
				name = getTriggerName(data);
			
			li.attachObject(msgTarget);
			li.setText(name.join('.') + ': ' + msgTarget.name);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                	   Setup	                              //
////////////////////////////////////////////////////////////////////////////////
	
	var behaviorWidget = null,
		behaviorLiTable = new Hashtable(),
		behaviorLiNotifier = new editor.utils.Listenable(),
		behaviorMenu = new editor.ui.PopupMenu(),
		addTriggerMnuItm = new editor.ui.MenuItem({
			title: 'Trigger a behavior',
			action: function(evt) {
				behaviorMenu.widget.setActor(behaviorMenu.actor, 
					shorthand.BehaviorTypes.TRIGGER);
				behaviorMenu.widget.setVisible(true);
			}
		}),
		addActionMnuItm = new editor.ui.MenuItem({
			title: 'Respond to a trigger',
			action: function(evt) {
				behaviorMenu.widget.setActor(behaviorMenu.actor, 
					shorthand.BehaviorTypes.ACTION);
				behaviorMenu.widget.setVisible(true);
			}
		});
		
	behaviorMenu.addMenuItem(addTriggerMnuItm);
	behaviorMenu.addMenuItem(addActionMnuItm);
	behaviorMenu.container.attr('id', 'behaviorMenu');
	
	shorthand.createBehaviorWidget = function() {
		var body = jQuery('body'),
			menuAdded = body.data('menuAdded');
			
		if (!menuAdded) {
			body.append(behaviorMenu.getUI()).data('menuAdded', true);
		}
		
		return new BehaviorWidget();
	};
		
	shorthand.showBehaviorMenu = function(parBtn, actor, bhvWgt) {		
		var position = parBtn.offset();
		
		position.top += parBtn.outerHeight();
		position.left -= behaviorMenu.container.outerWidth() - parBtn.outerWidth();
		behaviorMenu.show(position, parBtn);
		behaviorMenu.actor = actor,
		behaviorMenu.widget = bhvWgt;
	};
	
	shorthand.expandBehaviorData = expandTargetData;
	
	shorthand.getActionName = function(data) {
		return [data.handler.getCitizenType().split('.').pop(), data.method];
	};
	
	shorthand.getBehaviorListItem = function(actor) {
		return actor ? behaviorLiTable.get(actor) : null;
	};
	
	shorthand.getTriggerName = getTriggerName;
	
	shorthand.addBehaviorListItemListener = function(eventType, listener) {
		behaviorLiNotifier.addListener(eventType, listener);
	};
	
	shorthand.removeBehaviorListItemListener = function(listener) {
		behaviorLiNotifier.removeListener(listener);
	};
	
	return editor;
})(editor || {});
