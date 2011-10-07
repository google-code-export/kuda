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
	var shorthand = editor.tools.behavior = editor.tools.behavior || {};
	
	shorthand.events.ListItemEdit = 'behavior.listitemedit';
	shorthand.events.ListItemRemove = 'behavior.listitemremove';
	
////////////////////////////////////////////////////////////////////////////////
//                                Constants	    	                          //
////////////////////////////////////////////////////////////////////////////////
	
	shorthand.BehaviorTypes = {
		TRIGGER: 'trigger',
		ACTION: 'action',
		NA: 'na'
	};
			
	var axnTree = null,
		trgTree = null;
	
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
					source = shorthand.treeData.createShapePickCitizen(msgTarget.handler.citizen);
				} else {
					source = shorthand.treeData.createCamMoveCitizen(hemi.world.camera);
				}
			} else {
				source = spec.src === hemi.dispatch.WILDCARD ? shorthand.treeData.MSG_WILDCARD : spec.src;
				type = spec.msg === hemi.dispatch.WILDCARD ? shorthand.treeData.MSG_WILDCARD : spec.msg;
				handler = msgTarget.handler;
				method = msgTarget.func;
				argList = msgTarget.args;
			}
			
			argNames = meta.getParameters(handler.getCitizenType(), method);
			
			if (!argNames) {
				// If the metadata is missing, try the old way to get the
				// parameter names. Unfortunately this will be ugly if the
				// source is minified.
				argNames = editor.utils.getFunctionParams(handler[method]);
			}
				
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
			// viewpoint case
			else if (citizen.camMove) {
				// get the list of viewpoints
				var vps = hemi.world.getViewpoints();
				
				for (var i = 0, il = vps.length; i < il; i++) {
					msgs.push(vps[i].getId());
				}
			}			
			// shape pick case
			else if (citizen.shapePick) {
				// get list of shapes
				var shapes = hemi.world.getShapes();
				
				for (var i = 0, il = shapes.length; i < il; i++) {
					msgs.push(shapes[i].transform.shapes[0].name);
				}
				var models = hemi.world.getModels();
				
				for (var i = 0, il = models.length; i < il; i++) {
					var shapes = models[i].shapes;
					for (var j = 0, jl = shapes.length; j < jl; j++) {
						msgs.push(shapes[j].name);
					}					
				}
			}			
			
			return msgs;
		},
		
		getMethods = function(citizen) {		
			var methods = [],
				hasMore = false;

			for (propName in citizen) {
				var prop = citizen[propName];
				
				if (jQuery.isFunction(prop) && shorthand.treeData.methodsToRemove.indexOf(propName) === -1) {					
					hasMore = !shorthand.treeData.isCommon(citizen, propName);
					methods.push(propName);
				}
			}
			
			if (hasMore) {
				methods.push('MORE');
			}
			
			return methods;
		},
		
		getTriggerName = function(data) {
			var source = data.source,
				msgType,
				nameArr;
			
			if (data.type === shorthand.treeData.MSG_WILDCARD) {
				msgType = '[any trigger]';
			} else {
				msgType = data.type;
			}
			
			if (source === shorthand.treeData.MSG_WILDCARD) {
				nameArr = ['[any source]', msgType.split('.').pop()];
			} else if (hemi.utils.isNumeric(source)) {
				var cit = hemi.world.getCitizenById(source),
					citType = cit.getCitizenType().split('.').pop();
				
				nameArr = [citType, cit.name, msgType.split('.').pop()];
			} else {
				var trigType = source.getCitizenType().split('.').pop(),
					citName = source.citizen.name,
					argName;
				
				if (source.camMove) {
					argName = hemi.world.getCitizenById(msgType).name;
				} else {
					argName = msgType;
				}
				
				nameArr = [trigType, citName, argName];
			}
				
			return nameArr;
		},
		
		openNode = function(tree, citizen, prefix) {
			var nodeName = shorthand.treeData.getNodeName(citizen, {
					prefix: prefix,
					id: citizen.getId ? citizen.getId() : null
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
					
			var nodeName = shorthand.treeData.getNodeName(source, {
						option: data.type,
						prefix: trgTree.pre,
						id: source.getId ? source.getId() : null
					}),				
				trgT = trgTree.getUI(),
				axnT = axnTree.getUI();
			
			openNode(trgT, source, trgTree.pre);
			this.trgChooser.select(nodeName);
			
			nodeName = shorthand.treeData.getNodeName(data.handler, {
				option: data.method,
				prefix: axnTree.pre,
				id: data.handler.getId()
			});
			
			openNode(axnT, data.handler, axnTree.pre);
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
					nodeName = shorthand.treeData.getNodeName(cit, {
						option: msg,
						prefix: trgTree.pre,
						id: cit.getId()
					});
				
				this.trgChooser.select(nodeName);
				openNode(trgTree.getUI(), cit, trgTree.pre);
			}
			if (data.action) {
				var handler = data.action.handler,
					func = data.action.method,
					nodeName = shorthand.treeData.getNodeName(handler, {
						option: [func],
						prefix: axnTree.pre,
						id: handler.getId()
					});
				
				openNode(axnTree.getUI(), handler, axnTree.pre);
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
			var pnl = this.panel;
			
			this.tree = tree.tree;
			this.tree.bind('select_node.jstree', this.selFcn).addClass('treeSelectorTree');
			pnl.append(this.tree);
			this.input.attr('placeholder', 'Select an item');
			
			this.treeBorder = Math.ceil(parseFloat(pnl.css('borderRightWidth'))) 
				+ Math.ceil(parseFloat(pnl.css('borderLeftWidth')));
			this.treePadding = Math.ceil(parseFloat(pnl.css('paddingLeft'))) 
				+ Math.ceil(parseFloat(pnl.css('paddingRight')));
		},
		
		rebindTree: function() {
			this.tree.unbind('select_node.jstree')
				.bind('select_node.jstree', this.selFcn);
			this.panel.append(this.tree);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                	Widget		                              //
////////////////////////////////////////////////////////////////////////////////
		
	var BehaviorWidget = editor.ui.FormWidget.extend({
		init: function(options) {
			this._super(jQuery.extend({
				name: 'behaviorWidget'
			}, options));
		},
		
		checkRestrictions: function() {
			if (this.restrictions) {
				var actor = this.restrictions.actor,
					type = this.restrictions.type;
					
				if (type === shorthand.BehaviorTypes.ACTION) {
				 	axnTree.restrictSelection(actor, getMethods(actor));
				}
				else {
					trgTree.restrictSelection(actor, getMessages(actor));
				}
			}
			else {
				reset(axnTree.getUI());
				reset(trgTree.getUI());
			}
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
		
		layout: function() {			
			this._super();
			
			var form = jQuery('<form class="noSteps" action="" method="post"></form>'), 
				triggerFieldset = jQuery('<fieldset><legend>Select a Trigger</legend><ol></ol></fieldset>'), 
				actionFieldset = jQuery('<fieldset><legend>Select an Action</legend><ol id="behaviorAxnSelect"></ol><ol id="behaviorAxnParams"><li></li></ol></fieldset>'),
				paramsList = actionFieldset.find('#behaviorAxnParams').hide(), 
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
									wgt.prmList.show(200, function() {
										wgt.invalidate();
									});
									wgt.axnChooser.getUI().addClass('hasValue');
								}
								else {
									wgt.prmList.hide();
									wgt.axnChooser.getUI().removeClass('hasValue');
									wgt.invalidate();
								}
								wgt.prms.populateArgList(handler, method, args);
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
			this.savFieldset = saveFieldset;
			this.prmList = paramsList;
			this.saveBtn = saveBtn;
			this.cancelBtn = cancelBtn;
			this.nameIpt = nameIpt;
							
			this.prms = new shorthand.Parameters({
					prefix: 'bhvEdt'
				});
			
			paramsList.find('li').append(this.prms.getUI());
				
			// init trees
			if (axnTree == null) {
				axnTree = shorthand.createActionsTree();
			}
			if (trgTree == null) {				
				trgTree = shorthand.createTriggersTree();
			}
			
			this.trgChooser = new BhvTreeSelector({
				tree: trgTree,
				select: selFcn
			}); 
			
			this.axnChooser = new BhvTreeSelector({
				tree: axnTree,
				select: selFcn
			});
			
			var li = jQuery('<li></li>');
			
			li.append(this.axnChooser.getUI());
			actionFieldset.find('#behaviorAxnSelect').append(li);
			
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
					msgType = wgt.msgTarget ? shorthand.events.UpdateBehavior :
						shorthand.events.CreateBehavior;
				
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
			
			form.append(triggerFieldset).append(actionFieldset).append(saveFieldset);
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
			
			this.setVisible(false);
		},
		
		reset: function() {
			this.trgChooser.reset();
			this.axnChooser.reset();
			this.axnChooser.getUI().removeClass('hasValue');
			this.prms.reset();
			this.nameIpt.val('');
			
			reset(trgTree.getUI());
			reset(axnTree.getUI());
			
			this.checkSaveButton();
			this.msgTarget = null;
			this.invalidate();
			
			// clear restrictions
			this.restrictions = null;
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
							data = {
								action: {
									handler: actor,
									method: 'moveToView'
								},
								args: [{
									name: 'view',
									value: 'id:' + vp.getId()
								}]
							};
							this.prms.populateArgList(data.action.handler,
									data.action.method, data.args);
						}
						break;
					case shorthand.BehaviorTypes.TRIGGER:	
						var cmc = shorthand.treeData.createCamMoveCitizen(hemi.world.camera);
						actor = cmc;
						
						if (!data) {
							data = {
								trigger: {
									citizen: cmc,
									type: vp.getId()
								}
							};
						}
						break;
				}
			} 
			else if (actor instanceof hemi.shape.Shape 
					&& type === shorthand.BehaviorTypes.TRIGGER) {
				var shp = actor,
					spc = shorthand.treeData.createShapePickCitizen(actor);
				
				actor = spc;
				
				if (!data) {
					data = {
						trigger: {
							citizen: spc,
							type: shp.transform.shapes[0].name
						}
					}
				}
			}
			
		    this.axnFieldset.show();
			this.trgFieldset.show();
			this.savFieldset.show();
			
			switch(type) {
				case shorthand.BehaviorTypes.ACTION:
					// get the list of functions
					axnTree.restrictSelection(actor, getMethods(actor));
					// open up to the actor's node
					openNode(axnTree.getUI(), actor, axnTree.pre);
					break;
				case shorthand.BehaviorTypes.TRIGGER:
					trgTree.restrictSelection(actor, getMessages(actor));
					openNode(trgTree.getUI(), actor, trgTree.pre);		    
					break;
			}
					
			// save restriction state
			this.restrictions = {
				actor: actor,
				type: type
			}
			
			if (data instanceof hemi.dispatch.MessageTarget) {
				setByMsgTarget.call(this, data, opt_spec);
			}
			else if (data != null) {
				setBySavedData.call(this, data, actor);
			}
		},
		
		setTarget: function(msgTarget, spec) {
			this.reset();
			setByMsgTarget.call(this, msgTarget, spec);
		},
		
		setTrigger: function(source, messages) {
			trgTree.restrictSelection(source, messages);
			openNode(trgTree.getUI(), source, trgTree.pre);
			
			var nodeId = shorthand.treeData.getNodeName(source, {
				option: messages[0],
				prefix: trgTree.pre,
				id: source.getId ? source.getId() : null
			});
			
			this.trgChooser.select(nodeId);
		},
		
		setVisible: function(visible, etc) {
			if (visible) {
				this.axnChooser.rebindTree();
				this.trgChooser.rebindTree();
				
				this.checkRestrictions();
			}
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
		
		add: function(msgTarget, spec) {
			if (this.targets.get(msgTarget.dispatchId) == null) {
				var li = new editor.ui.EditableListItem(), 
					data = expandTargetData(msgTarget, spec), 
					name = getTriggerName(data);
				
				li.setText(name.join('.') + ': ' + msgTarget.name);
				li.attachObject(msgTarget);
				
				this.bindButtons(li);
				this.list.add(li);
				
				this.targets.put(msgTarget.dispatchId, li);
			}
		},
		
		attachObject: function(obj) {
			this._super(obj);
			
			detectTriggersAndActions.call(this, obj);
			behaviorLiTable.put(obj, this);
		},
		
		bindButtons: function(li) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var msgTarget = li.getAttachedObject(),
					obj = wgt.getAttachedObject();
				
				behaviorLiNotifier.notifyListeners(
					shorthand.events.ListItemEdit, {
						target: msgTarget,
						widget: wgt.behaviorWidget
					});
			});
			
			li.removeBtn.bind('click', function(evt) {
				var msgTarget = li.getAttachedObject();
				msgTarget.actor = wgt.getAttachedObject();
				behaviorLiNotifier.notifyListeners(
					shorthand.events.ListItemRemove, msgTarget);
			});
		},
		
		layout: function() {
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
		
		update: function(msgTarget, spec) {
			var li = this.targets.get(msgTarget.dispatchId),
				data = expandTargetData(msgTarget, spec),
				name = getTriggerName(data);
			
			li.attachObject(msgTarget);
			li.setText(name.join('.') + ': ' + msgTarget.name);
		}
	});
	
	var detectTriggersAndActions = function(citizen) {
		editor.getDispatchProxy().swap();
		var specs = hemi.dispatch.getSpecs(),
			id = citizen.getId();
		
		for (var i = 0, il = specs.length; i < il; i++) {
			var spec = specs[i];
			
			if (spec.src === id) {
				// triggers
				for (var k = 0, kl = spec.targets.length; k < kl; k++) {
					var target = spec.targets[k];
					
					if (!jQuery.isFunction(target.handler)) {
						this.add(spec.targets[k], spec);
					}
				}
			}
			else {
				// actions				
				for (var k = 0, kl = spec.targets.length; k < kl; k++) {
					var target = spec.targets[k],
						compId;
					
					// valuecheck case
					if (target.handler instanceof hemi.handlers.ValueCheck) {
						if (target.handler.citizen instanceof hemi.view.Camera){
							compId = target.handler.values[0];
						}
						else if (target.handler.citizen instanceof hemi.model.Model) {
							compId = target.handler.handler.getId();
						}
						else {
							compId = target.handler.citizen.getId();
						}
					}
					else {
						compId = target.handler.getId ? target.handler.getId() : null;
					}
					
					if (compId === id) {
						this.add(target, spec);
					}
				}
			}
		}
		editor.getDispatchProxy().unswap();
	};
	
