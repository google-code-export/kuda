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
	
	// view specific
	module.EventTypes.CreateMotion = "Motion.CreateMotion";
	module.EventTypes.RemoveMotion = "Motion.RemoveMotion";
	module.EventTypes.SaveMotion = "Motion.SaveMotion";
	module.EventTypes.SetMotion = "Motion.SetMotion";
	module.EventTypes.StartPreview = "Motion.StartPreview";
	module.EventTypes.StopPreview = "Motion.StopPreview";
	
	// model specific
	module.EventTypes.MotionCreated = "Motion.MotionCreated";
	module.EventTypes.MotionRemoved = "Motion.MotionRemoved";
	module.EventTypes.MotionUpdated = "Motion.MotionUpdated";
	module.EventTypes.MotionSet = "Motion.MotionSet";
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * A MotionsModel handles the creation, updating, and removal of Rotators
     * and Translators.
     */
    module.tools.MotionsModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
			
			this.currentMotion = null;
			this.previewMotion = null;
	    },
		
		removeMotion: function(motion) {
			motion.cleanup();
			this.notifyListeners(module.EventTypes.MotionRemoved, motion);
		},
		
		saveMotion: function(props) {
			var motion = this.currentMotion,
				currentType = null,
				event;
			
			if (motion instanceof hemi.motion.Rotator) {
				currentType = 'rot';
			} else if (motion instanceof hemi.motion.Translator) {
				currentType = 'trans';
			}
			
			if (currentType !== props.type) {
				if (motion !== null) {
					this.removeMotion(motion);
				}
				
				if (props.type === 'rot') {
					motion = new hemi.motion.Rotator();
				} else {
					motion = new hemi.motion.Translator();
				}
				
				event = module.EventTypes.MotionCreated;
			} else {
				motion.clear();
				event = module.EventTypes.MotionUpdated;
			}
			
			if (props.accel != null) {
				motion.setAccel(props.accel);
			}
			if (props.angle != null) {
				motion.setAngle(props.angle);
			}
			if (props.origin != null) {
				motion.setOrigin(props.origin);
			}
			if (props.pos != null) {
				motion.setPos(props.pos);
			}
			if (props.vel != null) {
				motion.setVel(props.vel);
			}
			
			motion.setTransform(props.transform);
			motion.name = props.name;
			this.notifyListeners(event, motion);
			this.setMotion(null);
		},
		
		setMotion: function(motion) {
			this.stopPreview();
			this.currentMotion = motion;
			this.notifyListeners(module.EventTypes.MotionSet, motion);
		},
		
		startPreview: function(props) {
			if (this.previewMotion !== null) {
				this.previewMotion.cleanup();
			}
			
			if (props.type === 'rot') {
				this.previewMotion = new hemi.motion.Rotator();
			} else {
				this.previewMotion = new hemi.motion.Translator();
			}
			
			if (props.accel != null) {
				this.previewMotion.setAccel(props.accel);
			}
			if (props.angle != null) {
				this.previewMotion.setAngle(props.angle);
			}
			if (props.origin != null) {
				this.previewMotion.setOrigin(props.origin);
			}
			if (props.pos != null) {
				this.previewMotion.setPos(props.pos);
			}
			if (props.vel != null) {
				this.previewMotion.setVel(props.vel);
			}
			
			this.previewMotion.setTransform(props.transform);
			this.previewMotion.name = module.tools.ToolConstants.EDITOR_PREFIX + 'PreviewMotion';
			this.previewMotion.enable();
		},
		
		stopPreview: function() {
			if (this.previewMotion !== null) {
				this.previewMotion.cleanup();
				this.previewMotion = null;
			}
		},
			
		worldCleaned: function() {
			var rots = hemi.world.getRotators(),
				trans = hemi.world.getTranslators();
			
			for (var i = 0, il = rots.length; i < il; i++) {
				this.notifyListeners(module.EventTypes.MotionRemoved, rots[i]);
			}
			for (var i = 0, il = trans.length; i < il; i++) {
				this.notifyListeners(module.EventTypes.MotionRemoved, trans[i]);
			}
	    },
	    
	    worldLoaded: function() {
			var rots = hemi.world.getRotators(),
				trans = hemi.world.getTranslators();
			
			for (var i = 0, il = rots.length; i < il; i++) {
				this.notifyListeners(module.EventTypes.MotionCreated, rots[i]);
			}
			for (var i = 0, il = trans.length; i < il; i++) {
				this.notifyListeners(module.EventTypes.MotionCreated, trans[i]);
			}
	    }
	});

