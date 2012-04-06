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
 
 // TODO: Octane targets for spot and directional lights.
 (function() {
	"use strict";
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Initialization
////////////////////////////////////////////////////////////////////////////////////////////////////

	var shorthand = editor.tools.lights;

	shorthand.init = function() {
		var navPane = editor.ui.getNavPane('Environment'),
			
			lightsMdl = new LightsModel(),
			lightsView = new LightsView(),
			lightsCtr = new LightsController();
						
		lightsCtr.setModel(lightsMdl);
		lightsCtr.setView(lightsView);
		
		navPane.add(lightsView);
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Tool Definition
////////////////////////////////////////////////////////////////////////////////////////////////////
    
    shorthand.events = {
		// create sidebar widget specific
		PreviewLight: "Lights.PreviewLight",
		SaveLight: "Lights.SaveLight"
    };
    
////////////////////////////////////////////////////////////////////////////////////////////////////
// Model
////////////////////////////////////////////////////////////////////////////////////////////////////
    
    /**
     * An LightsModel handles the creation, updating, and removal of 
     * lights
     */
    var LightsModel = function() {
		editor.ToolModel.call(this, 'lights');
        
        this.currentLight = null;
        this.prevLight = null;
    };
		
	LightsModel.prototype = new editor.ToolModel();
	LightsModel.prototype.constructor = LightsModel;
		
	LightsModel.prototype.previewLight = function(props) {
		if (this.currentLight !== null) {
            this.currentLight.removeFromScene();
            //this.currentLight.refreshMaterial();
        }
        if(this.prevLight) {
            this.prevLight.cleanup();
        }
        
        this.prevLight = new hemi.Light(editor.client, this.createLight(props.lightInfo));
        this.prevLight.name = editor.ToolConstants.EDITOR_PREFIX + 'PreviewLight';
        //this.prevLight.refreshMaterial();
	};
	
    
	LightsModel.prototype.removeLight = function(light) {
		this.notifyListeners(editor.events.Removing, light);
        if (light == this.currentLight) {
            this.setLight(null);
        }
        light.cleanup();        
        
	};
	
	LightsModel.prototype.saveLight = function(props) {
        var light, msgType;
		if (this.prevLight !== null) {
            this.prevLight.cleanup();
            this.prevLight = null;
        }
        
        if (this.currentLight !== null) {
            light = this.currentLight;
            light.removeFromScene();
            light.light = this.createLight(props.lightInfo);            
            light.addToScene();
            //light.updateTargetMatrix();
            //light.refreshMaterial();
            msgType = editor.events.Updated;
        } else {
            light = this.currentLight = new hemi.Light(editor.client, this.createLight(props.lightInfo));
            //light.updateTargetMatrix();
            //light.refreshMaterial();
            msgType = editor.events.Created;
        }
        light.setName(props.name);
        this.notifyListeners(msgType, light)
        this.currentLight = null;
	};
	
    LightsModel.prototype.setLight = function(light) {
        if (this.prevLight !== null) {
            this.prevLight.cleanup();
            this.prevLight = null;
        }
        if (this.currentLight !== null) {
            this.currentLight.addToScene();
            //this.currentLight.refreshMaterial();
        }
        
        this.currentLight = light;
        this.notifyListeners(editor.events.Editing, light);
    };
    
    LightsModel.prototype.createLight = function(lightInfo) {
        var type = lightInfo.type,
            light;
        switch(type) {
            case hemi.LightType.AMBIENT:
                light = new THREE.AmbientLight(lightInfo.color);
                break;
            case hemi.LightType.SPOT:
                // false is the default for shadow
                light = new THREE.SpotLight(lightInfo.color, lightInfo.intensity, lightInfo.distance,false);
                light.position = lightInfo.position;
                // shadows 
                break;
            case hemi.LightType.DIRECTIONAL:
                light = new THREE.DirectionalLight(lightInfo.color, lightInfo.intensity);
                light.position = lightInfo.position;
                light.target.position = lightInfo.target;
                break;  
            case hemi.LightType.POINT:
                light = new THREE.PointLight(lightInfo.color, lightInfo.intensity, lightInfo.distance);
                light.position = lightInfo.position;
                break;  
        }    
        return light;
    };
    
	LightsModel.prototype.worldCleaned = function() {
		var lights = hemi.world.getLights();
        
        for (var ndx = 0, len = lights.length; ndx < len; ndx++) {
			this.notifyListeners(editor.events.Removing, lights[ndx]);
		}
    };
    
    LightsModel.prototype.worldLoaded = function() {
		var lights = hemi.world.getLights();
        
        for (var ndx = 0, len = lights.length; ndx < len; ndx++) {
			this.notifyListeners(editor.events.Created, lights[ndx]);
		}		
    };
    

////////////////////////////////////////////////////////////////////////////////////////////////////
// Create Light Sidebar Widget
////////////////////////////////////////////////////////////////////////////////////////////////////
			
	var CreateWidget = function() {
		editor.ui.FormWidget.call(this, {
			name: 'createLightWidget',
			uiFile: 'js/editor/plugins/lights/html/lightsForms.htm',
		});
			
		this.inputsToCheck = [];
	};
	var crtWgtSuper = editor.ui.FormWidget.prototype;
		
	CreateWidget.prototype = new editor.ui.FormWidget();
	CreateWidget.prototype.constructor = CreateWidget;
	
	CreateWidget.prototype.layout = function() {
		crtWgtSuper.layout.call(this);
		
		var form = this.find('form'),
			saveBtn = this.find('#lightSaveBtn'),
			cancelBtn = this.find('#lightCancelBtn'),
            // Need inputs?
			inputs = this.find('input:not(#lightName, .vector, .color)'),
			previewBtn = this.find('#lightPreviewBtn'),
			validator = editor.ui.createDefaultValidator(),
			wgt = this;
		
		this.lightType = this.find('#lightTypeSelect');
		
		this.lightIntensity = new editor.ui.Input({
			container: wgt.find('#lightIntensity')
		});
		this.lightDistance = new editor.ui.Input({
			container: wgt.find('#lightDistance')
		});

		this.lightName = new editor.ui.Input({
			container: wgt.find('#lightName'),
			type: 'string'
		});
		
		this.colorPicker = new editor.ui.ColorPicker({
			inputId: 'lightColor',
			buttonId: 'lightColorPicker'
		});
		this.find('#lightColorLbl').after(this.colorPicker.getUI());
		
		this.lightPosition = new editor.ui.Vector({
			container: wgt.find('#lightPositionDiv'),
			onBlur: function(ipt, evt) {
				wgt.checkToggleButtons();
			},
			validator: validator
		});
		
        this.lightTarget = new editor.ui.Vector({
			container: wgt.find('#lightTargetDiv'),
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
		this.lightType.bind('change', function(evt) {
			var val = wgt.lightType.val(),
				inputs = [];
			
			wgt.lightIntensity.reset();
			wgt.lightDistance.reset();
			wgt.find('.optional').parent().hide();
			
			// switch between lights
			switch(val) {
                case hemi.LightType.POINT:
                    wgt.lightDistance.getUI().parent().show();
                    wgt.lightIntensity.getUI().parent().show();
                    wgt.lightPosition.getUI().parent().show();
                    inputs.push(wgt.lightDistance);
                    inputs.push(wgt.lightIntensity);
                    inputs.push(wgt.lightPosition);
                    break;
                case hemi.LightType.DIRECTIONAL:
                    wgt.lightIntensity.getUI().parent().show();
                    wgt.lightPosition.getUI().parent().show();
                    wgt.lightTarget.getUI().parent().show();
                    inputs.push(wgt.lightIntensity);
                    inputs.push(wgt.lightPosition);
                    inputs.push(wgt.lightTarget);
                    break;
                case hemi.LightType.SPOT:
                    wgt.lightDistance.getUI().parent().show();
                    wgt.lightIntensity.getUI().parent().show();
                    wgt.lightPosition.getUI().parent().show();
                    inputs.push(wgt.lightDistance);
                    inputs.push(wgt.lightIntensity);
                    inputs.push(wgt.lightPosition);
                    // cast shadow?
                    break;
                case hemi.LightType.AMBIENT:
                    break;
			}
			
			wgt.inputsToCheck = inputs;
			wgt.invalidate();
			saveBtn.attr('disabled', 'disabled');
			previewBtn.attr('disabled', 'disabled');
		});
		
		this.lightName.getUI().bind('keyup', function(evt) {
			wgt.checkToggleButtons();
		});
		
		saveBtn.bind('click', function(evt) {
			var props = wgt.getProperties();
			wgt.notifyListeners(shorthand.events.SaveLight, props);
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
			wgt.notifyListeners(shorthand.events.PreviewLight, props);
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
		var name = this.lightName.getValue(),
			saveBtn = this.find('#lightSaveBtn'),
			previewBtn = this.find('#lightPreviewBtn'),
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
		var type = this.lightType.val(),
			wgt = this,
			props = {
				name: wgt.lightName.getValue()				
			},
			lightInfo = {
				color: wgt.colorPicker.getColorHex(),
				type: type
			};
		switch (type) {
            case hemi.LightType.POINT:
                lightInfo.distance = this.lightDistance.getValue();
                lightInfo.intensity = this.lightIntensity.getValue();
                var pos = this.lightPosition.getValue();
                lightInfo.position = new THREE.Vector3(pos[0], pos[1], pos[2]);
                break;
            case hemi.LightType.DIRECTIONAL:
                lightInfo.distance = this.lightDistance.getValue();
                lightInfo.intensity = this.lightIntensity.getValue();
                var pos = this.lightPosition.getValue();
                lightInfo.position = new THREE.Vector3(pos[0], pos[1], pos[2]);
                var tgt = this.lightTarget.getValue();
                lightInfo.target = new THREE.Vector3(tgt[0], tgt[1], tgt[2]);
                break;
            case hemi.LightType.SPOT:
                lightInfo.distance = this.lightDistance.getValue();
                lightInfo.intensity = this.lightIntensity.getValue();
                var pos = this.lightPosition.getValue();
                lightInfo.position = new THREE.Vector3(pos[0], pos[1], pos[2]);
                break;
                // cast shadow?
                break;
            case hemi.LightType.AMBIENT:
                break;
		}
		
		props.lightInfo = lightInfo;
		return props;
	};
	
	CreateWidget.prototype.reset = function() {		
		// hide optional inputs
		this.find('.optional').parent().hide();
		
		// reset selects
		this.lightType.val(-1);
		
		// reset all inputs
        this.lightDistance.reset();
        this.lightIntensity.reset();
        this.lightPosition.reset();
        this.lightTarget.reset();
        this.lightName.reset();
	
		// reset the colorpicker
		this.colorPicker.reset();
					
		// disable the save and preview buttons
		this.find('#lightSaveBtn').attr('disabled', 'disabled');
		this.find('#lightPreviewBtn').attr('disabled', 'disabled');
	};
	
	CreateWidget.prototype.set = function(light) {
		// set the type
        var type;
        switch(light.light._octaneType) {
            case 'THREE.AmbientLight':
                type = hemi.LightType.AMBIENT;
                break;
            case 'THREE.SpotLight':
                type = hemi.LightType.SPOT;
                break;
            case 'THREE.DirectionalLight':
                type = hemi.LightType.DIRECTIONAL;
                break;
            case 'THREE.PointLight':
                type = hemi.LightType.POINT;
                break;
        }
		this.lightType.val(type).change();
		
		
		// set the dimension values
		for (var prop in light.light) {
			var val = light.light[prop];
			
			switch(prop) {
				case 'intensity':
					this.lightIntensity.setValue(val);
					break;
				case 'distance':
					this.lightDistance.setValue(val);
					break;
				case 'position':
                    var translation = light.light.position;
                    this.lightPosition.setValue({
                        x: translation.x,
                        y: translation.y,
                        z: translation.z
                    });
					break;
                case 'target':
                    var target = light.light.target.position;
                    
                    this.lightTarget.setValue({
                        x: target.x,
                        y: target.y,
                        z: target.z
                    });
			}
		}
		
		// set the color
        var lightColor = light.light.color;
        var color = [];
        color = [lightColor.r, lightColor.g, lightColor.b, 1]
        this.colorPicker.setColor(color);
        
		// set the name
		this.lightName.setValue(light.name);
		
		// set the buttons
		this.checkToggleButtons();
	};
         
////////////////////////////////////////////////////////////////////////////////////////////////////
// View
////////////////////////////////////////////////////////////////////////////////////////////////////  
    
    var LightsView = function() {
        editor.ToolView.call(this, {
			toolName: 'Lights',
			toolTip: 'Create and edit lights',
			id: 'lights'
		});
		
		this.addPanel(new editor.ui.Panel({
			classes: ['lightSidePanel']
		}));
		
		this.sidePanel.addWidget(new CreateWidget());
		this.sidePanel.addWidget(new editor.ui.ListWidget({
			name: 'lightListWidget',
			listId: 'lightList',
			prefix: 'lightLst',
			title: 'Lights',
			instructions: "Add lights above."
		}));
    };
		
	LightsView.prototype = new editor.ToolView();
	LightsView.prototype.constructor = LightsView;
    
////////////////////////////////////////////////////////////////////////////////////////////////////
// Controller
////////////////////////////////////////////////////////////////////////////////////////////////////

    var LightsController = function() {
		editor.ToolController.call(this);
	};
	var lightCtrSuper = editor.ToolController.prototype;
		
	LightsController.prototype = new editor.ToolController();
	LightsController.prototype.constructor = LightsController;

    /**
     * Binds event and message handlers to the view and model this object 
     * references.  
     */
    LightsController.prototype.bindEvents = function() {
        lightCtrSuper.bindEvents.call(this);
        
        var model = this.model,
			view = this.view,
			crtWgt = view.sidePanel.createLightWidget,
			lstWgt = view.sidePanel.lightListWidget;
			
		view.addListener(editor.events.ToolModeSet, function(value) {
			var isDown = value.newMode === editor.ToolConstants.MODE_DOWN;
			
			if (model.prevLight) {
                if (isDown) {
                    model.prevLight.addToScene();
                    //this.prevLight.refreshMaterial();
                } else {
                    model.prevLight.removeFromScene();
                    //this.prevLight.refreshMaterial();
                }
                if (model.currentLight) {
                    if (isDown) {
                        model.prevLight.removeFromScene();
                        //this.prevLight.refreshMaterial();
                    } else {
                        model.prevLight.addToScene();
                        //this.prevLight.refreshMaterial();
                    }
                }
			}
		});
		
		// create sidebar widget listeners
		crtWgt.addListener(shorthand.events.SaveLight, function(props) {				
            model.saveLight(props);
            crtWgt.reset();

		});		
		crtWgt.addListener(shorthand.events.PreviewLight, function(props) {
			model.previewLight(props);
		});
		crtWgt.addListener(editor.events.Cancel, function() {
            model.setLight(null);
		});	
		
		// list sidebar widget listeners
		lstWgt.addListener(editor.events.Edit, function(light) {				
            model.setLight(light)
		});	
		lstWgt.addListener(editor.events.Remove, function(light) {
			 model.removeLight(light);
		});
		
		// model specific listeners
		model.addListener(editor.events.Created, function(light) {
            lstWgt.add(light);
		});
		model.addListener(editor.events.Editing, function(light) {
            if (light !== null) {
                crtWgt.set(light);
            }
		});		
		model.addListener(editor.events.Updated, function(light) {
			lstWgt.update(light);
		});		
		model.addListener(editor.events.Removing, function(light) {
			 lstWgt.remove(light);
		});
    };
})();
