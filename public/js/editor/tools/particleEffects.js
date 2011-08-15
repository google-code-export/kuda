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
    editor.tools = editor.tools || {};
	
	var HIDE_TXT = 'Hide',
		SHOW_TXT = 'Show',
		EMPTY_PTE_TXT = 'No particle effect selected';
	
    editor.EventTypes = editor.EventTypes || {};
	// model specific
    editor.EventTypes.ParticleFxAdded = "particleFx.ParticleFxAdded";
    editor.EventTypes.ParticleFxUpdated = "particleFx.ParticleFxUpdated";
    editor.EventTypes.ParticleFxRemoved = "particleFx.ParticleFxRemoved";
    editor.EventTypes.TemplatesLoaded = "particleFx.TemplatesLoaded";
	
	// view specific
    editor.EventTypes.ParticleFxType = "particleFx.ParticleFxType";
	
	// create fx sidebar widget specific
	editor.EventTypes.RemoveParticleFxParam = "particleFx.RemoveParticleFxParam";
    editor.EventTypes.SaveParticleFx = "particleFx.SaveParticleFx";
    editor.EventTypes.StartParticleFxPreview = "particleFx.StartParticleFxPreview";
    editor.EventTypes.StopParticleFxPreview = "particleFx.StopParticleFxPreview";
    editor.EventTypes.SetParticleFxParam = "particleFx.SetParticleFxParam";
    editor.EventTypes.SetParticleFxColorRamp = "particleFx.SetParticleFxColorRamp";
    editor.EventTypes.SetParticleFxState = "particleFx.SetParticleFxState";
    editor.EventTypes.SetParticleFxFireInterval = "particleFx.SetParticleFxFireInterval";
    editor.EventTypes.PreviewCurrentFx = "particleFx.PreviewCurrentFx";
	editor.EventTypes.CancelCreateParticleFx = "particleFx.CancelCreateParticleFx";
	editor.EventTypes.TemplateSelected = "particleFx.TemplateSelected";
	
	// list sidebar widget specific
	editor.EventTypes.CreateParticleFx = "particleFx.CreateParticleFx";
    editor.EventTypes.EditParticleFx = "particleFx.EditParticleFx";
    editor.EventTypes.RemoveParticleFx = "particleFx.RemoveParticleFx";	
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * A ParticleFxMgrModel ...
     *  
     * @param {hemi.world.World} world the world object, which has references to
     *         all relevant objects (like models)
     */
    editor.tools.ParticleFxMgrModel = editor.tools.ToolModel.extend({
		init: function() {
			this._super();
			this.particleEffectParams = {};
			this.currentParticleEffect = null;
			this.type = null;
			this.state = null;
			this.colorRamp = null;
			this.fireInterval = null;
			this.isUpdating = false;
	    },
		
		addToColorRamp: function(ndx, color) {
			if (this.colorRamp === null) {
				this.colorRamp = [];
			}
			if (this.colorRamp.length <= ndx) {
				this.colorRamp = this.colorRamp.concat(color);	
			}
			else {
				for (var i = 0; i < color.length; ++i) {
					this.colorRamp[ndx + i] = color[i];
				}
			}
			
			if (this.currentParticleEffect) {
				this.currentParticleEffect.colorRamp = this.colorRamp.slice(0);
			}
		},
		
		cancelParticleFxEdit: function() {
			this.stopPreview();
				
			if (!this.isUpdating && this.currentParticleEffect) {
				this.currentParticleEffect.cleanup();
			}
			
			this.currentParticleEffect = null;
			this.fireInterval = null;
			this.type = null;
			this.state = null;
			this.colorRamp = null;
			this.isUpdating = false;
			this.particleEffectParams = {};
		},
		
		create: function() {
			var mdl = this,
				createFcn = function() {	
					var particleFx = null,
						clrRmp = [];
				
					for (var ndx = 0, len = mdl.colorRamp.length; ndx < len; ndx++) {
						clrRmp = clrRmp.concat(mdl.colorRamp[ndx]);
					};
								
					switch (mdl.type) {
						case 'Burst':
							particleFx = hemi.effect.createBurst(mdl.state, clrRmp, mdl.particleEffectParams);
							break;
						case 'Trail':
							particleFx = hemi.effect.createTrail(mdl.state, clrRmp, mdl.particleEffectParams, mdl.fireInterval);
							break;
						case 'Emitter':
							particleFx = hemi.effect.createEmitter(mdl.state, clrRmp, mdl.particleEffectParams);
							break;
					}
					
					return particleFx;
				};
				
			if (this.currentParticleEffect) {
				this.stopPreview();
				var oldId = this.currentParticleEffect.getId();
				this.currentParticleEffect.cleanup();
				this.currentParticleEffect = createFcn();
				this.currentParticleEffect.setId(oldId);
			}
			else {
				this.currentParticleEffect = createFcn(); 
			}
		},
		
		loadTemplates: function() {			
			var mdl = this;
			
			// load the template file, eventually, this will be grabbed
			// from a server
			hemi.loader.loadHtml('js/editor/tools/templates/particleFx.json', function(data) {
				mdl.templates = JSON.parse(data);
				mdl.notifyListeners(editor.EventTypes.TemplatesLoaded, 
					mdl.templates);
			});
		},
		
		preview: function() {
			this.create();
			this.currentParticleEffect.particles = null;
			this.previewEffect(this.currentParticleEffect);		
		},
		
		previewEffect: function(effect) {		
			switch(effect.citizenType) {
				case 'hemi.effect.Burst':
					effect.trigger();
					break;
				case 'hemi.effect.Trail':
					effect.start();
					break;
				case 'hemi.effect.Emitter':
					effect.show();
					break;
			}	
		},
		
		removeEffect: function(effect) {
			effect.cleanup();
		},
	    
	    removeParam: function(paramName) {
			if (this.particleEffectParams[paramName] !== undefined) {
				delete this.particleEffectParams[paramName];
				
				if (this.currentParticleEffect) {
					this.currentParticleEffect.params = this.particleEffectParams;
				}
			}
	    },
		
		save: function(name) {
			this.create();
			
			var msgType = this.isUpdating ? editor.EventTypes.ParticleFxUpdated 
				: editor.EventTypes.ParticleFxAdded;
										
			this.currentParticleEffect.name = name;
			this.currentParticleEffect.particles = null;
				
			this.notifyListeners(msgType, this.currentParticleEffect);
			
			this.currentParticleEffect = null;
			this.fireInterval = null;
			this.type = null;
			this.state = null;
			this.colorRamp = null;
			this.particleEffectParams = {};
			this.isUpdating = false;	
		},
		
		saveTemplate: function(name) {
			
		},
		
		setEffect: function(effect) {
			this.currentParticleEffect = effect;
			this.particleEffectParams = jQuery.extend(true, {}, effect.params);
			this.colorRamp = effect.colorRamp;
			this.state = effect.state;
			this.type = effect.citizenType.replace('hemi.effect.', '');
			this.isUpdating = true;
		},
		
		setState: function(state) {
			if (state === -1) {
				this.state = null;
			}
			else {
				this.state = state;
				if (this.currentParticleEffect) {
					this.currentParticleEffect.state = state;
				}
			}
		},
		
		setTemplate: function(tpl) {
			var oldId = null;			
			this.particleEffectParams = {};
			
			if (this.isUpdating) {
				oldId = this.currentParticleEffect.getId();
				this.stopPreview();
				this.currentParticleEffect.cleanup();
				this.currentParticleEffect = null;
			}
			this.setType(tpl.type);
			this.setState(tpl.state);
			if (tpl.fireInterval) {
				this.setFireInterval(tpl.fireInterval);
			}
			if (tpl.colorRamp) {
				this.colorRamp = tpl.colorRamp;
			}
			
			var prm = tpl.params;
			
			for (var key in prm) {
				this.setParam(key, prm[key]);
			}
			
			if (this.isUpdating) {
				this.create();
				this.currentParticleEffect.setId(oldId);
			}
		},
		
		setType: function(type) {
			this.type = type;
			if (this.currentParticleEffect && this.currentParticleEffect.citizenType.replace('hemi.effect.', '') !== type) {
				this.currentParticleEffect.cleanup();
			}
		},
		
		setFireInterval: function(interval) {
			this.fireInterval = interval;
			if (this.currentParticleEffect) {
				this.currentParticleEffect.fireInterval = interval;
			}
		},
	    
	    setParam: function(paramName, paramVal) {
			this.particleEffectParams[paramName] = paramVal;
			
			if (this.currentParticleEffect) {
				this.currentParticleEffect.params = this.particleEffectParams;
			}
	    },
		
		stopPreview: function() {
			if (this.currentParticleEffect) {
				this.stopPreviewEffect(this.currentParticleEffect);
			}		
		},
		
		stopPreviewEffect: function(effect) {		
			switch(effect.citizenType) {
				case 'hemi.effect.Trail':
					effect.stop();
					break;
				case 'hemi.effect.Emitter':
					effect.hide();
					break;
			}
		},
		
	    worldLoaded: function() {
			var effects = hemi.world.getEffects();
			this.notifyListeners(editor.EventTypes.WorldLoaded, effects);
	    },
	    
	    worldCleaned: function() {
			this.notifyListeners(editor.EventTypes.WorldCleaned, null);
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                    Particle Effects Edit Sidebar Widget                    //
////////////////////////////////////////////////////////////////////////////////     
		
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	editor.tools.PteFxEditSBWidgetDefaults = {
		name: 'pteFxEditSBWidget',
		uiFile: 'js/editor/tools/html/particleFxForms.htm',
		manualVisible: true
	};
	
	editor.tools.PteFxEditSBWidget = editor.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
					editor.tools.PteFxEditSBWidgetDefaults, options),
				wgt = this;
			this.colorPickers = [];
			
		    this._super(newOpts);	
		},
		
		addColorInput: function() {
			var colorAdder = this.find('#pteAddColorToRamp'),
				ndx = colorAdder.data('ndx'),
				wgt = this,
				colorPicker;
			
			if (this.colorPickers.length <= ndx) {
				colorPicker = new editor.ui.ColorPicker({
					inputId: 'pte-colorRamp' + ndx,
					containerClass: 'colorRampAdd',
					buttonId: 'pteColorRamp' + ndx + 'Picker'
				});			
				
				colorPicker.addListener(editor.EventTypes.ColorPicked, function(clr) {
					wgt.notifyListeners(editor.EventTypes.SetParticleFxColorRamp, {
						color: clr,
						ndx: ndx
					});
				});
			
				this.colorPickers.push(colorPicker);
			}
			else {
				colorPicker = this.colorPickers[ndx];
			}
			
			colorAdder.before(colorPicker.getUI());
			colorAdder.data('ndx', ndx+1);
		},
		
		canSave: function() {
			var nameInput = this.find('#pteName'),
				typeInput = this.find('#pteType'),
				stateInput = this.find('#pteState'),
				colorRampInput = this.find('#pteColorRamp0r'),
				saveBtn = this.find('#pteSaveBtn'),
				previewBtn = this.find('#ptePreviewStartBtn'),
				fireInterval = this.find('#pteFireInterval'),
				typeVal = typeInput.val(),
				stateVal = stateInput.val(),
				clrRmpVal = colorRampInput.val(),
				nameVal = nameInput.val(),
				fireIntVal = fireInterval.val(),
				type = typeVal.replace('hemi.effect.', '');
				
			if (nameVal !== '' && typeVal !== -1 && stateVal !== -1 
				&& clrRmpVal !== 'r' && (type !== 'Trail' || fireIntVal !== '')) {
				saveBtn.removeAttr('disabled');
			}
			else {
				saveBtn.attr('disabled', 'disabled');
			}
			
			if (stateVal !== -1 && clrRmpVal !== 'r' && typeVal !== -1
				&& (type !== 'Trail' || fireIntVal !== '')) {
				previewBtn.removeAttr('disabled');
			}
			else {
				previewBtn.attr('disabled', 'disabled');
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
					numColors = colorRamp.length / 4, 
					colorAdder = this.find('#pteAddColorToRamp');
				
				this.find('#pteTemplateSelect').val(-1);
				this.find('#pteType').val(type).change();
				this.find('#pteName').val(effect.name);
				
				for (var paramName in params) {
					var val = params[paramName];
					
					if (paramName.match('colorMult')) {
						this.colorMultPicker.setColor(val);
					}
					else 
						if (paramName.match(/acceleration|position|velocity|world/)) {							
							this[paramName].setValue(val);
						}
						else if (paramName.match('orientation')) {
							this[paramName].setValue(val);
						}
						else {
							this.find('#pte-' + paramName).val(val);
						}
				}
				
				this.find('#pteState').val(state);
				if (fireInt) {
					this.find('#pteFireInterval').val(fireInt);
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
			
			this.invalidate();
		},
		
		finishLayout: function() {
			this._super();
			
			var saveBtn = this.find('#pteSaveBtn'),
				cancelBtn = this.find('#pteCancelBtn'),
				previewStartBtn = this.find('#ptePreviewStartBtn'),
				previewStopBtn = this.find('#ptePreviewStopBtn'),
	        	typeSelect = this.find('#pteType'),
				paramsSet = this.find('fieldset:not(#pteSystemType)'),
				inputs = this.find('input:not(.vector, .color, .quat, #pteName, #pteFireInterval)'),
				stateSelect = this.find('#pteState'),
				fireInterval = this.find('#pteFireInterval'),
				form = this.find('form'),
				nameInput = this.find('#pteName'),
				wgt = this,
				vecValidator = new editor.ui.Validator(null, function(elem) {
						var val = elem.val(),
							msg = null;
							
						if (val !== '' && !hemi.utils.isNumeric(val)) {
							msg = 'must be a number';
						}
						
						return msg;
					}),
				onBlurFcn = function(elem, evt, vecWgt) {
					var val = elem.val(),
						ndx = elem.data('ndx');
					
					if (val === '') {
						wgt.notifyListeners(editor.EventTypes.RemoveShapeParam, 
							vecWgt.config.paramName);
					}
					else if (hemi.utils.isNumeric(val)) {
						var totalVal = vecWgt.getValue();
						
						if (totalVal.length > 0) {
							wgt.notifyListeners(editor.EventTypes.SetParticleFxParam, {
								paramName: vecWgt.config.paramName,
								paramVal: totalVal
							});
						}
					}
				};
						
			form.bind('submit', function() {
				return false;
			});
			
			fireInterval.parent().hide();
			saveBtn.attr('disabled', 'disabled');
			
			// bind selectbox
			typeSelect.bind('change', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					firstShown = elem.data('firstShown');
				
				if (val != -1) {
					if (val === 'Trail') {
						fireInterval.parent().show();
					}
					else {
						fireInterval.parent().hide();
					}
					
					wgt.notifyListeners(editor.EventTypes.ParticleFxType, val);
				}
				else {
					wgt.reset();
				}
			});
			
			stateSelect.bind('change', function(evt) {
				var elem = jQuery(this),
					val = elem.val();
					
				wgt.notifyListeners(editor.EventTypes.SetParticleFxState, val);
				wgt.canSave();
			});
			
			nameInput.bind('keydown', function(evt) {
				wgt.canSave();
			});
			
			fireInterval.bind('change', function(evt) {
				var val = fireInterval.val();
				
				wgt.notifyListeners(editor.EventTypes.SetParticleFxFireInterval, val);
			});
			
			// bind save button
			saveBtn.bind('click', function(evt) {				
				wgt.notifyListeners(editor.EventTypes.SaveParticleFx, nameInput.val());
				wgt.reset();
			});
			
			// bind cancel button
			cancelBtn.bind('click', function(evt) {
				wgt.reset();
				wgt.notifyListeners(editor.EventTypes.CancelCreateParticleFx, null);
			});
			
			// bind preview buttons
			previewStartBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.EventTypes.StartParticleFxPreview, nameInput.val());
			});
			previewStopBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.EventTypes.StopParticleFxPreview, nameInput.val());
			});
			
			this.position = new editor.ui.Vector({
				container: wgt.find('#pte-positionDiv'),
				paramName: 'position',
				onBlur: onBlurFcn,
				validator: vecValidator
			});
			this.positionRange = new editor.ui.Vector({
				container: wgt.find('#pte-positionRangeDiv'),
				paramName: 'positionRange',
				onBlur: onBlurFcn,
				validator: vecValidator
			});
			this.orientation = new editor.ui.Vector({
				container: wgt.find('#pte-orientationDiv'),
				paramName: 'orientation',
				inputs: ['a', 'b', 'c', 'd'],
				type: 'quat',
				onBlur: onBlurFcn,
				validator: vecValidator
			});
			this.colorMultRange = new editor.ui.Vector({
				container: wgt.find('#pte-colorMultRangeDiv'),
				paramName: 'colorMultRange',
				inputs: ['r', 'g', 'b', 'a'],
				type: 'color',
				onBlur: onBlurFcn,
				validator: vecValidator
			});
			this.acceleration = new editor.ui.Vector({
				container: wgt.find('#pte-accelerationDiv'),
				paramName: 'acceleration',
				onBlur: onBlurFcn,
				validator: vecValidator
			});
			this.accelerationRange = new editor.ui.Vector({
				container: wgt.find('#pte-accelerationRangeDiv'),
				paramName: 'accelerationRange',
				onBlur: onBlurFcn,
				validator: vecValidator
			});
			this.velocity = new editor.ui.Vector({
				container: wgt.find('#pte-velocityDiv'),
				paramName: 'velocity',
				onBlur: onBlurFcn,
				validator: vecValidator
			});
			this.velocityRange = new editor.ui.Vector({
				container: wgt.find('#pte-velocityRangeDiv'),
				paramName: 'velocityRange',
				onBlur: onBlurFcn,
				validator: vecValidator
			});
			this.worldAcceleration = new editor.ui.Vector({
				container: wgt.find('#pte-worldAccelerationDiv'),
				paramName: 'worldAcceleration',
				onBlur: onBlurFcn,
				validator: vecValidator
			});
			this.worldVelocity = new editor.ui.Vector({
				container: wgt.find('#pte-worldVelocityDiv'),
				paramName: 'worldVelocity',
				onBlur: onBlurFcn,
				validator: vecValidator
			});
						
			var validator = new editor.ui.Validator(inputs, function(elem) {
				var val = elem.val(),
					msg = null,
					param = elem.attr('id').replace('pte-', '');
					
				if (val === '') {
					wgt.notifyListeners(editor.EventTypes.RemoveParticleFxParam, param);
				}
				else {
					if (param === 'billboard') {
						val = val.toLowerCase();
						
						if (val !== 'true' && val !== 'false') {
							msg = 'must be a boolean';
						}
					}
					else {
						val = parseFloat(val);
						
						if (isNaN(val)) {
							msg = 'must be a number';
						}
					}
					
					if (msg === null) {
						wgt.notifyListeners(editor.EventTypes.SetParticleFxParam, {
							paramName: param,
							paramVal: val
						});
					}
				}
				
				return msg;
			});
			
			this.setupColorPickers();
		},
		
		reset: function() {      
			// reset selects
			this.find('#pteTemplateSelect').val(-1);
			this.find('#pteType').val(-1).removeAttr('disabled');
			this.find('#pteState').val(-1);
			
			// set all inputs to blank
			this.find('form input:not(.vector, .color, .quat)').val('').blur();
			this.position.reset();
			this.positionRange.reset();
			this.orientation.reset();
			this.colorMultRange.reset();
			this.acceleration.reset();
			this.accelerationRange.reset();
			this.velocity.reset();
			this.velocityRange.reset();
			this.worldAcceleration.reset();
			this.worldVelocity.reset();
			
			// disable the save button
			this.find('#pteSaveBtn').attr('disabled', 'disabled');
			
			// remove additional color ramp values
			this.find('.colorRampAdd').remove();
			var colorRampPicker = this.colorPickers[0];
			this.find('#pteAddColorToRamp').data('ndx', 1);
			
			// reset color pickers
			this.colorMultPicker.reset();
			colorRampPicker.reset();	
		},
		
		resize: function(maxHeight) {
			this._super(maxHeight);	
			
			var form = this.find('form:visible'),
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
				this.find('form:visible').height(newHeight);
			}
		},
		
		setupColorPickers: function() {
			var wgt = this,
				colorAdder = this.find('#pteAddColorToRamp');
			
			this.colorMultPicker = new editor.ui.ColorPicker({
				inputId: 'pte-colorMult',
				containerClass: 'long',	
				buttonId: 'pteColorMultPicker'			
			});
			
			var colorRampPicker = new editor.ui.ColorPicker({
				inputId: 'pte-colorRamp0',	
				containerClass: 'long',
				buttonId: 'pteColorRamp0Picker'			
			});
			
			this.find('#pteColorRamp0Lbl').after(colorRampPicker.getUI());
			this.find('#pteColorMultLbl').after(this.colorMultPicker.getUI());
			
			// add listeners
			this.colorMultPicker.addListener(editor.EventTypes.ColorPicked, function(clr) {				
				wgt.notifyListeners(editor.EventTypes.SetParticleFxParam, {
					paramName: 'colorMult',
					paramVal: clr
				});
			});
			
			colorRampPicker.addListener(editor.EventTypes.ColorPicked, function(clr) {
				wgt.notifyListeners(editor.EventTypes.SetParticleFxColorRamp, {
					color: clr,
					ndx: 0
				});
			});
			
			// setup the color ramp adder
			colorAdder.bind('click', function(evt) {
				wgt.addColorInput();
			})
			.data('ndx', 1);
			
			this.colorPickers.push(colorRampPicker);
		},
		
		setupTemplates: function(tplData) {
			this.tplSelect = this.find('#pteTemplateSelect');
			var templates = this.templates = tplData.templates,
				wgt = this;
			
			for (var ndx = 0, len = templates.length; ndx < len; ndx++) {
				var tpl = templates[ndx],
					option = jQuery('<option value="' + ndx + '">' + tpl.name + '</option>');
					
				this.tplSelect.append(option);				
			}
			
			this.tplSelect.bind('change', function(evt) {
				var elem = jQuery(this),
					ndx = elem.val();
					
				if (ndx !== -1) {
					var tpl = templates[ndx];
					wgt.notifyListeners(editor.EventTypes.TemplateSelected, tpl);
					wgt.edit(tpl);
				}
				else {
					wgt.reset();
				}
			});
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                   Particle Effects List Sidebar Widget                     //
////////////////////////////////////////////////////////////////////////////////     
	
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	editor.tools.PteFxListSBWidgetDefaults = {
		name: 'pteFxListSBWidget',
		listId: 'pteFxList',
		prefix: 'pteLst',
		title: 'Particle Effects',
		instructions: "Click 'Create Particle Effect' to create a new particle effect."
	};
	
	editor.tools.PteFxListSBWidget = editor.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, editor.tools.PteFxListSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.items = new Hashtable();		
		},
		
		layoutExtra: function() {
			this.buttonDiv = jQuery('<div class="buttons"></div>');
			this.createBtn = jQuery('<button id="createParticleFx">Create Particle Effect</button>');
			var wgt = this;
						
			this.createBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.EventTypes.CreateParticleFx, null);
			});
			
			this.buttonDiv.append(this.createBtn);
			
			return this.buttonDiv;
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
    
    /*
     * Configuration object for the ParticleFxMgrView.
     */
    editor.tools.ParticleFxMgrViewDefaults = {
        toolName: 'Particle Effects',
		toolTip: 'Particle Effects: Create and edit particle effects',
		widgetId: 'particleEffectsBtn',
		axnBarId: 'pteActionBar'
    };
    
    editor.tools.ParticleFxMgrView = editor.tools.ToolView.extend({
		init: function(options) {
	        var newOpts = jQuery.extend({}, editor.tools.ParticleFxMgrViewDefaults, options);
	        this._super(newOpts);
			
			this.addSidebarWidget(new editor.tools.PteFxEditSBWidget());
			this.addSidebarWidget(new editor.tools.PteFxListSBWidget());
			this.addSidebarWidget(editor.ui.getBehaviorWidget());
	    }
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The ParticleFxMgrController facilitates AnimatorModel and AnimatorView
     * communication by binding event and message handlers.
     */
    editor.tools.ParticleFxMgrController = editor.tools.ToolController.extend({
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
				pteEdt = view.pteFxEditSBWidget,
				pteLst = view.pteFxListSBWidget,
				bhvWgt = view.behaviorSBWidget,
	        	that = this;
				
			model.loadTemplates();
	                	        
	        view.addListener(editor.EventTypes.ToolModeSet, function(value) {
	            var isDown = value.newMode === editor.tools.ToolConstants.MODE_DOWN;
	        });
			
			// create widget specific
			pteEdt.addListener(editor.EventTypes.CancelCreateParticleFx, function(name) {
				var isDown = view.mode === editor.tools.ToolConstants.MODE_DOWN;
				pteLst.setVisible(true && isDown);
				pteEdt.setVisible(false);
				model.cancelParticleFxEdit();
			});			
			pteEdt.addListener(editor.EventTypes.ParticleFxType, function(value) {
				model.setType(value);
			});	        
			pteEdt.addListener(editor.EventTypes.PreviewCurrentFx, function(value) {
				if (value.show) {
					model.previewEffect(value.effect);	
				}			
				else {
					model.stopPreviewEffect(value.effect);
				}
			});		
	        pteEdt.addListener(editor.EventTypes.RemoveParticleFxParam, function(value) {
	        	model.removeParam(value);
	        });	        	
			pteEdt.addListener(editor.EventTypes.SaveParticleFx, function(name) {
				model.save(name);
				pteEdt.setVisible(false);
			});		
	        pteEdt.addListener(editor.EventTypes.SetParticleFxParam, function(value) {
	        	model.setParam(value.paramName, value.paramVal);
	        });	        
	        pteEdt.addListener(editor.EventTypes.SetParticleFxColorRamp, function(value) {
	        	model.addToColorRamp(value.ndx * 4, value.color);
	        });			
			pteEdt.addListener(editor.EventTypes.SetParticleFxFireInterval, function(value) {
				model.setFireInterval(value);
			});		
			pteEdt.addListener(editor.EventTypes.SetParticleFxState, function(value) {
				model.setState(value);
			});				
			pteEdt.addListener(editor.EventTypes.StartParticleFxPreview, function(value) {
				model.preview();
			});			
			pteEdt.addListener(editor.EventTypes.StopParticleFxPreview, function(value) {
				model.stopPreview();
			});				
			pteEdt.addListener(editor.EventTypes.TemplateSelected, function(template) {
				model.setTemplate(template);
			});		
			
			// list widget specific
			pteLst.addListener(editor.EventTypes.CreateParticleFx, function() {
				var isDown = view.mode === editor.tools.ToolConstants.MODE_DOWN;
				pteEdt.setVisible(true && isDown);
				pteLst.setVisible(false);
			});			
			pteLst.addListener(editor.EventTypes.EditParticleFx, function(effect) {
				var isDown = view.mode === editor.tools.ToolConstants.MODE_DOWN;
				model.setEffect(effect);
				pteEdt.setVisible(true && isDown);
				pteLst.setVisible(false);
				pteEdt.edit(effect);
			});			
			pteLst.addListener(editor.EventTypes.RemoveParticleFx, function(effect) {
				model.removeEffect(effect);
				pteEdt.reset();
			});
			
			// model specific
			model.addListener(editor.EventTypes.ParticleFxAdded, function(particleFx) {
				var isDown = view.mode === editor.tools.ToolConstants.MODE_DOWN;
				pteLst.setVisible(true && isDown);
				pteEdt.setVisible(false);
				pteLst.add(particleFx);			
			});			
			model.addListener(editor.EventTypes.ParticleFxRemoved, function(value) {
				pteEdt.reset();
			});			
			model.addListener(editor.EventTypes.ParticleFxUpdated, function(particleFx) {	
				var isDown = view.mode === editor.tools.ToolConstants.MODE_DOWN;
				pteLst.setVisible(true && isDown);	
				pteEdt.setVisible(false);			
				pteLst.update(particleFx);
			});		
			model.addListener(editor.EventTypes.TemplatesLoaded, function(templates) {		
				pteEdt.setupTemplates(templates);
			});	
			model.addListener(editor.EventTypes.WorldLoaded, function(effects) {		
				for (var ndx = 0, len = effects.length; ndx < len; ndx++) {
					var eft = effects[ndx];
					pteLst.add(eft);
				}
			});			
			model.addListener(editor.EventTypes.WorldCleaned, function(effects) {		
				pteLst.clear();
			});		
			
			// behavior widget specific
			bhvWgt.addListener(editor.EventTypes.Sidebar.WidgetVisible, function(obj) {
				if (obj.updateMeta) {
					var isDown = view.mode === editor.tools.ToolConstants.MODE_DOWN;
					
					pteLst.setVisible(!obj.visible && isDown);
				}
			});
	    }
	});
    
    return editor;
})(editor || {});
