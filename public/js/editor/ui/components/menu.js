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
	
	editor.ui.Constants = editor.ui.Constants || {};
	editor.ui.Constants.UP_STATE = "UP";
	editor.ui.Constants.DOWN_STATE = "DOWN";
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                			  Menu Item	                                          //
////////////////////////////////////////////////////////////////////////////////////////////////////

    /*
     * Configuration object for the MenuItem.
     */
    editor.ui.MenuItemDefaults = {
		title: null,
		action: null,
		stateful: false,
		stateDownClass: 'down',
		stateUpClass: 'up'
    };
    
    var MenuItem = editor.ui.MenuItem = function(options) {		
        var newOpts = jQuery.extend({}, editor.ui.MenuItemDefaults, options);
		editor.ui.Component.call(this, newOpts);
		
		this.stateful = newOpts.stateful;
		this.setState(editor.ui.Constants.UP_STATE);
		this.downClass = newOpts.stateDownClass;
		this.upClass = newOpts.stateUpClass;
    };
		
	MenuItem.prototype = new editor.ui.Component();
	MenuItem.prototype.constructor = MenuItem;
		
	MenuItem.prototype.layout = function() {
        this.container = jQuery('<a></a>');
        
        if (this.config.title) {
            this.setTitle(this.config.title);
        }
        
        if (this.config.action) {
            this.setAction(this.config.action);
        }
	};

	MenuItem.prototype.setTitle = function(title) {
        this.container.text(title);
    };
	
	MenuItem.prototype.setKeyboardShortcut = function(key) {
        
    };

    MenuItem.prototype.setAction = function(callback) {
		var that = this;
		
        this.container.bind('click', function(evt) {
            callback(evt);
			that.notifyListeners(editor.events.MenuItemClicked, that);
			that.toggleState();
        });
    };
	
	MenuItem.prototype.setState = function(state) {
		if (this.stateful) {
			// check
			if (state == editor.ui.Constants.DOWN_STATE ||
				state == editor.ui.Constants.UP_STATE) {
				var oldClass;
				var newClass;
				if (state == editor.ui.Constants.DOWN_STATE) {
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
	};
	
	MenuItem.prototype.toggleState = function() {
		if (this.stateful) {
			this.setState(this.state == editor.ui.Constants.DOWN_STATE ? 
				editor.ui.Constants.UP_STATE : 
				editor.ui.Constants.DOWN_STATE);
		}
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                				Menu	                                          //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var Menu = editor.ui.Menu = function(opt_title, opt_noAction) {
		var that = this;
		this.menuItems = [];
		this.shown = false;
		this.enabled = true;
			
		MenuItem.call(this);
	
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
			});
		}
	};
		
	Menu.prototype = new MenuItem();
	Menu.prototype.constructor = Menu;
		
	Menu.prototype.layout = function() {	
		this.container = jQuery('<div class="uiMenu"></div>');
		this.titleLink = jQuery('<span></span>');
        this.list = jQuery('<ul></ul>');
		this.listItem = jQuery('<li></li>');
		
		this.container.append(this.titleLink).append(this.list);
		this.list.hide();
	};

	Menu.prototype.addMenuItem = function(menuItem) {
		if (menuItem instanceof editor.ui.MenuItem) {
			var li = this.listItem.clone();
			var that = this;
			
			li.append(menuItem.getUI());
			this.list.append(li);
			this.menuItems.push(menuItem);
			
			menuItem.addListener(editor.events.MenuItemClicked, function(value) {
				that.hide();
			});
		} else {
			alert("Must be a menu item " + menuItem.getUI.html());
		}
	};
    
    Menu.prototype.setTitle = function(title) {
        this.titleLink.text(title).attr('id', 'uiMenuItem_' + title);
    };
    
    Menu.prototype.setAction = function(callback) {
		var that = this;
        this.titleLink.bind('click', function(evt) {
            if (that.enabled) {
				callback(evt);
			}
        });
    };
	
	Menu.prototype.setEnabled = function(enabled) {
		this.enabled = enabled;
	};
    
    Menu.prototype.hide = function() {
        this.list.fadeOut(200);
		this.shown = false;
		this.titleLink.removeClass('uiMenuShown');
    };
    
    Menu.prototype.show = function() {
        this.list.fadeIn(200);
        this.shown = true;
		this.titleLink.addClass('uiMenuShown');
    };
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                			Popup Menu	                                          //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var PopupMenu = editor.ui.PopupMenu = function(opt_title) {
		Menu.call(this, opt_title, true);
	};
	var popSuper = Menu.prototype;
		
	PopupMenu.prototype = new Menu();
	PopupMenu.prototype.constructor = PopupMenu;
		
	PopupMenu.prototype.finishLayout = function() {
		popSuper.finishLayout.call(this);
		this.container.css({
			'zIndex': editor.ui.Layer.MENU
		}).hide();
		this.list.show();
	};
	
	PopupMenu.prototype.hide = function() {
		this.container.fadeOut(200);
		this.shown = false;
		jQuery(document).unbind('click.menu');
		this.parent.removeClass('uiMenuShown');
		this.parent = null;
	};
	
	PopupMenu.prototype.show = function(position, parent) {			
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
	};
	
})(editor);
