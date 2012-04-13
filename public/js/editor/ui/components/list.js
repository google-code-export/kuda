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
	
	editor.ui.ListType = {
		UNORDERED: 0,
		ORDERED: 1
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                				List	                                          //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	/*
	 * Configuration object for the Widget.
	 */
	editor.ui.ListDefaults = {
		id: '',
		cssClass: '',
		prefix: 'lst',
		type: editor.ui.ListType.UNORDERED,
		sortable: false
	};

	var List = editor.ui.List = function(options) {
		var newOpts = jQuery.extend({}, editor.ui.ListDefaults, options);
		editor.ui.Component.call(this, newOpts);
		
		this.list;
		this.listItemTemplate;
		this.idCounter = 0;
		this.listItems = new Hashtable();
	};
		
	List.prototype = new editor.ui.Component();
	List.prototype.constructor = List;
		
	List.prototype.add = function(liWidget) {
		this.list.append(this.createListItem(liWidget));
		liWidget.setParent(this);
	};
	
	List.prototype.after = function(liWidget, previousWidget) {
		previousWidget.getUI().parent().after(this.createListItem(liWidget));
		liWidget.setParent(this);
	};
	
	List.prototype.before = function(liWidget, nextWidget) {
		nextWidget.getUI().parent().before(this.createListItem(liWidget));
		liWidget.setParent(this);
	};
	
	List.prototype.clear = function() {
		this.list.empty();
		this.listItems.clear();
	};
	
	List.prototype.createListItem = function(liWidget) {
		var li = jQuery('<li></li>'),
			id = this.config.prefix + 'LstItm-' + this.idCounter;
			
		li.attr('id', id).append(liWidget.getUI());
		li.data('obj', liWidget);
		this.listItems.put(liWidget, li);
		
		this.idCounter += 1;
		
		return li;
	};
	
	List.prototype.edit = function(id, item, newName) {
		var li = this.list.find('#' + id),
			widget = li.data('obj');
		
		widget.attachObject(item);
		widget.setText(newName);
	};
	
	List.prototype.layout  = function() {
		this.container = this.list = 
			this.config.type == editor.ui.ListType.UNORDERED ?
			jQuery('<ul class="listWidget"></ul>') : 
			jQuery('<ol class="listWidget"></ol>');
		this.list.attr('id', this.config.id)
			.addClass(this.config.cssClass);
		
		if (this.config.sortable) {
			this.list.sortable();
		}
	};
	
	List.prototype.makeSortable = function() {
		this.list.sortable();
	};
	
	List.prototype.remove = function(idOrWidget) {
		var li = null;
		
		if (typeof idOrWidget === 'string') {
			li = this.list.find('#' + idOrWidget);
			var widget = li.data('obj');
			widget.setParent(null);
			this.listItems.remove(widget);
		}
		else if (idOrWidget instanceof editor.ui.ListItem) {
			li = this.listItems.remove(idOrWidget);
		}
		
		if (li !== null) {
			li.remove();
		}
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                			  List Item	                                          //
////////////////////////////////////////////////////////////////////////////////////////////////////
		
	var ListItem = editor.ui.ListItem = function(options) {
		editor.ui.Component.call(this, options);
	};
		
	ListItem.prototype = new editor.ui.Component();
	ListItem.prototype.constructor = ListItem;
		
	ListItem.prototype.attachObject = function(object) {
		this.container.data('obj', object);
	};
	
	ListItem.prototype.data = function(key, value) {
		if (value != null) {
			return this.container.data(key, value);
		}
		else {
			return this.container.data(key);
		}
	};
	
	ListItem.prototype.layout = function() {
		this.container = jQuery('<div></div>');
	};
	
	ListItem.prototype.getAttachedObject = function() {
		return this.container.data('obj');
	};
	
	ListItem.prototype.getId = function() {
		return this.container.parent().attr('id');
	};
	
	ListItem.prototype.getText = function() {
		return this.container.text();
	};
	
	ListItem.prototype.remove = function() {
		this.container.remove();
	};
	
	ListItem.prototype.removeObject = function() {
		this.container.data('obj', null);
	};
	
	ListItem.prototype.setId = function(id) {
		this.container.parent().attr('id', id);
	};
	
	ListItem.prototype.setParent = function(parent) {
		this.parent = parent;
	};
	
	ListItem.prototype.setText = function(text) {
		this.container.text(text);
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                		 Editable List Item                                       //
////////////////////////////////////////////////////////////////////////////////////////////////////

	editor.ui.EdtLiWgtDefaultOptions = {
		removable: true,
		editable: true
	};
	
	var EditableListItem = editor.ui.EditableListItem = function(options) {
		var newOpts = jQuery.extend({}, editor.ui.EdtLiWgtDefaultOptions, options);
		editor.ui.ListItem.call(this, newOpts);
	};
	var eliSuper = editor.ui.ListItem.prototype;
		
	EditableListItem.prototype = new editor.ui.ListItem();
	EditableListItem.prototype.constructor = EditableListItem;
						
	EditableListItem.prototype.layout = function() {
		eliSuper.layout.call(this);
		
		var btnDiv = jQuery('<div class="buttonContainer"></div>');
		this.title = jQuery('<span></span>');
		
		if (this.config.editable) {
			this.editBtn = jQuery('<button class="editBtn">Edit</button>');
			btnDiv.append(this.editBtn);
		}
		if (this.config.removable) {
			this.removeBtn = jQuery('<button class="removeBtn">Remove</button>');
			btnDiv.append(this.removeBtn);				
		}
		
		this.container.append(this.title).append(btnDiv);
	};
	
	EditableListItem.prototype.getText = function() {
		return this.title.text();
	};
	
	EditableListItem.prototype.setText = function(text) {
		this.title.text(text);
	};
	
})(editor);
