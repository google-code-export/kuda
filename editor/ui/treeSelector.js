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
	
    module.EventTypes = module.EventTypes || {};
	
	// jquery triggered events
	module.EventTypes.ColorPicked = 'editor.TreeSelector.ColorPicked';
	
	module.ui.TreeSelectorDefaults = {
		buttonId: 'treeSelector',
		containerClass: '',
		panelHeight: 400,
		types: {},
		json: {},
		select: null
	};
	
	module.ui.TreeSelector = module.ui.Component.extend({
		init: function(options) {
			var newOpts =  jQuery.extend({}, module.ui.TreeSelectorDefaults, 
				options);
			this._super(newOpts);
		},
		
		finishLayout: function() {			
			var wgt = this;
			
			// initialize container
			this.container = jQuery('<div></div>');
			this.input = jQuery('<input type="text" />');
			this.picker = jQuery('<button id="' + this.config.buttonId + '">Selector</button>');
			this.panel = jQuery('<div class="treeSelectPnl"></div>');
			this.tree = jQuery('<div></div>');
			
			this.container.addClass(this.config.containerClass);
			
			jQuery('body').append(this.panel);
			this.container.append(this.input).append(this.picker);
			this.panel.css({
				height: this.config.panelHeight,
				position: 'absolute'
			}).append(this.tree).hide();
			
			// setup the tree
			this.tree.bind('select_node.jstree', function(evt, data) {
				// check for a click on the node
				if (data.args[2] != null) {
					if (wgt.config.select) {
						wgt.config.select(data);
					}
					else {
						var elem = data.rslt.obj, 
							name = elem.find('a').text();
						
						wgt.input.val(name);						
					}
				}
			})
			.jstree({
				'json_data': {
					'data': this.config.json
				},
				'types': {
					'types': this.config.types
				},
				'themes': {
					'dots': false
				},
				'ui': {
					'select_limit': 1,
					'selected_parent_close': 'false'
				},
				'plugins': ['json_data', 'sort', 'themes', 'types', 'ui']
			});
			
			this.picker.bind('click', function(evt) {
				var input = wgt.input,
					position = input.offset(),
					width = wgt.container.outerWidth();
								
				position.top += input.outerHeight();
				
				wgt.panel.offset(position).width(width).slideDown(100);
			});
		},
	
		select: function(nodeId) {
			var elem = jQuery('#' + nodeId);
			this.tree.jstree('select_node', elem);
		},
		
		reset: function() {
			this.input.val('');
			this.tree.jstree('deselect_all');
		},
		
		value: function() {
			return this.input.data('selectObj');
		}
	});
	
	return module;
})(editor || {});
