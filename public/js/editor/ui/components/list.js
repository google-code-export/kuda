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
	
	editor.ui.ListType = {
		UNORDERED: 0,
		ORDERED: 1
	};
	
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

	editor.ui.List = editor.ui.Component.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, editor.ui.ListDefaults, options);
			this._super(newOpts);
			
			this.list;
			this.listItemTemplate;
			this.idCounter = 0;
			this.listItems = new Hashtable();
		},
		
		add: function(liWidget) {
			this.list.append(this.createListItem(liWidget));
			liWidget.setParent(this);
		},
		
		after: function(liWidget, previousWidget) {
			previousWidget.getUI().parent().after(this.createListItem(liWidget));
			liWidget.setParent(this);
		},
		
		before: function(liWidget, nextWidget) {
			nextWidget.getUI().parent().before(this.createListItem(liWidget));
			liWidget.setParent(this);
		},
		
		clear: function() {
			this.list.empty();
			this.listItems.clear();
		},
		
		createListItem: function(liWidget) {
			var li = jQuery('<li></li>'),
				id = this.config.prefix + 'LstItm-' + this.idCounter;
				
			li.attr('id', id).append(liWidget.getUI());
			li.data('obj', liWidget);
			this.listItems.put(liWidget, li);
			
			this.idCounter += 1;
			
			return li;
		},
		
		edit: function(id, item, newName) {
			var li = this.list.find('#' + id),
				widget = li.data('obj');
			
			widget.attachObject(item);
			widget.setText(newName);
		},
		
		layout : function() {
			this.container = this.list = 
				this.config.type == editor.ui.ListType.UNORDERED ?
				jQuery('<ul class="listWidget"></ul>') : 
				jQuery('<ol class="listWidget"></ol>');
			this.list.attr('id', this.config.id)
				.addClass(this.config.cssClass);
			
			if (this.config.sortable) {
				this.list.sortable();
			}
		},
		
		makeSortable: function() {
			this.list.sortable();
		},
		
		remove: function(idOrWidget) {
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
		}
	});
		
	editor.ui.ListItem = editor.ui.Component.extend({
		init: function(options) {
			this._super(options);
		},
		
		attachObject: function(object) {
			this.container.data('obj', object);
		},
		
		data: function(key, value) {
			if (value != null) {
				return this.container.data(key, value);
			}
			else {
				return this.container.data(key);
			}
		},
		
		layout: function() {
			this.container = jQuery('<div></div>');
		},
		
		getAttachedObject: function() {
			return this.container.data('obj');
		},
		
		getId: function() {
			return this.container.parent().attr('id');
		},
		
		getText: function() {
			return this.container.text();
		},
		
		remove: function() {
			this.container.remove();
		},
		
		removeObject: function() {
			this.container.data('obj', null);
		},
		
		setId: function(id) {
			this.container.parent().attr('id', id);
		},
		
		setParent: function(parent) {
			this.parent = parent;
		},
		
		setText: function(text) {
			this.container.text(text);
		}
	});
	
	editor.ui.EdtLiWgtDefaultOptions = {
		removable: true,
		editable: true
	};
	
	editor.ui.EditableListItem = editor.ui.ListItem.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, editor.ui.EdtLiWgtDefaultOptions, options);
			this._super(newOpts);
		},
						
		layout: function() {
			this._super();
			
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
		},
		
		getText: function() {
			return this.title.text();
		},
		
		setText: function(text) {
			this.title.text(text);
		}
	});
	
	return editor;
})(editor || {});
