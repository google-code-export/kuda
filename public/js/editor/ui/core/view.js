var editor = (function(editor) {
	editor.ui = editor.ui || {};	
	
// Notes: Tabpanes own toolbars
// 		  ToolBars own tools
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
	};
	
	editor.ui.Height = {
		FULL: 0,
		HALF: 1,
		THIRD: 2,
		MANUAL: 3
	};
	
	var EXTENT = 50,		// Grid will reach 50 meters in each direction
		FIDELITY = 1,		// Grid squares = 1 square meter

		FARPLANE = 10000,
		NEARPLANE = 0.5;


////////////////////////////////////////////////////////////////////////////////
//									Panel		  		                      //
////////////////////////////////////////////////////////////////////////////////

	var panels = [],
		
		addOpacityAnim = function(visible, origOpacity, target, animData) {
			var opacityStart = visible ? 0 : origOpacity,
				opacityEnd = visible ? origOpacity : 0;
			
			animData.opacity = opacityEnd;
			target.css('opacity', opacityStart);
			
			if (visible) {
				target.show();
			}
		},
		
		addSlideAnim = function(destination, animData) {
			var ctn = this.container,
				location;
			
			switch(this.config.location) {
				case editor.ui.Location.TOP:
					location = 'top';
					break;
				case editor.ui.Location.BOTTOM:
					location = 'bottom';
					break;
				case editor.ui.Location.RIGHT:
					location = 'right';
					break;
				default:
					location = 'left';
					break;
			}
			
			var start = parseInt(ctn.css(location)),
				animAmt = '+=' + (destination - start);
			
			animData[location] = animAmt;
		},
		
		setVisible = function(visible, opt_skipAnim) {
			var ctn = this.container,
				btn = this.minMaxBtn,
				animData = {},
				dest = visible ? 0 : -20,
				location;
			
			switch(this.config.location) {
				case editor.ui.Location.TOP:
					location = 'top';
					break;
				case editor.ui.Location.BOTTOM:
					location = 'bottom';
					break;
				case editor.ui.Location.RIGHT:
					location = 'right';
					break;
				default:
					location = 'left';
					break;
			}
			
			if (visible) {
				if (!btn.data('min')) {
					// The container was minimized, we need to rebind handlers
					ctn.bind('mouseenter', showMinMaxBtn)
					.bind('mouseleave', hideMinMaxBtn);
				}
				
				btn.data('min', true).text('Min').hide();
			} else {
				// Check if it is already hidden
				var pos = parseInt(ctn.css(location));
				opt_skipAnim = opt_skipAnim || pos < dest;
			}
			
			if (opt_skipAnim) {
				if (visible) {
					ctn.css(location, dest).css('opacity', this.origOpacity).show();
					btn.css(location, dest);
				}
				else {
					ctn.css(location, dest).css('opacity', 0).hide();
					btn.css(location, dest);
				}
			} else {
				addOpacityAnim(visible, this.origOpacity, ctn, animData, ctn);
				addSlideAnim.call(this, dest, animData);
				
				ctn.animate(animData, function() {
					if (!visible) {
						ctn.hide();
					}
				});
			}
		},
	
	hideMinMaxBtn = function(evt) {
		var btn = jQuery(this).find('button.minMax'),
			animData = {};
		
		addOpacityAnim(false, btn.data('origOpacity'), btn, animData);
		btn.animate(animData, function() {
			btn.hide();
		});
	},
	
	showMinMaxBtn = function(evt) {
		var btn = jQuery(this).find('button.minMax'),
			animData = {};
		
		addOpacityAnim(true, btn.data('origOpacity'), btn, animData);
		btn.animate(animData);
	},
	
	PanelBase = editor.ui.Component.extend({
		init: function(options) {
			var newOpts = jQuery.extend({
				location: editor.ui.Location.RIGHT,
				classes: [],
				startsVisible: true
			}, options);
			this.origOpacity = null;
			this.visible = true;
			
			this.name = newOpts.location === editor.ui.Location.TOP ?
				'topPanel' : newOpts.location === editor.ui.Location.BOTTOM ?
				'bottomPanel' : 'sidePanel';

			this._super(newOpts);
			panels.push(this);
		},
		
		finishLayout: function() {
			var minMaxBtn = this.minMaxBtn = jQuery('<button class="minMax" style="position:absolute;"></button>'),
				ctn = this.container = jQuery('<div></div>'),
				pnl = this;
			
			ctn.append(minMaxBtn);
			jQuery('body').append(ctn);
			
			minMaxBtn.bind('click', function(evt) {
				var min = minMaxBtn.data('min');
				
				if (min) {
					pnl.minimize();
				} else {
					pnl.maximize();
				}
				
				minMaxBtn.data('min', !min);
			}).data('min', true).text('Min').hide();
			
			// add any specified classes
			for (var i = 0, il = this.config.classes.length; i < il; i++) {
				ctn.addClass(this.config.classes[i]);
			}
			
			// put this on the tool layer and align it correctly
			ctn.css({
				zIndex: editor.ui.Layer.TOOL
			})
			.bind('mouseenter', showMinMaxBtn)
			.bind('mouseleave', hideMinMaxBtn);
			
			switch(this.config.location) {
				case editor.ui.Location.RIGHT:
					ctn.addClass('rightAligned');
					break;
				case editor.ui.Location.TOP:
					ctn.addClass('topAligned');
					break;
				case editor.ui.Location.BOTTOM:
					ctn.addClass('bottomAligned');
					break;
			}
			
			
			this.origOpacity = ctn.css('opacity');
			minMaxBtn.data('origOpacity', 1);
		},
		
		getName: function() {
			return this.name;
		},
		
		getPreferredHeight: function() {
			return this.preferredHeight;
		},
		
		isVisible: function() {
			return this.visible;
		},
		
		maximize: function() {
			var animData = {},
				minMaxBtn = this.minMaxBtn,
				that = this;
			
			addSlideAnim.call(this, 0, animData);
			this.container.bind('mouseleave', hideMinMaxBtn)
			.bind('mouseenter', showMinMaxBtn)
			.animate(animData, function() {
				minMaxBtn.text('Min');
				that.container.removeClass('minimized');
			});
		},
		
		minimize: function() {
			var animData = {},
				minMaxBtn = this.minMaxBtn,
				that = this,
				dest;
			
			switch(this.config.location) {
				case editor.ui.Location.TOP:
				case editor.ui.Location.BOTTOM:
					dest = this.container.height();
					break;
				case editor.ui.Location.RIGHT:
				default:
					dest = this.container.width();
					break;
			}
			
			addSlideAnim.call(this, -1 * dest, animData);
			this.container.unbind('mouseleave', hideMinMaxBtn)
			.unbind('mouseenter', showMinMaxBtn)
			.animate(animData, function() {
				minMaxBtn.text('Max');
				that.container.addClass('minimized');
			});
		},
		
		resize: function() {
			var ctnHeight = this.container.outerHeight(),
				ctnWidth = this.container.outerWidth(),
				btnHeight= this.minMaxBtn.outerHeight(),
				btnWidth = this.minMaxBtn.outerWidth(),
				windowWidth = window.innerWidth ? window.innerWidth 
					: document.documentElement.offsetWidth,
				midWidth = (windowWidth - ctnWidth)/2;
			
			switch(this.config.location) {
				case editor.ui.Location.RIGHT:
					this.minMaxBtn.css({
						top: (ctnHeight - btnHeight)/2,
						right: ctnWidth
					});
					break;
				case editor.ui.Location.TOP:
					this.container.css({
						left: midWidth
					});
					this.minMaxBtn.css({
						left: (ctnWidth - btnWidth)/2,
						top: ctnHeight
					});
					break;
				case editor.ui.Location.BOTTOM:
					this.container.css({
						left: midWidth
					});
					this.minMaxBtn.css({
						left: (ctnWidth - btnWidth)/2,
						bottom: ctnHeight
					});
					break;
				default:
					this.minMaxBtn.css({
						top: (ctnHeight - btnHeight)/2,
						left: ctnWidth
					});
					break;
			}			
		},
		
		setVisible: function(visible, opt_skipAnim) {
			if (visible !== this.visible) {
				setVisible.call(this, visible, opt_skipAnim);
				
				var pnl = this;
				this.resize();
				this.visible = visible;
				this.notifyListeners(editor.events.PanelVisible, {
					panel: pnl,
					visible: visible
				});
			}
		}
	});

////////////////////////////////////////////////////////////////////////////////
//                     			   	  Tab Bar	  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	var TabBar = PanelBase.extend({
		init: function() {
			this.panes = new Hashtable();
			this.visiblePane = null;
			
			this._super({
				location: 3		// LEFT
			});
		},
		
		finishLayout: function() {
			this._super();

			var title = jQuery('<h1><span>World</span><span class="editor">Editor</span></h1>');
			this.list = jQuery('<ul></ul>');
			this.container.attr('id', 'tabBar').append(title).append(this.list);
			this.resize();
		},
		
		add: function(tabpane, opt_liId) {			
			var li = jQuery('<li></li>'),
				ui = tabpane.getUI(),
				wgt = this;
			
			if (opt_liId != null) {
				li.attr('id', opt_liId);
			}
			li.append(ui);
			ui.find('a').bind('click', function(evt) {
				if (wgt.visiblePane && wgt.visiblePane !== tabpane) {
					wgt.visiblePane.setVisible(false);
				}
				
				tabpane.setVisible(!tabpane.isVisible());
				
				if (tabpane.isVisible()) {
					wgt.visiblePane = tabpane;
				} else {
					wgt.visiblePane = null;
				}
			});
			
			this.list.append(li); 
			this.panes.put(tabpane.title, {
				li: li,
				pane: tabpane
			});
			
			tabpane.addListener(editor.events.Enabled, function(data) {
				var obj = wgt.panes.get(data.item);
				
				if (data.enabled) {
					obj.li.show();
				}
				else {
					obj.pane.setVisible(false, function() {						
						obj.li.hide();
					});
				}
			});
		},
		
		get: function(title) {
			var obj = this.panes.get(title);
			return obj != null ? obj.pane : obj;
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     			   	 Tab Pane	  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	editor.ui.TabPane = editor.ui.Component.extend({
		init: function(title, options) {	
			this.toolbar = null;
			this.title = title;
			this.visible = false;
			
			this._super(options);
		},
		
		finishLayout: function() {
			this.toolbarContainer = jQuery('<div class="toolbarContainer"></div>');
			this.toolbarContainer.hide();
			this.container = jQuery('<div></div>');
			this.titleElem = jQuery('<h2><a href="#">' + this.title + '</a></h2>');
//			this.arrow = jQuery('<div class="toolbarArrow"></div>').hide();
			
			this.container.append(this.titleElem)//.append(this.arrow)
				.append(this.toolbarContainer);
		},
		
		isVisible: function() {
			return this.visible;
		},
		
		notify: function(eventType, value) {
			switch (eventType) {
				case editor.events.Enabled:
					this.setEnabled(value.enabled); 
					break;
			}
		},
		
		setEnabled: function(enabled) {
			this.notifyListeners(editor.events.Enabled, {
				item: this.title,
				enabled: enabled
			});
		},
		
		setToolBar: function(toolbar) {
			this.toolbar = toolbar;
			var ui = toolbar.getUI();
			this.toolbarContainer.append(ui);
			
			this.toolbar.addListener(editor.events.Enabled, this);
		},
		
		setVisible: function(visible, opt_callback) {
			if (visible) {
				this.toolbarContainer.slideDown(function() {
					if (opt_callback) {
						opt_callback();
					}
				});
//				this.arrow.show(100);
				this.toolbar.loadState();
				this.container.addClass('down');
				this.visible = true;
			}
			else {
				this.toolbarContainer.slideUp(function() {
					if (opt_callback) {
						opt_callback();
					}
				});
//				this.arrow.hide(100);
				this.toolbar.saveState();
				this.container.removeClass('down');
				this.visible = false;
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     			   	  Panel		  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	editor.ui.Panel = PanelBase.extend({
		init: function(options) {
			this.widgets = [];
			options = options || {};
			
			if (options.classes) {
				options.classes.unshift('panel');
			} else {
				options.classes = ['panel'];
			}
			
			this._super(options);
		},
		
		finishLayout: function() {
			this._super();

			this.setVisible(false, true);
		},
		
		addWidget: function(widget) {
			this.container.append(widget.getUI());
			this[widget.getName()] = widget;
			this.widgets.push(widget);
			
			var pnl = this;
			// TODO: listen to when a widget gets made visible/invisible
			widget.addListener(editor.events.WidgetResized, function() {
				pnl.resize();
			});
		},
		
		setVisible: function(visible, opt_skipAnim) {
			if (visible !== this.visible) {
				this._super(visible, opt_skipAnim);
				
				for (var i = 0, il = this.widgets.length; i < il; i++) {
					this.widgets[i].sizeAndPosition();	
				}
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     			   	  Widget	  		                      //
////////////////////////////////////////////////////////////////////////////////	
	
	editor.ui.WidgetDefaults = {
		classes: [],
		height: editor.ui.Height.HALF,
		name: 'defaultName'
	};
	
	editor.ui.Widget = editor.ui.Component.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, editor.ui.WidgetDefaults, options);
			this._super(newOpts);
		},
		
		layout: function() {
			this.container = jQuery('<div class="widget"></div>');
			
			for (var i = 0, il = this.config.classes.length; i < il; i++) {
				this.container.addClass(this.config.classes[i]);
			}
			
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
		
		invalidate: function() {
			this.sizeAndPosition();
			this.notifyListeners(editor.events.WidgetResized);
		},
		
		layoutDone: function() {
			this.sizeAndPosition();
		},
		
		setVisible: function(visible) {
			this._super(visible);
			var wgt = this;
			
			this.notifyListeners(editor.events.WidgetVisible, {
				widget: wgt,
				visible: visible
			});
		},
		
		sizeAndPosition: function() {
			var container = this.container,
				padding = parseInt(container.css('paddingBottom')) +
					parseInt(container.css('paddingTop')),
				win = jQuery(window),
				winHeight = win.height();
			
			switch(this.config.height) {
				case editor.ui.Height.FULL:
					container.height(winHeight - padding);
					break;
				case editor.ui.Height.HALF:
					container.height(winHeight/2 - padding);
					break;
				case editor.ui.Height.THIRD:
					container.height(winHeight/3 - padding);
					break;
				case editor.ui.Height.MANUAL:
					break;
			}
			
			// check scrollHeight
			if (container[0].scrollHeight > container.height() + padding) {
				container.addClass('hasScrollBar');
			}
			else {
				container.removeClass('hasScrollBar');
			}
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
			else if (inputs instanceof editor.ui.Input || inputs instanceof editor.ui.Vector) {
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
//                     		   Convenient List Widget                   	  //
////////////////////////////////////////////////////////////////////////////////     
	
	/*
	 * Configuration object for the ListWidget.
	 */
	editor.ui.ListWidgetDefaults = {
		name: 'listSBWidget',
		listId: 'list',
		prefix: 'lst',
		title: '',
		instructions: '',
		type: editor.ui.ListType.UNORDERED,
		sortable: false
	};
	
	editor.ui.ListWidget = editor.ui.Widget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, editor.tools.ListWidgetDefaults, options);
		    this._super(newOpts);
			
			this.items = new Hashtable();		
		},
			    
	    add: function(obj) {			
			var li = this.items.get(obj.getId());
			
			if (!li) {
				var li = this.createListItem();
					
				li.setText(obj.name);
				li.attachObject(obj);
				
				this.bindButtons(li, obj);
				
				this.list.add(li);
				this.items.put(obj.getId(), li);
			}
			
			return li;
	    },
		
		bindButtons: function() {
			
		},
		
		clear: function() {
			this.list.clear();
			this.items.clear();
		},
		
		createListItem: function() {
			return new editor.ui.EditableListItem();
		},
		
		getOtherHeights: function() {
			return 0;
		},
		
		finishLayout: function() {
			this._super();
			this.title = jQuery('<h1>' + this.config.title + '</h1>');
			this.instructions = jQuery('<p>' + this.config.instructions + '</p>');
			var wgt = this,
				otherElems = this.layoutExtra();
			
			this.list = new editor.ui.List({
				id: this.config.listId,
				prefix: this.config.prefix,
				type: this.config.type,
				sortable: this.config.sortable
			});
			
			this.container.append(this.title).append(this.instructions)
				.append(this.list.getUI());
				
			if (otherElems !== null) {
				this.instructions.after(otherElems);
			}
		},
		
		layoutExtra: function() {
			return null;
		},
	    
	    remove: function(obj) {
			var li = this.items.get(obj.getId()),
				retVal = false;
			
			if (li) {
				li.removeObject();
				this.list.remove(li);
				this.items.remove(obj.getId());
				retVal = true;
			}
			
			return retVal;
	    },
		
//		resize: function(maxHeight) {
//			this._super(maxHeight);	
//			var list = this.list.getUI(),	
//				
//			// now determine button container height
//				insHeight = this.instructions.outerHeight(true),
//			
//			// get the header height
//				hdrHeight = this.title.outerHeight(true),
//				
//			// get other heights
//				otherHeight = this.getOtherHeights(),
//			
//			// adjust the list pane height
//			 	listHeight = maxHeight - insHeight - hdrHeight - otherHeight;
//				
//			if (listHeight > 0) {
//				list.height(listHeight);
//			}
//		},
		
		update: function(obj) {
			var li = this.items.get(obj.getId()),
				retVal = false;
			
			if (li) {
				li.setText(obj.name);
				li.attachObject(obj);
				retVal = true;
			}
			
			return retVal;
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     			  Private Vars  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	var tabbar;
		
	var resize = function() {		
		var bdy = jQuery('body'),
			win = jQuery(window),
			vwr = jQuery('.mainView'),
		
			windowWidth = window.innerWidth ? window.innerWidth 
				: document.documentElement.offsetWidth,
			windowHeight = win.height();
			
		if (windowWidth <= 1024) {
			bdy.addClass('ten24');
		}
		else {
			bdy.removeClass('ten24');
		}
		
		vwr.width(windowWidth);
		vwr.height(windowHeight);
		
		for (var i = 0, il = panels.length; i < il; i++) {
			panels[i].resize();
		}
		
		// Unfortunately we also have to do this fairly O3D-specific resizing
		var cans = vwr.find('canvas'),
			displayInfo = hemi.core.client.gl.displayInfo;
		
		cans.attr('width', windowWidth);
		cans.attr('height', windowHeight);
		displayInfo.width = windowWidth;
		displayInfo.height = windowHeight;
		// For some reason, textBaseline gets reset when the canvas is resized
		hemi.hud.hudMgr.canvas.textBaseline = 'top';
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     			   Public Methods  		                      //
////////////////////////////////////////////////////////////////////////////////
		
	editor.ui.addTabPane = function(tabpane, opt_liId) {
		tabbar.add(tabpane, opt_liId);
	};
	
	editor.ui.getTabBar = function() {
		return tabbar;
	};
	
	editor.ui.getTabPane = function(title) {
		var tabpane = tabbar.get(title);
		
		if (!tabpane) {
			tabpane = new editor.ui.TabPane(title);
			tabpane.setToolBar(new editor.ui.ToolBar());
			tabbar.add(tabpane);
		}
		
		return tabpane;
	};
	
	editor.ui.initializeView = function(clientElements) {
		var bdy = jQuery('body');
		
		// create and size the webgl client			
		hemi.core.init(clientElements[0]);
		// create the grid plane
		grid = new editor.ui.GridPlane(EXTENT, FIDELITY);
		// create the plugin panel
		tabbar = new TabBar();
			
		var cam = hemi.world.camera;
		cam.enableControl();
		cam.clip.far = FARPLANE;
		cam.clip.near = NEARPLANE;
		cam.updateProjection();
        
		var vd = hemi.view.createViewData(hemi.world.camera);
		vd.eye = [0, 10, 40];
		vd.target = [0, 0, 0];
        hemi.world.camera.moveToView(vd, 0);
		
		// add resizing functionality
		jQuery(window).resize(resize);
		
		// do an initial resize
		resize();
		
		// add an empty panel for select boxes
		bdy.append('<div class="topBottomSelect"></div>');
	};
	
	return editor;
})(editor || {});
