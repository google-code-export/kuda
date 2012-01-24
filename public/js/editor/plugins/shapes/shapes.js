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

(function() {
	"use strict";
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                     			   			Initialization			  		                      //
////////////////////////////////////////////////////////////////////////////////////////////////////

	var shorthand = editor.tools.shapes;

	shorthand.init = function() {
		var navPane = editor.ui.getNavPane('Geometry'),
			
			shpMdl = new ShapesModel(),
			shpView = new ShapesView(),
			shpCtr = new ShapesController();
						
		shpCtr.setModel(shpMdl);
		shpCtr.setView(shpView);
		
		navPane.add(shpView);
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                     			  			Tool Definition			  		                      //
////////////////////////////////////////////////////////////////////////////////////////////////////
    
    shorthand.events = {
		// create sidebar widget specific
	    PreviewShape: "Shapes.PreviewShape",
	    SaveShape: "Shapes.SaveShape"
    };
    
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                   			 Model                                    		  //
////////////////////////////////////////////////////////////////////////////////////////////////////
    
    /**
     * An ShapesModel handles the creation, updating, and removal of 
     * shapes
     */
    var ShapesModel = function() {
		editor.ToolModel.call(this, 'shapes');
		
		this.currentShape = null;
		this.prevShape = null;
    };
		
	ShapesModel.prototype = new editor.ToolModel();
	ShapesModel.prototype.constructor = ShapesModel;
		
	ShapesModel.prototype.previewShape = function(props) {
		if (this.currentShape !== null) {
			this.currentShape.mesh.visible = false;
		}
		if (this.prevShape !== null) {
			this.prevShape.cleanup();
		}
		
		this.prevShape = new hemi.Shape(editor.client, props.shapeInfo);
		this.prevShape.name = editor.ToolConstants.EDITOR_PREFIX + 'PreviewShape';
		var pos = props.position;
		
		this.prevShape.translate(pos[0], pos[1], pos[2]);
	};
	
	ShapesModel.prototype.removeShape = function(shape) {
		this.notifyListeners(editor.events.Removing, shape);
		shape.cleanup();
	};
	
	ShapesModel.prototype.saveShape = function(props) {
		var msgType, shape;
		
		if (this.prevShape !== null) {
			this.prevShape.cleanup();
			this.prevShape = null;
		}
		
		if (this.currentShape !== null) {
			shape = this.currentShape;
			shape.config = props.shapeInfo;
			shape.create();
			shape.mesh.visible = true;
			msgType = editor.events.Updated;
		} else {
			shape = this.currentShape = new hemi.Shape(editor.client, props.shapeInfo);
			msgType = editor.events.Created;
		}
		
		var pos = props.position;
		shape.translate(pos[0], pos[1], pos[2]);
		shape.setName(props.name);
		this.notifyListeners(msgType, shape);
		
		this.currentShape = null;
	};
	
	ShapesModel.prototype.setShape = function(shape) {
		if (this.prevShape !== null) {
			this.prevShape.cleanup();
			this.prevShape = null;
		}
		if (this.currentShape !== null) {
			this.currentShape.mesh.visible = true;
		}
		
		this.currentShape = shape;
		this.notifyListeners(editor.events.Editing, shape);
	};
	
	ShapesModel.prototype.worldCleaned = function() {
		var shapes = hemi.world.getShapes();
		
		for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
			this.notifyListeners(editor.events.Removing, shapes[ndx]);
		}
    };
    
    ShapesModel.prototype.worldLoaded = function() {
		var shapes = hemi.world.getShapes();
		
		for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
			this.notifyListeners(editor.events.Created, shapes[ndx]);
		}
    };
   	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                     	   			 Create Shape Sidebar Widget    	                          //
////////////////////////////////////////////////////////////////////////////////////////////////////
			
	var CreateWidget = function() {
	    editor.ui.FormWidget.call(this, {
			name: 'createShapeWidget',
			uiFile: 'js/editor/plugins/shapes/html/shapesForms.htm',
	        instructions: 'Click on a model to select it'
		});
			
		this.inputsToCheck = [];
	};
	var crtWgtSuper = editor.ui.FormWidget.prototype;
		
	CreateWidget.prototype = new editor.ui.FormWidget();
	CreateWidget.prototype.constructor = CreateWidget;
	
	CreateWidget.prototype.layout = function() {
		crtWgtSuper.layout.call(this);
		
		var form = this.find('form'),
			saveBtn = this.find('#shpSaveBtn'),
			cancelBtn = this.find('#shpCancelBtn'),
			inputs = this.find('input:not(#shpName, .vector, .color)'),
			previewBtn = this.find('#shpPreviewBtn'),
			validator = editor.ui.createDefaultValidator(),
			wgt = this;
		
		this.shapeType = this.find('#shpTypeSelect');
		
		this.shapeHeight = new editor.ui.Input({
			container: wgt.find('#shpHeight')
		});
		this.shapeWidth = new editor.ui.Input({
			container: wgt.find('#shpWidth')
		});
		this.shapeDepth = new editor.ui.Input({
			container: wgt.find('#shpDepth')
		});
		this.shapeSize = new editor.ui.Input({
			container: wgt.find('#shpSize')
		});
		this.shapeTail = new editor.ui.Input({
			container: wgt.find('#shpTail')
		});
		this.shapeRadius = new editor.ui.Input({
			container: wgt.find('#shpRadius')
		});
		this.shapeName = new editor.ui.Input({
			container: wgt.find('#shpName'),
			type: 'string'
		});
		
		this.colorPicker = new editor.ui.ColorPicker({
			inputId: 'shpColor',
			buttonId: 'shpColorPicker'
		});
		this.find('#shpColorLbl').after(this.colorPicker.getUI());
		
		this.shapePosition = new editor.ui.Vector({
			container: wgt.find('#shpPositionDiv'),
			onBlur: function(ipt, evt) {
				wgt.checkToggleButtons();
			},
			validator: validator
		});
		
		// hide optional inputs
		this.find('.optional').parent().hide();
		
		// add validation
		validator.setElements(inputs);
							
		// bind inputs
		inputs.bind('blur', function(evt) {
			wgt.checkToggleButtons();
		});
		
		// bind type selection
		this.shapeType.bind('change', function(evt) {
			var val = wgt.shapeType.val(),
				inputs = [wgt.shapePosition];
			
			wgt.shapeHeight.reset();
			wgt.shapeWidth.reset();
			wgt.shapeDepth.reset();
			wgt.shapeRadius.reset();
			wgt.shapeSize.reset();
			wgt.shapeTail.reset();
			wgt.find('.optional').parent().hide();
			
			// switch between shapes
			switch(val) {
				case hemi.ShapeType.BOX:
				case hemi.ShapeType.PYRAMID:
					wgt.shapeHeight.getUI().parent().show();
					wgt.shapeWidth.getUI().parent().show();
					wgt.shapeDepth.getUI().parent().show();
					inputs.push(wgt.shapeHeight);
					inputs.push(wgt.shapeWidth);
					inputs.push(wgt.shapeDepth);
					break;
				case hemi.ShapeType.SPHERE:
					wgt.shapeRadius.getUI().parent().show();
					inputs.push(wgt.shapeRadius);
					break;
				case hemi.ShapeType.CONE:
				case hemi.ShapeType.CYLINDER:
					wgt.shapeRadius.getUI().parent().show();
					wgt.shapeHeight.getUI().parent().show();
					inputs.push(wgt.shapeRadius);
					inputs.push(wgt.shapeHeight);
					break;
				case hemi.ShapeType.ARROW:
					wgt.shapeSize.getUI().parent().show();
					wgt.shapeTail.getUI().parent().show();
					inputs.push(wgt.shapeSize);
					inputs.push(wgt.shapeTail);
				case hemi.ShapeType.CUBE:
				case hemi.ShapeType.TETRA:
				case hemi.ShapeType.OCTA:
					wgt.shapeSize.getUI().parent().show();
					inputs.push(wgt.shapeSize);
					break;
			}
			
			wgt.inputsToCheck = inputs;
			wgt.invalidate();
			saveBtn.attr('disabled', 'disabled');
			previewBtn.attr('disabled', 'disabled');
		});
		
		this.shapeName.getUI().bind('keyup', function(evt) {
			wgt.checkToggleButtons();
		});
		
		saveBtn.bind('click', function(evt) {
			var props = wgt.getProperties();
			wgt.notifyListeners(shorthand.events.SaveShape, props);
		})
		.attr('disabled', 'disabled');
		
		cancelBtn.bind('click', function(evt) {
			wgt.reset();
			wgt.notifyListeners(editor.events.Cancel, null);
			wgt.find('input.error').removeClass('error');
			wgt.invalidate();
		});
		
		previewBtn.bind('click', function(evt) {
			var props = wgt.getProperties();
			wgt.notifyListeners(shorthand.events.PreviewShape, props);
		})
		.attr('disabled', 'disabled');
		
		form.submit(function(evt) {
			return false;
		});
		
		this.colorPicker.addListener(editor.events.ColorPicked, function(clr) {
			wgt.checkToggleButtons();
		});
	};
	
	CreateWidget.prototype.checkToggleButtons = function() {
		var name = this.shapeName.getValue(),
			saveBtn = this.find('#shpSaveBtn'),
			previewBtn = this.find('#shpPreviewBtn'),
			list = this.inputsToCheck,
			isSafe = this.colorPicker.getColor() != null;
		
		for (var i = 0, il = list.length; i < il && isSafe; ++i) {
			isSafe = list[i].getValue() != null;
		}
		
		if (isSafe) {
			previewBtn.removeAttr('disabled');
			
			if (name != null) {
				saveBtn.removeAttr('disabled');
			} else {
				saveBtn.attr('disabled', 'disabled');
			}
		} else {
			previewBtn.attr('disabled', 'disabled');
			saveBtn.attr('disabled', 'disabled');
		}
	};
	
	CreateWidget.prototype.getProperties = function() {
		var type = this.shapeType.val(),
			wgt = this,
			props = {
				name: wgt.shapeName.getValue(),
				position: wgt.shapePosition.getValue()
			},
			shapeInfo = {
				color: wgt.colorPicker.getColorHex(),
				opacity: wgt.colorPicker.getAlpha(),
				shape: type
			};
		
		switch (type) {
			case hemi.ShapeType.BOX:
			case hemi.ShapeType.PYRAMID:
				shapeInfo.height = this.shapeHeight.getValue();
				shapeInfo.width= this.shapeWidth.getValue();
				shapeInfo.depth = this.shapeDepth.getValue();
				break;
			case hemi.ShapeType.SPHERE:
				shapeInfo.radius= this.shapeRadius.getValue();
				break;
			case hemi.ShapeType.CONE:
			case hemi.ShapeType.CYLINDER:
				shapeInfo.radius= this.shapeRadius.getValue();
				shapeInfo.height = this.shapeHeight.getValue();
				break;
			case hemi.ShapeType.ARROW:
				shapeInfo.size= this.shapeSize.getValue();
				shapeInfo.tail= this.shapeTail.getValue();
			case hemi.ShapeType.CUBE:
			case hemi.ShapeType.TETRA:
			case hemi.ShapeType.OCTA:
				shapeInfo.size= this.shapeSize.getValue();
				break;
		}
		
		props.shapeInfo = shapeInfo;
		return props;
	};
	
	CreateWidget.prototype.reset = function() {		
		// hide optional inputs
		this.find('.optional').parent().hide();
		
		// reset selects
		this.shapeType.val(-1);
		
		// reset all inputs
		this.shapeHeight.reset();
		this.shapeWidth.reset();
		this.shapeDepth.reset();
		this.shapeSize.reset();
		this.shapeTail.reset();
		this.shapeRadius.reset();
		this.shapeName.reset();
		
		// reset the position
		this.shapePosition.reset();
	
		// reset the colorpicker
		this.colorPicker.reset();
					
		// disable the save and preview buttons
		this.find('#shpSaveBtn').attr('disabled', 'disabled');
		this.find('#shpPreviewBtn').attr('disabled', 'disabled');
	};
	
	CreateWidget.prototype.set = function(shape) {
		// set the type
		this.shapeType.val(shape.config.shape).change();
		
		// set the position
		var translation = shape.mesh.position;
		this.shapePosition.setValue({
			x: translation.x,
			y: translation.y,
			z: translation.z
		});
		
		// set the dimension values
		for (var prop in shape.config) {
			var val = shape.config[prop];
			
			switch(prop) {
				case 'height':
				    this.shapeHeight.setValue(val);
					break;
				case 'width':
					this.shapeWidth.setValue(val);
					break;
				case 'depth':
					this.shapeDepth.setValue(val);
					break;
				case 'size':
					this.shapeSize.setValue(val);
					break;
				case 'tail':
					this.shapeTail.setValue(val);
					break;
				case 'radius':
					this.shapeRadius.setValue(val);
					break;
			}
		}
		
		// set the color
		this.colorPicker.setColorHex(shape.config.color, shape.config.opacity);
		
		// set the name
		this.shapeName.setValue(shape.name);
		
		// set the buttons
		this.checkToggleButtons();
	};
         
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                  			View		                                      //
////////////////////////////////////////////////////////////////////////////////////////////////////  
    
    /**
     * The ShapesView controls the dialog and toolbar widget for the 
     * animation tool.
     */
    var ShapesView = function() {
        editor.ToolView.call(this, {
	        toolName: 'Shapes',
			toolTip: 'Create and edit primitive shapes',
			id: 'shapes'
	    });
		
		this.addPanel(new editor.ui.Panel({
			classes: ['shpSidePanel']
		}));
		
		this.sidePanel.addWidget(new CreateWidget());
		this.sidePanel.addWidget(new editor.ui.ListWidget({
			name: 'shapeListWidget',
			listId: 'shapeList',
			prefix: 'shpLst',
			title: 'Shapes',
			instructions: "Add shapes above."
		}));
    };
		
	ShapesView.prototype = new editor.ToolView();
	ShapesView.prototype.constructor = ShapesView;
    
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                			  Controller		                                  //
////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * The ShapesController facilitates ShapesModel and ShapesView
     * communication by binding event and message handlers.
     */
    var ShapesController = function() {
		editor.ToolController.call(this);
	};
	var shpCtrSuper = editor.ToolController.prototype;
		
	ShapesController.prototype = new editor.ToolController();
	ShapesController.prototype.constructor = ShapesController;
		    
    /**
     * Binds event and message handlers to the view and model this object 
     * references.  
     */
    ShapesController.prototype.bindEvents = function() {
        shpCtrSuper.bindEvents.call(this);
        
        var model = this.model,
        	view = this.view,
			crtWgt = view.sidePanel.createShapeWidget,
			lstWgt = view.sidePanel.shapeListWidget;
			
		view.addListener(editor.events.ToolModeSet, function(value) {
			var isDown = value.newMode === editor.ToolConstants.MODE_DOWN;
			
			if (model.prevShape) {
				model.prevShape.mesh.visible = isDown;
				if (model.currentShape) {
					model.currentShape.mesh.visible = !isDown;
				}
			}
		});	        
		
		// create sidebar widget listeners
		crtWgt.addListener(shorthand.events.SaveShape, function(props) {				
			model.saveShape(props);
			crtWgt.reset();
		});		
		crtWgt.addListener(shorthand.events.PreviewShape, function(props) {
			model.previewShape(props);
		});
		crtWgt.addListener(editor.events.Cancel, function() {
			model.setShape(null);
		});	
		
		// list sidebar widget listeners
		lstWgt.addListener(editor.events.Edit, function(shape) {				
			model.setShape(shape);
		});	
		lstWgt.addListener(editor.events.Remove, function(shape) {
			model.removeShape(shape);
		});
		
		// model specific listeners
		model.addListener(editor.events.Created, function(shape) {
			lstWgt.add(shape);
		});
		model.addListener(editor.events.Editing, function(shape) {
			if (shape != null) {
				crtWgt.set(shape);
			}
		});		
		model.addListener(editor.events.Updated, function(shape) {
			lstWgt.update(shape);
		});		
		model.addListener(editor.events.Removing, function(shape) {
			lstWgt.remove(shape);
		});
    };
})();
