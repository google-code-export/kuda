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

	editor.tools.particleEffects = editor.tools.particleEffects || {};

	editor.tools.particleEffects.init = function() {
		var navPane = editor.ui.getNavPane('Effects'),
			
			pteMdl = new ParticleFxModel(),
			pteView = new ParticleFxView(),
			pteCtr = new ParticleFxController();

		pteCtr.setModel(pteMdl);
		pteCtr.setView(pteView);

		navPane.add(pteView);
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     			  Tool Definition  		                      //
////////////////////////////////////////////////////////////////////////////////
	
    editor.EventTypes = editor.EventTypes || {};
	
	// create fx sidebar widget specific
    editor.EventTypes.SaveParticleFx = "particleFx.SaveParticleFx";
    editor.EventTypes.StartParticleFxPreview = "particleFx.StartParticleFxPreview";
    editor.EventTypes.StopParticleFxPreview = "particleFx.StopParticleFxPreview";
	editor.EventTypes.TemplateSelected = "particleFx.TemplateSelected";
	
	// list sidebar widget specific
    editor.EventTypes.EditParticleFx = "particleFx.EditParticleFx";
    editor.EventTypes.RemoveParticleFx = "particleFx.RemoveParticleFx";	
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * A ParticleFxModel ...
     */
    var ParticleFxModel = editor.ToolModel.extend({
		init: function() {
			this._super('particleEffects');
			this.currentParticleEffect = null;
			this.isUpdating = false;
	    },
		
		cancelParticleFxEdit: function() {
			this.stopPreview();
				
			if (!this.isUpdating && this.currentParticleEffect) {
				this.currentParticleEffect.cleanup();
			}
			
			this.currentParticleEffect = null;
			this.isUpdating = false;
		},
		
		create: function(props) {
			var oldId = null;
				
			if (this.currentParticleEffect) {
				this.stopPreview();
				oldId = this.currentParticleEffect.getId();
				this.currentParticleEffect.cleanup();
			}
			
			switch (props.type) {
				case 'Burst':
					this.currentParticleEffect = hemi.effect.createBurst(props.state, props.colorRamp, props.params);
					break;
				case 'Trail':
					this.currentParticleEffect = hemi.effect.createTrail(props.state, props.colorRamp, props.params, props.fireInterval);
					break;
				case 'Emitter':
					this.currentParticleEffect = hemi.effect.createEmitter(props.state, props.colorRamp, props.params);
					break;
			}
			
			if (oldId) {
				this.currentParticleEffect.setId(oldId);
			}
		},
		
		preview: function(props) {
			this.create(props);
			this.currentParticleEffect.particles = null;
			
			switch(this.currentParticleEffect.citizenType) {
				case 'hemi.effect.Burst':
					this.currentParticleEffect.trigger();
					break;
				case 'hemi.effect.Trail':
					this.currentParticleEffect.start();
					break;
				case 'hemi.effect.Emitter':
					this.currentParticleEffect.show();
					break;
			}
		},
		
		removeEffect: function(effect) {
			effect.cleanup();
			this.notifyListeners(editor.events.Removed, effect);
		},
		
		save: function(props) {
			this.create(props);
			
			var msgType = this.isUpdating ? editor.events.Updated 
				: editor.events.Created;
										
			this.currentParticleEffect.name = props.name;
			this.currentParticleEffect.particles = null;
				
			this.notifyListeners(msgType, this.currentParticleEffect);
			
			this.currentParticleEffect = null;
			this.isUpdating = false;	
		},
		
		saveTemplate: function(name) {
			
		},
		
		setEffect: function(effect) {
			this.currentParticleEffect = effect;
			this.isUpdating = true;
		},
		
		setTemplate: function(tpl) {
			if (this.isUpdating) {
				this.create(tpl);
			}
		},
		
		stopPreview: function() {
			if (this.currentParticleEffect) {
				switch(this.currentParticleEffect.citizenType) {
					case 'hemi.effect.Trail':
						this.currentParticleEffect.stop();
						break;
					case 'hemi.effect.Emitter':
						this.currentParticleEffect.hide();
						break;
				}
			}
		},
		
	    worldLoaded: function() {
			var effects = hemi.world.getEffects();
			
			for (var ndx = 0, len = effects.length; ndx < len; ndx++) {
				this.notifyListeners(editor.events.Created, effects[ndx]);
			}
	    },
	    
	    worldCleaned: function() {
	    	var effects = hemi.world.getEffects();
			
			for (var ndx = 0, len = effects.length; ndx < len; ndx++) {
				this.notifyListeners(editor.events.Removed, effects[ndx]);
			}
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                    Particle Effects Edit Sidebar Widget                    //
////////////////////////////////////////////////////////////////////////////////     
	
	var CreateWidget = editor.ui.FormWidget.extend({
		init: function() {
			this.colorPickers = [];
			
		    this._super({
				name: 'createPteWidget',
				uiFile: 'js/editor/plugins/particleEffects/html/particleFxForms.htm'
			});	
		},
		
		addColorInput: function() {
			var colorAdder = this.find('#pteAddColorToRamp'),
				wrapper = this.find('#pteColorRampWrapper'),
				ndx = colorAdder.data('ndx'),
				wgt = this,
				colorPicker;
			
			if (this.colorPickers.length <= ndx) {
				colorPicker = new editor.ui.ColorPicker({
					inputId: 'pte-colorRamp' + ndx,
					containerClass: 'colorRampAdd',
					buttonId: 'pteColorRamp' + ndx + 'Picker'
				});			
				
				colorPicker.addListener(editor.events.ColorPicked, function(clr) {
					wgt.canSave();
				});
			
				this.colorPickers.push(colorPicker);
			}
			else {
				colorPicker = this.colorPickers[ndx];
			}
			
			wrapper.before(colorPicker.getUI());
			colorAdder.data('ndx', ndx+1);
		},
		
		canSave: function() {
			var colorRampInput = this.find('#pteColorRamp0'),
				saveBtn = this.find('#pteSaveBtn'),
				previewBtn = this.find('#ptePreviewBtn'),
				typeVal = this.typeSelect.val(),
				stateVal = this.stateSelect.val(),
				clrRmpVal = colorRampInput.val(),
				nameVal = this.name.getValue(),
				fireInterval = this.fireInterval.getValue(),
				type = typeVal.replace('hemi.effect.', '');
			
			if (stateVal !== '-1' && clrRmpVal !== 'r' && typeVal !== '-1' && (type !== 'Trail' || fireInterval != null)) {
				previewBtn.removeAttr('disabled');
				
				if (nameVal != null) {
					saveBtn.removeAttr('disabled');
				} else {
					saveBtn.attr('disabled', 'disabled');
				}
			} else {
				previewBtn.attr('disabled', 'disabled');
				saveBtn.attr('disabled', 'disabled');
			}
		},
		
		edit: function(effect) {
			this.reset();
			
			if (effect) {
				var params = effect.params, 
					type = effect.type ? effect.type 
						: effect.citizenType.replace('hemi.effect.', ''), 
					colorRamp = effect.colorRamp, 
					state = effect.state, 
					fireInt = effect.fireInterval, 
					numColors = colorRamp.length / 4;
				
				this.tplSelect.val(-1);
				this.typeSelect.val(type).change();
				this.stateSelect.val(state);
				this.name.setValue(effect.name);
				
				for (var paramName in params) {
					var val = params[paramName];
					
					if (paramName.match('colorMult')) {
						this.colorMult.setColor(val);
					}
					else {
						this[paramName].setValue(val);
					}
				}
				
				if (fireInt) {
					this.fireInterval.setValue(fireInt);
				}
				
				var count = 1;
				while (count++ < numColors) {
					this.addColorInput();
				}
				
				for (var ndx = 0; ndx < numColors; ndx++) {
					var rampNdx = ndx * 4, 
						r = colorRamp[rampNdx], 
						g = colorRamp[rampNdx + 1], 
						b = colorRamp[rampNdx + 2], 
						a = colorRamp[rampNdx + 3];
					
					var picker = this.colorPickers[ndx];
					picker.setColor([r, g, b, a]);
				}
				
				this.canSave();
			}
		},
		
		finishLayout: function() {
			this._super();
			
			var saveBtn = this.find('#pteSaveBtn'),
				cancelBtn = this.find('#pteCancelBtn'),
				previewBtn = this.find('#ptePreviewBtn'),
				inputs = this.find('input:not(.vector, .color, .quat, #pteName, #pteFireInterval)'),
				form = this.find('form'),
				wgt = this,
				validator = new editor.ui.createDefaultValidator(),
				onBlurFcn = function(ipt, evt) {
					wgt.canSave();
				};
			
			this.stateSelect = this.find('#pteState');
			this.tplSelect = this.find('#pteTemplateSelect');
        	this.typeSelect = this.find('#pteType');
			this.loadTemplates();
			
			this.numParticles = new editor.ui.Input({
				container: wgt.find('#pte-numParticles')
			});
			this.timeRange = new editor.ui.Input({
				container: wgt.find('#pte-timeRange')
			});
			this.lifeTime = new editor.ui.Input({
				container: wgt.find('#pte-lifeTime')
			});
			this.lifeTimeRange = new editor.ui.Input({
				container: wgt.find('#pte-lifeTimeRange')
			});
			this.startTime = new editor.ui.Input({
				container: wgt.find('#pte-startTime')
			});
			this.fireInterval = new editor.ui.Input({
				container: wgt.find('#ptefireInterval')
			});
			this.billboard = new editor.ui.Input({
				container: wgt.find('#pte-billboard'),
				type: 'boolean'
			});
			this.startSize = new editor.ui.Input({
				container: wgt.find('#pte-startSize')
			});
			this.startSizeRange = new editor.ui.Input({
				container: wgt.find('#pte-startSizeRange')
			});
			this.endSize = new editor.ui.Input({
				container: wgt.find('#pte-endSize')
			});
			this.endSizeRange = new editor.ui.Input({
				container: wgt.find('#pte-endSizeRange')
			});
			this.spinSpeed = new editor.ui.Input({
				container: wgt.find('#pte-spinSpeed')
			});
			this.spinSpeedRange = new editor.ui.Input({
				container: wgt.find('#pte-spinSpeedRange')
			});
			this.spinStart = new editor.ui.Input({
				container: wgt.find('#pte-spinStart')
			});
			this.spinStartRange = new editor.ui.Input({
				container: wgt.find('#pte-spinStartRange')
			});
			this.numFrames = new editor.ui.Input({
				container: wgt.find('#pte-numFrames')
			});
			this.frameStart = new editor.ui.Input({
				container: wgt.find('#pte-frameStart')
			});
			this.frameStartRange = new editor.ui.Input({
				container: wgt.find('#pte-frameStartRange')
			});
			this.frameDuration = new editor.ui.Input({
				container: wgt.find('#pte-frameDuration')
			});
			this.name = new editor.ui.Input({
				container: wgt.find('#pteName'),
				type: 'string'
			});
			
			this.position = new editor.ui.Vector({
				container: wgt.find('#pte-positionDiv'),
				onBlur: onBlurFcn,
				validator: validator
			});
			this.positionRange = new editor.ui.Vector({
				container: wgt.find('#pte-positionRangeDiv'),
				onBlur: onBlurFcn,
				validator: validator
			});
			this.orientation = new editor.ui.Vector({
				container: wgt.find('#pte-orientationDiv'),
				inputs: ['a', 'b', 'c', 'd'],
				type: 'quat',
				onBlur: onBlurFcn,
				validator: validator
			});
			this.colorMultRange = new editor.ui.Vector({
				container: wgt.find('#pte-colorMultRangeDiv'),
				inputs: ['r', 'g', 'b', 'a'],
				type: 'color',
				onBlur: onBlurFcn,
				validator: validator
			});
			this.acceleration = new editor.ui.Vector({
				container: wgt.find('#pte-accelerationDiv'),
				onBlur: onBlurFcn,
				validator: validator
			});
			this.accelerationRange = new editor.ui.Vector({
				container: wgt.find('#pte-accelerationRangeDiv'),
				onBlur: onBlurFcn,
				validator: validator
			});
			this.velocity = new editor.ui.Vector({
				container: wgt.find('#pte-velocityDiv'),
				onBlur: onBlurFcn,
				validator: validator
			});
			this.velocityRange = new editor.ui.Vector({
				container: wgt.find('#pte-velocityRangeDiv'),
				onBlur: onBlurFcn,
				validator: validator
			});
			this.worldAcceleration = new editor.ui.Vector({
				container: wgt.find('#pte-worldAccelerationDiv'),
				onBlur: onBlurFcn,
				validator: validator
			});
			this.worldVelocity = new editor.ui.Vector({
				container: wgt.find('#pte-worldVelocityDiv'),
				onBlur: onBlurFcn,
				validator: validator
			});
			
			validator.setElements(inputs);
			
			form.bind('submit', function() {
				return false;
			});
			
			// bind selectbox
			this.typeSelect.bind('change', function(evt) {
				var elem = jQuery(this),
					val = elem.val();
				
				if (val != -1) {
					if (val === 'Trail') {
						wgt.fireInterval.getUI().parent().show();
					} else {
						wgt.fireInterval.getUI().parent().hide();
					}
				} else {
					wgt.reset();
				}
			})
			.addClass('fixedWidth').sb({
				fixedWidth: true
			});
			
			this.stateSelect.bind('change', function(evt) {
				wgt.canSave();
			})
			.addClass('fixedWidth').sb({
				fixedWidth: true
			});
			
			this.name.getUI().bind('keyup', function(evt) {
				wgt.canSave();
			});
			
			this.fireInterval.getUI().bind('keyup', function(evt) {
				wgt.canSave();
			}).parent().hide();
			
			// bind save button
			saveBtn.bind('click', function(evt) {				
				var props = wgt.getProperties();
				wgt.notifyListeners(editor.EventTypes.SaveParticleFx, props);
				wgt.reset();
			}).attr('disabled', 'disabled');
			
			// bind cancel button
			cancelBtn.bind('click', function(evt) {
				wgt.reset();
				wgt.notifyListeners(editor.events.Cancel, null);
			});
			
			// bind preview button
			previewBtn.bind('click', function(evt) {
				var btn = jQuery(this);
				
				if (btn.data('previewing')) {
	            	wgt.notifyListeners(editor.EventTypes.StopParticleFxPreview, null);
					btn.text('Start Preview').data('previewing', false);
				}
				else {
					var props = wgt.getProperties();
					wgt.notifyListeners(editor.EventTypes.StartParticleFxPreview, props);
					btn.text('Stop Preview').data('previewing', true);
				}
			}).attr('disabled', 'disabled');
			
			this.setupColorPickers();
		},
		
		getColorRamp: function() {
			var ramp = [];
			
			for (var i = 0, il = this.colorPickers.length; i < il; ++i) {
				ramp = ramp.concat(this.colorPickers[i].getColor());
			}
			
			return ramp;
		},
		
		getProperties: function() {
			var wgt = this,
				names = ['numParticles', 'timeRange', 'lifeTime',
					'lifeTimeRange', 'startTime', 'billboard', 'startSize',
					'startSizeRange', 'endSize', 'endSizeRange', 'spinSpeed',
					'spinSpeedRange', 'spinStart', 'spinStartRange',
					'numFrames', 'frameStart', 'frameStartRange',
					'frameDuration', 'position', 'positionRange', 'orientation',
					'colorMult', 'colorMultRange', 'acceleration',
					'accelerationRange', 'velocity', 'velocityRange',
					'worldAcceleration', 'worldVelocity'],
				props = {
					colorRamp: wgt.getColorRamp(),
					fireInterval: wgt.fireInterval.getValue(),
					name: wgt.name.getValue(),
					state: parseInt(wgt.stateSelect.val()),
					type: wgt.typeSelect.val()
				},
				params = {};
			
			for (var i = 0, il = names.length; i < il; ++i) {
				var name = names[i],
					elem = wgt[name],
					val = null;
				
				if (elem.getValue) {
					val = elem.getValue();
				} else if (elem.getColor) {
					val = elem.getColor();
				}
				
				if (val != null) {
					params[name] = val;
				}
			}
			
			props.params = params;
			return props;
		},
		
		reset: function() {      
			// reset selects
			this.tplSelect.val(-1);
			this.typeSelect.val(-1).removeAttr('disabled');
			this.stateSelect.val(-1);
			
			// set all inputs to blank
			this.numParticles.reset();
			this.timeRange.reset();
			this.lifeTime.reset();
			this.lifeTimeRange.reset();
			this.startTime.reset();
			this.fireInterval.reset();
			this.billboard.reset();
			this.startSize.reset();
			this.startSizeRange.reset();
			this.endSize.reset();
			this.endSizeRange.reset();
			this.spinSpeed.reset();
			this.spinSpeedRange.reset();
			this.spinStart.reset();
			this.spinStartRange.reset();
			this.numFrames.reset();
			this.frameStart.reset();
			this.frameStartRange.reset();
			this.frameDuration.reset();
			this.name.reset();
			this.position.reset();
			this.positionRange.reset();
			this.orientation.reset();
			this.colorMult.reset();
			this.colorMultRange.reset();
			this.acceleration.reset();
			this.accelerationRange.reset();
			this.velocity.reset();
			this.velocityRange.reset();
			this.worldAcceleration.reset();
			this.worldVelocity.reset();
			
			// disable the save button
			this.find('#pteSaveBtn').attr('disabled', 'disabled');
			this.find('#ptePreviewBtn').text('Start Preview').data('previewing', false).attr('disabled', 'disabled');
			
			// remove additional color ramp values
			this.find('.colorRampAdd').remove();
			this.find('#pteAddColorToRamp').data('ndx', 1);
			var colorRampPicker = this.colorPickers[0];
			colorRampPicker.reset();
		},
		
		setupColorPickers: function() {
			var wgt = this,
				colorAdder = this.find('#pteAddColorToRamp');
			
			this.colorMult = new editor.ui.ColorPicker({
				inputId: 'pte-colorMult',
				containerClass: '',	
				buttonId: 'pteColorMult'			
			});
			
			var colorRampPicker = new editor.ui.ColorPicker({
				inputId: 'pte-colorRamp0',	
				containerClass: '',
				buttonId: 'pteColorRamp0Picker'			
			});
			
			this.find('#pteColorRamp0Lbl').after(colorRampPicker.getUI());
			this.find('#pteColorMultLbl').after(this.colorMult.getUI());
			
			// add listeners
			this.colorMult.addListener(editor.events.ColorPicked, function(clr) {				
				wgt.canSave();
			});
			
			colorRampPicker.addListener(editor.events.ColorPicked, function(clr) {
				wgt.canSave();
			});
			
			// setup the color ramp adder
			colorAdder.bind('click', function(evt) {
				wgt.addColorInput();
			})
			.data('ndx', 1);
			
			this.colorPickers.push(colorRampPicker);
		},
		
		loadTemplates: function() {
			var wgt = this;
			
			this.tplSelect.bind('change', function(evt) {
				var elem = jQuery(this),
					ndx = elem.val();
					
				if (ndx !== -1) {
					var tpl = wgt.templates[ndx];
					wgt.notifyListeners(editor.EventTypes.TemplateSelected, tpl);
					wgt.edit(tpl);
				} else {
					wgt.reset();
				}
			})
			.addClass('fixedWidth').sb({
				fixedWidth: true
			});
			
			hemi.utils.get('js/editor/plugins/particleEffects/templates/particleFx.json', function(data, status) {
				if (data == null) {
					hemi.core.error(status);
				} else {
					var tplData = JSON.parse(data);
					wgt.templates = tplData.templates;
					
					for (var i = 0, il = wgt.templates.length; i < il; ++i) {
						var tpl = wgt.templates[i],
							option = jQuery('<option value="' + i + '">' + tpl.name + '</option>');
							
						wgt.tplSelect.append(option).sb('refresh');				
					}
				}
			});
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                   Particle Effects List Sidebar Widget                     //
////////////////////////////////////////////////////////////////////////////////     
	
	var ListWidget = editor.ui.ListWidget.extend({
		init: function(options) {
		    this._super({
				name: 'pteListWidget',
				listId: 'pteFxList',
				prefix: 'pteLst',
				title: 'Particle Effects',
				instructions: "Add particle effects above."
			});
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var effect = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.EditParticleFx, effect);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var effect = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.RemoveParticleFx, effect);
			});
		},
		
		getOtherHeights: function() {
			return this.buttonDiv.outerHeight(true);
		}
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    
    
    var ParticleFxView = editor.ToolView.extend({
		init: function() {
	        this._super({
	            toolName: 'Particle Effects',
	    		toolTip: 'Particle Effects: Create and edit particle effects',
	    		elemId: 'particleEffectsBtn',
	    		id: 'particleEffects'
	        });

			this.addPanel(new editor.ui.Panel());
			
			this.sidePanel.addWidget(new CreateWidget());
			this.sidePanel.addWidget(new ListWidget());
	    }
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The ParticleFxController facilitates ParticleFxModel and ParticleFxView
     * communication by binding event and message handlers.
     */
    var ParticleFxController = editor.ToolController.extend({
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
				pteCrt = view.sidePanel.createPteWidget,
				pteLst = view.sidePanel.pteListWidget;
			
			// create widget specific
			pteCrt.addListener(editor.events.Cancel, function() {
				model.cancelParticleFxEdit();
			});
			pteCrt.addListener(editor.EventTypes.SaveParticleFx, function(props) {
				model.save(props);
			});
			pteCrt.addListener(editor.EventTypes.StartParticleFxPreview, function(props) {
				model.preview(props);
			});
			pteCrt.addListener(editor.EventTypes.StopParticleFxPreview, function(value) {
				model.stopPreview();
			});
			pteCrt.addListener(editor.EventTypes.TemplateSelected, function(template) {
				model.setTemplate(template);
			});
			
			// list widget specific
			pteLst.addListener(editor.EventTypes.EditParticleFx, function(effect) {
				model.setEffect(effect);
				pteCrt.edit(effect);
			});
			pteLst.addListener(editor.EventTypes.RemoveParticleFx, function(effect) {
				model.removeEffect(effect);
			});
			
			// model specific
			model.addListener(editor.events.Created, function(particleFx) {
				pteLst.add(particleFx);			
			});
			model.addListener(editor.events.Removed, function(value) {
				pteCrt.reset();
				pteLst.remove(value);
			});
			model.addListener(editor.events.Updated, function(particleFx) {
				pteLst.update(particleFx);
			});
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     			  	Extra Scripts  		                      //
////////////////////////////////////////////////////////////////////////////////

	editor.getCss('js/editor/plugins/particleEffects/css/style.css');
	
})();
