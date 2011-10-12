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
	editor.depends = editor.depends || {};
	
	var DependencyManager = editor.Class.extend({
		init: function() {
			this.depends = new Hashtable();
		},
		
		addDependency: function(child, parent) {
			var children = this.getDependencies(parent);
			
			if (children.indexOf(child) === -1) {
				children.push(child);
			}
			
			this.depends.put(parent.getId(), children);
		},
		
		clearDependencies: function(citizen) {
			if (citizen.getId) {
				this.depends.remove(citizen.getId());
			}
		},
		
		getDependencies: function(citizen, getAll) {
			var children = this.depends.get(citizen.getId()) || [];
			
			if (getAll) {
				for (var i = 0; i < children.length; ++i) {
					var child = children[i];
					
					if (child.getId) {
						var grandChildren = this.depends.get(child.getId()) || [];
						
						for (var j = 0, jl = grandChildren.length; j < jl; ++j) {
							gc = grandChildren[j];
							
							if (children.indexOf(gc) === -1) {
								children.push(gc);
							}
						}
					}
				}
			}
			
			return children;
		},
		
		removeDependency: function(child, parent) {
			var children = this.getDependencies(parent),
				ndx = children.indexOf(child);
			
			if (ndx !== -1) {
				children.splice(ndx, 1);
			}
		},
		
		resetDependencies: function(child) {
			this.depends.each(function(key, value) {
				var ndx = value.indexOf(child);
				
				if (ndx !== -1) {
					value.splice(ndx, 1);
				}
			});
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                              Private Methods                               //
////////////////////////////////////////////////////////////////////////////////	

	var createDependencyString = function(cits) {			
			var str = '';
			
			for (var i = 0, il = cits.length; i < il; ++i) {
				var cit = cits[i],
					name = cit.name,
					type;
				
				if (cit.getCitizenType) {
					type = cit.getCitizenType().split('.').pop();
				} else {
					type = 'Behavior';
				}
				
				if (i !== 0) {
					str += ', <br>';
				}
				
				str += name + ' (' + type + ')';
			}
			
			return str;
		};
	
////////////////////////////////////////////////////////////////////////////////
//                                	   Setup	                              //
////////////////////////////////////////////////////////////////////////////////

	var mgr = new DependencyManager();
	
	editor.addListener(editor.events.PluginLoaded, function(name) {
		var model = editor.getModel(name);
		
		if (model) {
			model.addListener(editor.events.Removing, function(citizen) {
				mgr.clearDependencies(citizen);
		    });
		}
	});
	
	editor.depends.add = function(child, parent) {
		if (child && parent) {
			mgr.addDependency(child, parent);
		}
	};
	
	editor.depends.check = function(citizen) {
		var children = mgr.getDependencies(citizen, true),
			safe = children.length === 0;
		
		if (!safe) {
			var str = createDependencyString(children),
				dlg = editor.ui.createDependencyDialog(str);
			
			dlg.dialog('open');
		}
		
		return safe;
	};
	
	editor.depends.clear = function(citizen) {
		mgr.clearDependencies(citizen);
	};
	
	editor.depends.remove = function(child, parent) {
		if (child && parent) {
			mgr.removeDependency(child, parent);
		}
	};
	
	editor.depends.reset = function(child) {
		mgr.resetDependencies(child);
	};
	
	return editor;
})(editor || {});
