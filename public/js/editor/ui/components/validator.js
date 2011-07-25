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
	
	var tooltip = new editor.ui.createTooltip();
		
	editor.ui.Validator = editor.utils.Listenable.extend({
		init: function(opt_elements, checkFunction) {
			this._super();
			this.checkFunction = checkFunction;
			this.containerClass = 'errorWrapper';
			
			if (opt_elements != null) {			
				this.setElements(opt_elements);
			}
		},
		
		setElements: function(elements) {	
			var vld = this;
					
			elements.bind('change.errEvt', function(evt) {
				var elem = jQuery(this),
					msg = null;
								
				msg = vld.checkFunction(elem);
				
				if (msg) {
					tooltip.setContainerClass(vld.containerClass);
					tooltip.show(elem, msg, 2000);
					elem.addClass('error');
				}
				else {
					tooltip.hide();	
					elem.removeClass('error');
				}
			});
		}
	});
		
	editor.ui.createDefaultValidator = function(opt_min, opt_max) {
		var validator = new editor.ui.Validator(null, function(elem) {
			var val = elem.val(),
				msg = null;
				
			if (!checkNumber(val)) {
				msg = 'must be a number';
			}
			else if ((this.min != null || this.max != null) 
					&& !checkRange(val, this.min, this.max)) {						
				msg = this.min != null && this.max != null ? 
					'must be between ' + this.min + ' and ' + this.max
					: this.min != null ? 'must be greater than or equal to ' + this.min 
					: 'must be less than or equal to ' + this.max;
			}
			
			return msg;
		});
		
		validator.min = opt_min;
		validator.max = opt_max;
		
		return validator;	
	};
	
	var checkNumber = function(val) {	
		return val === '' || hemi.utils.isNumeric(val);
	};
		
	var checkRange = function(val, min, max) {
		var num = parseFloat(val);					
		return val === '' || (min != null && max != null 
			? num >= min && num <= max 
			: min != null && max == null ? num >= min : num <= max);
	};
	
	return editor;
})(editor || {}, jQuery);