////////////////////////////////////////////////////////////////////////////////
//                                	   Setup	                              //
////////////////////////////////////////////////////////////////////////////////
	
	var behaviorLiTable = new Hashtable(),
		behaviorLiNotifier = new editor.utils.Listenable(),
		behaviorMenu = new editor.ui.PopupMenu(),
		addTriggerMnuItm = new editor.ui.MenuItem({
			title: 'Trigger a behavior',
			action: function(evt) {
				behaviorMenu.widget.setVisible(true);
				behaviorMenu.widget.setActor(behaviorMenu.actor, 
					shorthand.BehaviorTypes.TRIGGER);
			}
		}),
		addActionMnuItm = new editor.ui.MenuItem({
			title: 'Respond to a trigger',
			action: function(evt) {
				behaviorMenu.widget.setVisible(true);
				behaviorMenu.widget.setActor(behaviorMenu.actor, 
					shorthand.BehaviorTypes.ACTION);
			}
		});
		
	behaviorMenu.addMenuItem(addTriggerMnuItm);
	behaviorMenu.addMenuItem(addActionMnuItm);
	behaviorMenu.container.attr('id', 'behaviorMenu');
	
	shorthand.createBehaviorWidget = function(options) {
		var body = jQuery('body'),
			menuAdded = body.data('menuAdded');
			
		if (!menuAdded) {
			body.append(behaviorMenu.getUI()).data('menuAdded', true);
		}
		
		return new BehaviorWidget(options);
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
		var handler = data.handler;
		
		return [handler.getCitizenType().split('.').pop(), handler.name, data.method];
	};
	
	shorthand.modifyBehaviorListItems = function(msgTarget, spec, opt_method) {
		var data = expandTargetData(msgTarget, spec),
			source = data.source,
			method = opt_method == null || (opt_method != 'add' && 
				opt_method != 'update' && opt_method != 'remove') ? 'add' : 
				opt_method,
			li = null;
		
		// check special cases
		if (source.camMove) {
			li = behaviorLiTable.get(hemi.world.getCitizenById(data.type));
		}
		else if (source.shapePick && source.citizen instanceof hemi.shape.Shape) {
			li = behaviorLiTable.get(source.citizen);
		}
		else if (source !== shorthand.treeData.MSG_WILDCARD && !source.shapePick) {
			li = behaviorLiTable.get(hemi.world.getCitizenById(source));
		}
		
		if (li != null)  {
			li[method](msgTarget, spec);
			li = null;
		}
			
		if (data.method === 'moveToView' && data.handler.getCitizenType() === 'hemi.view.Camera') {
			var id = parseInt(data.args[0].value.replace('id:', ''));
			li = behaviorLiTable.get(hemi.world.getCitizenById(id));				
		}
		else {
			li = behaviorLiTable.get(data.handler);
		}
		
		if (li != null) {
			li[method](msgTarget, spec);
		}
	};
	
	shorthand.getTriggerName = getTriggerName;
	
	shorthand.addBehaviorListItemListener = function(eventType, listener) {
		behaviorLiNotifier.addListener(eventType, listener);
	};
	
	shorthand.removeBehaviorListItemListener = function(listener) {
		behaviorLiNotifier.removeListener(listener);
	};
	
})();
