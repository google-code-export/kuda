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

(function(editor) {
	editor.data = editor.data || {};
	
	var MetaData =  function() {
		loadJSON.call(this);
	};
		
	getDescription = function(objType, opt_fnc, opt_param) {
		var parent = this.getParent(objType),
			args = [];
		
		for (var i = 0, il = arguments.length; i < il; ++i) {
			args[i] = arguments[i];
		}
		
		var retVal = retrieve.call(this, args);
		
		while (retVal == null && parent != null) {
			args[0] = parent;
			parent = this.getParent(parent);
			retVal = retrieve.call(this, args);
		}
		
		return retVal == null ? null : retVal.description;
	};
	
	getMsgDescription = function(objType, msgName) {
		var parent = this.getParent(objType),
			retVal = this.messages.get(objType + '.' + msgName);
		
		while (retVal == null && parent != null) {
			retVal = this.messages.get(parent + '.' + msgName);
			parent = this.getParent(parent);
		}
		
		return retVal;
	};
	
	getMethods = function(objType) {
		var methods = [];
		
		while (objType != null) {
			var data = this.types.get(objType);
			
			if (data) {
				methods = methods.concat(data.methods);
				objType = data.parent;
			} else {
				objType = null;
			}
		}
		
		return methods;
	};
	
	getParameters = function(objType, fnc) {
		var data = this.functions.get(objType + '.' + fnc),
			parent = this.getParent(objType);
		
		while (data == null && parent != null) {
			data = this.functions.get(parent + '.' + fnc);
			parent = this.getParent(parent);
		}
		
		return data ? data.parameters : null;
	};
	
	getParent = function(objType) {
		var data = this.types.get(objType);
		return data ? data.parent : null;
	};
	
	getType = function(objType, opt_fnc, opt_param) {
		var parent = this.getParent(objType),
			args = [];
		
		for (var i = 0, il = arguments.length; i < il; ++i) {
			args[i] = arguments[i];
		}
		
		var retVal = retrieve.call(this, args);
		
		while (retVal == null && parent != null) {
			args[0] = parent;
			parent = this.getParent(parent);
			retVal = retrieve.call(this, args);
		}
		
		return retVal == null ? null : retVal.type;
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			Private Methods			                              //
////////////////////////////////////////////////////////////////////////////////////////////////////

	function loadJSON() {
		var that = this;
		this.types = new Hashtable();
		this.functions = new Hashtable();
		this.parameters = new Hashtable();
		this.messages = new Hashtable();
		
		try {
			hemi.loader.loadHtml('js/editor/data/hemi.json', function(data) {
				var json = JSON.parse(data);
			
				for (var i = 0, il = json.length; i < il; i++) {
					var type = json[i],
						tname = type.name,
						funcs = type.funcs,
						msgs = type.msgs,
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
					
					for (var j = 0, jl = msgs.length; j < jl; ++j) {
						var msg = msgs[j];
						that.messages.put(tname + '.' + msg.name, msg.desc);
					}
				}
			});
		} catch (err) {
			hemi.console.log(err);
		}
	};
	
	function retrieve(names) {			
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
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                	   			Setup				                              //
////////////////////////////////////////////////////////////////////////////////////////////////////

	var metadata = new MetaData();	
	
	editor.data.getMetaData = function() {
		return metadata;
	};
	
})(editor);
