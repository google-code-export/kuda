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
	
	module.ui.ListType = {
		UNORDERED: 0,
		ORDERED: 1
	};
	
	module.EventTypes = module.EventTypes || {};
	module.EventTypes.ListItemRemoveClicked = "listener.ListItemRemoveClicked";
	module.EventTypes.ListItemEditClicked = "listener.ListItemEditClicked";
	module.EventTypes.ListItemClicked = "listener.ListItemClicked";
	
	/*
	 * Configuration object for the Widget.
	 */
	module.ui.ListWidgetDefaults = {
		widgetId: '',
		widgetClass: 'listWidget',
		prefix: 'lst',
		type: module.ui.ListType.UNORDERED,
		sortable: false
	};

	module.ui.ListWidget = module.ui.Component.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.ui.ListWidgetDefaults, options);
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
		
		finishLayout : function() {
			this.container = this.list = 
				this.config.type == module.ui.ListType.UNORDERED ?
				jQuery('<ul></ul>') : jQuery('<ol></ol>');
			this.list.attr('id', this.config.widgetId)
				.addClass(this.config.widgetClass);
			
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
			else if (idOrWidget instanceof module.ui.ListItemWidget) {
				li = this.listItems.remove(idOrWidget);
			}
			
			if (li !== null) {
				li.remove();
			}
		}
	});
		
	module.ui.ListItemWidget = module.ui.Component.extend({
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
		
		finishLayout: function() {
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
	
	module.ui.EdtLiWgtDefaultOptions = {
		removable: true,
		editable: true
	};
	
	module.ui.EditableListItemWidget = module.ui.ListItemWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.ui.EdtLiWgtDefaultOptions, options);
			this._super(newOpts);
		},
						
		finishLayout: function() {
			var btnDiv = jQuery('<div class="buttonContainer"></div>'),
				wgt = this;
			
			this.container = jQuery('<div></div>');
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
		
		setText: function(text) {
			this.title.text(text);
		}
	});
	
	return module;
})(editor || {}, jQuery);
