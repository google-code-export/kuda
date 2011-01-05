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
	
	var HIDE_TXT = 'Hide',
		SHOW_TXT = 'Show',
		EMPTY_PTE_TXT = 'No particle effect selected';
	
    module.EventTypes = module.EventTypes || {};
	// model specific
    module.EventTypes.ParticleFxAdded = "particleFx.ParticleFxAdded";
    module.EventTypes.ParticleFxUpdated = "particleFx.ParticleFxUpdated";
    module.EventTypes.ParticleFxRemoved = "particleFx.ParticleFxRemoved";
	
	// view specific
    module.EventTypes.ParticleFxType = "particleFx.ParticleFxType";
	
	// create fx sidebar widget specific
	module.EventTypes.RemoveParticleFxParam = "particleFx.RemoveParticleFxParam";
    module.EventTypes.SaveParticleFx = "particleFx.SaveParticleFx";
    module.EventTypes.StartParticleFxPreview = "particleFx.StartParticleFxPreview";
    module.EventTypes.StopParticleFxPreview = "particleFx.StopParticleFxPreview";
    module.EventTypes.SetParticleFxParam = "particleFx.SetParticleFxParam";
    module.EventTypes.SetParticleFxColorRamp = "particleFx.SetParticleFxColorRamp";
    module.EventTypes.SetParticleFxState = "particleFx.SetParticleFxState";
    module.EventTypes.SetParticleFxFireInterval = "particleFx.SetParticleFxFireInterval";
    module.EventTypes.PreviewCurrentFx = "particleFx.PreviewCurrentFx";
	module.EventTypes.CancelCreateParticleFx = "particleFx.CancelCreateParticleFx";
	
	// list sidebar widget specific
	module.EventTypes.CreateParticleFx = "particleFx.CreateParticleFx";
    module.EventTypes.EditParticleFx = "particleFx.EditParticleFx";
    module.EventTypes.RemoveParticleFx = "particleFx.RemoveParticleFx";	
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * A ParticleFxMgrModel ...
     *  
     * @param {hemi.world.World} world the world object, which has references to
     *         all relevant objects (like models)
     */
    module.tools.ParticleFxMgrModel = module.tools.ToolModel.extend({
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
		
	    worldLoaded: function() {
			var effects = hemi.world.getEffects();
			this.notifyListeners(module.EventTypes.WorldLoaded, effects);
	    },
	    
	    worldCleaned: function() {
			this.notifyListeners(module.EventTypes.WorldCleaned, null);
	    },
		
		setEffect: function(effect) {
			this.currentParticleEffect = effect;
			this.particleEffectParams = jQuery.extend(true, {}, effect.params);
			this.colorRamp = effect.colorRamp;
			this.state = effect.state;
			this.type = effect.citizenType.replace('hemi.effect.', '');
			this.isUpdating = true;
		},
		
		removeEffect: function(effect, id) {
			if (this.editId === id) {
				this.notifyListeners(module.EventTypes.ParticleFxRemoved, null);
				this.currentParticleEffect.cleanup();
				this.currentParticleEffect = null;
			}
			else {
				effect.cleanup();
			}
		},
	    
	    removeParam: function(paramName) {
			if (this.particleEffectParams[paramName] !== undefined) {
				delete this.particleEffectParams[paramName];
				
				if (this.currentParticleEffect) {
					this.currentParticleEffect.params = this.particleEffectParams;
				}
			}
	    },
		
		setType: function(type) {
			this.type = type;
			if (this.currentParticleEffect && this.currentParticleEffect.citizenType.replace('hemi.effect.', '') !== type) {
				this.currentParticleEffect.cleanup();
			}
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
		
		setFireInterval: function(interval) {
			this.fireInterval = interval;
			if (this.currentParticleEffect) {
				this.currentParticleEffect.fireInterval = interval;
			}
		},
		
		addToColorRamp: function(ndx, color) {
			if (this.colorRamp === null) {
				this.colorRamp = [];
			}
			if (this.colorRamp.length < ndx) {
				this.colorRamp.push(color);	
			}
			else {
				this.colorRamp[ndx] = color;
			}
			
			if (this.currentParticleEffect) {
				var clrRmp = [];
					
				for (var ndx = 0, len = this.colorRamp.length; ndx < len; ndx++) {
					clrRmp = clrRmp.concat(this.colorRamp[ndx]);
				}
				
				this.currentParticleEffect.colorRamp = clrRmp;
			}
		},
	    
	    setParam: function(paramName, paramVal) {
			this.particleEffectParams[paramName] = paramVal;
			
			if (this.currentParticleEffect) {
				this.currentParticleEffect.params = this.particleEffectParams;
			}
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
		
		save: function(name) {
			this.create();
			
			var msgType = this.isUpdating ? module.EventTypes.ParticleFxUpdated 
				: module.EventTypes.ParticleFxAdded;
										
			this.currentParticleEffect.name = name;
			this.currentParticleEffect.particles = null;
				
			this.notifyListeners(msgType, this.currentParticleEffect);
			
			this.currentParticleEffect = null;
			this.particleEffectParams = {};
			this.isUpdating = false;	
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                    Particle Effects Edit Sidebar Widget                    //
////////////////////////////////////////////////////////////////////////////////     
		
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.PteFxEditSBWidgetDefaults = {
		name: 'pteFxEditSBWidget',
		uiFile: 'editor/tools/html/particleFxForms.htm',
		manualVisible: true
	};
	
	module.tools.PteFxEditSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.PteFxEditSBWidgetDefaults, options);
		    this._super(newOpts);	
		},
		
		finishLayout: function() {
			this._super();
			
			this.find('form').bind('submit', function(evt) {
				return false;
			});
			
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
				wgt = this;
						
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
					
					wgt.notifyListeners(module.EventTypes.ParticleFxType, val);
				}
				else {
					wgt.reset();
				}
			});
			
			stateSelect.bind('change', function(evt) {
				var elem = jQuery(this),
					val = elem.val();
					
				wgt.notifyListeners(module.EventTypes.SetParticleFxState, val);
				wgt.canSave();
			});
			
			nameInput.bind('keydown', function(evt) {
				wgt.canSave();
			});
			
			fireInterval.bind('change', function(evt) {
				var val = fireInterval.val();
				
				wgt.notifyListeners(module.EventTypes.SetParticleFxFireInterval, val);
			});
			
			// bind save button
			saveBtn.bind('click', function(evt) {				
				wgt.notifyListeners(module.EventTypes.SaveParticleFx, nameInput.val());
				wgt.reset();
			});
			
			// bind cancel button
			cancelBtn.bind('click', function(evt) {
				wgt.reset();
				wgt.notifyListeners(module.EventTypes.CancelCreateParticleFx, null);
			});
			
			// bind preview buttons
			previewStartBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.StartParticleFxPreview, nameInput.val());
			});
			previewStopBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.StopParticleFxPreview, nameInput.val());
			});
			
			// bind inputs
			inputs.bind('blur', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					param = elem.attr('id').replace('pte-', '');
				
				if (val === '') {
					wgt.notifyListeners(module.EventTypes.RemoveParticleFxParam, param);
				} else {
					var errorMsg = null;
					
					if (param === 'billboard') {
						val = val.toLowerCase();
						
						if (val !== 'true' && val !== 'false') {
							errorMsg = param + ' must be a boolean';
						}
					} else {
						val = parseFloat(val);
						
						if (isNaN(val)) {
							errorMsg = param + ' must be a number';
						}
					}
					
					if (errorMsg === null) {
						wgt.notifyListeners(module.EventTypes.SetParticleFxParam, {
							paramName: param,
							paramVal: val
						});
					}
					else {
						elem.val('').trigger('focus');
						alert(errorMsg);
					}
				}
			});
			
			this.setupColorPickers();
			this.setupAutoFills(this.find('input.vector, input.quat, #pteColors .range input.color'));
		},
		
		reset: function() {      
			// reset selects
			this.find('#pteType').val(-1).removeAttr('disabled');
			this.find('#pteState').val(-1);
			
			// set all inputs to blank
			this.find('form input').val('');
			
			// disable the save button
			this.find('#pteSaveBtn').attr('disabled', 'disabled');
			
			// remove additional color ramp values
			this.find('.colorRampAdd').remove();
			this.find('#pteAddColorToRamp').data('ndx', 1);
			
			// reset color pickers
			this.colorMultPicker.reset();
			this.colorRamp0Picker.reset();	
		},
		
		edit: function(effect, editId) {
			this.reset();
			
			if (effect) {
				var params = effect.params, 
					type = effect.citizenType.replace('hemi.effect.', ''), 
					colorRamp = effect.colorRamp, 
					state = effect.state, 
					fireInt = effect.fireInterval, 
					numColors = colorRamp.length / 4, 
					colorAdder = this.find('#pteAddColorToRamp');
				
				this.find('#pteType').val(type).change();
				this.find('#pteName').val(effect.name);
				
				for (var paramName in params) {
					var val = params[paramName];
					
					if (paramName.match('colorMult')) {
						this.colorMultPicker.setColor(val);
					}
					else 
						if (paramName.match(/acceleration|position|velocity|world/)) {
							this.find('#pte-' + paramName + 'X').val(val[0]).removeClass('vectorHelper');
							this.find('#pte-' + paramName + 'Y').val(val[1]).removeClass('vectorHelper');
							this.find('#pte-' + paramName + 'Z').val(val[2]).removeClass('vectorHelper');
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
					var temp = this.find('#pteColorRamp' + ndx + 'R'), 
						rampNdx = ndx * 4, 
						r = colorRamp[rampNdx], 
						g = colorRamp[rampNdx + 1], 
						b = colorRamp[rampNdx + 2], 
						a = colorRamp[rampNdx + 3];
					
					var picker = this['colorRamp' + ndx + 'Picker'];
					picker.setColor([r, g, b, a]);
				}
				
				this.canSave();
			}
			
			this.invalidate();
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
		
		validateNumeric: function(input) {
		},
		
		setupColorPickers: function() {
			var wgt = this,
				colorAdder = this.find('#pteAddColorToRamp');
			
			this.colorMultPicker = new module.ui.ColorPicker({
				inputId: 'pte-colorMult',	
				container: wgt.find('#pteColorMultDiv'),
				buttonId: 'pteColorMultPicker'			
			});
			
			this.colorRamp0Picker = new module.ui.ColorPicker({
				inputId: 'pte-colorRamp0',	
				container: wgt.find('#pteColorRamp0Div'),
				buttonId: 'pteColorRamp0Picker'			
			});
			
			// add listeners
			this.colorMultPicker.addListener(module.EventTypes.ColorPicked, function(clr) {				
				wgt.notifyListeners(module.EventTypes.SetParticleFxParam, {
					paramName: 'colorMult',
					paramVal: clr
				});
			});
			
			this.colorRamp0Picker.addListener(module.EventTypes.ColorPicked, function(clr) {
				wgt.notifyListeners(module.EventTypes.SetParticleFxColorRamp, {
					color: clr,
					ndx: 0
				});
			});
			
			// setup the color ramp adder
			colorAdder.bind('click', function(evt) {
				wgt.addColorInput();
			})
			.data('ndx', 1);
		},
		
		addColorInput: function() {
			var colorAdder = this.find('#pteAddColorToRamp'),
				ndx = colorAdder.data('ndx'),
				div = jQuery('<div class="colorRampAdd"></div>'),
				wgt = this;
			
			colorAdder.before(div);
			
			var colorPicker = wgt['colorRamp' + ndx + 'Picker'] = 
				new module.ui.ColorPicker({
					inputId: 'pte-colorRamp' + ndx,
					container: div,
					buttonId: 'pteColorRamp' + ndx + 'Picker'
				});
			
			colorPicker.addListener(module.EventTypes.ColorPicked, function(clr) {
				wgt.notifyListeners(module.EventTypes.SetParticleFxColorRamp, {
					color: clr,
					ndx: ndx
				});
			});
			
			colorAdder.data('ndx', ndx+1);
		},
	
		setupAutoFills: function(inputs) {
			var wgt = this;
			
			inputs.filter('.xNdx').val('x');
			inputs.filter('.yNdx').val('y');
			inputs.filter('.zNdx').val('z');
			inputs.filter('.rNdx').val('r');
			inputs.filter('.gNdx').val('g');
			inputs.filter('.aNdx').val('a');
			inputs.filter('.bNdx').val('b');
			inputs.filter('.cNdx').val('c');
			inputs.filter('.dNdx').val('d');
						
			// setup autofills for vectors
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
					type = cls.match(/xNdx|yNdx|zNdx|rNdx|gNdx|aNdx|bNdx|cNdx|dNdx/),
					paramName;
				
				param = param.substring(0, param.length-1);
				paramName = param.replace('pte-', '');
				
				if (val === '') {
					elem.val(type[0].replace('Ndx', '')).addClass('vectorHelper');
					wgt.notifyListeners(module.EventTypes.RemoveParticleFxParam, paramName);
				}
				else {
					var x = parseFloat(jQuery('#' + param + 'X').val()),
						y = parseFloat(jQuery('#' + param + 'Y').val()),
						z = parseFloat(jQuery('#' + param + 'Z').val()),
						r = parseFloat(jQuery('#' + param + 'R').val()),
						g = parseFloat(jQuery('#' + param + 'G').val()),
						a = parseFloat(jQuery('#' + param + 'A').val()),
						b = parseFloat(jQuery('#' + param + 'B').val()),
						c = parseFloat(jQuery('#' + param + 'C').val()),
						d = parseFloat(jQuery('#' + param + 'D').val());
					
					if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
						totalVal = [x, y, z];
					}
					else if (!isNaN(r) && !isNaN(g) && !isNaN(b) &&!isNaN(a)) {
						totalVal = [r, g, b, a];
					}
					else if (!isNaN(a) && !isNaN(b) && !isNaN(c) &&!isNaN(d)) {
						totalVal = [a, b, c, d];
					}
					
					if (totalVal) {
						wgt.notifyListeners(module.EventTypes.SetParticleFxParam, {
							paramName: paramName,
							paramVal: totalVal
						});
					}
				}
			})
			.bind('focus', function(evt) {
				var elem = jQuery(this),
					val = elem.val();
				if (val === 'x' || val === 'y' || val === 'z' || val === 'r'
					|| val === 'g' || val === 'b' || val === 'a' || val === 'c' 
					|| val === 'd') {
					elem.val('');
				}
			})
			.addClass('vectorHelper');
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
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                   Particle Effects List Sidebar Widget                     //
////////////////////////////////////////////////////////////////////////////////     
	
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.PteFxListSBWidgetDefaults = {
		name: 'pteFxListSBWidget',
		listId: 'pteFxList',
		prefix: 'pteLst',
		title: 'Particle Effects',
		instructions: "Click 'Create Particle Effect' to create a new particle effect."
	};
	
	module.tools.PteFxListSBWidget = module.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.PteFxListSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.items = new Hashtable();		
		},
		
		layoutExtra: function() {
			this.buttonDiv = jQuery('<div class="buttons"></div>');
			this.createBtn = jQuery('<button id="createParticleFx">Create Particle Effect</button>');
			var wgt = this;
						
			this.createBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.CreateParticleFx, null);
			});
			
			this.buttonDiv.append(this.createBtn);
			
			return this.buttonDiv;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var effect = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.EditParticleFx, effect);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var effect = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.RemoveParticleFx, effect);
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
     * Configuration object for the ParticleFxMgrView.
     */
    module.tools.ParticleFxMgrViewDefaults = {
        toolName: 'Particle Effects',
		toolTip: 'Particle Effects: Create and edit particle effects',
		widgetId: 'particleEffectsBtn',
		axnBarId: 'pteActionBar'
    };
    
    module.tools.ParticleFxMgrView = module.tools.ToolView.extend({
		init: function(options) {
	        var newOpts = jQuery.extend({}, module.tools.ParticleFxMgrViewDefaults, options);
	        this._super(newOpts);
			
			this.addSidebarWidget(new module.tools.PteFxEditSBWidget());
			this.addSidebarWidget(new module.tools.PteFxListSBWidget());
	    }
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The ParticleFxMgrController facilitates AnimatorModel and AnimatorView
     * communication by binding event and message handlers.
     */
    module.tools.ParticleFxMgrController = module.tools.ToolController.extend({
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
	        	that = this;
	                	        
	        view.addListener(module.EventTypes.ToolModeSet, function(value) {
	            var isDown = value === module.tools.ToolConstants.MODE_DOWN;
	        });
			
			// create widget specific
			pteEdt.addListener(module.EventTypes.ParticleFxType, function(value) {
				model.setType(value);
			});	        
	        pteEdt.addListener(module.EventTypes.RemoveParticleFxParam, function(value) {
	        	model.removeParam(value);
	        });	        
	        pteEdt.addListener(module.EventTypes.SetParticleFxParam, function(value) {
	        	model.setParam(value.paramName, value.paramVal);
	        });	        
	        pteEdt.addListener(module.EventTypes.SetParticleFxColorRamp, function(value) {
	        	model.addToColorRamp(value.ndx, value.color);
	        });			
			pteEdt.addListener(module.EventTypes.SetParticleFxState, function(value) {
				model.setState(value);
			});			
			pteEdt.addListener(module.EventTypes.SetParticleFxFireInterval, function(value) {
				model.setFireInterval(value);
			});			
			pteEdt.addListener(module.EventTypes.StartParticleFxPreview, function(value) {
				model.preview();
			});			
			pteEdt.addListener(module.EventTypes.StopParticleFxPreview, function(value) {
				model.stopPreview();
			});			
			pteEdt.addListener(module.EventTypes.SaveParticleFx, function(name) {
				model.save(name);
				pteEdt.setVisible(false);
			});			
			pteEdt.addListener(module.EventTypes.PreviewCurrentFx, function(value) {
				if (value.show) {
					model.previewEffect(value.effect);	
				}			
				else {
					model.stopPreviewEffect(value.effect);
				}
			});			
			pteEdt.addListener(module.EventTypes.CancelCreateParticleFx, function(name) {
				var isDown = view.mode === module.tools.ToolConstants.MODE_DOWN;
				pteLst.setVisible(true && isDown);
				pteEdt.setVisible(false);
			});		
			
			// list widget specific
			pteLst.addListener(module.EventTypes.CreateParticleFx, function() {
				var isDown = view.mode === module.tools.ToolConstants.MODE_DOWN;
				pteEdt.setVisible(true && isDown);
				pteLst.setVisible(false);
			});			
			pteLst.addListener(module.EventTypes.EditParticleFx, function(effect) {
				var isDown = view.mode === module.tools.ToolConstants.MODE_DOWN;
				model.setEffect(effect);
				pteEdt.setVisible(true && isDown);
				pteLst.setVisible(false);
				pteEdt.edit(effect);
			});			
			pteLst.addListener(module.EventTypes.RemoveParticleFx, function(effect) {
				model.removeEffect(effect);
				pteEdt.reset();
			});
			
			// model specific
			model.addListener(module.EventTypes.ParticleFxAdded, function(particleFx) {
				var isDown = view.mode === module.tools.ToolConstants.MODE_DOWN;
				pteLst.setVisible(true && isDown);
				pteEdt.setVisible(false);
				pteLst.add(particleFx);			
			});			
			model.addListener(module.EventTypes.ParticleFxUpdated, function(particleFx) {	
				var isDown = view.mode === module.tools.ToolConstants.MODE_DOWN;
				pteLst.setVisible(true && isDown);	
				pteEdt.setVisible(false);			
				pteLst.update(particleFx);
			});			
			model.addListener(module.EventTypes.ParticleFxRemoved, function(value) {
				pteEdt.reset();
			});			
			model.addListener(module.EventTypes.WorldLoaded, function(effects) {		
				for (var ndx = 0, len = effects.length; ndx < len; ndx++) {
					var eft = effects[ndx];
					pteLst.add(eft);
				}
			});			
			model.addListener(module.EventTypes.WorldCleaned, function(effects) {		
				pteLst.list.clear();
			});
	    }
	});
    
    return module;
})(editor || {});
