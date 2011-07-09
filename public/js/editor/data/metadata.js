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
	module.data = module.data || {};
	
	var MetaData = module.Class.extend({
		init: function() {
			loadJSON.call(this);
		},
		
		getDescription: function(objType, opt_fnc, opt_param) {
			var retVal = retrieve.call(this, arguments);			
			
			return retVal == null ? null : retVal.description;
		},
		
		getMethods: function(objType) {
			this.types.get(objType).methods;
		},
		
		getParameters: function(objType, fnc) {
			this.functions.get(objType + '.' + fnc).parameters;
		},
		
		getType: function(objType, opt_fnc, opt_param) {
			var retVal = retrieve.call(this, arguments);
			
			return retVal == null ? null : retVal.type;
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                              Private Methods                               //
////////////////////////////////////////////////////////////////////////////////	

	var loadJSON = function() {
			this.types = new Hashtable();
			this.functions = new Hashtable();
			this.parameters = new Hashtable();
			
			hemi.loader.loadHtml('js/data/metadata.json', function(data) {				
				var json = JSON.parse(data);
			
				for (var i = 0, il = json.length; i < il; i++) {
					var type = json[i],
						tname = type.name,
						funcs = type.funcs,
						tdata = {
							description: type.desc,
							methods: []
						};
						
					this.types.put(tname, tdata);
						
					for (var j = 0, jl = funcs.length; j < jl; j++) {
						var func = funcs[j],
							fname = func.name,
							params = func.params,
							fdata = {
								description: func.desc,
								parameters: []
							};
							
						tdata.methods.push(fname);				
						this.functions.put(tname + '.' + fname, fdata);
						
						for (var k = 0, kl = params.length; k < kl; k++) {
							var param = params[k],
								pname = param.name;
							
							fdata.parameters.push(pname);
							this.parameters.put(tname + '.' + fname + '.' + pname, {
								description: param.desc,
								type: param.type
							});
						}
					}
				}
			});
		},
		
		retrieve = function(names) {			
			var name = names.join('.'),
				retVal = this.types.get(name);
			
			if (retVal == null) {
				retVal = this.functions.get(name);
			}
			if (retVal == null) {
				retVal = this.parameters.get(name);
			}
			
			return retVal;
		};
	
////////////////////////////////////////////////////////////////////////////////
//                                	   Setup	                              //
////////////////////////////////////////////////////////////////////////////////

	var metadata = new MetaData();	
	
	module.data.getMetaData = function() {
		return metadata;
	};
	
	return module;
})(editor || {});