////////////////////////////////////////////////////////////////////////////////
//                     	   Create Motion Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
		
	/*
	 * Configuration object for the CreateMtnSBWidget.
	 */
	module.tools.CreateMtnSBWidgetDefaults = {
		name: 'createMotionSBWidget',
		uiFile: 'editor/tools/html/motionsForms.htm',
		manualVisible: true
	};
	
	module.tools.CreateMtnSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.CreateMtnSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.previewing = false;
			this.transform = null;
		},
		
		checkStatus: function() {
			var list = this.inputsToCheck,
				nameInput = this.find('#mtnName'),
				typeSelect = this.find('#mtnTypeSelect'),
				prevStartBtn = this.find('#mtnPrevStartBtn'),
				prevStopBtn = this.find('#mtnPrevStopBtn'),
				saveBtn = this.find('#mtnSaveBtn'),
				isSafe = this.transform !== null && typeSelect.val() !== '-1';
			
			if (this.previewing) {
				prevStopBtn.removeAttr('disabled');
			} else {
				prevStopBtn.attr('disabled', 'disabled');
			}
			
			if (isSafe && !this.previewing) {
				prevStartBtn.removeAttr('disabled');
			} else {
				prevStartBtn.attr('disabled', 'disabled');
			}
			
			if (isSafe && nameInput.val() !== '') {
				saveBtn.removeAttr('disabled');
			} else {
				saveBtn.attr('disabled', 'disabled');
			}
		},
		
		finishLayout: function() {
			this._super();
			
			var form = this.find('form'),
				typeSel = this.find('#mtnTypeSelect'),
				originX = this.find('#mtnOriginX'),
				originY = this.find('#mtnOriginY'),
				originZ = this.find('#mtnOriginZ'),
				angleX = this.find('#mtnAngleX'),
				angleY = this.find('#mtnAngleY'),
				angleZ = this.find('#mtnAngleZ'),
				posX = this.find('#mtnPosX'),
				posY = this.find('#mtnPosY'),
				posZ = this.find('#mtnPosZ'),
				velX = this.find('#mtnVelX'),
				velY = this.find('#mtnVelY'),
				velZ = this.find('#mtnVelZ'),
				accelX = this.find('#mtnAccelX'),
				accelY = this.find('#mtnAccelY'),
				accelZ = this.find('#mtnAccelZ'),
				saveBtn = this.find('#mtnSaveBtn'),
				cancelBtn = this.find('#mtnCancelBtn'),
				nameInput = this.find('#mtnName'),
				prevStartBtn = this.find('#mtnPrevStartBtn'),
				prevStopBtn = this.find('#mtnPrevStopBtn'),
				wgt = this;
			
			// bind type selection
			typeSel.bind('change', function(evt) {
				var elem = jQuery(this),
					val = elem.val();
				
				wgt.reset();
				elem.val(val);
				
				// switch between shapes
				switch(val) {
					case 'rot':
						originX.parent().show();
						angleX.parent().show();
						velX.parent().show();
						accelX.parent().show();
						break;
					case 'trans':
						posX.parent().show();
						velX.parent().show();
						accelX.parent().show();
						break;
				}
				
				wgt.checkStatus();
				wgt.invalidate();
			}).change();
			
			nameInput.bind('keyup', function(evt) {
				wgt.checkStatus();
			});
			
			saveBtn.bind('click', function(evt) {
				var props = wgt.getProperties();
				wgt.reset();
				wgt.notifyListeners(module.EventTypes.SaveMotion, props);
			})
			.attr('disabled', 'disabled');
			
			cancelBtn.bind('click', function(evt) {
				wgt.reset();
				wgt.notifyListeners(module.EventTypes.SetMotion, null);
			});
			
			prevStartBtn.bind('click', function(evt) {
				wgt.previewing = true;
				wgt.checkStatus();
				var props = wgt.getProperties();
				wgt.notifyListeners(module.EventTypes.StartPreview, props);
			})
			.attr('disabled', 'disabled');
			
			prevStopBtn.bind('click', function(evt) {
				wgt.previewing = false;
				wgt.checkStatus();
				wgt.notifyListeners(module.EventTypes.StopPreview, null);
			})
			.attr('disabled', 'disabled');
			
			form.submit(function(evt) {
				return false;
			});
			
			this.setupAutoFills();
			
			var vectors = this.find('input.vector');
			for (var i = 0, il = vectors.length; i < il; i++) {
				var vector = vectors[i],
					id = vector.id;
				jQuery(vector).attr('ndx', id.charAt(id.length - 1).toLowerCase()).focus().blur();
			}
		},
		
		getProperties: function() {
			var typeSel = this.find('#mtnTypeSelect'),
				originX = this.find('#mtnOriginX'),
				originY = this.find('#mtnOriginY'),
				originZ = this.find('#mtnOriginZ'),
				angleX = this.find('#mtnAngleX'),
				angleY = this.find('#mtnAngleY'),
				angleZ = this.find('#mtnAngleZ'),
				posX = this.find('#mtnPosX'),
				posY = this.find('#mtnPosY'),
				posZ = this.find('#mtnPosZ'),
				velX = this.find('#mtnVelX'),
				velY = this.find('#mtnVelY'),
				velZ = this.find('#mtnVelZ'),
				accelX = this.find('#mtnAccelX'),
				accelY = this.find('#mtnAccelY'),
				accelZ = this.find('#mtnAccelZ'),
				nameInput = this.find('#mtnName'),
				props = {
					name: nameInput.val(),
					transform: this.transform,
					type: typeSel.val()
				},
				vel = [],
				accel = [],
				val;
			
			val = velX.val();
			vel[0] = val === 'x' ? 0 : parseFloat(val);
			val = velY.val();
			vel[1] = val === 'y' ? 0 : parseFloat(val);
			val = velZ.val();
			vel[2] = val === 'z' ? 0 : parseFloat(val);
			val = accelX.val();
			accel[0] = val === 'x' ? 0 : parseFloat(val);
			val = accelY.val();
			accel[1] = val === 'y' ? 0 : parseFloat(val);
			val = accelZ.val();
			accel[2] = val === 'z' ? 0 : parseFloat(val);
			
			props.vel = vel;
			props.accel = accel;
			
			switch(props.type) {
				case 'rot':
					var origin = [],
						angle = [];
					
					val = originX.val();
					origin[0] = val === 'x' ? 0 : parseFloat(val);
					val = originY.val();
					origin[1] = val === 'y' ? 0 : parseFloat(val);
					val = originZ.val();
					origin[2] = val === 'z' ? 0 : parseFloat(val);
					val = angleX.val();
					angle[0] = val === 'x' ? 0 : parseFloat(val);
					val = angleY.val();
					angle[1] = val === 'y' ? 0 : parseFloat(val);
					val = angleZ.val();
					angle[2] = val === 'z' ? 0 : parseFloat(val);
					
					props.origin = origin;
					props.angle = angle;
					break;
				case 'trans':
					var pos = [];
					
					val = posX.val();
					pos[0] = val === 'x' ? 0 : parseFloat(val);
					val = posY.val();
					pos[1] = val === 'y' ? 0 : parseFloat(val);
					val = posZ.val();
					pos[2] = val === 'z' ? 0 : parseFloat(val);
					
					props.pos = pos;
					break;
			}
			
			return props;
		},
		
		reset: function() {
			this.previewing = false;
			
			// reset selects
			this.find('form select').val(-1);
			
			// set all inputs to blank
			this.find('form input').val('');
			
			// reset the hints and hide the inputs
			this.find('input.vector').addClass('vectorHelper').focus().blur()
				.parent().hide();
						
			// disable the save and preview buttons
			this.find('#mtnSaveBtn').attr('disabled', 'disabled');
			this.find('#mtnPrevStartBtn').attr('disabled', 'disabled');
			this.find('#mtnPrevStopBtn').attr('disabled', 'disabled');
		},
		
		resize: function(maxHeight) {
			this._super(maxHeight);	
			
			var form = this.find('form'),
				padding = parseInt(form.css('paddingTop')) 
					+ parseInt(form.css('paddingBottom')),
				newHeight = maxHeight - padding,
				oldHeight = form.outerHeight(true);
			
			if (oldHeight > newHeight) {
				form.addClass('scrolling');
			}
			else {
				form.removeClass('scrolling');
			}
			if (newHeight > 0) {
				this.find('form').height(newHeight);
			}
		},
		
		setMotion: function(motion) {
			var typeSel = this.find('#mtnTypeSelect'),
				originX = this.find('#mtnOriginX'),
				originY = this.find('#mtnOriginY'),
				originZ = this.find('#mtnOriginZ'),
				angleX = this.find('#mtnAngleX'),
				angleY = this.find('#mtnAngleY'),
				angleZ = this.find('#mtnAngleZ'),
				posX = this.find('#mtnPosX'),
				posY = this.find('#mtnPosY'),
				posZ = this.find('#mtnPosZ'),
				velX = this.find('#mtnVelX'),
				velY = this.find('#mtnVelY'),
				velZ = this.find('#mtnVelZ'),
				accelX = this.find('#mtnAccelX'),
				accelY = this.find('#mtnAccelY'),
				accelZ = this.find('#mtnAccelZ'),
				nameInput = this.find('#mtnName');
			
			if (motion instanceof hemi.motion.Rotator) {
				typeSel.val('rot').change();
				
				if (motion.origin[0] !== 0 || motion.origin[1] !== 0 || motion.origin[2] !== 0) {
					originX.val(motion.origin[0]).keydown();
					originY.val(motion.origin[1]).keydown();
					originZ.val(motion.origin[2]).keydown();
				}
				if (motion.angle[0] !== 0 || motion.angle[1] !== 0 || motion.angle[2] !== 0) {
					angleX.val(motion.angle[0]).keydown();
					angleY.val(motion.angle[1]).keydown();
					angleZ.val(motion.angle[2]).keydown();
				}
			} else if (motion instanceof hemi.motion.Translator) {
				typeSel.val('trans').change();
				
				if (motion.pos[0] !== 0 || motion.pos[1] !== 0 || motion.pos[2] !== 0) {
					posX.val(motion.pos[0]).keydown();
					posY.val(motion.pos[1]).keydown();
					posZ.val(motion.pos[2]).keydown();
				}
			}
			
			if (motion.vel[0] !== 0 || motion.vel[1] !== 0 || motion.vel[2] !== 0) {
				velX.val(motion.vel[0]).keydown();
				velY.val(motion.vel[1]).keydown();
				velZ.val(motion.vel[2]).keydown();
			}
			if (motion.accel[0] !== 0 || motion.accel[1] !== 0 || motion.accel[2] !== 0) {
				accelX.val(motion.accel[0]).keydown();
				accelY.val(motion.accel[1]).keydown();
				accelZ.val(motion.accel[2]).keydown();
			}
			nameInput.val(motion.name).keyup();
		},
		
		setTransform: function(transform) {
			this.transform = transform;
			this.checkStatus();
		},
	
		setupAutoFills: function() {
			var vectors = this.find('input.vector'),
				wgt = this;
						
			// setup autofills for vectors
			vectors.bind('keydown', function(evt) {
				var elem = jQuery(this);
				elem.removeClass('vectorHelper');
			})
			.bind('blur', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					ndx = elem.attr('ndx');
				
				if (val === '' && ndx != null) {
					elem.val(ndx).addClass('vectorHelper');
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
		}
	});

