var editor = (function(module) {
    module.tools = module.tools || {};
    
    module.EventTypes = module.EventTypes || {};
	
	// view specific
	
	// create sidebar widget specific
	module.EventTypes.SetShapeParam = "Shapes.SetShapeParam";
	module.EventTypes.RemoveShapeParam = "Shapes.RemoveShapeParam";
    module.EventTypes.PreviewShape = "Shapes.PreviewShape";
    module.EventTypes.SaveShape = "Shapes.SaveShape";
    module.EventTypes.CancelCreateShape = "Shapes.CancelCreateShape";
	
	// list sidebar widget specific
    module.EventTypes.CreateShape = "Shapes.CreateShape";
    module.EventTypes.EditShape = "Shapes.EditShape";
    module.EventTypes.RemoveShape = "Shapes.RemoveShape";
	
	// model specific
    module.EventTypes.ShapeCreated = "Shapes.ShapeCreated";
    module.EventTypes.ShapeRemoved = "Shapes.ShapeRemoved";
    module.EventTypes.ShapeUpdated = "Shapes.ShapeUpdated";
    module.EventTypes.ShapeSet = "Shapes.ShapeSet";
	module.EventTypes.ShapeWorldCleaned = "Shapes.ShapeWorldCleaned";
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * An ShapesModel handles the creation, updating, and removal of 
     * shapes
     */
    module.tools.ShapesModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
			
			this.currentShape = null;
			this.previousShape = null;
			this.shapeParams = {};
			this.isUpdating = false;
	    },
			
		worldCleaned: function() {
			this.notifyListeners(module.EventTypes.ShapeWorldCleaned, null);
	    },
	    
	    worldLoaded: function() {
			var shapes = hemi.world.getShapes();
			
			for (var ndx = 0, len = shapes.length; ndx < len; ndx++) {
				this.notifyListeners(module.EventTypes.ShapeCreated, shapes[ndx]);
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
			this.currentShape = shape;
			this.isUpdating = true;
			
			// set the params
			this.shapeParams = jQuery.extend({
					type: shape.shapeType,
					color: shape.color
				},
				shape.dim);
			
			this.notifyListeners(module.EventTypes.ShapeSet, shape);
		},
		
		previewShape: function() {
			if (this.isUpdating && this.previousShape === null) {
				this.previousShape = this.currentShape;
				this.previousShape.transform.visible = false;
			}
			this.createShape();
		},
		
		createShape: function() {
			if (this.currentShape) {
				var oldId = this.currentShape.getId();
				if (this.previousShape !== this.currentShape) {
					this.currentShape.cleanup();
				}
				this.currentShape = new hemi.shape.Shape(this.shapeParams);
				if (this.previousShape === null) {
					this.currentShape.setId(oldId);
				}
			}
			else {
				this.currentShape = new hemi.shape.Shape(this.shapeParams);
			}
			
			if (this.shapeParams.position) {
				var pos = this.shapeParams.position;
				this.currentShape.translate(pos[0], pos[1], pos[2]);
			}
		},
		
		removeShape: function(shape) {
			this.notifyListeners(module.EventTypes.ShapeRemoved, shape);
			shape.cleanup();
		},
		
		cancelUpdate: function() {
			// TODO: need to figure out how changes to other aspects of the 
			// editor should be handled.  i.e.: modal?
			if (this.previousShape !== null) {
				this.previousShape.transform.visible = true;
				this.removeShape(this.currentShape);
			}
			this.previousShape = null;
			this.currentShape = null;
			this.shapeParams = {};
			this.isUpdating = false;
		},
		
		saveShape: function(name) {
			this.createShape();
			
			if (this.previousShape !== null) {
				var oldId = this.previousShape.getId();
				this.previousShape.cleanup();
				this.previousShape = null;
				this.currentShape.setId(oldId);
			}
			
			var trans = this.currentShape.getTransform(),
				primitive = trans.shapes[0],
				msgType = this.isUpdating ? module.EventTypes.ShapeUpdated 
					: module.EventTypes.ShapeCreated;
				
			this.currentShape.setName(name);
				
			this.notifyListeners(msgType, this.currentShape);
			
			this.currentShape = null;
			this.shapeParams = {};
			this.isUpdating = false;
		}
	});
   	
