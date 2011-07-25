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
	
	// internal.  no one else can see or use
	var Tooltip = editor.ui.Component.extend({
		init: function(options) {
			this._super();
			this.id = 0;
		},
		
		finishLayout : function() {
			this.container = jQuery('<div class="tooltip"></div>');
			this.msg = jQuery('<p></p>');
			this.arrow = jQuery('<div class="arrow"></div>');
			
			// attach to the main body
			this.container.append(this.msg);
			
			// detect border
			if (this.msg.css('borderLeftWidth') !== 0) {
				this.arrow.addClass('outer');
				this.innerArrow = jQuery('<div class="innerArrow"></div>');
				this.msg.before(this.arrow);
				this.container.append(this.innerArrow);
			}
			else {
				this.container.append(this.arrow);
			}
			
			// hide
			this.container.hide();
		},
		
		setContainerClass: function(cls) {
			this.container.removeClass(function() {
				return jQuery(this).attr('class').replace('tooltip', '');
			});
			this.container.addClass(cls);
		},
		
		show: function(element, msg, opt_autohide) {
			var ctn = this.container,
				wgt = this;
			
			if (this.container.parents().size() === 0) {
				jQuery('body').append(this.container);
			}
								
			this.msg.text(msg);
			ctn.show();
			
			var	offset = element.offset(),
				height = ctn.outerHeight(true),
				width = ctn.outerWidth(true),
				center = element.width() / 2,
				elemHeight = element.height(),
				atTop = offset.top - height < 0,
				arrowHeight = 10,
				windowWidth = window.innerWidth ? window.innerWidth 
					: document.documentElement.offsetWidth,
				difference = width + offset.left > windowWidth 
					? offset.left - (windowWidth - width) : 0,
				top = atTop ? offset.top + elemHeight + arrowHeight 
					: offset.top - height;
			
			// position this
			ctn.offset({
				top: top + 20,
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
			
			if (!this.isAnimating) {
				this.isAnimating = true;				
				ctn.css('opacity', 0).animate({
					opacity: 1,
					top: '-=20'
				}, 200, function(){
					wgt.isAnimating = false;
				});
			}
			
			// auto hide the message
			if (opt_autohide != null) {
				this.hideTimer(true, opt_autohide);
			}
		},
		
		hide: function(opt_time) {
			this.hideTimer(false, opt_time);
		},
		
		hideTimer: function(resetTimer, opt_time) {
			var wgt = this,
				id = this.id;
			
			if (resetTimer) {
				id = this.id += 1;
			}
			
			setTimeout(function() {
				wgt.hideMessage(id);
			}, opt_time || 2000);
		},
		
		hideMessage: function(id) {
			if (this.id === id) {
				var ctn = this.container;
				
				ctn.animate({
					opacity: 0,
					top: '-=20'
				}, 200, function(){
					ctn.hide();
				});
			}
		}
	});
	
	editor.ui.createTooltip = function() {		
		return new Tooltip();
	};
	
	return editor;
})(editor || {}, jQuery);