////////////////////////////////////////////////////////////////////////////////
//                             MtnListSBWidget                                //
////////////////////////////////////////////////////////////////////////////////    

	/*
	 * Configuration object for the MtnListSBWidget.
	 */
	module.tools.MtnListSBWidgetDefaults = {
		name: 'mtnListSBWidget',
		listId: 'motionList',
		prefix: 'mtnLst',
		title: 'Motions',
		instructions: "Click 'Create Motion' to create a new moving transform."
	};
	
	module.tools.MtnListSBWidget = module.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.MtnListSBWidgetDefaults, options);
		    this._super(newOpts);
		},
		
		layoutExtra: function() {
			this.buttonDiv = jQuery('<div class="buttons"></div>');
			this.createBtn = jQuery('<button id="createMotion">Create Motion</button>');
			var wgt = this;
						
			this.createBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.CreateMotion, null);
			});
			
			this.buttonDiv.append(this.createBtn);
			
			return this.buttonDiv;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var motion = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.SetMotion, motion);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var motion = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.RemoveMotion, motion);
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
     * Configuration object for the MotionsView.
     */
    module.tools.MotionsViewDefaults = {
        toolName: 'Motions',
		toolTip: 'Motions: Create and edit moving transforms',
		widgetId: 'motionsBtn',
		axnBarId: 'mtnActionBar'
    };
    
    /**
     * The MotionsView controls the dialog and toolbar widget for the motions 
     * tool.
     * 
     * @param {Object} options configuration options.  Uses 
     *         editor.tools.MotionsViewDefaults as default options
     */
    module.tools.MotionsView = module.tools.ToolView.extend({
		init: function(options) {
	        var newOpts = jQuery.extend({}, module.tools.MotionsViewDefaults, options);
	        this._super(newOpts);
			
			this.addSidebarWidget(new module.tools.CreateMtnSBWidget());
			this.addSidebarWidget(new module.tools.MtnListSBWidget());
	    }
	});

