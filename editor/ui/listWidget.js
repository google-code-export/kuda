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
		
		add: function(liWidget) {
			this.list.append(this.createListItem(liWidget));
		},
		
		insert: function(liWidget, previousWidget) {
			previousWidget.getUI().parent().after(this.createListItem(liWidget));
		},
		
		edit: function(id, item, newName) {
			var li = this.list.find('#' + id),
				widget = li.data('obj');
			
			widget.attachObject(item);
			widget.setText(newName);
		},
		
		remove: function(idOrWidget) {
			var li = null;
			
			if (typeof idOrWidget === 'string') {
				li = this.list.find('#' + idOrWidget);
				var widget = li.data('obj');
				this.listItems.remove(widget);
			}
			else if (idOrWidget instanceof module.ui.ListItemWidget) {
				li = this.listItems.remove(idOrWidget);
			}
			
			if (li !== null) {
				li.remove();
			}
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
		
		clear: function() {
			this.list.empty();
			this.listItems.clear();
		}
	});
		
	module.ui.ListItemWidget = module.ui.Component.extend({
		init: function() {
			this._super();
		},
		
		attachObject: function(object) {
			this.container.data('obj', object);
		},
		
		removeObject: function() {
			this.container.data('obj', null);
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
		
		finishLayout: function() {
			this.container = jQuery('<span></span>');
		},
		
		setId: function(id) {
			this.container.parent().attr('id', id);
		},
		
		setText: function(text) {
			this.container.text(text);
		},
		
		remove: function() {
			this.container.remove();
		},
		
		data: function(key, value) {
			if (value != null) {
				return this.container.data(key, value);
			}
			else {
				return this.container.data(key);
			}
		}
	});
	
	module.ui.EditableListItemWidget = module.ui.ListItemWidget.extend({
		init: function() {
			this._super();
		},
						
		finishLayout: function() {
			this.container = jQuery('<div></div>');
			this.title = jQuery('<span></span>');
			this.editBtn = jQuery('<button class="editBtn">Edit</button>');
			this.removeBtn = jQuery('<button class="removeBtn">Remove</button>');
			var btnDiv = jQuery('<div class="buttonContainer"></div>');
			
			btnDiv.append(this.editBtn).append(this.removeBtn);
			this.container.append(this.title).append(btnDiv);
		},
		
		setText: function(text) {
			this.title.text(text);
		}
	});
	
	return module;
})(editor || {}, jQuery);
