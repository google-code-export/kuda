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
	
	editor.ui = editor.ui || {};
	
	editor.EventTypes = editor.EventTypes || {};
	
	editor.EventTypes.Params = {
		SetArgument: 'params.SetArgument'
	};
	
	var tooltip = editor.ui.createTooltip(),
		counter = 0;
	
////////////////////////////////////////////////////////////////////////////////
//                            Parameter Component                             //
////////////////////////////////////////////////////////////////////////////////
		
	/*
	 * Configuration object for the ParamWidget.
	 */
	editor.ui.ParamWidgetDefaults = {
		containerId: '',
		prefix: 'prmWgt',
		sendsNotifications: true
	};
	
	editor.ui.Parameters = editor.ui.Component.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, editor.ui.ParamWidgetDefaults, 
					options),
				wgt = this;
			this.curArgs = new Hashtable();
			this.ndxArgs = new Hashtable();
			this.id = counter++;
			
		    this._super(newOpts);
		},
		
		finishLayout: function() {
			this._super();
			
			this.container = jQuery('<ul id="' + this.config.containerId + '"></ul>');
		},
		
		// TODO: was getArgs()
		getArguments: function() {
			var argsKeys = this.curArgs.keys(),
				args = [];
			
			for (var i = 0, il = argsKeys.length; i < il; i++) {
				var argName = argsKeys[i],
					ipt = this.curArgs.get(argName);
								
				args.push({
					name: argName,
					value: ipt.getValue()
				});				
			}
			
			return args;
		},
		
		populateArgList: function(obj, fnc, opt_values) {
			this.reset();
			
			var meta = editor.data.getMetaData(),
				citType = obj.getCitizenType(),
				params = meta.getParameters(citType, fnc);
				
			for (var i = 0, il = params.length; i < il; i++) {
				var prm = params[i],
					type = meta.getType(citType, fnc, prm),
					desc = meta.getDescription(citType, fnc, prm),
					ui = createParameterUi(prm, type, type),
					li = createListItem(prm, desc, ui);
				
				if (opt_values) {
					ui.setValue(opt_values[i]);
				}
				this.curArgs.put(prm, ui);
				this.container.append(li);
			}
		},
		
		reset: function() {				
			this.curArgs.clear();	
			this.ndxArgs.clear();		
			this.container.empty();
		},
		
		setArgument: function(argName, argValue) {
			var ipt = this.curArgs.get(argName);
			if (/id:/.test(argValue)) {
				var cit = hemi.world.getCitizenById(
					parseInt(argValue.split(':').pop()));
				ipt.setValue(cit);
			}
			else {
				ipt.setValue(argValue);
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                Simple Input                                //
////////////////////////////////////////////////////////////////////////////////
			
	var NUMBER = 0,
		STRING = 1,
		BOOLEAN = 2;
			
	var SimpleInputDefaults =  {
		type: NUMBER,
		validator: null
	};
			
	var SimpleInput = editor.ui.Component.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, SimpleInputDefaults, options);
			this._super(newOpts);
		},
		
		finishLayout: function() {
			switch (this.config.type) {
				case NUMBER:
					this.container = jQuery('<input type="text" class="short" />');
					var validator = editor.ui.createDefaultValidator();
					validator.setElements(this.container);
					break;
				case STRING:
					this.container = jQuery('<input type="text" />');					
					break;
				case BOOLEAN:
					this.container = jQuery('<input type="checkbox" />');
					break;
			}
		},
		
		getValue: function() {
			switch (this.config.type) {
				case NUMBER:
					return parseFloat(this.container.val());
					break;
				case STRING:
					return this.container.val();
					break;
				case BOOLEAN:
					return this.container.prop('checked');
					break;
			}
		},
		
		setValue: function(value) {
			switch (this.config.type) {
				case BOOLEAN:
					this.container.prop('checked', value);
					break;
				default:
					this.container.val(value);
					break;
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                               Helper Methods                               //
////////////////////////////////////////////////////////////////////////////////
	
	var inputs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
		vecInputs = ['x', 'y', 'z'];
	
	var createListItem = function(argName, desc, ui) {
			var li = jQuery('<li></li>'),
				lbl = jQuery('<label>' + argName + '</label>'),
				elm = ui.getUI(),
				ipt = elm;
				
			li.append(lbl).append(elm);//.attr('title', desc);
			
			if (ipt[0].nodeName.toLowerCase() !== 'input') {
				ipt = elm.find('input');
			}
			
			ipt.bind('focus click', function(evt) {
				ipt.data('timeout', setTimeout(function() {
					tooltip.show(ipt, desc);
				}, 300));
			})
			.bind('blur', function(evt) {	
				var timeout = ipt.data('timeout');
				if (timeout) {
					clearTimeout(timeout);
					tooltip.hide(100);
				}
			});
			
			return li;
		},
		
		createParameterUi = function(prm, type, objType) {
			var firstMatch = type.indexOf('['),
				firstEnd = type.indexOf(']', firstMatch + 1),
				secondMatch = type.indexOf('[', firstMatch + 1),
				secondEnd = type.indexOf(']', secondMatch + 1),
				isArray = firstMatch > -1,
				isMultiArray = isArray && type.match(/\[/gi).length > 1,
				firstBound = isArray ? firstMatch + 1 < firstEnd ? 
					parseInt(type.substr(firstMatch + 1, firstEnd)) : 0 : -1,
				secondBound = isMultiArray ? secondMatch + 1 < secondEnd ? 
					parseInt(type.substr(secondMatch + 1, secondEnd)) : 0 : -1,
				inputs = createInputArray(firstBound, secondBound),
				vecData = {
					inputs: inputs
				},
				ui = null;
			
			switch(type.split('[').shift()) {
				case 'number':
					var vdr = editor.ui.createDefaultValidator();
					if (isArray) {
						vecData.isNumeric = true;	
						vecData.validator = vdr;
						vecData.container = jQuery('<div class="vectorContainer"></div>');
						ui = new editor.ui.Vector(vecData);
					}
					else {
						ui = new SimpleInput({
							validator: vdr
						});
					}
					break;
				case 'string':
					if (isArray) {
						vecData.isNumeric = false;	
						vecData.container = jQuery('<div class="vectorContainer"></div>');
						ui = new editor.ui.Vector(vecData);
					}
					else {
						ui = new SimpleInput({
							type: STRING
						});
					}
					break;
				case 'boolean':
					// create the input
					ui = new SimpleInput({
						type: BOOLEAN
					});
					break;
				default:
					// citizen picker
					ui = new editor.ui.ObjectPicker(prm, objType);
					break;
			}
	
			return ui;
		},
		
		createInputArray = function(bound1, bound2) {
			var retVal = [];
			
			if (bound1 !== -1 && bound2 !== -1) {
				for (var i = 0; i < bound1; i++) {
					retVal.push([bound2]);
				}
			}
			else if (bound1 !== -1) {
				retVal.push(bound1);
			}
			
			return retVal;
		};
	
	return editor;
})(editor || {});
