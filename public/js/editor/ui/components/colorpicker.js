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
	
	module.ui.ColorPickerDefaults = {
		container: null,
		inputId: 'color',
		buttonId: 'colorPicker',
		containerClass: ''
	};
	
	module.ui.ColorPicker = module.ui.Component.extend({
		init: function(options) {
			var newOpts =  jQuery.extend({}, module.ui.ColorPickerDefaults, 
				options);
			this._super(newOpts);
		},
		
		finishLayout: function() {
			// initialize container
			this.container = jQuery('<div></div>');
			this.container.addClass(this.config.containerClass);
			
			// initialize inputs
			this.rInput = jQuery('<input type="text" id="' + this.config.inputId + 'R" class="rNdx color" placeholder="r" disabled />');
			this.gInput = jQuery('<input type="text" id="' + this.config.inputId + 'G"  class="gNdx color" placeholder="g" disabled />');
			this.bInput = jQuery('<input type="text" id="' + this.config.inputId + 'B"  class="bNdx color" placeholder="b" disabled />');
			this.aInput = jQuery('<input type="text" id="' + this.config.inputId + 'A"  class="aNdx color" placeholder="a" disabled />');
			
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
				layer = editor.ui.Layer.DIALOG,
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
						type: 'fade',
						speed: {
							show: 'fast'
						}
					}
				},
				images: {
					clientPath: 'js/lib/jpicker/images/'
				},
				color: {
					active: '#ffffff'
				}
			};
			
			var colorPickedFcn = function(color) {
				var rndFnc = module.utils.roundNumber;
							 
				r.val(rndFnc(color.val('r')/255, 2));
				g.val(rndFnc(color.val('g')/255, 2));
				b.val(rndFnc(color.val('b')/255, 2));
				a.val(rndFnc(color.val('a')/255, 2));
				
				var val = [
					parseFloat(r.val()), parseFloat(g.val()), parseFloat(b.val()), 
					parseFloat(a.val())
				];
				
				return val;
			};
				
			colorPickerElem.jPicker(options, function(color, context) {
				var clr = colorPickedFcn(color);
				wgt.notifyListeners(module.events.ColorPicked, clr);
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
						
			// puts these last lines in the setTimeout queue, which should be
			// after the colorpicker
			setTimeout(function() {
				jQuery('div.jPicker.Container:last.Move').text('Color Picker');
			
				jQuery(wgt.picker).siblings('.jPicker')
					.bind('click', function(evt) {
						var btn = jQuery(this),
							win = options.window;
						
						// override default behavior
						jQuery('div.jPicker.Container').each(function(){
							var elem = jQuery(this);
							
							if (parseInt(elem.css('zIndex')) === 10) {
								elem.css({ zIndex: layer });	
							}
							else {
								elem.css({ 
									zIndex: layer + 1,
								
									// popups in the wrong place due to the button 
									// being hidden at first
									
									left:
										win.position.x == 'left' ? (btn.offset().left - 530 - (win.position.y == 'center' ? 25 : 0)) + 'px' :
										win.position.x == 'center' ? (btn.offset().left - 260) + 'px' :
										win.position.x == 'right' ? (btn.offset().left - 10 + (win.position.y == 'center' ? 25 : 0)) + 'px' :
										win.position.x == 'screenCenter' ? (($(document).width() >> 1) - 260) + 'px' : (btn.offset().left + parseInt(win.position.x)) + 'px',
									position: 'absolute',
									top: win.position.y == 'top' ? (btn.offset().top - 312) + 'px' :
										win.position.y == 'center' ? (btn.offset().top - 156) + 'px' :
										win.position.y == 'bottom' ? (btn.offset().top + 25) + 'px' : (btn.offset().top + parseInt(win.position.y)) + 'px'
								});
								 
							}
						});
					});
				
				// find the last container and override default
				jQuery('div.jPicker.Container:last')
					.unbind('mousedown')
					.bind('mousedown', function() {
						jQuery('div.jPicker.Container').each(function() {								
							jQuery(this).css({ zIndex: layer });
						});
						jQuery(this).css({ zIndex: layer + 1 });
					});				
			}, 0);
		},
		
		setColor: function(color) {	
			this.rInput.val(color[0]);
			this.gInput.val(color[1]);
			this.bInput.val(color[2]);
			this.aInput.val(color[3]);
			
			this.picker.color.active.val('rgba', {
				r: color[0] * 255,
				g: color[1] * 255,
				b: color[2] * 255,
				a: color[3] * 255
			});
		},
		
		getColor: function() {
			var r = this.rInput.val(),
				g = this.gInput.val(),
				b = this.bInput.val(),
				a = this.aInput.val(),
				color = null;
			
			if (r !== '' && g !== '' && b !== '' && a !== '') {
				r = parseFloat(r);
				g = parseFloat(g);
				b = parseFloat(b);
				a = parseFloat(a);
				
				if (!(isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a))) {
					color = [r, g, b, a];
				}
			}
			
			return color;
		},
		
		reset: function() {
			this.rInput.val('');
			this.gInput.val('');
			this.bInput.val('');
			this.aInput.val('');
			
			this.picker.color.active.val('hex', '#ffffff');
		}
	});
	
	return module;
})(editor || {});
