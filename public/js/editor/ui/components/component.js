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
	
	editor.ui.ComponentDefaults = {
		uiFile: null,
		showOptions: null,
		hideOptions: null
	};
	
	var Component = editor.ui.Component = function(options) {
		editor.utils.Listenable.call(this);
		
        this.config = jQuery.extend({}, editor.ui.ComponentDefaults, options);
		this.container = null;
		
		if (this.visible === undefined) {
			this.visible = false;
		}
		
		if (this.config.uiFile && this.config.uiFile !== '') {
			this.load();
		}
		else {
			this.layout();
			this.finishLayout();
			this.notifyListeners(editor.events.Loaded);
		}
	};

	Component.prototype = new editor.utils.Listenable();
	Component.prototype.constructor = Component;
		
	Component.prototype.layout = function() {
		// Place DOM elements
	};
	
	Component.prototype.finishLayout = function() {
		// Do any final styling or event binding
	};
	
	Component.prototype.load = function() {
		var cmp = this;
		this.container = jQuery('<div></div>');

		if (this.config.uiFile && this.config.uiFile !== '') {
			hemi.loader.loadHtml(this.config.uiFile, function(data) {
				// clean the string of html comments
				var cleaned = data.replace(/<!--(.|\s)*?-->/, '');
				cmp.container.append(jQuery(cleaned));
				cmp.layout();
				cmp.finishLayout();
				cmp.notifyListeners(editor.events.Loaded);
			});
		}
	};
	
	Component.prototype.getUI = function() {
		return this.container;
	};
	
	Component.prototype.setVisible = function(visible) {
		if (visible) {
			this.container.show(this.config.showOptions);
		}
		else {
			this.container.hide(this.config.hideOptions);
		}
	};
	
	Component.prototype.isVisible = function() {
		return this.container.is(':visible');
	};
	
	Component.prototype.find = function(query) {
		return this.container.find(query);
	};
	
})(editor);
