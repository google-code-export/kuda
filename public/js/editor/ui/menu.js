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
	o3djs.require('editor.ui.component');
	
	module.ui = module.ui || {};
	
    module.EventTypes = module.EventTypes || {};
	module.EventTypes.MenuItemShown = "MenuItemShown";
    module.EventTypes.MenuActionClicked = "MenuActionClicked";
	
	module.ui.Constants = module.ui.Constants || {};
	module.ui.Constants.UP_STATE = "UP";
	module.ui.Constants.DOWN_STATE = "DOWN";

    /*
     * Configuration object for the MenuItem.
     */
    module.ui.MenuItemDefaults = {
		title: null,
		action: null,
		stateful: false,
		stateDownClass: 'down',
		stateUpClass: 'up'
    };
    
    module.ui.MenuItem = module.ui.Component.extend({
		init: function(options) {		
	        var newOpts = jQuery.extend({}, module.ui.MenuItemDefaults, options);
			this._super(newOpts);
			
			this.stateful = newOpts.stateful;
			this.setState(module.ui.Constants.UP_STATE);
			this.downClass = newOpts.stateDownClass;
			this.upClass = newOpts.stateUpClass;
	    },
		
		finishLayout: function() {
	        this.container = jQuery('<a></a>');
	        
	        if (this.config.title) {
	            this.setTitle(this.config.title);
	        }
	        
	        if (this.config.action) {
	            this.setAction(this.config.action);
	        }
		},
    
    	setTitle: function(title) {
	        this.container.text(title);
	    },
		
		setKeyboardShortcut: function(key) {
	        
	    },
    
	    setAction: function(callback) {
			var that = this;
			
	        this.container.bind('click', function(evt) {
	            callback(evt);
				that.notifyListeners(module.EventTypes.MenuActionClicked, that);
				that.toggleState();
	        });
	    },
		
		setState: function(state) {
			if (this.stateful) {
				// check
				if (state == module.ui.Constants.DOWN_STATE ||
					state == module.ui.Constants.UP_STATE) {
					var oldClass;
					var newClass;
					if (state == module.ui.Constants.DOWN_STATE) {
						oldClass = this.upClass;
						newClass = this.downClass;
					} 
					else {
						oldClass = this.downClass;
						newClass = this.upClass;
					}
					
					this.state = state;
					this.container.removeClass(oldClass).addClass(newClass);
				}
				else {
					alert(state + ' is an improper state');
				}
			}
		},
		
		toggleState: function() {
			if (this.stateful) {
				this.setState(this.state == module.ui.Constants.DOWN_STATE ? 
					module.ui.Constants.UP_STATE : 
					module.ui.Constants.DOWN_STATE);
			}
		}
	});
	
	module.ui.Menu = module.ui.MenuItem.extend({
		init: function(opt_title, opt_noAction) {
			var that = this;
			this.menuItems = [];
			this.shown = false;
			this.enabled = true;
				
			this._super();
		
			if (opt_title) {
				this.setTitle(opt_title);
			}
			
			if (!opt_noAction) {
				this.setAction(function(evt){
					if (that.shown) {
						that.hide();
						jQuery(document).unbind('click.menu');
					}
					else {
						var highestZ = 0;
						jQuery('.ui-dialog').each(function(){
							var z = parseInt(jQuery(this).css('zIndex'));
							highestZ = z > highestZ ? z : highestZ;
						});
						
						that.show();
						that.list.css('zIndex', highestZ + 1);
						jQuery(document).bind('click.menu', function(evt){
							var target = jQuery(evt.target), 
								parent = target.parents('.uiMenu');
							
							if (parent.size() == 0) {
								that.hide();
							}
						});
					}
					
					that.notifyListeners(module.EventTypes.MenuItemShown, that);
				});
			}
		},
		
		finishLayout: function() {	
			this.container = jQuery('<div class="uiMenu"></div>');
			this.titleLink = jQuery('<span></span>');
	        this.list = jQuery('<ul></ul>');
			this.listItem = jQuery('<li></li>');
			
			this.container.append(this.titleLink).append(this.list);
			this.list.hide();
		},
	
		addMenuItem: function(menuItem) {
			if (menuItem instanceof module.ui.MenuItem) {
				var li = this.listItem.clone();
				var that = this;
				
				li.append(menuItem.getUI());
				this.list.append(li);
				this.menuItems.push(menuItem);
				
				menuItem.addListener(module.EventTypes.MenuActionClicked, function(value) {
					that.hide();
				});
			} else {
				alert("Must be a menu item " + menuItem.getUI.html());
			}
		},
	    
	    setTitle: function(title) {
	        this.titleLink.text(title).attr('id', 'uiMenuItem_' + title);
	    },
	    
	    setAction: function(callback) {
			var that = this;
	        this.titleLink.bind('click', function(evt) {
	            if (that.enabled) {
					callback(evt);
				}
	        });
	    },
		
		setEnabled: function(enabled) {
			this.enabled = enabled;
		},
	    
	    hide: function() {
	        this.list.fadeOut(200);
			this.shown = false;
			this.titleLink.removeClass('uiMenuShown');
	    },
	    
	    show: function() {
	        this.list.fadeIn(200);
	        this.shown = true;
			this.titleLink.addClass('uiMenuShown');
	    }
	});
	
	module.ui.PopupMenu = module.ui.Menu.extend({
		init: function(opt_title) {
			this._super(opt_title, true);
		},
		
		finishLayout: function() {
			this._super();
			this.container.hide();
			this.list.show();
		},
		
		hide: function() {
			this.container.fadeOut(200);
			this.shown = false;
			jQuery(document).unbind('click.menu');
			this.parent.removeClass('uiMenuShown');
			this.parent = null;
		},
		
		show: function(position, parent) {			
			jQuery(document).bind('click.menu', function(evt){
				var target = jQuery(evt.target), 
					par = target.parents('.uiMenu');
				
				if (par.size() == 0 && target[0] != parent[0]) {
					that.hide();
				}
			});
						
			this.container.css({
				top: position.top,
				left: position.left
			}).fadeIn(200);
			this.shown = true;
			var that = this;
			this.parent = parent;
			
			parent.addClass('uiMenuShown');
		}
	});
    
    module.ui.MenuBar = module.ui.Menu.extend({
		init: function() {
			this._super();
			this.list.show();       
			this.container.removeClass().addClass("uiMenuBar");
    	},
		
	    addMenuItem: function(menuItem) {
			var that = this;
	        this._super(menuItem);
			
			menuItem.addListener(module.EventTypes.MenuItemShown, function(value) {
				for (var ndx = 0, len = that.menuItems.length; ndx < len; ndx++) {
					var item = that.menuItems[ndx];
					
					if (item != value) {
						item.hide();
					}
				}
			});
	    },
	    
	    setTitle: function(title) {
	    },
	    
	    setAction: function(callback) {
	    },
		
		setEnabled: function(enabled) {
			for (var i = 0, il = this.menuItems.length; i < il; i++) {
				this.menuItems[i].setEnabled(enabled);
			}
		}
	});
	
	module.ui.Separator = module.ui.MenuItem.extend({
		init: function() {
	        this._super();
		},
		
		finishLayout: function() {
			this.container = jQuery('<span class="uiMenuSeparator"></span>');
		}
	});
	
	return module;
})(editor || {});
