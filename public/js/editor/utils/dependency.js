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
	module.depends = module.depends || {};
	
	var DependencyManager = module.Class.extend({
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
			this.depends.remove(citizen.getId());
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

	var loadJSON = function() {
			var that = this;
			this.types = new Hashtable();
			this.functions = new Hashtable();
			this.parameters = new Hashtable();
			
			try {
				hemi.loader.loadHtml('js/editor/data/hemi.json', function(data) {
					var json = JSON.parse(data);
				
					for (var i = 0, il = json.length; i < il; i++) {
						var type = json[i],
							tname = type.name,
							funcs = type.funcs,
							tdata = {
								description: type.desc,
								methods: [],
								parent: type.parent
							};
							
						that.types.put(tname, tdata);
							
						for (var j = 0, jl = funcs.length; j < jl; j++) {
							var func = funcs[j],
								fname = func.name,
								params = func.params,
								fdata = {
									description: func.desc,
									parameters: []
								};
								
							tdata.methods.push(fname);				
							that.functions.put(tname + '.' + fname, fdata);
							
							for (var k = 0, kl = params.length; k < kl; k++) {
								var param = params[k],
									pname = param.name;
								
								fdata.parameters.push(pname);
								that.parameters.put(tname + '.' + fname + '.' + pname, {
									description: param.desc,
									type: param.type
								});
							}
						}
					}
				});
			} catch (err) {
				hemi.console.log(err);
			}
		},
		
		createDependencyString = function(cits) {			
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
					str += ', ';
				}
				
				str += name + ' (' + type + ')';
			}
			
			return str;
		};
	
////////////////////////////////////////////////////////////////////////////////
//                                	   Setup	                              //
////////////////////////////////////////////////////////////////////////////////

	var mgr = new DependencyManager();
	
	module.depends.add = function(child, parent) {
		if (child && parent) {
			mgr.addDependency(child, parent);
		}
	};
	
	module.depends.check = function(citizen) {
		var children = mgr.getDependencies(citizen, true),
			safe = children.length === 0;
		
		if (!safe) {
			var str = createDependencyString(children),
				dlg = editor.ui.createDependencyDialog(str);
			
			dlg.dialog('open');
		}
		
		return safe;
	};
	
	module.depends.clear = function(citizen) {
		mgr.clearDependencies(citizen);
	};
	
	module.depends.remove = function(child, parent) {
		if (child && parent) {
			mgr.removeDependency(child, parent);
		}
	};
	
	module.depends.reset = function(child) {
		mgr.resetDependencies(child);
	};
	
	return module;
})(editor || {});
