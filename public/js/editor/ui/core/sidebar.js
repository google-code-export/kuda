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
	
	var MAX_TXT = 'Maximize',
		MIN_TXT = 'Minimize';
		
	module.EventTypes = module.EventTypes || {};
	module.EventTypes.Sidebar = {
		// sidebar widget specific
		WidgetVisible: "sidebar.WidgetVisible",
		WidgetInvalidate: "sidebar.WidgetInvalidate",
		WidgetLoaded: "sidebar.WidgetLoaded",
		
		// sidebar specific
		Minimized: "sidebar.Minimized",
		FinishedLoading: "sidebar.FinishedLoading"
	};
   
////////////////////////////////////////////////////////////////////////////////
//                     				Sidebar				                   	  //
////////////////////////////////////////////////////////////////////////////////     
	
	module.ui.SidebarDefaults = {
		containerId: 'sidebar'
	};
	
	module.ui.Sidebar = module.ui.Component.extend({
		init: function(options) {		
			var newOpts = jQuery.extend({}, module.ui.SidebarDefaults, options);
			this.widgets = [];
			this.waitingToAdd = [];
			this.visibleWidgets = [];
			this.minimized = false;
				
			this._super(newOpts);
		},
		
		finishLayout: function() {
			this.container = jQuery('#' + this.config.containerId);
			this.minMaxBtn = jQuery('<button id="minMaxBtn">Minimize</button>');
			var sidebar = this,
				sizeFcn = function() {
					// size the container
					var	col = jQuery('#column3'),
						win = jQuery(window),
						sbr = sidebar.container,
						
						colHeight = col.innerHeight(),		
						colPadding = Math.ceil(parseFloat(col.css('paddingTop'))) 
							+ Math.ceil(parseFloat(col.css('paddingBottom'))),
						sbrPadding = Math.ceil(parseFloat(sbr.css('paddingTop'))) 
							+ Math.ceil(parseFloat(sbr.css('paddingBottom'))),
						
						newHeight = colHeight - colPadding - sbrPadding;
						sbr.height(newHeight);
				};
			// Commenting this out for now until bugs get worked out. ~ekitson
//			this.container.append(this.minMaxBtn);
			
			this.minMaxBtn.bind('click', function(evt) {
				if (sidebar.minimized) {
					sidebar.maximize();
				}
				else {
					sidebar.minimize();
				}
				
				jQuery(window).trigger('resize');
			});
			
			sizeFcn();					
			jQuery('#o3d').bind('editor.mainView.resize', function(evt) {
				sizeFcn();
				sidebar.layoutWidgets();
			});
		},
		
		addWidget: function(widget) {
			if (widget instanceof module.ui.SidebarWidget) {
				var widgetUI = widget.getUI(),
					sidebar = this,
					list = sidebar.widgets,
					waiting = sidebar.waitingToAdd,
					inList = jQuery.inArray(widget, list) !== -1;
				
				if (!inList) {
					var appendWidgets = function(){
						for (var ndx = 0, len = list.length; ndx < len; ndx++) {
							sidebar.container.append(list[ndx].getUI());
						}
						
						waiting = [];
						sidebar.notifyListeners(
							module.EventTypes.Sidebar.FinishedLoading, null);
					};
					
					if (!widgetUI) {
						widget.addListener(module.EventTypes.Sidebar.WidgetLoaded, 
							function(wgt){
								var ndx = jQuery.inArray(wgt, waiting);
								
								waiting.splice(ndx, 1);
								
								if (waiting.length === 0) {
									appendWidgets();
								}
							});
						waiting.push(widget);
					}
					
					list.push(widget);
					
					widget.addListener(module.EventTypes.Sidebar.WidgetVisible, this);
					widget.addListener(module.EventTypes.Sidebar.WidgetInvalidate, 
						this);
					
					if (waiting.length === 0) {
						appendWidgets();
					}
				}
			}
		},
		
		removeWidget: function(widget) {
	        var found = null;
	        var ndx = this.widgets.indexOf(widget);
	        
	        if (ndx != -1) {
	            var spliced = this.widgets.splice(ndx, 1);
	            
	            if (spliced.length == 1) {
	                found = spliced[0];
					found.getUI().remove();
	            }
	        }
	        
			found.removeListener(module.EventTypes.Sidebar.WidgetVisible, this);
			found.removeListener(module.EventTypes.Sidebar.WidgetInvalidate, this);
	        return found;
		},
		
		minimize: function() {
			this.minimized = true;
			this.minMaxBtn.text(MAX_TXT).addClass('minimized');
			this.container.addClass('minimized');
			var visWgts = this.visibleWidgets;
			this.minimizedWidgets = [];
			
			for (var ndx = 0, len = visWgts.length; ndx < len; ndx++) {
				this.minimizedWidgets.push(visWgts[ndx]);
			}
			
			for (var ndx = 0, len = this.minimizedWidgets.length; ndx < len; ndx++) {
				this.minimizedWidgets[ndx].setVisible(false, false);
			}
			
			this.notifyListeners(module.EventTypes.Sidebar.Minimized, true);
		},
		
		maximize: function() {
			this.minimized = false;
			this.minMaxBtn.text(MIN_TXT).removeClass('minimized');
			this.container.removeClass('minimized');			
			
			for (var ndx = 0, len = this.minimizedWidgets.length; ndx < len; ndx++) {
				this.minimizedWidgets[ndx].setVisible(true, false);
			}
			
			this.notifyListeners(module.EventTypes.Sidebar.Minimized, false);
		},
		
		notify: function(eventType, value) {
			if (eventType === module.EventTypes.Sidebar.WidgetVisible) {
				var visible = value.visible,
					widget = value.widget;
					
				if (visible) {
					if (jQuery.inArray(widget, this.visibleWidgets) === -1) {
						this.visibleWidgets.push(widget);
					}
				}
				else {
					var ndx = jQuery.inArray(widget, this.visibleWidgets);
					
					if (ndx !== -1) {
						this.visibleWidgets.splice(ndx, 1);
					}
				}
				this.layoutWidgets();
			}
			else if (eventType === module.EventTypes.Sidebar.WidgetInvalidate) {
				this.layoutWidgets();
			}
		},
		
		layoutWidgets: function() {
			// get the visible widgets
			var visWgts = this.visibleWidgets;
			
			// size the visible widgets
			var len = visWgts.length,	
				ctr = this.container,	
				
				ctrHeight = ctr.innerHeight(),
				ctrPadding = Math.ceil(parseFloat(ctr.css('paddingTop'))) 
					+ Math.ceil(parseFloat(ctr.css('paddingBottom'))),
				minBtnHeight = this.minMaxBtn.outerHeight(true),
			
				newHeight = ctrHeight - ctrPadding - minBtnHeight,
				wgtMax = newHeight / len;
				
			// get the append ordering instead of who setvisible() last
			var wgts = this.widgets,
				found = false,
				ordered = [];
			
			for (var ndx = 0, wlen = wgts.length; ndx < wlen; ndx++) {
				found = false;
				
				for (var ndx2 = 0, len2 = visWgts.length; ndx2 < len2 && !found; 
						ndx2++) {
					if (found = (visWgts[ndx2] === wgts[ndx])) {
						ordered.push(visWgts[ndx2]);
					}
				}
			}
			
			for (var ndx = 0; ndx < len; ndx++) {
				var wgt = ordered[ndx],
				
					// get the preferred size
					preferred = wgt.getPreferredHeight();
					
				if (preferred > 0 && preferred < wgtMax) {
					wgt.resize(preferred);
					wgtMax = newHeight / (len - ndx - 1);
				}
				else {
					wgt.resize(wgtMax);
				}
				
				// reset classes
				wgt.getUI().removeClass('first').removeClass('last');
			}
			
			// set classes for first and last visible widget
			if (len > 0) {				
				ordered[0].getUI().addClass('first');
				ordered[ordered.length - 1].getUI().addClass('last');
			}
		}
	});
   
