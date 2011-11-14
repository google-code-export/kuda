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
	
////////////////////////////////////////////////////////////////////////////////
//                                Input                                       //
////////////////////////////////////////////////////////////////////////////////
	
	var InputDefaults =  {
		container: null,
		inputClass: null,
		onBlur: null,
		placeHolder: null,
		type: 'number',
		validator: null
	};
			
	editor.ui.Input = editor.ui.Component.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, InputDefaults, options);
			this.value = null;
			this._super(newOpts);
		},
		
		layout: function() {
			var wgt = this;
			
			if (this.config.container) {
				this.container = this.config.container;
				
				if (!this.config.placeHolder) {
					this.config.placeHolder = this.container.attr('placeholder');
				}
			} else {
				switch (this.config.type) {
					case 'boolean':
						this.container = jQuery('<input type="checkbox" />');
						break;
					default:
						this.container = jQuery('<input type="text" />');
						break;
				}
			}
			
			if (this.config.placeHolder) {
				this.container.attr('placeholder', this.config.placeHolder);
			}
			if (this.config.inputClass) {
				this.container.attr('class', this.config.inputClass);
			}
			if (this.config.validator) {
				this.config.validator.setElements(this.container);
			}
			
			this.container.bind('blur', function(evt) {
				var val = getContainerValue.call(wgt);
				wgt.setValue(val);
				
				if (wgt.config.onBlur) {
					wgt.config.onBlur(wgt, evt);
				}
			})
			.bind('focus', function(evt) {
				setContainerValue.call(wgt, wgt.value);
			});
		},
		
		getValue: function() {
			if (this.container.is(':focus') || this.config.type === 'boolean') {
				return getContainerValue.call(this);
			} else {
				return this.value;
			}
		},
		
		reset: function() {
			this.value = null;
			setContainerValue.call(this, null);
		},
		
		setName: function(name) {
			this.config.placeHolder = name;
			this.container.attr('placeholder', name);
			this.setValue(this.value);
		},
		
		setType: function(type) {
			this.config.type = type;
		},
		
		setValue: function(value) {
			if (value == null) {
				this.reset();
			} else {
				this.value = value;
				
				switch (this.config.type) {
					case 'boolean':
						this.container.prop('checked', value);
						break;
					case 'angle':
						value = hemi.core.math.radToDeg(value);
					default:
						if (this.config.placeHolder) {
							this.container.val(this.config.placeHolder + ': ' + value);
						} else {
							this.container.val(value);
						}
						
						break;
				}
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//								Private Methods								  //
////////////////////////////////////////////////////////////////////////////////
	
	var getContainerValue = function() {
		var val;
		
		switch (this.config.type) {
			case 'number':
				val = parseFloat(this.container.val());
				
				if (isNaN(val)) {
					val = null;
				}
				break;
			case 'integer':
				val = parseInt(this.container.val());
				
				if (isNaN(val)) {
					val = null;
				}
				break;
			case 'boolean':
				val = this.container.prop('checked');
				break;
			case 'angle':
				var deg = parseFloat(this.container.val());
				val = hemi.core.math.degToRad(deg);
				
				if (isNaN(val)) {
					val = null;
				}
				break;
			default:
				val = this.container.val();
				
				if (val === '') {
					val = null;
				}
				break;
		}
		
		return val;
	},
	
	setContainerValue = function(value) {
		if (value == null) {
			switch (this.config.type) {
				case 'boolean':
					this.container.prop('checked', false);
					break;
				default:
					this.container.val('');
					break;
			}
		} else {
			switch (this.config.type) {
				case 'boolean':
					this.container.prop('checked', value);
					break;
				case 'angle':
					var deg = hemi.core.math.radToDeg(value);
					this.container.val(deg);
					break;
				default:
					this.container.val(value);
					break;
			}
		}
	};
	
	return editor;
})(editor || {});
