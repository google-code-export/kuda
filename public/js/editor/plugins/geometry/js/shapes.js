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

var editor = (function(editor) {
	"use strict";
	
    editor.tools = editor.tools || {};
    
    editor.EventTypes = editor.EventTypes || {};
	
	// view specific
	
	// create sidebar widget specific
	editor.EventTypes.SetShapeParam = "Shapes.SetShapeParam";
	editor.EventTypes.RemoveShapeParam = "Shapes.RemoveShapeParam";
    editor.EventTypes.PreviewShape = "Shapes.PreviewShape";
    editor.EventTypes.SaveShape = "Shapes.SaveShape";
	
	// list sidebar widget specific
    editor.EventTypes.CreateShape = "Shapes.CreateShape";
    editor.EventTypes.EditShape = "Shapes.EditShape";
    editor.EventTypes.RemoveShape = "Shapes.RemoveShape";
	
	// model specific
    editor.EventTypes.ShapeSet = "Shapes.ShapeSet";
	editor.EventTypes.ShapeWorldCleaned = "Shapes.ShapeWorldCleaned";
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * An ShapesModel handles the creation, updating, and removal of 
     * shapes
     */
    editor.tools.ShapesModel = editor.ToolModel.extend({
		init: function() {
			this._super('editor.tools.Shapes');
			
			this.currentShape = null;
			this.prevShape = null;
			this.shapeParams = {};
	    },
			
		worldCleaned: function() {
			this.notifyListeners(editor.EventTypes.ShapeWorldCleaned, null);
	    },
	    
	    worldLoaded: function() {
			var shapes = hemi.world.getShapes();
			
			for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
				this.notifyListeners(editor.events.Created, shapes[ndx]);
			}
	    },
		
		setParam: function(paramName, paramValue) {
			if (paramValue === '') {
				delete this.shapeParams[paramName];
			}
			else {
				this.shapeParams[paramName] = paramValue;
			}
		},
		
		setShape: function(shape) {
			if (this.prevShape !== null) {
				this.prevShape.cleanup();
				this.prevShape = null;
			}
			
			this.currentShape = shape;
			
			// set the params
			if (shape !== null) {
				this.shapeParams = jQuery.extend({
						type: shape.shapeType,
						color: shape.color
					},
					shape.dim);
			} else {
				this.shapeParams = {};
			}
			
			this.notifyListeners(editor.EventTypes.ShapeSet, shape);
		},
		
		previewShape: function() {
			if (this.currentShape !== null) {
				this.currentShape.transform.visible = false;
			}
			if (this.prevShape !== null) {
				this.prevShape.cleanup();
			}
			
			this.prevShape = new hemi.shape.Shape(this.shapeParams);
			this.prevShape.name = editor.ToolConstants.EDITOR_PREFIX + 'PreviewShape';
			
			if (this.shapeParams.position) {
				var pos = this.shapeParams.position;
				this.prevShape.translate(pos[0], pos[1], pos[2]);
			}
		},
		
		removeShape: function(shape) {
			this.notifyListeners(editor.events.Removed, shape);
			shape.cleanup();
		},
		
		saveShape: function(name) {
			var msgType;
			
			if (this.prevShape !== null) {
				this.prevShape.cleanup();
			}
			
			if (this.currentShape !== null) {
				this.currentShape.change(this.shapeParams);
				this.currentShape.transform.identity();
				this.currentShape.transform.visible = true;
				msgType = editor.events.Updated;
			} else {
				this.currentShape = new hemi.shape.Shape(this.shapeParams);
				msgType = editor.events.Created;
			}
			
			if (this.shapeParams.position) {
				var pos = this.shapeParams.position;
				this.currentShape.translate(pos[0], pos[1], pos[2]);
			}
			
			this.currentShape.setName(name);
			this.notifyListeners(msgType, this.currentShape);
			
			this.currentShape = null;
			this.prevShape = null;
			this.shapeParams = {};
		}
	});
   	
////////////////////////////////////////////////////////////////////////////////
//                     	   Create Shape Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
			
	var CreateWidget = editor.ui.FormWidget.extend({
		init: function() {
		    this._super({
				name: 'createShapeWidget',
				uiFile: 'js/editor/plugins/geometry/html/shapesForms.htm',
		        instructions: 'Click on a model to select it'
			});
				
			this.inputsToCheck = [];
		},
		
		finishLayout: function() {
			this._super();
			
			var form = this.find('form'),
				typeSel = this.find('#shpTypeSelect'),
				saveBtn = this.find('#shpSaveBtn'),
				cancelBtn = this.find('#shpCancelBtn'),
				nameInput = this.find('#shpName'),
				inputs = this.find('input:not(#shpName, .vector, .color)'),
				params = this.find('#shpShapeParams'),
				previewBtn = this.find('#shpPreviewBtn'),
				optionalInputs = this.find('.optional'),
				wgt = this,
				vecValidator = new editor.ui.Validator(null, function(elem) {
						var val = elem.val(),
							msg = null;
							
						if (val !== '' && !hemi.utils.isNumeric(val)) {
							msg = 'must be a number';
						}
						
						return msg;
					});
			
			this.colorPicker = new editor.ui.ColorPicker({
				inputId: 'shpColor',
				buttonId: 'shpColorPicker'
			});
			
			this.find('#shpColorLbl').after(this.colorPicker.getUI());
				
			// hide optional inputs
			optionalInputs.parent().hide();
			
			this.vectors = new editor.ui.Vector({
				container: wgt.find('#shpPositionDiv'),
				paramName: 'position',
				onBlur: function(elem, evt) {
					var val = elem.val(),
						ndx = elem.data('ndx');
					
					if (val === '') {
						wgt.notifyListeners(editor.EventTypes.RemoveShapeParam, 
							wgt.vectors.config.paramName);
					}
					else if (hemi.utils.isNumeric(val)) {
						var totalVal = wgt.vectors.getValue();
						
						if (totalVal == null) {
							wgt.notifyListeners(editor.EventTypes.SetShapeParam, {
								paramName: wgt.vectors.config.paramName,
								paramValue: totalVal
							});
						}
					}
					
					wgt.checkToggleButtons();
				},
				validator: vecValidator
			});
			
			// add validation
			new editor.ui.Validator(inputs, function(elem) {
				var val = elem.val(),
					msg = null;
				
				if (val != '' && !hemi.utils.isNumeric(val)) {
					msg = 'must be a number';
				}
				
				return msg;
			});
								
			// bind inputs
			inputs.bind('blur', function(evt) {
				var elem = jQuery(this),
					origVal = elem.val(),
					val = parseInt(origVal),
					param = elem.attr('id').replace('shp', '').toLowerCase();
					
				if (origVal == '' || !isNaN(val)) {
					val = isNaN(val) ? origVal : val;
					wgt.notifyListeners(editor.EventTypes.SetShapeParam, {
						paramName: param,
						paramValue: val
					});
				
					wgt.checkToggleButtons();
				}
			});
			
			// bind type selection
			typeSel.bind('change', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					heightInput = wgt.find('#shpHeight'),
					widthInput = wgt.find('#shpWidth'),
					depthInput = wgt.find('#shpDepth'),
					sizeInput = wgt.find('#shpSize'),
					tailInput = wgt.find('#shpTail'),
					radiusInput = wgt.find('#shpRadius'),
					inputs = [];
				
				heightInput.val('').blur().parent().hide();
				widthInput.val('').blur().parent().hide();
				depthInput.val('').blur().parent().hide();
				radiusInput.val('').blur().parent().hide();
				sizeInput.val('').blur().parent().hide();
				tailInput.val('').blur().parent().hide();
				
				wgt.notifyListeners(editor.EventTypes.SetShapeParam, {
					paramName: 'type',
					paramValue: val
				});
				
				// switch between shapes
				switch(val) {
					case hemi.shape.BOX:
					case hemi.shape.PYRAMID:
						heightInput.parent().show();
						widthInput.parent().show();
						depthInput.parent().show();
						inputs.push(heightInput);
						inputs.push(widthInput);
						inputs.push(depthInput);
						break;
					case hemi.shape.SPHERE:
						radiusInput.parent().show();
						inputs.push(radiusInput);
						break;
					case hemi.shape.CONE:
					case hemi.shape.CYLINDER:
						radiusInput.parent().show();
						heightInput.parent().show();
						inputs.push(radiusInput);
						inputs.push(heightInput);
						break;
					case hemi.shape.ARROW:
						sizeInput.parent().show();
						tailInput.parent().show();
						inputs.push(sizeInput);
						inputs.push(tailInput);
					case hemi.shape.CUBE:
					case hemi.shape.TETRA:
					case hemi.shape.OCTA:
						sizeInput.parent().show();
						inputs.push(sizeInput);
						break;
				}
				
				wgt.inputsToCheck = inputs;
				saveBtn.attr('disabled', 'disabled');
				previewBtn.attr('disabled', 'disabled');
			});
			
			
			nameInput.bind('keyup', function(evt) {
				var val = nameInput.val();
				
				if (val !== '' && wgt.canSave()) {
					saveBtn.removeAttr('disabled');
				}
				else {
					saveBtn.attr('disabled', 'disabled');
				}
			});
			
			saveBtn.bind('click', function(evt) {
				var name = nameInput.val();
				
				wgt.notifyListeners(editor.EventTypes.SaveShape, name);
			})
			.attr('disabled', 'disabled');
			
			cancelBtn.bind('click', function(evt) {
				wgt.reset();
				wgt.notifyListeners(editor.events.Cancel, null);
				wgt.find('input.error').removeClass('error');
			});
			
			previewBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.EventTypes.PreviewShape, null);
			})
			.attr('disabled', 'disabled');
			
			form.submit(function(evt) {
				return false;
			});
			
			this.colorPicker.addListener(editor.EventTypes.ColorPicked, function(clr) {
				wgt.notifyListeners(editor.EventTypes.SetShapeParam, {
					paramName: 'color',
					paramValue: clr
				});
				
				wgt.checkToggleButtons();
			});
			
			editor.ui.sizeAndPosition.call(this);
		},
		
		canSave: function() {
			var list = this.inputsToCheck,
				isSafe = this.vectors.getValue() != null && this.colorPicker.getColor() != null;
			
			for (var ndx = 0, len = list.length; ndx < len && isSafe; ndx++) {
				isSafe = list[ndx].val() !== '';
			}
			
			return isSafe;
		},
		
		checkToggleButtons: function() {
			var name = this.find('#shpName').val(),
				canSave = this.canSave(),
				saveBtn = this.find('#shpSaveBtn'),
				previewBtn = this.find('#shpPreviewBtn');				
					
			if (name !== '' && canSave) {
				saveBtn.removeAttr('disabled');
				previewBtn.removeAttr('disabled');
			}
			else if (canSave) {
				previewBtn.removeAttr('disabled');
			}
			else {
				previewBtn.attr('disabled', 'disabled');
				saveBtn.attr('disabled', 'disabled');
			}
		},
		
		reset: function() {		
			// hide optional inputs
			this.find('.optional').parent().hide();
			
			// reset selects
			this.find('#shpTypeSelect').val(-1);
			
			// set all inputs to blank
			this.find('form input').val('');
			
			// reset the hints
			this.vectors.reset();
		
			// reset the colorpicker
			this.colorPicker.reset();
						
			// disable the save and preview buttons
			this.find('#shpSaveBtn').attr('disabled', 'disabled');
			this.find('#shpPreviewBtn').attr('disabled', 'disabled');
		},
		
		set: function(shape) {
			var heightInput = this.find('#shpHeight'),
				widthInput = this.find('#shpWidth'),
				depthInput = this.find('#shpDepth'),
				sizeInput = this.find('#shpSize'),
				tailInput = this.find('#shpTail'),
				radiusInput = this.find('#shpRadius'),
				r = shape.color[0],
				g = shape.color[1],
				b = shape.color[2],
				a = shape.color[3];
			
			// set the type
			this.find('#shpTypeSelect').val(shape.shapeType).change();
			
			// set the position
			var translation = hemi.core.math.matrix4.getTranslation(shape.transform.localMatrix);
			this.vectors.setValue({
				x: translation[0],
				y: translation[1],
				z: translation[2]
			});
			
			// set the dimension values
			for (var prop in shape.dim) {
				var val = shape.dim[prop];
				switch(prop) {
					case 'height':
					    heightInput.val(val).blur();
						break;
					case 'width':
					    widthInput.val(val).blur();
						break;
					case 'depth':
					    depthInput.val(val).blur();
						break;
					case 'size':
					    sizeInput.val(val).blur();
						break;
					case 'tail':
					    tailInput.val(val).blur();
						break;
					case 'radius':
					    radiusInput.val(val).blur();
						break;
				}
			}
			
			// set the color
			this.colorPicker.setColor(shape.color);
			
			// set the name
			this.find('#shpName').val(shape.name);
			
			// set the buttons
			this.find('#shpSaveBtn').attr('disabled', 'disabled');
			this.find('#shpPreviewBtn').attr('disabled', 'disabled');
			
			this.notifyListeners(editor.EventTypes.SetShapeParam, {
				paramName: 'position',
				paramValue: translation
			});
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	 		Shapes List Widget  	                      //
////////////////////////////////////////////////////////////////////////////////     
		
	var ListWidget = editor.ui.ListWidget.extend({
		init: function() {
		    this._super({
				name: 'shapeListWidget',
				listId: 'shapeList',
				prefix: 'shpLst',
				title: 'Shapes',
				instructions: "Add shapes above."
			});
			
			this.items = new Hashtable();
			this.container.addClass('second');		
			editor.ui.sizeAndPosition.call(this);
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var shape = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.EditShape, shape);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var shape = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.RemoveShape, shape);
			});
		},
		
		createListItemWidget: function() {
			return new editor.ui.BhvListItemWidget();
		},
		
		getOtherHeights: function() {
			return this.buttonDiv.outerHeight(true);
		}
	});
         
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////   
    
    /**
     * The ShapesView controls the dialog and toolbar widget for the 
     * animation tool.
     * 
     * @param {Object} options configuration options.  Uses 
     *         editor.tools.ShapesViewDefaults as default options
     */
    editor.tools.ShapesView = editor.ToolView.extend({
		init: function(options) {
	        this._super({
		        toolName: 'Shapes',
				toolTip: 'Create and edit primitive shapes',
				elemId: 'shapesBtn',
				id: 'editor.tools.Shapes'
		    });
			
			this.addPanel(new editor.ui.Panel({
				classes: ['shpSidePanel']
			}));
			
			this.sidePanel.addWidget(new CreateWidget());
			this.sidePanel.addWidget(new ListWidget());
//			this.sidePanel.addWidget(editor.ui.getBehaviorWidget());
	    }
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The ShapesController facilitates ShapesModel and ShapesView
     * communication by binding event and message handlers.
     */
    editor.tools.ShapesController = editor.ToolController.extend({
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
				crtWgt = view.sidePanel.createShapeWidget,
				lstWgt = view.sidePanel.shapeListWidget,
				bhvWgt = view.sidePanel.behaviorWidget,
	        	that = this;
			
			// create sidebar widget listeners
			crtWgt.addListener(editor.EventTypes.SaveShape, function(name) {				
				model.saveShape(name);
				crtWgt.reset();
			});		
			crtWgt.addListener(editor.EventTypes.PreviewShape, function() {
				model.previewShape();
			});
			crtWgt.addListener(editor.EventTypes.SetShapeParam, function(paramObj) {
				model.setParam(paramObj.paramName, paramObj.paramValue);
			});	
			crtWgt.addListener(editor.events.Cancel, function() {
				model.setShape(null);
			});	
			
			// list sidebar widget listeners
			lstWgt.addListener(editor.EventTypes.CreateShape, function() {
			});	
			lstWgt.addListener(editor.EventTypes.EditShape, function(shape) {				
				model.setShape(shape);
			});	
			lstWgt.addListener(editor.EventTypes.RemoveShape, function(shape) {
				model.removeShape(shape);
			});
			
			// view specific listeners
			
			// model specific listeners
			model.addListener(editor.events.Created, function(shape) {
				lstWgt.add(shape);
			});		
			model.addListener(editor.events.Updated, function(shape) {
				lstWgt.update(shape);
			});		
			model.addListener(editor.events.Removed, function(shape) {
				lstWgt.remove(shape);
			});
			model.addListener(editor.EventTypes.ShapeSet, function(shape) {
				if (shape != null) {
					crtWgt.set(shape);
				}
			});
			model.addListener(editor.EventTypes.ShapeWorldCleaned, function() {
				lstWgt.clear();
			});
			
//			// behavior widget specific
//			bhvWgt.addListener(editor.EventTypes.Sidebar.WidgetVisible, function(obj) {
//				if (obj.updateMeta) {
//					var isDown = view.mode === editor.ToolConstants.MODE_DOWN;
//					
//					lstWgt.setVisible(!obj.visible && isDown);
//					crtWgt.setVisible(!obj.visible && isDown);
//				}
//			});
	    }
	});
    
    return editor;
})(editor || {});