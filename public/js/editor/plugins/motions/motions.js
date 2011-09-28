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
//								Initialization								  //
////////////////////////////////////////////////////////////////////////////////

	editor.tools.motions = editor.tools.motions || {};
	var mtnCtr = null;

	editor.tools.motions.init = function() {
		var navPane = editor.ui.getNavPane('Animation'),
			mtnMdl = new MotionsModel(),
			mtnView = new MotionsView();
		
		mtnCtr = new MotionsController();
		mtnCtr.setModel(mtnMdl);
		mtnCtr.setView(mtnView);
		
		navPane.add(mtnView);
		
		var model = editor.getModel('browser');
		
		if (model) {
			mtnCtr.setBrowserModel(model);
		}
		
		editor.addListener(editor.events.PluginLoaded, function(name) {
			if (name === 'browser' && !mtnCtr.bound) {
				mtnCtr.setBrowserModel(editor.getModel(name));
			}
		});
	};

////////////////////////////////////////////////////////////////////////////////
//								Tool Definition								  //
////////////////////////////////////////////////////////////////////////////////
    
    editor.EventTypes = editor.EventTypes || {};
	
	// view specific
	editor.EventTypes.RemoveMotion = "Motion.RemoveMotion";
	editor.EventTypes.SaveMotion = "Motion.SaveMotion";
	editor.EventTypes.SetMotion = "Motion.SetMotion";
	editor.EventTypes.StartPreview = "Motion.StartPreview";
	editor.EventTypes.StopPreview = "Motion.StopPreview";
	
	// model specific
	editor.EventTypes.MotionSet = "Motion.MotionSet";
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * A MotionsModel handles the creation, updating, and removal of Rotators
     * and Translators.
     */
    var MotionsModel = editor.ToolModel.extend({
		init: function() {
			this._super('motions');
			
			this.currentMotion = null;
			this.previewMotion = null;
			this.matrices = [];
	    },
		
		removeMotion: function(motion) {
			this.notifyListeners(editor.events.Removed, motion);
			motion.cleanup();
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
					if (props.origin.join() !== '0,0,0') {
						motion.setOrigin(props.origin);
					}
					if (props.angle.join() !== '0,0,0') {
						motion.setAngle(props.angle);
					}
				} else {
					motion = new hemi.motion.Translator();
					if (props.pos.join() !== '0,0,0') {
						motion.setPos(props.pos);
					}
				}
				
				motion.disable();
				event = editor.events.Created;
			} else {
				motion.clear();
				motion.clearTransforms();
				event = editor.events.Updated;
			}
			
			if (props.accel.join() !== '0,0,0') {
				motion.setAccel(props.accel);
			}
			if (props.vel.join() !== '0,0,0') {
				motion.setVel(props.vel);
			}
			
			for (var i = 0, il = props.transforms.length; i < il; i++) {
				motion.addTransform(props.transforms[i]);
			}
			
			motion.name = props.name;
			this.notifyListeners(event, motion);
			this.setMotion(null);
		},
		
		setMotion: function(motion) {
			this.stopPreview();
			this.currentMotion = motion;
			this.notifyListeners(editor.EventTypes.MotionSet, motion);
		},
		
		startPreview: function(props) {
			this.stopPreview();
			
			if (props.type === 'rot') {
				this.previewMotion = new hemi.motion.Rotator();
				if (props.origin.join() !== '0,0,0') {
					this.previewMotion.setOrigin(props.origin);
				}
				if (props.angle.join() !== '0,0,0') {
					this.previewMotion.setAngle(props.angle);
				}
			} else {
				this.previewMotion = new hemi.motion.Translator();
				if (props.pos.join() !== '0,0,0') {
					this.previewMotion.setPos(props.pos);
				}
			}

			if (props.accel.join() !== '0,0,0') {
				this.previewMotion.setAccel(props.accel);
			}
			if (props.vel.join() !== '0,0,0') {
				this.previewMotion.setVel(props.vel);
			}
			
			for (var i = 0, il = props.transforms.length; i < il; i++) {
				var tran = props.transforms[i];
				this.previewMotion.addTransform(tran);
				this.matrices.push(hemi.utils.clone(tran.localMatrix));
			}
			
			this.previewMotion.name = editor.ToolConstants.EDITOR_PREFIX + 'PreviewMotion';
			this.previewMotion.enable();
		},
		
		stopPreview: function() {
			if (this.previewMotion !== null) {
				var trans = this.previewMotion.getTransforms();
					
				for (var i = 0, il = trans.length; i < il; i++) {
					var tran = trans[i];
					
					if (!hemi.utils.isAnimated(tran)) {
						tran.localMatrix = this.matrices[i];
					}
				}
				
				this.previewMotion.cleanup();
				this.previewMotion = null;
				this.matrices = [];
			}
		},
			
		worldCleaned: function() {
			var rots = hemi.world.getRotators(),
				trans = hemi.world.getTranslators();
			
			for (var i = 0, il = rots.length; i < il; i++) {
				this.notifyListeners(editor.events.Removed, rots[i]);
			}
			for (var i = 0, il = trans.length; i < il; i++) {
				this.notifyListeners(editor.events.Removed, trans[i]);
			}
	    },
	    
	    worldLoaded: function() {
			var rots = hemi.world.getRotators(),
				trans = hemi.world.getTranslators();
			
			for (var i = 0, il = rots.length; i < il; i++) {
				this.notifyListeners(editor.events.Created, rots[i]);
			}
			for (var i = 0, il = trans.length; i < il; i++) {
				this.notifyListeners(editor.events.Created, trans[i]);
			}
	    }
	});

