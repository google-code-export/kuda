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

(function(window, jQuery) {
	o3djs.require('editor.requires');
	
	Application = function() {
	};
	
	Application.prototype = {
		initViewerStep1: function() {
			var app = this;
			
			o3djs.util.makeClients(function(clientElements) {
				app.initViewerStep2(clientElements);
			});
		},
		
		initViewerStep2: function(clientElements) {	  
			// First: adjust the Hemi loader's path since this HTML file is in
			// the editor directory.
			hemi.loader.loadPath = '../';
			hemi.core.init(clientElements[0]);
			hemi.loader.loadOctane('editor/project.json');
		},

		uninitViewer: function() {
			if (hemi.core.client) {
				hemi.core.client.cleanup();
			}
		},

		sizeViewerPane: function() {
			var vwr = jQuery('#o3d');
			vwr.css('width', '100%').css('height', '100%');
		},
		
		scrollbarWidth: function() {
			var div = jQuery('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
			// Append our div, do our calculation and then remove it
			jQuery('body').append(div);
			var w1 = jQuery('div', div).innerWidth();
			div.css('overflow-y', 'scroll');
			var w2 = jQuery('div', div).innerWidth();
			jQuery(div).remove();
			return (w1 - w2);
		}
	};
	
	var app = new Application();
	
	window.onload = function() {
		app.sizeViewerPane();		 
		app.initViewerStep1();
	};
	
	window.onunload = function() {
		app.uninitViewer();
	};
	
	jQuery(window).resize(jQuery.debounce(250, false, function() {
		app.sizeViewerPane();
	}));
})(window, jQuery);
