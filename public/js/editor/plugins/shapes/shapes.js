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
	
////////////////////////////////////////////////////////////////////////////////
//                     			   Initialization  		                      //
////////////////////////////////////////////////////////////////////////////////

	var shorthand = editor.tools.shapes = editor.tools.shapes || {};

	shorthand.init = function() {
		var navPane = editor.ui.getNavPane('Geometry'),
			
			shpMdl = new ShapesModel(),
			shpView = new ShapesView(),
			shpCtr = new ShapesController();
						
		shpCtr.setModel(shpMdl);
		shpCtr.setView(shpView);
		
		navPane.add(shpView);
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     			  Tool Definition  		                      //
////////////////////////////////////////////////////////////////////////////////
    
    shorthand.events = {
		// create sidebar widget specific
	    PreviewShape: "Shapes.PreviewShape",
	    SaveShape: "Shapes.SaveShape",
		
		// list sidebar widget specific
	    CreateShape: "Shapes.CreateShape",
	    EditShape: "Shapes.EditShape",
	    RemoveShape: "Shapes.RemoveShape",
		
		// model specific
	    ShapeSet: "Shapes.ShapeSet"
    };
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * An ShapesModel handles the creation, updating, and removal of 
     * shapes
     */
    var ShapesModel = editor.ToolModel.extend({
		init: function() {
			this._super('shapes');
			
			this.currentShape = null;
			this.prevShape = null;
	    },
			
		worldCleaned: function() {
			var shapes = hemi.world.getShapes();
			
			for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
				this.notifyListeners(editor.events.Removed, shapes[ndx]);
			}
	    },
	    
	    worldLoaded: function() {
			var shapes = hemi.world.getShapes();
			
			for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
				this.notifyListeners(editor.events.Created, shapes[ndx]);
			}
	    },
		
		setShape: function(shape) {
			if (this.prevShape !== null) {
				this.prevShape.cleanup();
				this.prevShape = null;
			}
			if (this.currentShape !== null) {
				this.currentShape.transform.visible = true;
			}
			
			this.currentShape = shape;
			this.notifyListeners(shorthand.events.ShapeSet, shape);
		},
		
		previewShape: function(props) {
			if (this.currentShape !== null) {
				this.currentShape.transform.visible = false;
			}
			if (this.prevShape !== null) {
				this.prevShape.cleanup();
			}
			
			this.prevShape = new hemi.shape.Shape(props.shapeInfo);
			this.prevShape.name = editor.ToolConstants.EDITOR_PREFIX + 'PreviewShape';
			var pos = props.position;
			this.prevShape.translate(pos[0], pos[1], pos[2]);
		},
		
		removeShape: function(shape) {
			this.notifyListeners(editor.events.Removed, shape);
			shape.cleanup();
		},
		
		saveShape: function(props) {
			var msgType;
			
			if (this.prevShape !== null) {
				this.prevShape.cleanup();
				this.prevShape = null;
			}
			
			if (this.currentShape !== null) {
				this.currentShape.change(props.shapeInfo);
				this.currentShape.transform.identity();
				this.currentShape.transform.visible = true;
				msgType = editor.events.Updated;
			} else {
				this.currentShape = new hemi.shape.Shape(props.shapeInfo);
				msgType = editor.events.Created;
			}
			
			var pos = props.position;
			this.currentShape.translate(pos[0], pos[1], pos[2]);
			this.currentShape.setName(props.name);
			this.notifyListeners(msgType, this.currentShape);
			
			this.currentShape = null;
		}
	});
   	
