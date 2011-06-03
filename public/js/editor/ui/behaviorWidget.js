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
	
	module.ui.BehaviorTypes = {
		TRIGGER: 'trigger',
		ACTION: 'action',
		NA: 'na'
	};
	
	module.ui.BehaviorWidgetDefaults = {
		
	};
	
	module.ui.BehaviorWidget = module.ui.FormSBWidget.extend({
		init: function() {
			this._super();
		},
		
		finishLayout: function() {
			var form = jQuery('<form class="noSteps" action="" method="post"></form>'), 
				triggerFieldset = jQuery('<fieldset><legend>Triggers</legend><ol></ol></fieldset>'), 
				actionFieldset = jQuery('<fieldset><legend>Actions</legend><ol></ol></fieldset>'), 
				paramsFieldset = jQuery('<fieldset><legend>Action Parameters</legend><ol><li></li></ol></fieldset>'), 
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
						path = selector.tree.jstree('get_path', elem);
					
					if (metadata.type === 'citType' ||
							metadata.type === 'citizen') {
						selector.tree.jstree('open_node', elem, false, false);
						return false;
					}
					else {
						var cit = metadata.parent, 
							method = path[path.length - 1];
						
						wgt.prmfieldset.show(200);
						wgt.prmWgt.fillParams(module.util.getFunctionParams(cit[method]));
						selector.input.val(path.join('.').replace('.More...', ''));
						selector.setSelection({
							citizen: cit,
							method: method
						});
						
						return true;
					}
				};
			
			this.trgFieldset = triggerFieldset;
			this.axnFieldset = actionFieldset;
			this.prmFieldset = paramsFieldset;
			
			this.axnTree = module.ui.createActionsTree();
			this.trgTree = module.ui.createTriggersTree();
			
			this.axnTree.addListener()
				
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
				}
				
				wgt.notifyListeners(module.EventTypes.Behavior.Save, data);
				wgt.reset();
			});
			
			cancelBtn.bind('click', function(evt) {
				wgt.reset();
			});
		},
		
		reset: function() {
			this.trgChooser.reset();
			this.axnChooser.reset();
			this.prmWgt.reset();
			
			this.trgFieldset.hide();
			this.axnFieldset.hide();
			this.prmFieldset.hide();
		},
		
		setActor: function(actor, type, msgObj) {
			this.type = type;
			this.actor = actor;
			
			switch(type) {
				case module.ui.BehaviorTypes.ACTION:
					this.trgFieldset.hide();
				    this.axnFieldset.show();
					break;
				case module.ui.BehaviorTypes.TRIGGER:
				    this.axnFieldset.hide();
					this.trgFieldset.show();				    
					break;
				default:
				    this.axnFieldset.show();
					this.trgFieldset.show();	
					break;
			}
		}
	});
	
	return module;
})(editor || {})