////////////////////////////////////////////////////////////////////////////////
//                     	   Create Shape Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
		
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.CreateShpSBWidgetDefaults = {
		name: 'createShapeSBWidget',
		uiFile: 'editor/tools/html/shapesForms.htm',
        instructions: 'Click on a model to select it',
		manualVisible: true
	};
	
	module.tools.CreatShpSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.CreateShpSBWidgetDefaults, options);
		    this._super(newOpts);
				
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
				wgt = this;
			
			this.colorPicker = new module.ui.ColorPicker({
				inputId: 'shpColor',
				container: wgt.find('#shpColorDiv'),
				buttonId: 'shpColorPicker'
			});
				
			// hide optional inputs
			optionalInputs.parent().hide();
			
			this.setupAutoFills(this.find('input.vector'));
			
			// add validation
			new module.ui.Validator(inputs, function(elem) {
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
					wgt.notifyListeners(module.EventTypes.SetShapeParam, {
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
				
				wgt.notifyListeners(module.EventTypes.SetShapeParam, {
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
				
				wgt.notifyListeners(module.EventTypes.SaveShape, name);
			})
			.attr('disabled', 'disabled');
			
			cancelBtn.bind('click', function(evt) {
				wgt.setVisible(false);
				wgt.reset();
				wgt.notifyListeners(module.EventTypes.CancelCreateShape, null);
				wgt.find('input.error').removeClass('error');
			});
			
			previewBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.PreviewShape, null);
			})
			.attr('disabled', 'disabled');
			
			form.submit(function(evt) {
				return false;
			});
			
			this.colorPicker.addListener(module.EventTypes.ColorPicked, function(clr) {
				wgt.notifyListeners(module.EventTypes.SetShapeParam, {
					paramName: 'color',
					paramValue: clr
				});
				
				wgt.checkToggleButtons();
			});
		},
		
		canSave: function() {
			var list = this.inputsToCheck,
				isSafe = true;
			
			for (var ndx = 0, len = list.length; ndx < len; ndx++) {
				isSafe = isSafe && list[ndx].val() !== '';
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
			this.find('input.xNdx').val('x').addClass('vectorHelper');
			this.find('input.yNdx').val('y').addClass('vectorHelper');
			this.find('input.zNdx').val('z').addClass('vectorHelper');
		
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
			this.find('#shpPositionX').val(translation[0]).removeClass('vectorHelper');
			this.find('#shpPositionY').val(translation[1]).removeClass('vectorHelper');
			this.find('#shpPositionZ').val(translation[2]).removeClass('vectorHelper');
			
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
			
			this.notifyListeners(module.EventTypes.SetShapeParam, {
				paramName: 'position',
				paramValue: translation
			});
		},
	
		setupAutoFills: function(vectors) {
			var wgt = this,
				vectors = this.find('input.vector');
			
			this.find('input.xNdx').val('x');
			this.find('input.yNdx').val('y');
			this.find('input.zNdx').val('z');
			
			// add validation
			new module.ui.Validator(vectors, function(elem) {
				var val = elem.val(),
					msg = null;
					
				if (val !== '' && !hemi.utils.isNumeric(val)) {
					msg = 'must be a number';
				}
				
				return msg;
			});
						
			// setup autofills for vectors
			vectors.bind('keydown', function(evt) {
				var elem = jQuery(this);
				elem.removeClass('vectorHelper');
			})
			.bind('blur', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					cls = elem.attr('class'),
					param = elem.attr('id'),
					totalVal = null,
					type = cls.match(/xNdx|yNdx|zNdx/),
					paramName;
				
				param = param.substring(0, param.length-1);
				paramName = param.replace('shp', '').toLowerCase();
				
				if (val === '') {
					elem.val(type[0].replace('Ndx', '')).addClass('vectorHelper');
					wgt.notifyListeners(module.EventTypes.RemoveShapeParam, paramName);
				}
				else if (hemi.utils.isNumeric(val)) {
					var x = parseFloat(jQuery('#' + param + 'X').val()),
						y = parseFloat(jQuery('#' + param + 'Y').val()),
						z = parseFloat(jQuery('#' + param + 'Z').val());
					
					if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
						totalVal = [x, y, z];
					}
					
					if (totalVal) {
						wgt.notifyListeners(module.EventTypes.SetShapeParam, {
							paramName: paramName,
							paramValue: totalVal
						});
					}
				}
				
				wgt.checkToggleButtons();
			})
			.bind('focus', function(evt) {
				var elem = jQuery(this),
					val = elem.val();
				if (val === 'x' || val === 'y' || val === 'z') {
					elem.val('');
				}
			})
			.addClass('vectorHelper');
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	 	Shapes List Sidebar Widget                        //
////////////////////////////////////////////////////////////////////////////////     
	
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.ShpListSBWidgetDefaults = {
		name: 'shapeListSBWidget',
		listId: 'shapeList',
		prefix: 'shpLst',
		title: 'Shapes',
		instructions: "Click 'Create Shape' to create a new shape."
	};
	
	module.tools.ShpListSBWidget = module.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.ShpListSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.items = new Hashtable();		
		},
		
		layoutExtra: function() {
			this.buttonDiv = jQuery('<div class="buttons"></div>');
			this.createBtn = jQuery('<button id="createShape">Create Shape</button>');
			var wgt = this;
						
			this.createBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.CreateShape, null);
			});
			
			this.buttonDiv.append(this.createBtn);
			
			return this.buttonDiv;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var shape = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.EditShape, shape);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var shape = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.RemoveShape, shape);
			});
		},
		
		getOtherHeights: function() {
			return this.buttonDiv.outerHeight(true);
		}
	});
         
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    

    /*
     * Configuration object for the ShapesView.
     */
    module.tools.ShapesViewDefaults = {
        toolName: 'Shapes',
		toolTip: 'Shapes: Create and edit shapes',
		widgetId: 'shapesBtn',
		axnBarId: 'shpActionBar'
    };
    
    /**
     * The ShapesView controls the dialog and toolbar widget for the 
     * animation tool.
     * 
     * @param {Object} options configuration options.  Uses 
     *         editor.tools.ShapesViewDefaults as default options
     */
    module.tools.ShapesView = module.tools.ToolView.extend({
		init: function(options) {
	        var newOpts = jQuery.extend({}, module.tools.ShapesViewDefaults, options);
	        this._super(newOpts);
			
			this.addSidebarWidget(new module.tools.CreatShpSBWidget());
			this.addSidebarWidget(new module.tools.ShpListSBWidget());
	    }
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The ShapesController facilitates ShapesModel and ShapesView
     * communication by binding event and message handlers.
     */
    module.tools.ShapesController = module.tools.ToolController.extend({
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
				crtWgt = view.createShapeSBWidget,
				lstWgt = view.shapeListSBWidget,
	        	that = this;
	                	        
			// special listener for when the toolbar button is clicked
	        view.addListener(module.EventTypes.ToolModeSet, function(value) {
	            var isDown = value === module.tools.ToolConstants.MODE_DOWN;
	        });
			
			// create sidebar widget listeners
			crtWgt.addListener(module.EventTypes.SaveShape, function(name) {
				crtWgt.setVisible(false);
				lstWgt.setVisible(true);
				
				model.saveShape(name);
				crtWgt.reset();
			});		
			crtWgt.addListener(module.EventTypes.PreviewShape, function() {
				model.previewShape();
			});
			crtWgt.addListener(module.EventTypes.SetShapeParam, function(paramObj) {
				model.setParam(paramObj.paramName, paramObj.paramValue);
			});	
			crtWgt.addListener(module.EventTypes.CancelCreateShape, function() {
				model.cancelUpdate();
				lstWgt.setVisible(true);
			});	
			
			// list sidebar widget listeners
			lstWgt.addListener(module.EventTypes.CreateShape, function() {
				crtWgt.setVisible(true);
				lstWgt.setVisible(false);
			});	
			lstWgt.addListener(module.EventTypes.EditShape, function(shape) {
				crtWgt.setVisible(true);
				lstWgt.setVisible(false);
				
				model.setShape(shape);
			});	
			lstWgt.addListener(module.EventTypes.RemoveShape, function(shape) {
				model.removeShape(shape);
			});
			
			// view specific listeners
			
			// model specific listeners
			model.addListener(module.EventTypes.ShapeCreated, function(shape) {
				lstWgt.add(shape);
			});		
			model.addListener(module.EventTypes.ShapeUpdated, function(shape) {
				lstWgt.update(shape);
			});		
			model.addListener(module.EventTypes.ShapeRemoved, function(shape) {
				lstWgt.remove(shape);
			});
			model.addListener(module.EventTypes.ShapeSet, function(shape) {
				crtWgt.set(shape);
			});
			model.addListener(module.EventTypes.ShapeWorldCleaned, function() {
				lstWgt.list.clear();
			});
	    }
	});
    
    return module;
})(editor || {});