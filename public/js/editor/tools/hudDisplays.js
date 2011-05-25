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
    module.tools = module.tools || {};
    
    module.EventTypes = module.EventTypes || {};
		
	// model specific
	module.EventTypes.DisplayCreated = "Hud.DisplayCreated";
	module.EventTypes.DisplayRemoved = "Hud.DisplayRemoved";
	module.EventTypes.DisplaySet = "Hud.DisplaySet";
	module.EventTypes.ElementCreated = "Hud.ElementCreated";
	module.EventTypes.ElementRemoved = "Hud.ElementRemoved";
	module.EventTypes.ElementSet = "Hud.ElementSet";
	module.EventTypes.ElementUpdated = "Hud.ElementUpdated";
	module.EventTypes.PageCreated = "Hud.PageCreated";
	module.EventTypes.PageRemoved = "Hud.PageRemoved";
	module.EventTypes.PageSet = "Hud.PageSet";
	module.EventTypes.HudWorldLoaded = "Hud.HudWorldLoaded";
	
	// hud edit specific
	module.EventTypes.CreateDisplay = "Hud.CreateDisplay";
	module.EventTypes.CreatePage = "Hud.CreatePage";
	module.EventTypes.RemoveDisplay = "Hud.RemoveDisplay";
	module.EventTypes.RemoveElement = "Hud.RemoveElement";
	module.EventTypes.RemovePage = "Hud.RemovePage";
	module.EventTypes.SaveElement = "Hud.SaveElement";
	module.EventTypes.SavePage = "Hud.SavePage";
	
	// hud tree specific
	module.EventTypes.SelectHudNode = "Hud.SelectHudNode";
	
	// shared
	module.EventTypes.SetElement = "Hud.SetElement";
	
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * A HudDisplaysModel handles the creation, updating, and removal of 
     * HudDisplays.
     */
    module.tools.HudDisplaysModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
			
			this.currentDisplay = null;
			this.currentPage = null;
			this.currentElement = null;
			this.theme = null;
	    },
		
		createDisplay: function(name) {
			var display = new hemi.hud.HudDisplay();
			display.name = name;
			this.notifyListeners(module.EventTypes.DisplayCreated, display);
			this.setDisplay(display);
		},
		
		createPage: function(opt_select) {
			var page = new hemi.hud.HudPage();
			this.currentDisplay.addPage(page);
			page.name = this.currentDisplay.name + ' Page ' +
				this.currentDisplay.getNumberOfPages();
			this.notifyListeners(module.EventTypes.PageCreated, page);
			
			if (opt_select) {
				this.setPage(page);
			}
		},
		
		removeDisplay: function(display) {
			if (display === this.currentDisplay) {
				this.setDisplay(null);
			}
			
			display.cleanup();		
			this.notifyListeners(module.EventTypes.DisplayRemoved, display);
		},
		
		removeElement: function(element) {
			this.currentPage.removeElement(element);
			element.cleanup();
			this.currentDisplay.showPage();
			this.notifyListeners(module.EventTypes.ElementRemoved, element);
		},
		
		removePage: function(page) {
			this.currentDisplay.removePage(page);
			page.cleanup();
			this.notifyListeners(module.EventTypes.PageRemoved, page);
		},
		
		saveElement: function(props) {
			var element = this.currentElement,
				event = module.EventTypes.ElementCreated,
				refresh = true;
			
			if (props.type === 'Text') {
				if (element !== null) {
					if (element instanceof hemi.hud.HudText) {
						event = module.EventTypes.ElementUpdated;
					} else {
						this.currentPage.removeElement(element);
						element.cleanup();
						element = null;
					}
				}
				
				if (element === null) {
					element = new hemi.hud.HudText();
					this.currentPage.addElement(element);
				}
				
				element.x = props.x;
				element.y = props.y;
				element.setText(props.text);
				element.setWidth(props.width);
			} else if (props.type === 'Image') {
				if (element !== null) {
					if (element instanceof hemi.hud.HudImage) {
						event = module.EventTypes.ElementUpdated;
					} else {
						this.currentPage.removeElement(element);
						element.cleanup();
						element = null;
					}
				}
				
				if (element === null) {
					element = new hemi.hud.HudImage();
					this.currentPage.addElement(element);
				}
				
				element.x = props.x;
				element.y = props.y;
				element.setImageUrl(props.url);
				refresh = false;
				var that = this,
					msgHandler = element.subscribe(hemi.msg.load,
					function(msg) {
						element.unsubscribe(msgHandler, hemi.msg.load);
						that.currentDisplay.showPage();
					});
			}
			
			if (element !== null) {
				element.name = props.name;
				
				if (props.config) {
					element.setConfig(props.config);
				}
				this.notifyListeners(event, element);
			}
			
			this.setElement(null);
			
			if (refresh) {
				this.currentDisplay.show();
			}
		},
		
		savePage: function(props) {
			this.currentPage.setConfig(props);
			
			if (this.currentDisplay.isVisible()) {
				this.currentDisplay.showPage();
			}
		},
		
		setDisplay: function(display) {
			if (this.currentDisplay !== null) {
				this.currentDisplay.hide();
			}
			
			if (display === null) {
				this.currentPage = null;
				this.currentElement = null;
			} else if (display.getNumberOfPages() > 0) {
				display.show();
			}
			
			this.currentDisplay = display;
			this.notifyListeners(module.EventTypes.DisplaySet, display);
		},
		
		setElement: function(element, opt_type) {			
			var type = opt_type ? opt_type : null;
			
			this.currentElement = element;
			this.notifyListeners(module.EventTypes.ElementSet, {
				element: element,
				type: type
			});
		},
		
		setPage: function(page) {
			var hide = true;
			
			if (page !== null) {
				for (var ndx = 0, len = this.currentDisplay.pages.length; hide && ndx < len; ndx++) {
					if (this.currentDisplay.pages[ndx] === page) {
						this.currentDisplay.currentPage = ndx;
						this.currentDisplay.showPage();
						hide = false;
					}
				}
			}
			
			if (hide) {
				this.currentDisplay.hide();
			}
			
			this.currentPage = page;
			this.notifyListeners(module.EventTypes.PageSet, page);
		},
			
		worldCleaned: function() {
			var displays = hemi.world.getHudDisplays();
			
			for (var ndx = 0, len = displays.length; ndx < len; ndx++) {
				this.notifyListeners(module.EventTypes.DisplayRemoved, displays[ndx]);
			}
	    },
	    
	    worldLoaded: function() {
			var displays = hemi.world.getHudDisplays();
			
			this.notifyListeners(module.EventTypes.HudWorldLoaded, displays);
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	 	   Hud Tree Sidebar Widget                        //
////////////////////////////////////////////////////////////////////////////////     
	
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.HudTreeSBWidgetDefaults = {
		name: 'hudTreeSBWidget',
		prefix: 'hud'
	};
	
	module.tools.HudTreeSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.HudTreeSBWidgetDefaults, options);
		    this._super(newOpts);	
		},
		
		finishLayout: function() {
			this._super();
			
			this.tree = jQuery('<div id="hudTree"></div>');
			this.title = jQuery('<h1>Hud Outline</h1>');
			this.instructions = jQuery("<p>Type in a name and click 'Create New Display' to add a new HUD display box</p>");
			this.form = jQuery('<form method="post"></form>');
			this.nameInput = jQuery('<input type="text" id="hudDpyName" />');
			this.createBtn = jQuery('<button id="createHudDisplay" class="inlineBtn">Create New Display</button>');
			var wgt = this;
			
			this.createBtn.bind('click', function(evt) {
				var name = wgt.nameInput.val();
				wgt.notifyListeners(module.EventTypes.CreateDisplay, name);
				wgt.createBtn.attr('disabled', 'disabled');
				wgt.nameInput.val('');
			})
			.attr('disabled', 'disabled');
			
			this.nameInput.bind('keyup', function(evt) {
				var val = jQuery(this).val();
				
				if (val !== '') {
					wgt.createBtn.removeAttr('disabled');
				} else {
					wgt.createBtn.attr('disabled', 'disabled');
				}
			});
			
			this.form.append(this.nameInput).append(this.createBtn)
				.bind('submit', function(evt) {
					return false;
				});
			this.container.append(this.title).append(this.instructions)
				.append(this.form).append(this.tree);
			
			this.tree.bind('select_node.jstree', function(evt, data) {
				var elem = data.rslt.obj,
					hudObj = elem.data('jstree'),
					elemId = elem.attr('id'),
					path = wgt.tree.jstree('get_path', elem, true),
					hudObjs = [];
					
				for (var ndx = 0, len = path.length; ndx < len; ndx++) {
					hudObjs.push(jQuery('#' + path[ndx]).data('jstree'));
				}
				wgt.notifyListeners(module.EventTypes.SelectHudNode, hudObjs);
			}).jstree({
				'json_data': {
					'data': {}
				},
				'types': {
					'types': {
						'display': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-96px 0'
							}
						},
						'page': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-112px 0'
							}
						},
						'text': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-64px 0'
							}
						},
						'image': {
							'icon': {
								'image': 'images/treeSprite.png',
								'position': '-128px 0'
							}
						}
					}
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
		},
		
		getNode: function(obj) {
			return jQuery('#' + this.getNodeName(obj));
		},
		
		getNodeName: function(obj) {
			var prefix = this.config.prefix,
				nodeName = null;
			
			if (obj != null) {
				nodeName = prefix + obj.getCitizenType().split('.').pop();				
				nodeName += '_' + obj.getId();				
				nodeName = nodeName.replace(' ', '_').replace('.', '_');
			}
			
			return nodeName;
		},
		
		createJson: function(obj) {
			var json = null;
			
			if (obj.data && obj.attr) {
				json = obj;
			}
			else {
				var id = this.getNodeName(obj),
					name = obj.name,
					type = obj.getCitizenType().split('.').pop().toLowerCase()
						.replace('hud', '');
					
				json = {
					data: name,
					attr: {
						id: id,
						rel: type
					},
					state: 'closed',
					children: [],
					metadata: obj
				};
			}
			
			return json;
		},
			    
	    add: function(obj, parentObj) {
			var parentNode = parentObj == null ? -1 : this.getNode(parentObj),
				objJson = this.createJson(obj);
			
			this.tree.jstree('create_node', parentNode, 'inside', {
				json_data: objJson
			});
			
			this.tree.jstree('open_node', parentNode);
	    },
	    
	    remove: function(obj) {
			var node = this.getNode(obj);
			
			this.tree.jstree('delete_node', node);
	    },
		
		update: function(obj) {
			var node = this.getNode(obj);
			
			this.tree.jstree('rename_node', node, obj.name);
		},
		
		select: function(obj) {
			this.tree.jstree('deselect_all');
			this.tree.jstree('select_node', this.getNode(obj));
		},
		
		resize: function(maxHeight) {
			this._super(maxHeight);	
		}
	});	
	
