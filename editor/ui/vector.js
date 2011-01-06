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
	
    module.EventTypes = module.EventTypes || {};
	
	// jquery triggered events
	module.EventTypes.EmptyVectorValue = 'editor.vector.EmptyVectorValue';
	module.EventTypes.VectorValueSet = 'editor.vector.VectorValueSet';
	
	module.ui.VectorDefaults = {
		container: null,
		inputs: ['x', 'y', 'z'],
		type: 'vector',
		paramName: '',
		onBlur: null,
		validator: null
	};
	
	module.ui.Vector = module.ui.Component.extend({
		init: function(options) {
			var newOpts =  jQuery.extend({}, module.ui.VectorDefaults, 
				options);
			
			this.inputs = new Hashtable();
			
			this._super(newOpts);
		},
		
		finishLayout: function() {
			// initialize container
			this.container = this.config.container;
			
			// initialize inputs
			var inputs = this.config.inputs,
				param = this.config.paramName,
				type = this.config.type;
				
			for (var ndx = 0, len = inputs.length; ndx < len; ndx++) {
				var i = inputs[ndx],
					elem = jQuery('<input type="text" id="' + param + i.toUpperCase() + '" class="' + type + ' vectorHelper" />');
				
				elem.data('ndx', i);
				this.inputs.put(i, elem);
				
				this.container.append(elem);
			}
						
			// add to container
			this.container.append(this.rInput).append(this.gInput)
				.append(this.bInput).append(this.aInput).append(this.pickerBtn);
				
			this.setupAutoFills();
		},
	
		setupAutoFills: function() {
			var wgt = this,
				vectors = wgt.find('.' + this.config.type),
				inputs = this.inputs.values();
			
			for (var ndx = 0, len = inputs.length; ndx < len; ndx++) {
				var input = inputs[ndx];
				
				input.val(input.data('ndx'));
			}
			
			wgt.config.validator.setElements(vectors);
										
			vectors.bind('keydown', function(evt) {
				var elem = jQuery(this);
				elem.removeClass('vectorHelper');
			})
			.bind('blur', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					ndx = elem.data('ndx');
				
				if (val === '') {
					elem.val(ndx).addClass('vectorHelper');
				}
				if (wgt.config.onBlur) {
					wgt.config.onBlur(elem, evt);
				}	
			})
			.bind('focus', function(evt) {
				var elem = jQuery(this),
					val = elem.val();
				if (jQuery.inArray(val, wgt.config.inputs) !== -1) {
					elem.val('');
				}
			})
			.addClass('vectorHelper');
		},
		
		setValue: function(values) {	
			for (var key in values) {
				var input = this.inputs.get(key);
				
				if (input) {
					input.val(values[key]).removeClass('vectorHelper');
				}
			}
		},
		
		getValue: function() {
			var keys = this.inputs.keys(),
				values = {},
				isComplete = true;
			
			for (var ndx = 0, len = keys.length; ndx < len && isComplete; ndx++) {
				var key = keys[ndx],
					val = this.inputs.get(key).val();
				
				if (hemi.utils.isNumeric(val)) {				
					values[key] = parseFloat(val);	
				}
				else {
					isComplete = false;
				}
			}
			
			return isComplete ? values : null;
		},
		
		reset: function() {
			this.find('.' + this.config.type).focus().val('').blur();
		}
	});
	
	return module;
})(editor || {});
