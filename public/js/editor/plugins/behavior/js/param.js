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
	
	var tooltip = editor.ui.createTooltip(),
		counter = 0;
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                            				Parameter Component		                              //
////////////////////////////////////////////////////////////////////////////////////////////////////
		
	/*
	 * Configuration object for the ParamWidget.
	 */
	shorthand.ParamWidgetDefaults = {
		containerId: '',
		prefix: 'prmWgt',
		sendsNotifications: true
	};
	
	shorthand.Parameters = function(options) {
		var newOpts = jQuery.extend({}, shorthand.ParamWidgetDefaults, 
				options);
		
		this.curArgs = new Hashtable();
		this.ndxArgs = new Hashtable();
		this.id = counter++;
		
	    editor.ui.Component.call(this, newOpts);
	};
		
	shorthand.Parameters.prototype = new editor.ui.Component();
	shorthand.Parameters.prototype.constructor = shorthand.Parameters;
		
	shorthand.Parameters.prototype.layout = function() {
		this.container = jQuery('<ul id="' + this.config.containerId + '"></ul>');
	};
	
	shorthand.Parameters.prototype.getArguments = function() {
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
	};
	
	shorthand.Parameters.prototype.populateArgList = function(obj, fnc, args, opt_values) {
		this.reset();
		
		var meta = editor.data.getMetaData(),
			octType = obj._octaneType,
			params = meta.getParameters(octType, fnc);
		
		if (!params) {
			// Use the back up argument list
			params = args;
		}
		
		for (var i = 0, il = params.length; i < il; i++) {
			var prm = params[i],
				type = meta.getType(octType, fnc, prm),
				desc = meta.getDescription(octType, fnc, prm);
			
			type = type || 'string';
			
			if (desc && desc.search(/radian/i) !== -1) {
				desc = desc.replace(/radian/gi, 'degree');
				type = type.replace('number', 'angle');
			}
			
			var ui = createParameterUi(prm, type),
				li = createListItem(prm, desc, ui);
			
			if (opt_values) {
				ui.setValue(opt_values[i]);
			}
			this.curArgs.put(prm, ui);
			this.container.append(li);
		}
	};
	
	shorthand.Parameters.prototype.reset = function() {				
		this.curArgs.clear();	
		this.ndxArgs.clear();		
		this.container.empty();
	};
	
	shorthand.Parameters.prototype.setArgument = function(argName, argValue) {
		var ipt = this.curArgs.get(argName);
		if (/id:/.test(argValue)) {
			var cit = hemi.world.getCitizenById(
				parseInt(argValue.split(':').pop()));
			ipt.setValue(cit);
		}
		else {
			ipt.setValue(argValue);
		}
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
//                               				Helper Methods		                              //
////////////////////////////////////////////////////////////////////////////////////////////////////

	function createListItem(argName, desc, ui) {
		var option = false;
		
		if (argName.indexOf('opt_') === 0) {
			option = true;
			argName = argName.substr(4);
		}
		
		var li = jQuery('<li></li>'),
			lbl = jQuery('<label>' + argName + '</label>'),
			elm = ui.getUI(),
			ipt = elm;
		
		if (option) {
			lbl.addClass('optional');
		}
		
		li.append(lbl).append(elm);
		
		if (ipt[0].nodeName.toLowerCase() !== 'input') {
			ipt = elm.find('input');
		}
		
		if (desc) {
			ipt.bind('focus click', function(evt) {
				var timeout = ipt.data('timeout');
				
				if (!timeout) {
					ipt.data('timeout', setTimeout(function(){
						tooltip.show(ipt, desc);
						ipt.data('tooltipShown', true);
						
						jQuery(document).bind('click.' + argName + '.tooltipShown', function(evt){
							if (ipt.data('tooltipShown')) {
								ipt.blur();
							}
						});
					}, 400));
				}
			})
			.bind('blur', function(evt) {	
				var timeout = ipt.data('timeout');
				if (timeout) {
					clearTimeout(timeout);
					tooltip.hide(100);
					ipt.data('timeout', null);
				}
				ipt.data('tooltipShown', false);
				jQuery(document).unbind('click.' + argName + '.tooltipShown');
			});
		}
		
		return li;
	};
	
	function createParameterUi(prm, type) {
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
			baseType = type.split('[').shift(),
			vecData = {
				inputs: inputs,
				inputType: baseType
			},
			ui = null;
		
		switch(baseType) {
			case 'angle':
			case 'number':
				var vdr = editor.ui.createDefaultValidator();
				if (isArray) {	
					vecData.validator = vdr;
					vecData.container = jQuery('<div class="vectorContainer"></div>');
					ui = new editor.ui.Vector(vecData);
				}
				else {
					ui = new editor.ui.Input({
						validator: vdr,
						inputClass: 'short',
						type: baseType
					});
				}
				break;
			case 'string':
				if (isArray) {
					vecData.container = jQuery('<div class="vectorContainer"></div>');
					ui = new editor.ui.Vector(vecData);
				}
				else {
					ui = new editor.ui.Input({
						type: baseType
					});
				}
				break;
			case 'boolean':
				// create the input
				ui = new editor.ui.Input({
					type: baseType
				});
				break;
			default:
				// citizen picker
				ui = new shorthand.ObjectPicker(prm, type);
				break;
		}

		return ui;
	};
	
	function createInputArray(bound1, bound2) {
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
	
})();