////////////////////////////////////////////////////////////////////////////////
//                     	 	   Hud Edit Sidebar Widget                        //
////////////////////////////////////////////////////////////////////////////////     
	
	var COLOR_PICKED = 'editor.hud.colorpicked';
	
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.HudEditSBWidgetDefaults = {
		name: 'hudEditSBWidget',
		uiFile: 'js/editor/tools/html/hudForms.htm',
		manualVisible: true
	};
	
	module.tools.HudEditSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.HudEditSBWidgetDefaults, options);
		    this._super(newOpts);	
		},
		
		finishLayout: function() {
			this._super();
			
			this.displayEditor = this.find('#hudDpyEditor');
			this.pageEditor = this.find('#hudPgeEditor');
			this.textEditor = this.find('#hudTxtEditor');
			this.imageEditor = this.find('#hudImgEditor');
			
			this.bindDisplayEditor();
			this.bindPageEditor();
			this.bindTextEditor();
			this.bindImageEditor();
			
			this.find('form').bind('submit', function(evt) {
				return false;
			});
			
			// hide all
			this.displayEditor.hide();
			this.pageEditor.hide();
			this.textEditor.hide();
			this.imageEditor.hide();
		},
		
		edit: function(obj, citizenType) {
			if (obj) {
				citizenType = obj.getCitizenType().split('.').pop();
			}
			
			// now setup the appropriate editor
			switch (citizenType) {
				case 'HudDisplay':
					this.setDisplayEditor(obj);
					// set the preferred height
					this.preferredHeight = this.displayEditor.height();
					break;
				case 'HudPage':
					this.setPageEditor(obj);
					// set the preferred height
					this.preferredHeight = this.pageEditor.height();
					break;
				case 'HudText':
					this.setTextEditor(obj);
					// set the preferred height
					this.preferredHeight = this.textEditor.height();
					break;
				case 'HudImage':
					this.setImageEditor(obj);
					// set the preferred height
					this.preferredHeight = this.imageEditor.height();
					break;
			}
			
			this.invalidate();
		},
		
		canSave: function(inputs, btns) {
			var	canSave = true;
			
			for (var ndx = 0, len = inputs.length; canSave && ndx < len; ndx++) {
				var clsAtt = jQuery(inputs[ndx]).attr('class');
				canSave = clsAtt.indexOf('vectorHelper') === -1;
				canSave = canSave && inputs[ndx].value !== '';
			}
			
			if (canSave) {
				for (var ndx = 0, len = btns.length; ndx < len; ndx++) {
					btns[ndx].removeAttr('disabled');
				}
			}
			else {
				for (var ndx = 0, len = btns.length; ndx < len; ndx++) {
					btns[ndx].attr('disabled', 'disabled');
				}
			}
		},
		
		bindDisplayEditor: function() {
			var addPageBtn = this.displayEditor.find('#hudDpyAddPageBtn'),
				removeBtn = this.displayEditor.find('#hudDpyRemoveBtn'),
				wgt = this;
			
			addPageBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.CreatePage, true);
			});
			
			removeBtn.bind('click', function(evt) {
				var display = wgt.displayEditor.data('obj');
				
				wgt.notifyListeners(module.EventTypes.RemoveDisplay, display);
			});
		},
		
		bindPageEditor: function() {
			var pgeEdt = this.pageEditor,
				addTextBtn = pgeEdt.find('#hudPgeAddTextBtn'),
				addImageBtn = pgeEdt.find('#hudPgeAddImageBtn'),
				removeBtn = pgeEdt.find('#hudPgeRemoveBtn'),
				saveBtn = pgeEdt.find('#hudPgeSaveBtn'),
				cancelBtn = pgeEdt.find('#hudPgeCancelBtn'),
				wgt = this;
			
			var colorPicker = new module.ui.ColorPicker({
				inputId: 'hudPgeColor',
				buttonId: 'hudPgeColorPicker'
			});
			
			this.find('#hudPgeColorLbl').after(colorPicker.getUI());
			
			colorPicker.addListener(module.EventTypes.ColorPicked, function(clr) {		
				saveBtn.removeAttr('disabled');
				cancelBtn.removeAttr('disabled');
			});
			
			pgeEdt.data('colorPicker', colorPicker);
			
			addTextBtn.bind('click', function(evt) {
				pgeEdt.hide();
				wgt.notifyListeners(module.EventTypes.SetElement, {
					element: null,
					type: 'HudText'
				});
			});
			
			addImageBtn.bind('click', function(evt) {
				pgeEdt.hide();
				wgt.notifyListeners(module.EventTypes.SetElement, {
					element: null,
					type: 'HudImage'
				});
			});
			
			removeBtn.bind('click', function(evt) {
				var page = pgeEdt.data('obj');
				
				wgt.notifyListeners(module.EventTypes.RemovePage, page);
			});
			
			saveBtn.bind('click', function(evt) {				
				var props = {
					color: colorPicker.getColor()
				};
				
				wgt.notifyListeners(module.EventTypes.SavePage, props);
				saveBtn.attr('disabled', 'disabled');
				cancelBtn.attr('disabled', 'disabled');
			});
			
			cancelBtn.bind('click', function(evt) {
				var color = pgeEdt.data('oldColor');
				
				colorPicker.setColor(color);
				cancelBtn.attr('disabled', 'disabled');
				saveBtn.attr('disabled', 'disabled');
			})
			.attr('disabled', 'disabled');
		},
		
		bindTextEditor: function() {
			var txtEdt = this.textEditor,
				xInput = txtEdt.find('#hudTxtPositionX'),
				yInput = txtEdt.find('#hudTxtPositionY'),
				inputs = txtEdt.find('input'),
				required = txtEdt.find('input:not(.optional)'),
				textInput = txtEdt.find('#hudTxtText'),
				widthInput = txtEdt.find('#hudTxtWidth'),
				nameInput = txtEdt.find('#hudTxtName'),
				sizeInput = txtEdt.find('#hudTxtSize'),
				fontSelect = txtEdt.find('#hudTxtFont'),
				styleSelect = txtEdt.find('#hudTxtStyle'),
				alignSelect = txtEdt.find('#hudTxtAlign'),
				saveBtn = txtEdt.find('#hudTxtSaveBtn'),
				cancelBtn = txtEdt.find('#hudTxtCancelBtn'),
				removeBtn = txtEdt.find('#hudTxtRemoveBtn'),
				wgt = this;
			
			var colorPicker = new module.ui.ColorPicker({
				inputId: 'hudTxtColor',
				buttonId: 'hudTxtColorPicker'
			});
			
			this.find('#hudTxtColorLbl').after(colorPicker.getUI());
			
			txtEdt.data('colorPicker', colorPicker);
			
			// add validation
			new module.ui.Validator(inputs.filter('.vector, .short'), 
				function(elem) {
					var val = elem.val(),
						msg = null;
						
					if (val !== '' && !hemi.utils.isNumeric(val)) {
						msg = 'must be a number';
					}
					
					return msg;
				});
			
			this.setupAutoFills(inputs.filter('.vector'));
													
			inputs.bind('blur', function(evt) {
				var elem = jQuery(this),
					id = elem.attr('id');							

				wgt.canSave(required, [saveBtn]);
			})
			.bind('change', function(evt) {
				wgt.canSave(required, [saveBtn]);
			}); 
			
			nameInput.bind('keyup', function(evt) {
				wgt.canSave(required, [saveBtn]);
			});
			
			saveBtn.bind('click', function(evt) {
				var size = sizeInput.val(),
					font = fontSelect.val(),
					style = styleSelect.val(),
					align = alignSelect.val(),
					color = colorPicker.getColor();
				
				var props = {
					type: 'Text',
					name: nameInput.val(),
					x: parseFloat(xInput.val()),
					y: parseFloat(yInput.val()),
					text: textInput.val(),
					width: parseFloat(widthInput.val()),
					config: {}
				};
				
				if (color != null) {
					props.config.color = color;
				}
				if (size !== '') {
					props.config.textSize = parseInt(size);
				}
				if (font !== '-1') {
					props.config.textTypeface = font;
				}
				if (style !== '-1') {
					props.config.textStyle = style;
				}
				if (align !== '-1') {
					props.config.textAlign = align;
				}
				
				colorPicker.setColor([1, 1, 1, 1]);
				wgt.setTextEditor(null);
				wgt.notifyListeners(module.EventTypes.SaveElement, props);
			});
			
			cancelBtn.bind('click', function(evt) {
				txtEdt.hide();
				wgt.pageEditor.show();
				wgt.preferredHeight = wgt.pageEditor.height();
				wgt.invalidate();
				txtEdt.find('input.error').removeClass('error');
			});
			
			removeBtn.bind('click', function(evt) {
				var text = txtEdt.data('obj');
				
				wgt.notifyListeners(module.EventTypes.RemoveElement, text);
			})
			.hide();
		},
		
		bindImageEditor: function() {
			var imgEdt = this.imageEditor,
				xInput = imgEdt.find('#hudImgPositionX'), 
				yInput = imgEdt.find('#hudImgPositionY'),
				inputs = imgEdt.find('input'),
				nameInput = imgEdt.find('#hudImgName'),
				urlInput = imgEdt.find("#hudImgUrl"),
				saveBtn = imgEdt.find('#hudImgSaveBtn'),
				cancelBtn = imgEdt.find('#hudImgCancelBtn'),
				removeBtn = imgEdt.find('#hudImgRemoveBtn'),
				wgt = this;
			
			// add validation
			new module.ui.Validator(inputs.filter('.vector, .short'), 
				function(elem) {
					var val = elem.val(),
						msg = null;
						
					if (val !== '' && !hemi.utils.isNumeric(val)) {
						msg = 'must be a number';
					}
					
					return msg;
				});
				
			this.setupAutoFills(inputs.filter('.vector'));
						
			inputs.bind('blur', function(evt) {
				var elem = jQuery(this),
					id = elem.attr('id');			

				wgt.canSave(inputs, [saveBtn]);
			})
			.bind('change', function(evt) {
				wgt.canSave(inputs, [saveBtn]);
			});
			
			nameInput.bind('keyup', function(evt) {
				wgt.canSave(inputs, [saveBtn]);
			});
			
			saveBtn.bind('click', function(evt) {
				var props = {
					type: 'Image',
					name: nameInput.val(),
					x: parseFloat(xInput.val()),
					y: parseFloat(yInput.val()),
					url: urlInput.val()
				};				
				
				wgt.setImageEditor(null);
				wgt.notifyListeners(module.EventTypes.SaveElement, props);
			});
			
			cancelBtn.bind('click', function(evt) {
				imgEdt.hide();
				wgt.pageEditor.show();
				wgt.preferredHeight = wgt.pageEditor.height();
				wgt.invalidate();
				imgEdt.find('input.error').removeClass('error');
			});
			
			removeBtn.bind('click', function(evt) {
				var image = imgEdt.data('obj');
				
				wgt.notifyListeners(module.EventTypes.RemoveElement, image);
			}).hide();
		},
		
		setDisplayEditor: function(obj) {
			this.displayEditor.data('obj', obj).find('.displayName').text(obj.name);
			
			this.displayEditor.show();
			this.pageEditor.hide();
			this.textEditor.hide();
			this.imageEditor.hide();
		},
		
		setPageEditor: function(obj) {
			var pgeEdt = this.pageEditor,
				colorPicker = pgeEdt.data('colorPicker'),
				color = obj && obj.config.color ? obj.config.color 
					: hemi.hud.theme.page.color;
				
			pgeEdt.data('obj', obj).data('oldColor', color)
				.find('.displayName').text(obj.name);
			
			colorPicker.setColor(color);		
			
			pgeEdt.show();
			this.displayEditor.hide();
			this.textEditor.hide();
			this.imageEditor.hide();
		},
		
		setTextEditor: function(obj) {
			var txtEdt = this.textEditor,
				required = txtEdt.find('input:not(.optional)'),
				xInput = txtEdt.find('#hudTxtPositionX'),
				yInput = txtEdt.find('#hudTxtPositionY'),
				textInput = txtEdt.find('#hudTxtText'),
				widthInput = txtEdt.find('#hudTxtWidth'),
				nameInput = txtEdt.find('#hudTxtName'),
				sizeInput = txtEdt.find('#hudTxtSize'),
				fontSelect = txtEdt.find('#hudTxtFont'),
				styleSelect = txtEdt.find('#hudTxtStyle'),
				alignSelect = txtEdt.find('#hudTxtAlign'),
				removeBtn = txtEdt.find('#hudTxtRemoveBtn'),
				colorPicker = txtEdt.data('colorPicker'),
				color = obj && obj.config.color ? obj.config.color 
					: hemi.hud.theme.text.color,
				wgt = this;
				
			txtEdt.data('obj', obj).find('.displayName').text(obj ? obj.name : '');
			xInput.val(obj ? obj.x : '').blur();
			yInput.val(obj ? obj.y : '').blur();
			widthInput.val(obj ? obj.width : '');
			textInput.val(obj ? obj.text[0] : '');
			nameInput.val(obj ? obj.name : '');
			sizeInput.val(obj && obj.config.textSize ? obj.config.textSize 
				: hemi.hud.theme.text.textSize);
			fontSelect.val(obj && obj.config.textTypeface
				? obj.config.textTypeface : hemi.hud.theme.text.textTypeface);
			styleSelect.val(obj && obj.config.textStyle
				? obj.config.textStyle: hemi.hud.theme.text.textStyle);
			alignSelect.val(obj && obj.config.textAlign
				? obj.config.textAlign: hemi.hud.theme.text.textAlign);
			
			colorPicker.setColor(color);
			
			if (obj) {
				removeBtn.show();		
			}
			else {
				removeBtn.hide();		
			}
			
			this.canSave(required, [txtEdt.find('#hudTxtSaveBtn')]);
			txtEdt.show();
			
			this.pageEditor.hide();
			this.displayEditor.hide();
			this.imageEditor.hide();
		},
		
		setImageEditor: function(obj) {
			var imgEdt = this.imageEditor,
				xInput = imgEdt.find('#hudImgPositionX'),
				yInput = imgEdt.find('#hudImgPositionY'),
				urlInput = imgEdt.find('#hudImgUrl'),
				nameInput = imgEdt.find('#hudImgName'),
				removeBtn = imgEdt.find('#hudImgRemoveBtn'),
				wgt = this;
				
			imgEdt.data('obj', obj).find('.displayName').text(obj ? obj.name : '');
			xInput.val(obj ? obj.x : '').blur();
			yInput.val(obj ? obj.y : '').blur();
			urlInput.val(obj ? obj.getImageUrl() : '');
			nameInput.val(obj ? obj.name : '');
			
			if (obj) {
				removeBtn.show();
			}
			else {
				removeBtn.hide();
			}
			
			imgEdt.show();
			
			this.imageEditor.show();
			this.pageEditor.hide();
			this.textEditor.hide();
			this.displayEditor.hide();
		},
	
		setupAutoFills: function(inputs) {
			var wgt = this;
			
			inputs.filter('.xNdx').val('x');
			inputs.filter('.yNdx').val('y');
			inputs.filter('.zNdx').val('z');
										
			inputs.bind('keydown', function(evt) {
				var elem = jQuery(this);
				elem.removeClass('vectorHelper');
			})
			.bind('blur', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					cls = elem.attr('class'),
					param = elem.attr('id'),
					totalVal = null,
					type = cls.match(/xNdx|yNdx|zNdx/);
				
				
				if (val === '') {
					elem.val(type[0].replace('Ndx', '')).addClass('vectorHelper');
				}
			})
			.bind('focus', function(evt) {
				var elem = jQuery(this),
					val = elem.val();
				if (val === 'x' || val === 'y' || val === 'z') {
					elem.val('');
				}
			})
			.addClass('vectorHelper');
		},
		
		resize: function(maxHeight) {
			this._super(maxHeight);	
			
			var form = this.find('form:visible'),
				hdrHeight = this.find('h1:visible').outerHeight(true),
				padding = parseInt(form.css('paddingTop')) 
					+ parseInt(form.css('paddingBottom')),
				newHeight = maxHeight - hdrHeight - padding,
				oldHeight = form.outerHeight(true);
			
			if (oldHeight > newHeight) {
				form.addClass('scrolling');
			}
			else {
				form.removeClass('scrolling');
			}
			if (newHeight > 0) {
				this.find('form:visible').height(newHeight);
			}
		}
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    

    /*
     * Configuration object for the HudDisplaysView.
     */
    module.tools.HudDisplaysViewDefaults = {
        toolName: 'HudDisplays',
		toolTip: 'HudDisplays: Create and edit HudDisplays',
		widgetId: 'hudBtn',
		axnBarId: 'hudActionBar'
    };
    
    /**
     * The HudDisplaysView controls the dialog and toolbar widget for the 
     * HudDisplay tool.
     * 
     * @param {Object} options configuration options.  Uses 
     *         editor.tools.HudDisplaysViewDefaults as default options
     */
    module.tools.HudDisplaysView = module.tools.ToolView.extend({
		init: function(options) {
	        var newOpts = jQuery.extend({}, module.tools.HudDisplaysViewDefaults, options);
	        this._super(newOpts);
						
			this.addSidebarWidget(new module.tools.HudEditSBWidget());
			this.addSidebarWidget(new module.tools.HudTreeSBWidget());
	    }
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The HudDisplaysController facilitates HudDisplaysModel and
     * HudDisplaysView communication by binding event and message handlers.
     */
    module.tools.HudDisplaysController = module.tools.ToolController.extend({
		init: function() {
			this._super();
    	},
		
	    /**
	     * Binds event and message handlers to the view and model this object 
	     * references.  
	     */
	    bindEvents: function() {
			this._super();
				        
	        var model = this.model,
	        	view = this.view,
				hudTreeWgt = view.hudTreeSBWidget,
				hudEdtWgt = view.hudEditSBWidget,
	        	that = this;
	                	        
			// special listener for when the toolbar button is clicked
	        view.addListener(module.EventTypes.ToolModeSet, function(value) {
	            var isDown = value.newMode === module.tools.ToolConstants.MODE_DOWN;
				
				if (isDown && model.currentDisplay) {
					model.currentDisplay.currentPage = model.savedPage ? 
						model.savedPage : 0;
					model.currentDisplay.show();
				}
				else if (model.currentDisplay) {
					model.savedPage = model.currentDisplay.currentPage;
					model.currentDisplay.hide();
				}
	        }); 
			
			// hud tree specific listeners
			hudTreeWgt.addListener(module.EventTypes.CreateDisplay, function(name) {
				model.createDisplay(name);
			});
			hudTreeWgt.addListener(module.EventTypes.SelectHudNode, function(hudObjs) {
				var isDown = view.mode === module.tools.ToolConstants.MODE_DOWN;
				hudEdtWgt.setVisible(true && isDown);
								
				for (var ndx = 0, len = hudObjs.length; ndx < len; ndx++) {
					var hudObj = hudObjs[ndx],
						type = hudObj.getCitizenType().split('.').pop();
					
					switch (type) {
						case 'HudDisplay':
							model.setDisplay(hudObj);
							break;
						case 'HudPage':
							model.setPage(hudObj);
							break;
						case 'HudText':
						case 'HudImage':
							model.setElement(hudObj);
							break;
					}
				}
			});
			
			// hud edit specific listeners
			hudEdtWgt.addListener(module.EventTypes.CreatePage, function(select) {
				model.createPage(select);
			});
			hudEdtWgt.addListener(module.EventTypes.RemoveDisplay, function(display) {
				model.removeDisplay(display);
			});
			hudEdtWgt.addListener(module.EventTypes.RemoveElement, function(element) {
				model.removeElement(element);
			});
			hudEdtWgt.addListener(module.EventTypes.RemovePage, function(page) {
				model.removePage(page);
			});
			hudEdtWgt.addListener(module.EventTypes.SaveElement, function(props) {
				model.saveElement(props);
			});
			hudEdtWgt.addListener(module.EventTypes.SavePage, function(props) {
				model.savePage(props);
			});
			hudEdtWgt.addListener(module.EventTypes.SetElement, function(elemObj) {
				model.setElement(elemObj.element, elemObj.type);
			});
			
			// view specific listeners
			
			// model specific listeners
			model.addListener(module.EventTypes.DisplayCreated, function(display) {
				var isDown = view.mode === module.tools.ToolConstants.MODE_DOWN;
				hudEdtWgt.setVisible(true && isDown);
				hudEdtWgt.edit(display);
				hudTreeWgt.add(display);
				hudTreeWgt.select(display);
			});
			model.addListener(module.EventTypes.DisplayRemoved, function(display) {
				hudEdtWgt.setVisible(false);
				hudTreeWgt.remove(display);
			});
			model.addListener(module.EventTypes.DisplaySet, function(display) {
				hudEdtWgt.edit(display, hemi.hud.HudDisplay.prototype.citizenType);
			});
			model.addListener(module.EventTypes.ElementCreated, function(element) {
				hudEdtWgt.edit(model.currentPage);
				hudTreeWgt.add(element, model.currentPage);
				hudTreeWgt.select(model.currentPage);
			});
			model.addListener(module.EventTypes.ElementRemoved, function(element) {
				hudEdtWgt.edit(model.currentPage);
				hudTreeWgt.remove(element);
				hudTreeWgt.select(model.currentPage);
			});
			model.addListener(module.EventTypes.ElementSet, function(elemObj) {
				hudEdtWgt.edit(elemObj.element, elemObj.type);
			});
			model.addListener(module.EventTypes.ElementUpdated, function(element) {
				hudEdtWgt.edit(model.currentPage);
				hudTreeWgt.select(model.currentPage);
				hudTreeWgt.update(element);
			});
			model.addListener(module.EventTypes.PageCreated, function(page) {
				hudEdtWgt.edit(page);
				hudTreeWgt.add(page, model.currentDisplay);
				hudTreeWgt.select(page);
			});
			model.addListener(module.EventTypes.PageRemoved, function(page) {
				hudEdtWgt.edit(model.currentDisplay);
				hudTreeWgt.remove(page);
				hudTreeWgt.select(model.currentDisplay);
			});
			model.addListener(module.EventTypes.PageSet, function(page) {
				hudEdtWgt.edit(page, hemi.hud.HudPage.prototype.citizenType);
			});
			model.addListener(module.EventTypes.HudWorldLoaded, function(displays) {			
				for (var ndx = 0, len = displays.length; ndx < len; ndx++) {
					var display = displays[ndx],
						pages = display.pages;
					
					// Skip the HUD display used by the editor
					if (display.name.match(module.tools.ToolConstants.EDITOR_PREFIX) !== null) {
						continue;
					}
					
					hudTreeWgt.add(display);
					
					for (var ndx2 = 0, len2 = pages.length; ndx2 < len2; ndx2++) {
						var page = pages[ndx2],
							elems = page.elements;
						
						hudTreeWgt.add(page, display);
					
						for (var ndx3 = 0, len3 = elems.length; ndx3 < len3; ndx3++) {
							var elem = elems[ndx3];							
							hudTreeWgt.add(elem, page);
						}
					}
				}
			});
	    }
	});
    
    return module;
})(editor || {});