////////////////////////////////////////////////////////////////////////////////
//                     			Sidebar Widget			                   	  //
////////////////////////////////////////////////////////////////////////////////     
	
	
	module.ui.SidebarWidgetDefaults = {
		name: '',
		manualVisible: false
	};
	
	module.ui.SidebarWidget = module.ui.Component.extend({
		init: function(options) {		
			var newOpts = jQuery.extend({}, module.ui.SidebarWidgetDefaults, options);
			var widgets = [];
			this.preferredHeight = 0;
			this.currentView = null;
			this.viewMeta = new Hashtable();
			
			this._super(newOpts);
		},
		
		addViewMeta: function(view) {
			var meta = {
				viewIsVisible: false,
				widgetShouldBeVisible: false
			};
			
			this.viewMeta.put(view, meta);
			
			return meta;
		},
		
		finishLayout: function() {
			var wgt = this;
			
			if (!this.container) {
				this.container = jQuery('<div></div>');
			}
			
			this.container.addClass('sidebarWidget');			
			this.setVisible(false, false);
			this.find('form').addClass('sidebarForm');
		},
		
		getName: function() {
			return this.config.name;
		},
		
		getPreferredHeight: function() {
			return this.preferredHeight;
		},
		
		getViewMeta: function(view) {
			return this.viewMeta.get(view);
		},
		
		invalidate: function() {
			this.notifyListeners(module.EventTypes.Sidebar.WidgetInvalidate, null);
		},
		
		load: function() {
			var cmp = this;

			if (this.config.uiFile && this.config.uiFile !== '') {
				hemi.loader.loadHtml(this.config.uiFile, function(data) {
					// clean the string of html comments
					var cleaned = data.replace(/<!--(.|\s)*?-->/, '');
					cmp.container = jQuery(cleaned);
					cmp.finishLayout();
					
					cmp.notifyListeners(module.EventTypes.Sidebar.WidgetLoaded, cmp);
				});
			}
		},
		
		resize: function(maxHeight) {
			var ctn = this.container,
				form = ctn.find('form'),
				borderHeight = parseInt(ctn.css('borderTopWidth')) 
					+ parseInt(ctn.css('borderBottomWidth')),
				marginHeight = parseInt(ctn.css('marginTop')) 
					+ parseInt(ctn.css('marginBottom')),
				paddingHeight = parseInt(ctn.css('paddingTop')) 
					+ parseInt(ctn.css('paddingBottom')),
				newHeight = maxHeight - borderHeight - marginHeight 
					- paddingHeight;
				
			this.container.height(newHeight);
		},
		
		setCurrentView: function(view) {
			this.currentView = view;
		},
		
		setViewMeta: function(view, meta) {
			this.viewMeta.put(view, meta);
		},
		
		setVisible: function(visible, opt_updateMeta) {
			this._super(visible);
			var wgt = this;
			opt_updateMeta = opt_updateMeta == null ? true : opt_updateMeta;
			
			this.notifyListeners(module.EventTypes.Sidebar.WidgetVisible, {
				widget: wgt,
				visible: visible,
				updateMeta: opt_updateMeta
			});
		}
	});
   
