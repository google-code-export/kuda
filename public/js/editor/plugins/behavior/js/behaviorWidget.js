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
	"use strict";
	
	var shorthand = editor.tools.behavior;
	
	shorthand.events.ListItemEdit = 'behavior.listitemedit';
	shorthand.events.ListItemRemove = 'behavior.listitemremove';
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	shorthand.BehaviorTypes = {
		TRIGGER: 'trigger',
		ACTION: 'action',
		NA: 'na'
	};
			
	var axnTree = null,
		trgTree = null,
		behaviorLiTable = new Hashtable(),
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
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Widget Helpers
////////////////////////////////////////////////////////////////////////////////////////////////////
		
	function expandTargetData(msgTarget, spec) {
		var isValueCheck = msgTarget.handler instanceof hemi.ValueCheck,
			meta = editor.data.getMetaData(),
			args = [],
			source, type, handler, method, argList, argNames;
		
		if (isValueCheck) {
			type = msgTarget.handler.values[0];
			handler = msgTarget.handler.handler;
			method = msgTarget.handler.func;
			argList = msgTarget.handler.args;
			
			if (spec.msg === hemi.msg.keyDown || spec.msg === hemi.msg.keyUp ||
					spec.msg === hemi.msg.keyPress) {
				source = shorthand.treeData.MSG_WILDCARD;
				type = spec.msg;
			} else if (spec.src === hemi.dispatch.WILDCARD) {
				source = shorthand.treeData.createShapePickCitizen(msgTarget.handler.citizen);
			} else {
				source = shorthand.treeData.createCamMoveCitizen(editor.client.camera);
			}
		} else {
			source = spec.src === hemi.dispatch.WILDCARD ? shorthand.treeData.MSG_WILDCARD : spec.src;
			type = spec.msg === hemi.dispatch.WILDCARD ? shorthand.treeData.MSG_WILDCARD : spec.msg;
			handler = msgTarget.handler;
			method = msgTarget.func;
			argList = msgTarget.args;
		}
		
		argNames = meta.getParameters(handler._octaneType, method);
		
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
	}
	
	function getMessages(citizen) {
		var msgs = [],
			id = citizen._getId(),
			i, il, j, jl;
		
		if (citizen._msgSent) {
			msgs.push('Any');
			
			for (var ndx = 0, len = citizen._msgSent.length; ndx < len; ndx++) {
				msgs.push('messages_' + citizen._msgSent[ndx]);
			}
		}
		// viewpoint case
		else if (citizen.camMove) {
			// get the list of viewpoints
			var vps = hemi.world.getViewpoints();
			
			for (i = 0, il = vps.length; i < il; i++) {
				msgs.push(vps[i]);
			}
		}			
		// shape pick case
		else if (citizen.shapePick) {
			// get list of shapes
			var shapes = hemi.world.getShapes();
			
			for (i = 0, il = shapes.length; i < il; i++) {
				msgs.push(shapes[i].name);
			}
			var models = hemi.world.getModels();
			
			for (i = 0, il = models.length; i < il; i++) {
				var geometries = models[i].geometries;
				for (j = 0, jl = geometries.length; j < jl; j++) {
					msgs.push(geometries[j].name);
				}					
			}
		}			
		
		return msgs;
	}
	
	function getMethods(citizen) {		
		var methods = [],
			hasMore = false;

		for (var propName in citizen) {
			var prop = citizen[propName];
			
			if (jQuery.isFunction(prop) && shorthand.treeData.methodsToRemove.indexOf(propName) === -1) {					
				hasMore = !shorthand.treeData.isCommon(citizen, propName);
				methods.push(shorthand.constants.FUNCTIONS + '_' + propName);
			}
		}
		
		if (hasMore) {
			methods.push(shorthand.constants.FUNCTIONS_MORE);
		}
		
		return methods;
	}
	
	function getTriggerName(data) {
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
				citType = cit._octaneType.split('.').pop();
			
			nameArr = [citType, cit.name, msgType.split('.').pop()];
		} else {
			var trigType = source._octaneType.split('.').pop(),
				citName = source.citizen.name,
				argName;
			
			if (source.camMove) {
				argName = hemi.world.getCitizenById(msgType).name;
			} else if (source.shapePick) {
				trigType = source.citizen._octaneType.split('.').pop();
				citName += '.pickedShape';
				argName = msgType;
			} else if (trigType === 'Mesh' || trigType === 'Transform') {
			} else {
				argName = msgType;
			}
			
			nameArr = [trigType, citName, argName];
		}
			
		return nameArr;
	}
	
	function openNode(treeWgt, citizen, prefix) {
		var nodeName = shorthand.treeData.getNodeName(citizen, {
				prefix: prefix
			}),
			tree = treeWgt.getUI(),
			cons = shorthand.constants,
			node, path;
		
		treeWgt.generateNodes(nodeName);

		// special cases
		tree.jstree('open_node', jQuery('#' + nodeName, tree), false, true);
		tree.jstree('open_node', jQuery('#' + nodeName + '_' + cons.FUNCTIONS, tree), false, true);
		tree.jstree('open_node', jQuery('#' + nodeName + '_' + cons.FUNCTIONS_MORE, tree), false, 
			true);
		tree.jstree('open_node', jQuery('#' + nodeName + '_' + cons.TRANSFORMS, tree), false, true);
		tree.jstree('open_node', jQuery('#' + nodeName + '_' + cons.MESSAGES, tree), false, true);
		tree.jstree('open_node', jQuery('#' + nodeName + '_' + cons.SHAPE_PICK, tree), false, true);
	}
	
	function reset(tree) {
		tree.removeClass('restricted');
		tree.find('a').removeClass('restrictedSelectable');
		tree.jstree('close_all');
	}
	
	function setByMsgTarget(wgt, msgTarget, spec) {
		var data = expandTargetData(msgTarget, spec),
			source = hemi.utils.isNumeric(data.source) ? 
				hemi.world.getCitizenById(data.source) : data.source,
			node = source,
			cfg = { prefix: trgTree.pre };
		
		if (source._octaneType && source._octaneType === shorthand.constants.SHAPE_PICK) {
			// shape pick case
			node = source.citizen;
			cfg.option = shorthand.constants.SHAPE_PICK + '_' + data.type.replace(/_/g, '-') || '';
		} else if (source._octaneType && source._octaneType === shorthand.constants.CAM_MOVE) {
			node = hemi.world.getCitizenById(data.type);
			cfg.parent = shorthand.treeData.createCamMoveCitizen(editor.client.camera);
		} else {
			cfg.option = data.type;
		}
		openNode(trgTree, node, trgTree.pre);
		var nodeName = shorthand.treeData.getNodeName(node, cfg);
		
		wgt.trgChooser.select(nodeName);

		if (data.type === hemi.msg.keyDown || data.type === hemi.msg.keyUp ||
				data.type === hemi.msg.keyPress) {
			wgt.trgPrmLst.show(200, function() {
				wgt.invalidate();
			});
			wgt.keySelector.getUI().show();
			wgt.keySelector.setValue(msgTarget.handler.values[0]);
		}
		
		nodeName = shorthand.treeData.getNodeName(data.handler, {
			option: shorthand.constants.FUNCTIONS + '_' + data.method,
			prefix: axnTree.pre
		});
		
		openNode(axnTree, data.handler, axnTree.pre);

		if (jQuery('#' + nodeName, axnTree.getUI()).length === 0) {
			nodeName = shorthand.treeData.getNodeName(data.handler, {
				option: shorthand.constants.FUNCTIONS_MORE + '_' + data.method,
				prefix: axnTree.pre
			});
		}

		wgt.axnChooser.select(nodeName);	
		
		var il = data.args.length;
		
		if (il) {
			wgt.axnPrmList.show(200, function() {
				wgt.invalidate();
			});
		}

		for (var i = 0; i < il; i++) {
			var a = data.args[i];				
			wgt.prms.setArgument(a.name, a.value);
		}
		
		wgt.nameIpt.val(msgTarget.name);
		wgt.msgTarget = msgTarget;
		wgt.checkSaveButton();
	}
	
	function setBySavedData(wgt, data, actor) {
		var nodeName;

		if (data.trigger) {
			var msg = data.trigger.type, 
				cit = data.trigger.citizen,
				cfg = { prefix: trgTree.pre },
				node = cit;

			// cam move case
			if (cit._octaneType === shorthand.constants.CAM_MOVE) {
				node = hemi.world.getCitizenById(msg);
				cfg.parent = cit;
			} else {
				cfg.option = msg;
			}
			nodeName = shorthand.treeData.getNodeName(node, cfg);
			
			wgt.trgChooser.select(nodeName);
			openNode(trgTree, cit, trgTree.pre);
		}
		if (data.action) {
			var handler = data.action.handler,
				func = data.action.method;

			nodeName = shorthand.treeData.getNodeName(handler, {
				option: shorthand.constants.FUNCTIONS + '_' + func,
				prefix: axnTree.pre
			});
			
			openNode(axnTree, handler, axnTree.pre);

			if (jQuery('#' + nodeName, axnTree.getUI()).length === 0) {
				nodeName = shorthand.treeData.getNodeName(data.handler, {
					option: shorthand.constants.FUNCTIONS_MORE + '_' + func,
					prefix: axnTree.pre
				});
			}

			wgt.axnChooser.select(nodeName);
		}
		if (data.args) {					
			for (var i = 0, il = data.args.length; i < il; i++) {
				var a = data.args[i];				
				wgt.prms.setArgument(a.name, a.value);
			}
		}
		
		wgt.nameIpt.val(data.name);
		wgt.checkSaveButton();			
	}
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Custom Tree Selector
////////////////////////////////////////////////////////////////////////////////////////////////////
		
	
	var BhvTreeSelector = function(options) {
		editor.ui.TreeSelector.call(this, options);
	};
		
	BhvTreeSelector.prototype = new editor.ui.TreeSelector();
	BhvTreeSelector.prototype.constructor = BhvTreeSelector;
		
	BhvTreeSelector.prototype.setTree = function(tree) {
		var pnl = this.panel;
		
		this.tree = tree.tree;
		this.tree.bind('select_node.jstree', this.selFcn).addClass('treeSelectorTree');
		pnl.append(this.tree);
		this.input.attr('placeholder', 'Select an item');
		
		this.treeBorder = Math.ceil(parseFloat(pnl.css('borderRightWidth'))) + 
			Math.ceil(parseFloat(pnl.css('borderLeftWidth')));
		this.treePadding = Math.ceil(parseFloat(pnl.css('paddingLeft'))) + 
			Math.ceil(parseFloat(pnl.css('paddingRight')));
	};
	
	BhvTreeSelector.prototype.rebindTree = function() {
		this.tree.unbind('select_node.jstree')
			.bind('select_node.jstree', this.selFcn);
		this.panel.append(this.tree);
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Widget
////////////////////////////////////////////////////////////////////////////////////////////////////
		
	var BehaviorWidget = function(options) {
		editor.ui.FormWidget.call(this, jQuery.extend({
			name: 'behaviorWidget'
		}, options));
	};
	var bhvWgtSuper = editor.ui.FormWidget.prototype;
		
	BehaviorWidget.prototype = new editor.ui.FormWidget();
	BehaviorWidget.prototype.constructor = BehaviorWidget;
		
	BehaviorWidget.prototype.checkRestrictions = function() {
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
	};
	
	BehaviorWidget.prototype.checkSaveButton = function() {
		var btn = this.saveBtn,
			saveable = this.checkSaveable();
		
		if (saveable) {
			btn.removeAttr('disabled');
		}
		else {
			btn.attr('disabled', 'disabled');
		}
	};
	
	BehaviorWidget.prototype.layout = function() {			
		bhvWgtSuper.layout.call(this);
		
		var form = jQuery('<form class="noSteps" action="" method="post"></form>'), 
			triggerFieldset = jQuery('<fieldset><legend>Select a Trigger</legend><ol class="behaviorTrgSelect" /><ol class="behaviorTrgParams"><li /></ol></fieldset>'), 
			actionFieldset = jQuery('<fieldset><legend>Select an Action</legend><ol class="behaviorAxnSelect" /><ol class="behaviorAxnParams"><li /></ol></fieldset>'),
			axnParamsList = actionFieldset.find('.behaviorAxnParams').hide(), 
			trgParamsList = triggerFieldset.find('.behaviorTrgParams').hide(),
			saveFieldset = jQuery('<fieldset><legend>Save Behavior</legend><ol>' +
				'<li>' +
				'    <input type="text" class="nameField" autocomplete="off" placeholder="Name"/>' +
				'    <div class="buttons">' +
				'        <button class="saveBtn" disabled="disabled">Save</button>' +
				'        <button class="cancelBtn">Cancel</button>' +
				'    </div>' +
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
				
				if (metadata.type === 'citType' || metadata.type === 'set' ||
						metadata.type === 'citizen') {
					selector.tree.jstree('open_node', elem, false, false);
					return false;
				}
				else {
					var dta = {};
					
					if (!isSelectable && isRestricted) {
						return false;
					}
					else {
						if (selector === wgt.axnChooser) {
							var handler = metadata.parent,
								method = path[path.length-1],
								args = editor.utils.getFunctionParams(handler[method]);
							if (args.length > 0) {
								wgt.axnPrmList.show(200, function() {
									// can be repetitive, but needs to be here due to the show 
									// animation
									wgt.invalidate();
								});
								wgt.axnChooser.getUI().addClass('hasValue');
							}
							else {
								wgt.axnPrmList.hide();
								wgt.axnChooser.getUI().removeClass('hasValue');
							}
							wgt.prms.populateArgList(handler, method, args);
							dta.handler = handler;
							dta.method = method;
							wgt.invalidate();
						}
						else {
							dta.citizen = metadata.parent;
							dta.type = metadata.msg;
							console.log(dta.citizen);

							var key = wgt.keySelector,
								keyUI = key.getUI();

							if (dta.type === hemi.msg.keyDown) {
								key.reset();
								keyUI.show();
								wgt.trgPrmLst.show(200, function() {
									wgt.invalidate();
								});
							}
							else {
								keyUI.hide();
								wgt.trgPrmLst.hide();
							}
						}
						selector.input.val(path.join('.').replace(
							/\.More\.\.\.|\.messages|\.functions|\.transforms/g, '').replace(
							/pickable shapes/g, 'pickedShape'));
						selector.setSelection(dta);
						
						wgt.checkSaveButton();
						return true;
					}
				}
			};
		
		this.trgFieldset = triggerFieldset;
		this.axnFieldset = actionFieldset;
		this.savFieldset = saveFieldset;
		this.axnPrmList = axnParamsList;
		this.trgPrmLst = trgParamsList;
		this.saveBtn = saveBtn;
		this.cancelBtn = cancelBtn;
		this.nameIpt = nameIpt;
						
		this.prms = new shorthand.Parameters({
				prefix: 'bhvEdt'
			});
		this.keySelector = new shorthand.KeyTriggerSelector();
		
		axnParamsList.find('li').append(this.prms.getUI());
		trgParamsList.find('li').append(this.keySelector.getUI());
			
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
		actionFieldset.find('.behaviorAxnSelect').append(li);
		
		li = jQuery('<li></li>');
		
		li.append(this.trgChooser.getUI());
		triggerFieldset.find('.behaviorTrgSelect').append(li);
		
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
			
			if (wgt.keySelector.getUI().is(':visible')) {
				data.keyTrigger = wgt.keySelector.getValue();
			}

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
	};
	
	BehaviorWidget.prototype.reset = function() {
		this.trgChooser.reset();
		this.axnChooser.reset();
		this.axnChooser.getUI().removeClass('hasValue');
		this.prms.reset();
		this.keySelector.reset();
		this.nameIpt.val('');
		
		reset(trgTree.getUI());
		reset(axnTree.getUI());
		
		this.axnPrmList.hide();
		this.trgPrmLst.hide();
		this.keySelector.getUI().hide();
		this.checkSaveButton();
		this.msgTarget = null;
		this.invalidate();
		
		// clear restrictions
		this.restrictions = null;
	};
	
	BehaviorWidget.prototype.setActor = function(actor, type, data, opt_spec) {
		this.reset();
		
		this.type = type;
		this.actor = actor;
		
		// special cases
		if (actor instanceof hemi.Viewpoint) {
			var vp = actor;
			
			switch(type) {
				case shorthand.BehaviorTypes.ACTION:
					actor = editor.client.camera;	
					
					if (!data) {
						data = {
							action: {
								handler: actor,
								method: 'moveToView'
							},
							args: [{
								name: 'view',
								value: 'id:' + vp._getId()
							}]
						};
						this.prms.populateArgList(data.action.handler,
								data.action.method, data.args);
					}
					break;
				case shorthand.BehaviorTypes.TRIGGER:	
					var cmc = shorthand.treeData.createCamMoveCitizen(editor.client.camera);
					actor = cmc;
					
					if (!data) {
						data = {
							trigger: {
								citizen: cmc,
								type: vp._getId()
							}
						};
					}
					break;
			}
		} 
		else if (actor instanceof hemi.Shape && 
				type === shorthand.BehaviorTypes.TRIGGER) {
			var shp = actor,
				spc = shorthand.treeData.createShapePickCitizen(actor);
			
			actor = spc;
			
			if (!data) {
				data = {
					trigger: {
						citizen: spc,
						type: shp.name
					}
				};
			}
		}
		
		this.axnFieldset.show();
		this.trgFieldset.show();
		this.savFieldset.show();
		
		switch(type) {
			case shorthand.BehaviorTypes.ACTION:
				// open up to the actor's node
				openNode(axnTree, actor, axnTree.pre);
				axnTree.restrictSelection(actor, getMethods(actor));
				break;
			case shorthand.BehaviorTypes.TRIGGER:
				openNode(trgTree, actor, trgTree.pre);
				trgTree.restrictSelection(actor, getMessages(actor));
				break;
		}
				
		// save restriction state
		this.restrictions = {
			actor: actor,
			type: type
		};
		
		if (data instanceof hemi.dispatch.MessageTarget) {
			setByMsgTarget(this, data, opt_spec);
		}
		else if (data != null) {
			setBySavedData(this, data, actor);
		}
	};
	
	BehaviorWidget.prototype.setTarget = function(msgTarget, spec) {
		this.reset();
		setByMsgTarget(this, msgTarget, spec);
	};
	
	BehaviorWidget.prototype.setTrigger = function(source, messages) {
		var cit = source, 
			cfg = { prefix: trgTree.pre },
			opt = [];

		if (source._octaneType === shorthand.constants.CAM_MOVE) {
			var vpt = hemi.world.getCitizenById(messages[0]);
			cfg.option = vpt._octaneType.split('.').pop() + '-' + vpt._getId();
			opt.push(vpt);
		} else {
			cfg.option = shorthand.constants.MESSAGES + '_' + messages[0].replace(/\./g, '-');

			for (var i = 0, il = messages.length; i < il; i++) {
				opt.push(shorthand.constants.MESSAGES + '_' + messages[i]);
			}
		}

		openNode(trgTree, source, trgTree.pre);
		
		var nodeId = shorthand.treeData.getNodeName(source, cfg);
		
		this.trgChooser.select(nodeId);
		trgTree.restrictSelection(cit, opt);
	};
	
	BehaviorWidget.prototype.setVisible = function(visible, etc) {
		if (visible) {
			this.axnChooser.rebindTree();
			this.trgChooser.rebindTree();
			
			this.checkRestrictions();
		}
		bhvWgtSuper.setVisible.call(this, visible, etc);
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Behavior List Widget
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	function detectTriggersAndActions(bhvLi, citizen) {
		editor.getDispatchProxy().swap();
		var specs = hemi.dispatch.getSpecs(),
			id = citizen._getId(),
			i, il, k, kl, target;
		
		for (i = 0, il = specs.length; i < il; i++) {
			var spec = specs[i];
			
			if (spec.src === id) {
				// triggers
				for (k = 0, kl = spec.targets.length; k < kl; k++) {
					target = spec.targets[k];
					
					if (!jQuery.isFunction(target.handler)) {
						bhvLi.add(spec.targets[k], spec);
					}
				}
			}
			else {
				// actions				
				for (k = 0, kl = spec.targets.length; k < kl; k++) {
					target = spec.targets[k];
					var compId;
					
					// valuecheck case
					if (target.handler instanceof hemi.ValueCheck) {
						if (target.handler.citizen instanceof hemi.Camera){
							compId = target.handler.values[0];
						} else if (target.handler.citizen instanceof hemi.Model) {
							compId = target.handler.handler._getId();
						} else if (target.handler.citizen == null) {
							compId = null;
						} else {
							compId = target.handler.citizen._getId();
						}
					}
					else {
						compId = target.handler._getId ? target.handler._getId() : null;
					}
					
					if (compId === id) {
						bhvLi.add(target, spec);
					}
				}
			}
		}
		editor.getDispatchProxy().unswap();
	}
	
	shorthand.BhvListItem = function(behaviorWidget) {
		editor.ui.EditableListItem.call(this);
		
		this.isSorting = false;
		this.targets = new Hashtable();
		this.behaviorWidget = behaviorWidget;
	};
	var bhvLiSuper = editor.ui.EditableListItem.prototype;
		
	shorthand.BhvListItem.prototype = new editor.ui.EditableListItem();
	shorthand.BhvListItem.prototype.constructor = shorthand.BhvListItem;
		
	shorthand.BhvListItem.prototype.add = function(msgTarget, spec) {
		if (this.targets.get(msgTarget._dispatchId) == null) {
			var li = new editor.ui.EditableListItem(), 
				data = expandTargetData(msgTarget, spec), 
				name = getTriggerName(data);
			
			li.setText(name.join('.') + ': ' + msgTarget.name);
			li.attachObject(msgTarget);
			
			this.bindButtons(li);
			this.list.add(li);
			
			this.targets.put(msgTarget._dispatchId, li);
		}
	};
	
	shorthand.BhvListItem.prototype.attachObject = function(obj) {
		bhvLiSuper.attachObject.call(this, obj);
		
		detectTriggersAndActions(this, obj);
		behaviorLiTable.put(obj, this);
	};
	
	shorthand.BhvListItem.prototype.bindButtons = function(li) {
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
	};
	
	shorthand.BhvListItem.prototype.layout = function() {
		var wgt = this;

		bhvLiSuper.layout.call(this);
		
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
			arrow = jQuery('<div class="bhvListArrow"></div>');
		
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
			
			if (evt.target.tagName !== 'BUTTON' && 
					tgt.parents('.bhvListWrapper').size() === 0 && 
					!tgt.hasClass('bhvListWrapper') && 
					!wgt.isSorting) {
				arrow.toggle(100);
				evtList.slideToggle(200);
			}
		});		
	};
	
	shorthand.BhvListItem.prototype.remove = function(msgTarget) {
		var li = this.targets.get(msgTarget._dispatchId);
		
		this.list.remove(li);
		
		this.targets.remove(msgTarget._dispatchId);
	};
	
	shorthand.BhvListItem.prototype.setParent = function(parent) {
		bhvLiSuper.setParent.call(this);
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
	};
	
	shorthand.BhvListItem.prototype.update = function(msgTarget, spec) {
		var li = this.targets.get(msgTarget._dispatchId),
			data = expandTargetData(msgTarget, spec),
			name = getTriggerName(data);
		
		li.attachObject(msgTarget);
		li.setText(name.join('.') + ': ' + msgTarget.name);
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Setup
////////////////////////////////////////////////////////////////////////////////////////////////////
		
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
		behaviorMenu.actor = actor;
		behaviorMenu.widget = bhvWgt;
	};
	
	shorthand.expandBehaviorData = expandTargetData;
	
	shorthand.getActionName = function(data) {
		var handler = data.handler,
			retVal = [handler.name, data.method];
		
		if (handler instanceof hemi.Mesh || handler instanceof hemi.Transform) {
			var owner = shorthand.treeData.getOwner(handler);
			retVal = [owner._octaneType.split('.').pop(), owner.name].concat(retVal);
		} else {
			retVal.unshift(handler._octaneType.split('.').pop());
		}
		
		return retVal;
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
		else if (source.shapePick && source.citizen instanceof hemi.Shape) {
			li = behaviorLiTable.get(source.citizen);
		}
		else if (source !== shorthand.treeData.MSG_WILDCARD && !source.shapePick) {
			li = behaviorLiTable.get(hemi.world.getCitizenById(source));
		}
		
		if (li != null)  {
			li[method](msgTarget, spec);
			li = null;
		}
			
		if (data.method === 'moveToView' && data.handler._octaneType === 'hemi.Camera') {
			var id = parseInt(data.args[0].value.replace('id:', ''), 10);
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
