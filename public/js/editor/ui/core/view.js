var editor = (function(editor) {
	editor.ui = editor.ui || {};	
	
// Notes: Tabpanes own toolbars
// 		  Toolbars own tools
//  	  Tools are made up of MVC
//		  Tool views are made up of widgets
//		  	 tool views maintain widget states  
	
////////////////////////////////////////////////////////////////////////////////
//                     			   	Constants	  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	editor.ui.Layer = {
		TOOL: 500,
		TOOLBAR: 600,
		DIALOG: 700,
		MENU: 800
	};
	
	editor.ui.Location = {
		TOP: 0,
		RIGHT: 1,
		BOTTOM: 2
	}
	
	var EXTENT = 50,		// Grid will reach 50 meters in each direction
		FIDELITY = 1,		// Grid squares = 1 square meter

		FARPLANE = 10000,
		NEARPLANE = 0.5;
	
////////////////////////////////////////////////////////////////////////////////
//                     			   	  Tab Bar	  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	var TabBar = editor.ui.Component.extend({
		init: function() {
			this.panes = [];
			this.visiblePane = null;
			
			this._super();
		},
		
		finishLayout: function() {
			this.container = jQuery('<div id="tabBar"></div>');
			this.list = jQuery('<ul></ul>');
			var title = jQuery('<h1>World<span>Editor</span></h1>');
			
			this.container.append(title).append(this.list)
				.css('zIndex', editor.ui.Layer.TOOLBAR);
		},
		
		add: function(tabpane) {
			this.panes.push(tabpane);
			
			var li = jQuery('<li></li>'),
				ui = tabpane.getUI(),
				wgt = this;
			
			li.append(ui);
			ui.find('a').bind('click', function(evt) {
				if (wgt.visiblePane && wgt.visiblePane !== tabpane) {
					wgt.visiblePane.setVisible(false);
				}
				
				tabpane.setVisible(true);
				wgt.visiblePane = tabpane;
			});
			
			this.list.append(li); 
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     			   	 Tab Pane	  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	editor.ui.TabPane = editor.ui.Component.extend({
		init: function(title, options) {	
			this.toolbar = null;
			this.title = title;
			
			this._super(options);
		},
		
		finishLayout: function() {
			this.toolbarContainer = jQuery('<div class="toolbarContainer"></div>');
			this.toolbarContainer.hide();
			this.container = jQuery('<div></div>');
			this.titleElem = jQuery('<h2><a href="#">' + this.title + '</a></h2>');
			
			this.container.append(this.titleElem).append(this.toolbarContainer);
		},
		
		setToolBar: function(toolbar) {
			this.toolbar = toolbar;
			var ui = toolbar.getUI();
			this.toolbarContainer.append(ui);
		},
		
		setVisible: function(visible) {
			if (visible) {
				this.toolbarContainer.slideDown();
				this.toolbar.loadState();
				this.container.addClass('down');
			}
			else {
				this.toolbarContainer.slideUp();
				this.toolbar.saveState();
				this.toolbar.deselect();
				this.container.removeClass('down');
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     			   	  Panel		  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	var setVisible = function(visible) {
			var ctn = this.container,
				origOpacity = 0.85,
				opacity = visible ? origOpacity : 0,
				opacityStart = visible ? 0 : origOpacity,
				location = 'top',
				startLoc = visible ? -20 : 0,
				animAmt = visible ? '+=20' : '-=20',
				animData = {
					opacity: opacity
				};
			
			// TODO: there's a better way to do this
			if (!this.visible && !visible) {
				ctn.css('opacity', 0).hide();
			}
			else if (this.visible && visible) {
				ctn.css('opacity', origOpacity);
			}
			else {				
				ctn.css('opacity', opacityStart);
				
				if (visible) {
					ctn.show();
				}
			
				switch(this.config.location) {
					case editor.ui.Location.TOP:
						animData.top = animAmt;			
						break;
					case editor.ui.Location.BOTTOM:
						animData.bottom = animAmt;
						location = 'bottom';				
						break;
					case editor.ui.Location.RIGHT:
						animData.right = animAmt;
						location = 'right';
						break;
				}
			
				ctn.css(location, startLoc).animate(animData, function() {
					if (!visible) {
						ctn.hide();
					}
				});
			}
		};
	
	editor.ui.PanelDefaults = {
		location: editor.ui.Location.RIGHT,
		classes: [],
		name: 'Panel',
		startsVisible: true
	};
	
	editor.ui.Panel = editor.ui.Component.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, editor.ui.PanelDefaults, options);
			this.viewMeta = new Hashtable();
			this.widgets = [];
			this.visible = true;
			
			this.name = newOpts.location === editor.ui.Location.TOP ?
				'topPanel' : newOpts.location === editor.ui.Location.BOTTOM ?
				'bottomPanel' : 'sidePanel';

			this._super(newOpts);
		},
		
		addViewMeta: function(view) {
			var meta = {
				viewIsVisible: false,
				panelShouldBeVisible: false
			};
			
			this.viewMeta.put(view, meta);
			
			return meta;
		},
		
		addWidget: function(widget) {
			this.container.append(widget.getUI());
			this[widget.getName()] = widget;
			this.widgets.push(widget);
			
			// TODO: listen to when a widget gets made visible/invisible
		},
		
		finishLayout: function() {
			var wgt = this;
			
			this.container = jQuery('<div class="panel"></div>');
//			this.container.data('appended', false);		
			jQuery('body').append(this.container);
			
			// put this on the widget layer and align it correctly
			for (var i = 0, il = this.config.classes.length; i < il; i++) {
				this.container.addClass(this.config.classes[i]);
			}
			this.container.css({
				zIndex: editor.ui.Layer.TOOL
			})
			.addClass(this.config.location === editor.ui.Location.RIGHT ? 'rightAligned' :
				this.config.location === editor.ui.Location.TOP ? 'topAligned' : 
				'bottomAligned');
			
			this.setVisible(false, false, true);
		},
		
		getName: function() {
			return this.name;
		},
		
		getPreferredHeight: function() {
			return this.preferredHeight;
		},
		
		getViewMeta: function(view) {
			return this.viewMeta.get(view);
		},
		
		isVisible: function() {
			return this.visible;
		},
		
		maximize: function() {
			
		},
		
		minimize: function() {
			
		},
		
		resize: function() {			
			switch(this.config.location) {
				case editor.ui.Location.TOP:
				case editor.ui.Location.BOTTOM:
					var width = this.container.outerWidth(),
						windowWidth = window.innerWidth ? window.innerWidth 
							: document.documentElement.offsetWidth;
					
					this.container.css({
						left: (windowWidth - width)/2
					});
					
					break;
			}			
		},
		
		setCurrentView: function(view) {
			this.currentView = view;
		},
		
		setViewMeta: function(view, meta) {
			this.viewMeta.put(view, meta);
		},
		
		setVisible: function(visible, opt_updateMeta, opt_noAnimate) {
			setVisible.call(this, visible);
					
			var pnl = this;
			opt_updateMeta = opt_updateMeta == null ? true : opt_updateMeta;
			
			this.resize();
			this.notifyListeners(editor.EventTypes.PanelVisible, {
				panel: pnl,
				visible: visible,
				updateMeta: opt_updateMeta
			});
			this.visible = visible;
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     			   	  Widget	  		                      //
////////////////////////////////////////////////////////////////////////////////	
	
	editor.ui.Widget = editor.ui.Component.extend({
		init: function(options) {
			this.viewMeta = new Hashtable();
			
			this._super(options);
		},
		
		layout: function() {
			this.container = jQuery('<div class="widget"></div>');
			this._super();
		},
		
		finishLayout: function() {			
			// make sure forms are widget forms
			this.find('form').addClass('widgetForm').submit(function() {
				return false;
			});
		},
		
		getName: function() {
			return this.config.name;
		},
		
		getPreferredHeight: function() {
			return this.preferredHeight;
		},
		
		setVisible: function(visible, opt_updateMeta) {
			this._super(visible);
			var wgt = this;
			opt_updateMeta = opt_updateMeta == null ? true : opt_updateMeta;
			
			this.notifyListeners(editor.EventTypes.WidgetVisible, {
				widget: wgt,
				visible: visible,
				updateMeta: opt_updateMeta
			});
		}
	});
   
////////////////////////////////////////////////////////////////////////////////
//                     		  Convenient Forms Widget                   	  //
////////////////////////////////////////////////////////////////////////////////     
		
	editor.ui.FormWidget = editor.ui.Widget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, editor.ui.WidgetDefaults, options);			
			this.checkers = [];
			
		    this._super(newOpts);
			this.container.addClass('widgetWithForms');
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
	
	editor.ui.InputChecker = function(input) {
		this.input = input;
	};
	
	editor.ui.InputChecker.prototype = {
		saveable: function() {
			
		}
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     			  Private Methods  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	var tabbar = new TabBar(),
		commonWidgets = new Hashtable(),
		scripts = new Hashtable(),
		callbacks = [];
		doneCallbacks = [];
		grid = null;
		
	var loadingComplete = function() {
		var vals = scripts.values(),
			complete = true;
		
		for (var i = 0, il = vals.length; i < il && complete; i++) {
			complete &= vals[i];
		}
		
		if (complete) {
			for (var i = 0, il = callbacks.length; i < il; i++) {
				var obj = callbacks[i];
				obj.callback.apply(this, obj.params);
			}
			
			for (var i = 0, il = doneCallbacks.length; i < il; i++) {
				doneCallbacks[i]();
			}
		}
	};
	
////////////////////////////////////////////////////////////////////////////////
//                      	Convenient Widget Methods     	                  //
////////////////////////////////////////////////////////////////////////////////  
	
	editor.ui.sizeAndPosition = function(height) {
		var wgt = this,
			container = this.container,
			padding = parseInt(container.css('paddingBottom')) +
				parseInt(container.css('paddingTop')),
			win = jQuery(window),
			winHeight = win.height(),
			wgtHeight = winHeight/2 - padding;
		
		container.height(wgtHeight)
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     			   Public Methods  		                      //
////////////////////////////////////////////////////////////////////////////////
		
	editor.ui.addTabPane = function(tabpane) {
		tabbar.add(tabpane);
	};
	
	editor.ui.getCss = function(url, media) {
		jQuery( document.createElement('link') ).attr({
	        href: url,
	        media: media || 'screen',
	        type: 'text/css',
	        rel: 'stylesheet'
	    }).appendTo('head');
	};
	
	editor.ui.getScript = function(url, callback) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;
		
		scripts.put(script, false);
		
		{
	        var done = false;
	
	        // Attach handlers for all browsers
	        script.onload = script.onreadystatechange = function(){
	            if (!done && (!this.readyState ||
	            		this.readyState == "loaded" || 
						this.readyState == "complete")) {
	                done = true;
                	scripts.put(script, true);
					if (callback) {
						callback();
					}
					loadingComplete();
	
	                // Handle memory leak in IE
	                script.onload = script.onreadystatechange = null;
	            }
	        };
	    }
		
	    document.body.appendChild(script);
	};
	
	editor.ui.whenDoneLoading = function(callback) {
		doneCallbacks.push(callback);
	};
	
	editor.ui.initializeView = function(clientElements) {
		var bdy = jQuery('body');
		
		// create and size the webgl client			
		hemi.core.init(clientElements[0]);
		// create the tabbar
		bdy.append(tabbar.getUI());
		// create the grid plane
		grid = new editor.ui.GridPlane(EXTENT, FIDELITY);
			
		var cam = hemi.world.camera;
		cam.enableControl();
		cam.clip.far = FARPLANE;
		cam.clip.near = NEARPLANE;
		cam.updateProjection();
        
		var vd = hemi.view.createViewData(hemi.world.camera);
		vd.eye = [0, 10, 40];
		vd.target = [0, 0, 0];
        hemi.world.camera.moveToView(vd);
			
		// search for tabpanes (plugins) to add to the tabbar
		// this is the way for now. in the future, this will be a server call
		// so that the server can do an auto roll-call. the fall back will be
		// this method
		jQuery.get('js/editor/plugins/plugins.json')
			.success(function(data, status, xhr) {								
				// data is a json array
				var plugins = data.plugins,
					bdy = jQuery('body');
				
				for (var i = 0, il = plugins.length; i < il; i++) {
					var plugin = plugins[i];
					
					editor.ui.getScript('js/editor/plugins/' + plugin + '/init.js'); 
					callbacks.push({
						callback: function(name){
							editor.tools[name].init();
						},
						params: [plugin]
					});
				}
			})
			.error(function(xhr, status, err) {
				// fail gracefully
			});
	};
	
	return editor;
})(editor || {});