////////////////////////////////////////////////////////////////////////////////
//                     	Convenient Forms Sidebar Widget                   	  //
////////////////////////////////////////////////////////////////////////////////     
		
	module.ui.FormSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.ui.SidebarWidgetDefaults, options);			
			this.checkers = [];
			
		    this._super(newOpts);	
		},
		
		addInputsToCheck: function(inputs) {
			var wgt = this;
			
			if (inputs instanceof editor.ui.ColorPicker) {
				var checker = {
					input: inputs,
					saveable: function() {
						return this.input.getColor() != null;
					}
				};
				this.checkers.push(checker);
			}
			else if (inputs instanceof editor.ui.Vector) {
				var checker = {
					input: inputs,
					saveable: function() {
						return this.input.getValue() != null;
					}
				};
				this.checkers.push(checker);
			}
			else if (inputs instanceof editor.ui.InputChecker) {
				this.checkers.push(inputs);
			}
			else if (inputs.each){
				inputs.each(function(ndx, elem) {
					var input = jQuery(elem),
						checker = {
								input: input,
								saveable: function() {
									return this.input.val() !== '';
								}
							};
					wgt.checkers.push(checker);
				});
			}
		},
		
		checkSaveable: function() {
			var list = this.checkers,
				isSafe = true;
			
			for (var ndx = 0, len = list.length; ndx < len && isSafe; ndx++) {
				isSafe = list[ndx].saveable();
			}
			
			return isSafe;
		}
	});
	
	module.ui.InputChecker = function(input) {
		this.input = input;
	};
	
	module.ui.InputChecker.prototype = {
		saveable: function() {
			
		}
	};
	
	return module;
})(editor || {});
