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
	"use strict";
	
	editor.ui = editor.ui || {};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                				Input	                                          //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var InputDefaults =  {
		container: null,
		inputClass: null,
		onBlur: null,
		placeHolder: null,
		type: 'number',
		validator: null,
		name: null
	};
			
	var Input = editor.ui.Input = function(options) {
		var newOpts = jQuery.extend({}, InputDefaults, options);
		this.value = null;
		editor.ui.Component.call(this, newOpts);
	};
		
	Input.prototype = new editor.ui.Component();
	Input.prototype.constructor = Input;
		
	Input.prototype.layout = function() {
		var wgt = this,
			cfg = this.config;
		
		if (cfg.container) {
			this.container = cfg.container;
			
			if (!cfg.placeHolder) {
				cfg.placeHolder = this.container.attr('placeholder');
			}
		} else {
			switch (cfg.type) {
				case 'boolean':
					this.container = jQuery('<div>' + 
						'<input type="radio" name="' + cfg.name + '" value="true" /> true' +
						'<input type="radio" name="' + cfg.name + '" value="false" /> false' +
						'</div>');
					break;
				default:
					this.container = jQuery('<input type="text" />');
					break;
			}
		}
		
		if (cfg.placeHolder) {
			this.container.attr('placeholder', cfg.placeHolder);
		}
		if (cfg.inputClass) {
			this.container.attr('class', cfg.inputClass);
		}
		if (cfg.validator) {
			cfg.validator.setElements(this.container);
		}
		
		this.container.bind('blur', function(evt) {
			var val = getContainerValue(wgt);
			wgt.setValue(val);
			
			if (wgt.config.onBlur) {
				wgt.config.onBlur(wgt, evt);
			}
		})
		.bind('focus', function(evt) {
			setContainerValue(wgt, wgt.value);
		});
	};
	
	Input.prototype.getValue = function() {
		if (this.container.is(':focus') || this.config.type === 'boolean') {
			return getContainerValue(this);
		} else {
			return this.value;
		}
	};
	
	Input.prototype.reset = function() {
		this.value = null;
		setContainerValue(this, null);
	};
	
	Input.prototype.setName = function(name) {
		this.config.placeHolder = name;
		this.container.attr('placeholder', name);
		this.setValue(this.value);
	};
	
	Input.prototype.setType = function(type) {
		this.config.type = type;
	};
	
	Input.prototype.setValue = function(value) {
		if (value == null) {
			this.reset();
		} else {
			this.value = value;
			
			switch (this.config.type) {
				case 'boolean':
					this.container.find('input[value="' + (value ? 'true' : 'false') + '"]')
						.attr('checked', true);
					break;
				case 'angle':
					value = hemi.RAD_TO_DEG * value;
				default:
					if (this.config.placeHolder) {
						this.container.val(this.config.placeHolder + ': ' + value);
					} else {
						this.container.val(value);
					}
					
					break;
			}
		}
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//											Private Methods										  //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	function getContainerValue(wgt) {
		var val;
		
		switch (wgt.config.type) {
			case 'number':
				val = parseFloat(wgt.container.val());
				
				if (isNaN(val)) {
					val = null;
				}
				break;
			case 'integer':
				val = parseInt(wgt.container.val());
				
				if (isNaN(val)) {
					val = null;
				}
				break;
			case 'boolean':
				val = wgt.container.find('input:radio:checked').val() === 'true';
				break;
			case 'angle':
				var deg = parseFloat(wgt.container.val());
				val = hemi.DEG_TO_RAD * deg;
				
				if (isNaN(val)) {
					val = null;
				}
				break;
			default:
				val = wgt.container.val();
				
				if (val === '') {
					val = null;
				}
				break;
		}
		
		return val;
	};
	
	function setContainerValue(wgt, value) {
		if (value == null) {
			switch (wgt.config.type) {
				case 'boolean':
					wgt.container.find('input[value="false"]').attr('checked', true);
					break;
				default:
					wgt.container.val('');
					break;
			}
		} else {
			switch (wgt.config.type) {
				case 'boolean':
					wgt.container.find('input[value="' + (value ? 'true' : 'false') + '"]')
						.attr('checked', true);
					break;
				case 'angle':
					var deg = hemi.RAD_TO_DEG * value;
					wgt.container.val(deg);
					break;
				default:
					wgt.container.val(value);
					break;
			}
		}
	};
	
})(editor);