////////////////////////////////////////////////////////////////////////////////
//                     	   Create Motion Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
    var NO_TRANS = 'NONE_SELECTED';
    
	var CreateWidget = editor.ui.FormWidget.extend({
		init: function() {
		    this._super({
				name: 'createMtnWidget',
				uiFile: 'js/editor/plugins/motions/html/motionsForms.htm'
			});
			
			this.transforms = [];
			this.tranList = {};
		},
		
		addTransform: function(transform) {
			var ndx = this.transforms.indexOf(transform);
			
			if (ndx === -1) {
				var name = transform.name,
					li = this.tranList[name],
					ol = this.find('#mtnTranList');
				
				if (li == null) {
					this.tranList[name] = li = jQuery('<li><label>' + name + '</label></li>');
				}
				if (this.transforms.length === 0) {
					this.tranList[NO_TRANS].detach();
				}
				
				ol.append(li);
				this.transforms.push(transform);
				this.checkStatus();
			}
		},
		
		checkStatus: function() {
			var typeSelect = this.find('#mtnTypeSelect'),
				prevBtn = this.find('#mtnPrevBtn'),
				saveBtn = this.find('#mtnSaveBtn'),
				isSafe = this.transforms.length > 0 && typeSelect.val() !== '-1';
			
			if (isSafe) {
				prevBtn.removeAttr('disabled');
			} else {
				prevBtn.attr('disabled', 'disabled');
			}
			
			if (isSafe && this.nameInput.getValue() != null) {
				saveBtn.removeAttr('disabled');
			} else {
				saveBtn.attr('disabled', 'disabled');
			}
		},
		
		finishLayout: function() {
			this._super();
			
			var form = this.find('form'),
				typeSel = this.find('#mtnTypeSelect'),
				saveBtn = this.find('#mtnSaveBtn'),
				cancelBtn = this.find('#mtnCancelBtn'),
				prevBtn = this.find('#mtnPrevBtn'),
				ol = this.find('#mtnTranList'),
				validator = editor.ui.createDefaultValidator(),
				wgt = this;
			
			this.origin = new editor.ui.Vector({
				container: wgt.find('#mtnOriginDiv'),
				inputType: 'angle',
				validator: validator
			});
			this.angle = new editor.ui.Vector({
				container: wgt.find('#mtnAngleDiv'),
				inputType: 'angle',
				validator: validator
			});
			this.position = new editor.ui.Vector({
				container: wgt.find('#mtnPosDiv'),
				validator: validator
			});
			this.velocity = new editor.ui.Vector({
				container: wgt.find('#mtnVelDiv'),
				validator: validator
			});
			this.acceleration = new editor.ui.Vector({
				container: wgt.find('#mtnAccelDiv'),
				validator: validator
			});
			this.nameInput = new editor.ui.Input({
				container: wgt.find('#mtnName'),
				type: 'string'
			});
			
			this.tranList[NO_TRANS] = jQuery('<li><label>None selected</label></li>');
			ol.append(this.tranList[NO_TRANS]);
			
			// bind type selection
			typeSel.bind('change', function(evt) {
				var elem = jQuery(this),
					val = elem.val();
				
				wgt.reset();
				elem.val(val);
				
				// switch between shapes
				switch(val) {
					case 'rot':
						wgt.velocity.setInputType('angle');
						wgt.acceleration.setInputType('angle');
						
						wgt.origin.getUI().parent().show();
						wgt.angle.getUI().parent().show();
						wgt.velocity.getUI().parent().show();
						wgt.acceleration.getUI().parent().show();
						break;
					case 'trans':
						wgt.velocity.setInputType('number');
						wgt.acceleration.setInputType('number');
						
						wgt.position.getUI().parent().show();
						wgt.velocity.getUI().parent().show();
						wgt.acceleration.getUI().parent().show();
						break;
				}
				
				wgt.checkStatus();
				wgt.invalidate();
			})
			.change()
			.addClass('fixedWidth').sb({
				fixedWidth: true
			});
			
			this.nameInput.getUI().bind('keyup', function(evt) {
				wgt.checkStatus();
			});
			
			saveBtn.bind('click', function(evt) {
				var props = wgt.getProperties();
				wgt.reset();
				wgt.notifyListeners(editor.EventTypes.SaveMotion, props);
			})
			.attr('disabled', 'disabled');
			
			cancelBtn.bind('click', function(evt) {
				wgt.reset();
				wgt.notifyListeners(editor.EventTypes.SetMotion, null);
			});
			
			prevBtn.bind('click', function(evt) {
				var btn = jQuery(this);
				
				if (btn.data('previewing')) {
	            	wgt.notifyListeners(editor.EventTypes.StopPreview, null);
					btn.text('Start Preview').data('previewing', false);
				}
				else {
					var props = wgt.getProperties();
					wgt.notifyListeners(editor.EventTypes.StartPreview, props);
					btn.text('Stop Preview').data('previewing', true);
				}
	        }).data('previewing', false);
			
			form.submit(function(evt) {
				return false;
			});
		},
		
		getProperties: function() {
			var typeSel = this.find('#mtnTypeSelect'),
				name = this.nameInput.getValue(),
				props = {
					name: name,
					transforms: this.transforms,
					type: typeSel.val()
				};
			
			props.vel = this.velocity.getValue() || [0,0,0];
			props.accel = this.acceleration.getValue() || [0,0,0];
			
			switch(props.type) {
				case 'rot':
					props.origin = this.origin.getValue() || [0,0,0];
					props.angle = this.angle.getValue() || [0,0,0];
					break;
				case 'trans':
					props.pos = this.position.getValue() || [0,0,0];
					break;
			}
			
			return props;
		},
		
		removeTransform: function(transform) {
			var ndx = this.transforms.indexOf(transform);
			
			if (ndx !== -1) {
				this.tranList[transform.name].detach();
				
				if (this.transforms.length === 1) {
					var ol = this.find('#mtnTranList');
					ol.append(this.tranList[NO_TRANS]);
				}
				
				this.transforms.splice(ndx, 1);
				this.checkStatus();
			}
		},
		
		reset: function() {
			// reset selects
			this.find('form select').val(-1);
			
			// set all inputs to blank
			this.find('form input').val('');
			
			// reset the vectors and hide them
			this.origin.reset();
			this.origin.getUI().parent().hide();
			this.angle.reset();
			this.angle.getUI().parent().hide();
			this.position.reset();
			this.position.getUI().parent().hide();
			this.velocity.reset();
			this.velocity.getUI().parent().hide();
			this.acceleration.reset();
			this.acceleration.getUI().parent().hide();
						
			// disable the save and preview buttons
			this.find('#mtnSaveBtn').attr('disabled', 'disabled');
			this.find('#mtnPrevBtn').attr('disabled', 'disabled')
				.text('Start Preview')
				.data('previewing', false);
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
			var typeSel = this.find('#mtnTypeSelect');
			
			if (motion instanceof hemi.motion.Rotator) {
				typeSel.val('rot').change();
				
				if (motion.origin[0] !== 0 || motion.origin[1] !== 0 || motion.origin[2] !== 0) {
					this.origin.setValue({
						x: motion.origin[0],
						y: motion.origin[1],
						z: motion.origin[2]
					});
				}
				if (motion.angle[0] !== 0 || motion.angle[1] !== 0 || motion.angle[2] !== 0) {
					this.angle.setValue({
						x: motion.angle[0],
						y: motion.angle[1],
						z: motion.angle[2]
					});
				}
			} else if (motion instanceof hemi.motion.Translator) {
				typeSel.val('trans').change();
				
				if (motion.pos[0] !== 0 || motion.pos[1] !== 0 || motion.pos[2] !== 0) {
					this.position.setValue({
						x: motion.pos[0],
						y: motion.pos[1],
						z: motion.pos[2]
					});
				}
			}
			
			if (motion.vel[0] !== 0 || motion.vel[1] !== 0 || motion.vel[2] !== 0) {
				this.velocity.setValue({
					x: motion.vel[0],
					y: motion.vel[1],
					z: motion.vel[2]
				});
			}
			if (motion.accel[0] !== 0 || motion.accel[1] !== 0 || motion.accel[2] !== 0) {
				this.acceleration.setValue({
					x: motion.accel[0],
					y: motion.accel[1],
					z: motion.accel[2]
				});
			}
			
			this.nameInput.setValue(motion.name);
			this.checkStatus();
		}
	});

