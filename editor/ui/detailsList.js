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
	
    /*
     * Configuration object for the ModelBrowserView.
     */
    module.ui.DetailsListDefaults = {
        listClass: 'detailsList',
        listId: 'details',
		subListClass: 'subDetailsList',
		listItemClass: 'detailsListItem',
		labelClass: 'detailsLabel',
		valueClass: 'detailsValue'
    };
	
	module.ui.DetailsList = module.ui.Component.extend({
		init: function(options) {
	        var newOpts = jQuery.extend({}, module.ui.DetailsListDefaults, 
				options);
			this._super(newOpts);
		},
		
		finishLayout: function() {
			this.list = jQuery('<ul></ul>');			
			
			this.list.addClass(this.config.listClass).attr('id', this.config.listId);
		},
		
		addItem: function(label, value) {
            var listItem = jQuery('<li class="' + this.config.listItemClass + '"></li>'),
	            lbl = jQuery('<span></span>'),
	            val = jQuery('<span></span>');
            
            lbl.addClass(this.config.labelClass).append(label);
            val.addClass(this.config.valueClass).append(this.cleanup(value));
            
            listItem.append(lbl).append(val);
				
			this.list.append(listItem);
		},
            
        addList: function(label, list) {
            var lbl = jQuery('<span></span>'),
            	listItem = jQuery('<li class="' + this.config.listItemClass + '"></li>'),
				subList = this.layoutList(list);
			
            lbl.addClass(this.config.labelClass).append(label);			
			listItem.append(lbl).append(subList);
			this.list.append(listItem);
        },
		
		layoutList: function(list) {
            var subList = jQuery('<ul></ul>');
            
            subList.addClass(this.config.subListClass).removeAttr('id');
            
            for (var ndx = 0, len = list.length; ndx < len; ndx++) {
                var subLbl = jQuery('<span></span>');
                var subVal = jQuery('<span></span>');
                var subLi = jQuery('<li class="' + this.config.listItemClass + '"></li>');
                var item = list[ndx];
                
                subLbl.addClass(this.config.labelClass);
                subVal.addClass(this.config.valueClass);
                
                subLbl.empty().append(item.label);
                subVal.empty().append(this.cleanup(item.value));
                
                subLi.append(subLbl).append(subVal);
                subList.append(subLi);
            }
			
			return subList;
		},
		
		cleanup: function(val) {
			var retVal = val;
			
			if (jQuery.isArray(val) && val.length > 0) {
				if (jQuery.isPlainObject(val[0])) {
					retVal = this.layoutList(val);
				}
				else {
					retVal = this.printArray(val);
				}
			}
			
			return retVal;
		},
		
		printArray: function(arr) {
			var strings = [];
			
			for (var ndx = 0, len = arr.length; ndx < len; ndx++) {
				var item = arr[ndx];
				strings.push(jQuery.isArray(item) ? this.printArray(item) : item);
			}
			
			return '[' + strings.join(',') + ']';
		},
		
		getList: function() {
			return this.list;
		}
	});
	
	return module;
})(editor || {});