////////////////////////////////////////////////////////////////////////////////
//                     	   Create Shape Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
			
	var CreateWidget = editor.ui.FormWidget.extend({
		init: function() {
		    this._super({
				name: 'createShapeWidget',
				uiFile: 'js/editor/plugins/shapes/html/shapesForms.htm',
		        instructions: 'Click on a model to select it'
			});
				
			this.inputsToCheck = [];
		},
		
		finishLayout: function() {
			this._super();
			
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
					case hemi.shape.BOX:
					case hemi.shape.PYRAMID:
						wgt.shapeHeight.getUI().parent().show();
						wgt.shapeWidth.getUI().parent().show();
						wgt.shapeDepth.getUI().parent().show();
						inputs.push(wgt.shapeHeight);
						inputs.push(wgt.shapeWidth);
						inputs.push(wgt.shapeDepth);
						break;
					case hemi.shape.SPHERE:
						wgt.shapeRadius.getUI().parent().show();
						inputs.push(wgt.shapeRadius);
						break;
					case hemi.shape.CONE:
					case hemi.shape.CYLINDER:
						wgt.shapeRadius.getUI().parent().show();
						wgt.shapeHeight.getUI().parent().show();
						inputs.push(wgt.shapeRadius);
						inputs.push(wgt.shapeHeight);
						break;
					case hemi.shape.ARROW:
						wgt.shapeSize.getUI().parent().show();
						wgt.shapeTail.getUI().parent().show();
						inputs.push(wgt.shapeSize);
						inputs.push(wgt.shapeTail);
					case hemi.shape.CUBE:
					case hemi.shape.TETRA:
					case hemi.shape.OCTA:
						wgt.shapeSize.getUI().parent().show();
						inputs.push(wgt.shapeSize);
						break;
				}
				
				wgt.inputsToCheck = inputs;
				wgt.invalidate();
				saveBtn.attr('disabled', 'disabled');
				previewBtn.attr('disabled', 'disabled');
			}).addClass('fixedWidth').sb({
				fixedWidth: true
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
		},
		
		checkToggleButtons: function() {
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
		},
		
		getProperties: function() {
			var type = this.shapeType.val(),
				wgt = this,
				props = {
					name: wgt.shapeName.getValue(),
					position: wgt.shapePosition.getValue()
				},
				shapeInfo = {
					color: wgt.colorPicker.getColor(),
					type: type
				};
			
			switch (type) {
				case hemi.shape.BOX:
				case hemi.shape.PYRAMID:
					shapeInfo.height = this.shapeHeight.getValue();
					shapeInfo.width= this.shapeWidth.getValue();
					shapeInfo.depth = this.shapeDepth.getValue();
					break;
				case hemi.shape.SPHERE:
					shapeInfo.radius= this.shapeRadius.getValue();
					break;
				case hemi.shape.CONE:
				case hemi.shape.CYLINDER:
					shapeInfo.radius= this.shapeRadius.getValue();
					shapeInfo.height = this.shapeHeight.getValue();
					break;
				case hemi.shape.ARROW:
					shapeInfo.size= this.shapeSize.getValue();
					shapeInfo.tail= this.shapeTail.getValue();
				case hemi.shape.CUBE:
				case hemi.shape.TETRA:
				case hemi.shape.OCTA:
					shapeInfo.size= this.shapeSize.getValue();
					break;
			}
			
			props.shapeInfo = shapeInfo;
			return props;
		},
		
		reset: function() {		
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
		},
		
		set: function(shape) {
			// set the type
			this.shapeType.val(shape.shapeType).change();
			
			// set the position
			var translation = hemi.core.math.matrix4.getTranslation(shape.transform.localMatrix);
			this.shapePosition.setValue({
				x: translation[0],
				y: translation[1],
				z: translation[2]
			});
			
			// set the dimension values
			for (var prop in shape.dim) {
				var val = shape.dim[prop];
				
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
			this.colorPicker.setColor(shape.color);
			
			// set the name
			this.shapeName.setValue(shape.name);
			
			// set the buttons
			this.checkToggleButtons();
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
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var shape = li.getAttachedObject();
				wgt.notifyListeners(shorthand.events.EditShape, shape);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var shape = li.getAttachedObject();
				wgt.notifyListeners(shorthand.events.RemoveShape, shape);
			});
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
     */
    var ShapesView = editor.ToolView.extend({
		init: function() {
	        this._super({
		        toolName: 'Shapes',
				toolTip: 'Create and edit primitive shapes',
				elemId: 'shapesBtn',
				id: 'shapes'
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
    var ShapesController = editor.ToolController.extend({
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
				lstWgt = view.sidePanel.shapeListWidget;
			
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
			lstWgt.addListener(shorthand.events.CreateShape, function() {
			});	
			lstWgt.addListener(shorthand.events.EditShape, function(shape) {				
				model.setShape(shape);
			});	
			lstWgt.addListener(shorthand.events.RemoveShape, function(shape) {
				model.removeShape(shape);
			});
			
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
			model.addListener(shorthand.events.ShapeSet, function(shape) {
				if (shape != null) {
					crtWgt.set(shape);
				}
			});
	    }
	});
})();
