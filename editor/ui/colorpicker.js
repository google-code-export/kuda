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
	module.EventTypes.ColorPicked = 'editor.colorPicker.ColorPicked';
	
	module.ui.ColorPickerDefaults = {
		container: null,
		inputId: 'color',
		buttonId: 'colorPicker'
	};
	
	module.ui.ColorPicker = module.ui.Component.extend({
		init: function(options) {
			var newOpts =  jQuery.extend({}, module.ui.ColorPickerDefaults, 
				options);
			this._super(newOpts);
		},
		
		finishLayout: function() {
			// initialize container
			this.container = this.config.container;
			
			// initialize inputs
			this.rInput = jQuery('<input type="text" id="' + this.config.inputId + 'R" class="rNdx color"/>');
			this.gInput = jQuery('<input type="text" id="' + this.config.inputId + 'G"  class="gNdx color"/>');
			this.bInput = jQuery('<input type="text" id="' + this.config.inputId + 'B"  class="bNdx color"/>');
			this.aInput = jQuery('<input type="text" id="' + this.config.inputId + 'A"  class="aNdx color"/>');
			
			// initialize colorpicker button
			this.pickerBtn = jQuery('<span id="' + this.config.buttonId + '" class="colorPicker"></span>');
			
			// add to container
			this.container.append(this.rInput).append(this.gInput)
				.append(this.bInput).append(this.aInput).append(this.pickerBtn);
				
			this.setupColorPicker();
		},
	
		setupColorPicker: function() {			
			var r = this.rInput,
				g = this.gInput,
				b = this.bInput,
				a = this.aInput,
				colorPickerElem = this.pickerBtn,
				wgt = this;
			
			var options = {
				window: {
					expandable: true,
					alphaSupport: true,
					position: {
						x: 'left',
						y: 'center'
					},
					effects: {
						type: 'slide',
						speed: {
							show: 'fast'
						}
					}
				},
				images: {
					clientPath: '../lib/jpicker/images/'
				},
				color: {
					active: '#ffffff'
				}
			};
			
			var colorPickedFcn = function(color) {
				var rndFnc = module.utils.roundNumber;
							 
				r.val(rndFnc(color.val('r')/255, 2)).removeClass('vectorHelper');
				g.val(rndFnc(color.val('g')/255, 2)).removeClass('vectorHelper');
				b.val(rndFnc(color.val('b')/255, 2)).removeClass('vectorHelper');
				a.val(rndFnc(color.val('a')/255, 2)).removeClass('vectorHelper');
				
				var val = [
					parseFloat(r.val()), parseFloat(g.val()), parseFloat(b.val()), 
					parseFloat(a.val())
				];
				
				return val;
			};
				
			colorPickerElem.jPicker(options, function(color, context) {
				var clr = colorPickedFcn(color);
				wgt.notifyListeners(module.EventTypes.ColorPicked, clr);
			});
				
			// save this picker
			var found = false,
				pickers = jQuery.jPicker.List;
			
			for (var ndx = 0, len = pickers.length; ndx < len && !found; ndx++) {
				var picker = pickers[ndx];
				if (jQuery(picker).attr('id') === this.config.buttonId) {
					this.picker = picker;
					found = true;
				}
			}
			
			this.setupAutoFills();
		},
	
		setupAutoFills: function() {
			var wgt = this;
				
			this.rInput.val('r').attr('disabled', 'disabled');
			this.gInput.val('g').attr('disabled', 'disabled');
			this.bInput.val('b').attr('disabled', 'disabled');
			this.aInput.val('a').attr('disabled', 'disabled');
						
			this.find('.color').bind('keydown', function(evt) {
				var elem = jQuery(this);
				elem.removeClass('vectorHelper');
			})
			.bind('blur', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					cls = elem.attr('class'),
					param = elem.attr('id'),
					totalVal = null,
					type = cls.match(/rNdx|gNdx|bNdx|aNdx/);				
				
				if (val === '') {
					elem.val(type[0].replace('Ndx', '')).addClass('vectorHelper');
				}
			})
			.bind('focus', function(evt) {
				var elem = jQuery(this),
					val = elem.val();
				if (val === 'r' || val === 'g' || val === 'b' || val === 'a') {
					elem.val('');
				}
			})
			.addClass('vectorHelper');
		},
		
		setColor: function(color) {	
			var pickers = jQuery.jPicker.List;
				
			this.rInput.val(color[0]).removeClass('vectorHelper');
			this.gInput.val(color[1]).removeClass('vectorHelper');
			this.bInput.val(color[2]).removeClass('vectorHelper');
			this.aInput.val(color[3]).removeClass('vectorHelper');
			
			this.picker.color.active.val('rgba', {
				r: color[0] * 255,
				g: color[1] * 255,
				b: color[2] * 255,
				a: color[3] * 255
			});
		},
		
		getColor: function() {
			var r = this.rInput.val();
				g = this.gInput.val();
				b = this.bInput.val();
				a = this.aInput.val(),
				color = null;
			
			if (r !== 'r' && g !== 'g' && b !== 'b' && a !== 'a') {
				color = [
					parseFloat(r), parseFloat(g), parseFloat(b), 
					parseFloat(a)
				];
			}
			
			return color;
		},
		
		reset: function() {
			this.rInput.val('r').addClass('vectorHelper');
			this.gInput.val('g').addClass('vectorHelper');
			this.bInput.val('b').addClass('vectorHelper');
			this.aInput.val('a').addClass('vectorHelper');
			
			this.picker.color.active.val('hex', '#ffffff');
		}
	});
	
	return module;
})(editor || {});