////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The MotionsController facilitates MotionsModel and MotionsView
     * communication by binding event and message handlers.
     */
    module.tools.MotionsController = module.tools.ToolController.extend({
		init: function() {
			this._super();
		},
		
		setSelectorModel: function(model) {
			this.selModel = model;
			
			if (this.checkBindEvents()) {
				this.bindEvents();
			}
		},
		
		checkBindEvents: function() {
			return this.selModel && this.model && this.view;
		},
		
		bindEvents: function() {
			this._super();
			
			var model = this.model,
				selModel = this.selModel,
				view = this.view,
				crtWgt = view.createMotionSBWidget,
				mtnWgt = view.mtnListSBWidget;
			
			// view events
			crtWgt.addListener(module.EventTypes.SaveMotion, function(props) {
				model.saveMotion(props);
			});
			
			crtWgt.addListener(module.EventTypes.SetMotion, function(motion) {
				model.setMotion(motion);
			});
			
			crtWgt.addListener(module.EventTypes.StartPreview, function(props) {
				selModel.enableSelection(false);
				model.startPreview(props);
			});
			
			crtWgt.addListener(module.EventTypes.StopPreview, function(value) {
				selModel.enableSelection(true);
				model.stopPreview();
			});
			
			mtnWgt.addListener(module.EventTypes.CreateMotion, function(value) {
				crtWgt.setVisible(true);
				mtnWgt.setVisible(false);
			});
			
			mtnWgt.addListener(module.EventTypes.RemoveMotion, function(motion) {
				model.removeMotion(motion);
			});
			
			mtnWgt.addListener(module.EventTypes.SetMotion, function(motion) {
				model.setMotion(motion);
			});
			
			view.addListener(module.EventTypes.ToolModeSet, function(value) {
				var isDown = value == module.tools.ToolConstants.MODE_DOWN;
				selModel.enableSelection(isDown);
			});
			
			// model events
			model.addListener(module.EventTypes.MotionCreated, function(motion) {
				mtnWgt.add(motion);
			});
			
			model.addListener(module.EventTypes.MotionRemoved, function(motion) {
				mtnWgt.remove(motion);
			});
			
			model.addListener(module.EventTypes.MotionSet, function(motion) {
				selModel.deselectAll();
				selModel.enableSelection(true);
				
				if (motion === null) {
					crtWgt.setVisible(false);
					mtnWgt.setVisible(true);
				} else {
					crtWgt.setMotion(motion);
					crtWgt.setVisible(true);
					mtnWgt.setVisible(false);
					var tran = motion.getTransform();
					tran = hemi.core.getTransformParent(tran);
					selModel.selectTransform(tran);
				}
			});
			
			model.addListener(module.EventTypes.MotionUpdated, function(motion) {
				mtnWgt.update(motion);
			});
			
			selModel.addListener(module.EventTypes.TransformDeselected, function(transform) {
				if (crtWgt.transform === transform) {
					crtWgt.setTransform(null);
					mtnWgt.createBtn.attr('disabled', 'disabled');
				}
			});
			
			selModel.addListener(module.EventTypes.TransformSelected, function(transform) {
				crtWgt.setTransform(transform);
				mtnWgt.createBtn.removeAttr('disabled');
			});
		}
	});
    
    return module;
})(editor || {});