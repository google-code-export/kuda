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
		type: 'number',
		validator: null,
		inputClass: null
	};
			
	editor.ui.Input = editor.ui.Component.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, InputDefaults, options);
			this.validator = newOpts.validator;
			this._super(newOpts);
		},
		
		finishLayout: function() {
			switch (this.config.type) {
				case 'number':
				case 'angle':
					this.container = jQuery('<input type="text" />');
					break;
				case 'string':
					this.container = jQuery('<input type="text" />');					
					break;
				case 'boolean':
					this.container = jQuery('<input type="checkbox" />');
					break;
			}
			
			if (this.config.inputClass) {
				this.container.attr('class', this.config.inputClass);
			}
			if (this.validator) {
				this.validator.setElements(this.container);
			}
		},
		
		getValue: function() {
			var val;
			
			switch (this.config.type) {
				case 'number':
					val = parseFloat(this.container.val());
					break;
				case 'boolean':
					val = this.container.prop('checked');
					break;
				case 'angle':
					var deg = parseFloat(this.container.val());
					val = hemi.core.math.degToRad(deg);
					break;
				default:
					val = this.container.val();
					break;
			}
			
			if (isNaN(val)) {
				val = null;
			}
			
			return val;
		},
		
		reset: function() {
			switch (this.config.type) {
				case 'boolean':
					this.container.prop('checked', false);
					break;
				default:
					this.container.val('');
					break;
			}
		},
		
		setName: function(name) {
			this.container.attr('placeholder', name);
		},
		
		setType: function(type) {
			this.config.type = type;
		},
		
		setValue: function(value) {
			if (value == null) {
				this.reset();
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
		}
	});
	
	return editor;
})(editor || {});
