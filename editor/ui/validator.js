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
 
 var editor = (function(module, jQuery) {
	module.ui = module.ui || {};	
	
	module.EventTypes = module.EventTypes || {};

	// internal.  no one else can see or use
	var ErrorWidget = module.ui.Component.extend({
		init: function() {
			this._super();
			this.id = 0;
		},
		
		finishLayout : function() {
			this.container = jQuery('<div class="errorWrapper"></div>');
			this.msg = jQuery('<p class="errorMsg"></p>');
			this.arrow = jQuery('<div class="errorArrow"></div>');
			
			// attach to the main body
			this.container.append(this.msg);
			
			// detect border
			if (this.msg.css('borderLeftWidth') !== 0) {
				this.arrow.addClass('outer');
				this.innerArrow = jQuery('<div class="innerErrorArrow"></div>');
				this.msg.before(this.arrow);
				this.container.append(this.innerArrow);
			}
			else {
				this.container.append(this.arrow);
			}
			
//			jQuery('body').append(this.container);
			
			// hide
			this.container.hide();
		},
		
		showError: function(element, msg, checkFcn) {
			var ctn = this.container,
				form = element.parents('form'),
				wgt = this;
								
			this.msg.text(msg);
			form.append(ctn);
			ctn.show();
			
			var	offset = element.offset(),
				formOffset = form.offset(),
				height = ctn.outerHeight(true),
				width = ctn.outerWidth(true),
				center = element.width() / 2,
				elemHeight = element.height(),
				atTop = offset.top - formOffset.top - height < 0,
				arrowHeight = 10,
				windowWidth = window.innerWidth ? window.innerWidth 
					: document.documentElement.offsetWidth,
				difference = width + offset.left > windowWidth 
					? offset.left - (windowWidth - width) : 0,
				errorEvent = 'blur.error',
				top = atTop ? offset.top + elemHeight + arrowHeight 
					: offset.top - height;
			
			// position this
			ctn.offset({
				top: top,
				left: offset.left - difference
			});
			
			if (atTop) {
				this.innerArrow.addClass('top');
				this.arrow.addClass('top');
			}
			else {
				this.innerArrow.removeClass('top');
				this.arrow.removeClass('top');
			}
			
			
			// position the arrow
			this.arrow.css('left', center + difference);
			if (this.innerArrow) {
				this.innerArrow.css('left', center + difference);
			}
			
			// set the element class
			element.addClass('error');
			
			// auto hide the message
			this.hideTimer(true);
		},
		
		hideError: function(element) {			
			element.removeClass('error');
			this.hideTimer(false);
		},
		
		hideTimer: function(resetTimer) {
			var wgt = this,
				id = this.id;
			
			if (resetTimer) {
				id = this.id += 1;
			}
			
			setTimeout(function() {
				wgt.hideMessage(id);
			}, 1000);
		},
		
		hideMessage: function(id) {
			if (this.id === id) {
				var ctn = this.container;
				
				ctn.fadeOut(300, function(){
					ctn.remove();
				});
			}
		}
	});
	
	var errWgt = null;
		
	module.ui.Validator = module.utils.Listenable.extend({
		init: function(elements, checkFunction) {
			this._super();
			
			if (!errWgt) {
				errWgt = new ErrorWidget();
			}
			
			elements.bind('blur.errEvt', function(evt) {
				var elem = jQuery(this),
					msg = null;
								
				msg = checkFunction(elem);
				
				if (msg) {
					errWgt.showError(elem, msg);
				}
				else {
					errWgt.hideError(elem);
				}
			});
		}
	});
	
	return module;
})(editor || {}, jQuery);