////////////////////////////////////////////////////////////////////////////////
//						Motion List Sidebar Widget							  //
////////////////////////////////////////////////////////////////////////////////    

	var ListWidget = editor.ui.ListWidget.extend({
		init: function() {
		    this._super({
				name: 'mtnListWidget',
				listId: 'motionList',
				prefix: 'mtnLst',
				title: 'Motions',
				instructions: "Add motions above."
			});
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var motion = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.SetMotion, motion);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var motion = li.getAttachedObject();
//				if (editor.depends.check(motion)) {
					wgt.notifyListeners(editor.EventTypes.RemoveMotion, motion);
//				}
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
     * The MotionsView controls the dialog and toolbar widget for the motions 
     * tool.
     */
    var MotionsView = editor.ToolView.extend({
		init: function() {
	        this._super({
	            toolName: 'Motions',
	    		toolTip: 'Create and edit moving transforms',
	    		elemId: 'motionsBtn',
	    		id: 'motions'
	        });
	        
	        this.addPanel(new editor.ui.Panel({
				name: 'sidePanel',
				classes: ['mtnSidePanel']
			}));
			
			this.sidePanel.addWidget(new CreateWidget());
			this.sidePanel.addWidget(new ListWidget());
	    }
	});

////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The MotionsController facilitates MotionsModel and MotionsView
     * communication by binding event and message handlers.
     */
    var MotionsController = editor.ToolController.extend({
		init: function() {
			this._super();
			this.bound = false;
			this.bwrModel = null;
		},
		
		setBrowserModel: function(model) {
			this.bwrModel = model;
			
			if (this.checkBindEvents()) {
				this.bindEvents();
			}
		},
		
		checkBindEvents: function() {
			return !this.bound && this.bwrModel && this.model && this.view;
		},
		
		bindEvents: function() {
			this._super();
			this.bound = true;
			
			var model = this.model,
				bwrModel = this.bwrModel,
				view = this.view,
				crtWgt = view.sidePanel.createMtnWidget,
				lstWgt = view.sidePanel.mtnListWidget;
			
			// create motion widget events
			crtWgt.addListener(editor.EventTypes.SaveMotion, function(props) {
				model.saveMotion(props);
			});
			crtWgt.addListener(editor.EventTypes.SetMotion, function(motion) {
				model.setMotion(motion);
			});
			crtWgt.addListener(editor.EventTypes.StartPreview, function(props) {
				bwrModel.enableSelection(false);
				model.startPreview(props);
			});
			crtWgt.addListener(editor.EventTypes.StopPreview, function(value) {
				bwrModel.enableSelection(true);
				model.stopPreview();
			});
			
			// motion list widget events
			lstWgt.addListener(editor.EventTypes.RemoveMotion, function(motion) {
				model.removeMotion(motion);
			});
			lstWgt.addListener(editor.EventTypes.SetMotion, function(motion) {
				model.setMotion(motion);
			});
			
			// view events
			view.addListener(editor.events.ToolModeSet, function(value) {
				var isDown = value.newMode === editor.ToolConstants.MODE_DOWN;
				bwrModel.enableSelection(isDown);
			});
			
			// model events
			model.addListener(editor.events.Created, function(motion) {
//				var trans = motion.getTransforms();
//				
//				for (var i = 0, il = trans.length; i < il; ++i) {
//					var id = trans[i].getParam('ownerId').value,
//						model = hemi.world.getCitizenById(id);
//					
//					editor.depends.add(motion, model);
//				}
				
				lstWgt.add(motion);
			});
			model.addListener(editor.events.Removed, function(motion) {
//				var trans = motion.getTransforms();
//				
//				for (var i = 0, il = trans.length; i < il; ++i) {
//					var id = trans[i].getParam('ownerId').value,
//						model = hemi.world.getCitizenById(id);
//					
//					editor.depends.remove(motion, model);
//				}
//				
//				editor.depends.clear(motion);
				lstWgt.remove(motion);
			});
			model.addListener(editor.EventTypes.MotionSet, function(motion) {
				bwrModel.deselectAll();
				bwrModel.enableSelection(true);
				
				if (motion != null) {
					crtWgt.setMotion(motion);
					var trans = motion.getTransforms();
					
					for (var i = 0, il = trans.length; i < il; i++) {
						bwrModel.selectTransform(trans[i]);
					}
				}
			});
			model.addListener(editor.events.Updated, function(motion) {
//				editor.depends.reset(motion);
//				var trans = motion.getTransforms();
//				
//				for (var i = 0, il = trans.length; i < il; ++i) {
//					var id = trans[i].getParam('ownerId').value,
//						model = hemi.world.getCitizenById(id);
//					
//					editor.depends.add(motion, model);
//				}
				
				lstWgt.update(motion);
			});
			
			// browser model events
			bwrModel.addListener(editor.EventTypes.TransformDeselected, function(transform) {
				crtWgt.removeTransform(transform);
			});
			bwrModel.addListener(editor.EventTypes.TransformSelected, function(transform) {
				crtWgt.addTransform(transform);
			});
		}
	});
    
})();