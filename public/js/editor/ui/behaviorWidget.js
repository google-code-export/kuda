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
		Save: 'behavior.save',
		Cancel: 'behavior.cancel'
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
								wgt.prmFieldset.show(200);
								wgt.prmWgt.fillParams(module.utils.getFunctionParams(obj1[obj2]));
								data.handler = obj1;
								data.method = obj2;
							}
							else {
								data.citizen = obj1;
								data.type = obj2;
							}
							selector.input.val(path.join('.').replace('.More...', ''));
							selector.setSelection(data);
							
							return true;
						}
					}
				};
			
			this.trgFieldset = triggerFieldset;
			this.axnFieldset = actionFieldset;
			this.prmFieldset = paramsFieldset;
			this.savFieldset = saveFieldset;
			
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
					name: nameIpt.val()
				};
				
				wgt.notifyListeners(module.EventTypes.Behavior.Save, data);
				wgt.reset();
				wgt.setVisible(false);
			});
			
			cancelBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.Behavior.Cancel);
				wgt.reset();
				wgt.setVisible(false);
			});
			
			nameIpt.bind('keyUp', function(evt) {
				
			});
			
			form.submit(function() { return false; });
			
			form.append(triggerFieldset).append(actionFieldset)
				.append(paramsFieldset).append(saveFieldset);
			this.container.append(form);
			
			// save checking
//			this.addInputToCheck(nameIpt);
		},
		
		reset: function() {
			this.trgChooser.reset();
			this.axnChooser.reset();
			this.prmWgt.reset();
			
			this.trgFieldset.hide();
			this.axnFieldset.hide();
			this.prmFieldset.hide();
			this.savFieldset.hide();
			
			reset(this.trgTree.getUI());
			reset(this.axnTree.getUI());
		},
		
		setActor: function(actor, type, msgObj) {
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
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                	   Setup	                              //
////////////////////////////////////////////////////////////////////////////////
	
	var behaviorWidget = null,
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
		position.left -= behaviorMenu.container.width() - parBtn.width();
		behaviorMenu.show(position);
		behaviorMenu.actor = actor;
	};
	
	return module;
})(editor || {})
