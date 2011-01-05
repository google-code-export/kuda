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
	
	// fog form sb widget events
	module.EventTypes.FogOnOff = "fog.FogOnOff";
	module.EventTypes.SaveFog = "fog.SaveFog";
	module.EventTypes.CancelFogEdit = "fog.CancelFogEdit";
	
	// model events
	module.EventTypes.FogVisible = "fog.FogVisible";
	module.EventTypes.FogWorldLoaded = "fog.FogWorldLoaded";
	
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////

	module.tools.FogModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
		},
		
		setVisible: function(visible) {
			if (visible && this.currentVals) {
				hemi.world.setFog(this.currentVals.color,
					this.currentVals.start,
					this.currentVals.end);
			}
			else {
				hemi.world.clearFog();
			}
			
			this.notifyListeners(module.EventTypes.FogVisible, visible);
		},
		
		save: function(params) {
			this.currentVals = params;
			this.setVisible(true);
		},
			
		worldCleaned: function() {
			this.currentVals = null;
			this.setVisible(false);
			this.notifyListeners(module.EventTypes.FogWorldLoaded, null);
	    },
	    
	    worldLoaded: function() {
			var fog = hemi.world.fog;
			
			this.currentVals = fog;
			this.notifyListeners(module.EventTypes.FogWorldLoaded, fog);
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     		 Fog Form Sidebar Widget                          //
//////////////////////////////////////////////////////////////////////////////// 
		
	/*
	 * Configuration object for the FogFormSBWidgetDefaults.
	 */
	module.tools.FogFormSBWidgetDefaults = {
		name: 'fogFormSBWidget',
		uiFile: 'editor/tools/html/fogForms.htm'
	};
	
	module.tools.FogFormSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.FogFormSBWidgetDefaults, options);
		    this._super(newOpts);
		},
		
		finishLayout: function() {
			this._super();
			
			this.onOff = this.find('#fogFormOnOff');
			this.start = this.find('#fogFormStart');
			this.end = this.find('#fogFormEnd');
			this.saveBtn = this.find('#fogFormSaveBtn');
			this.cancelBtn = this.find('#fogFormCancelBtn');
			var wgt = this,
				form = this.find('form');
				
			// add validation
			new module.ui.Validator(wgt.find('input.short'), function(elem) {
				var val = elem.val(),
					msg = null;
					
				if (val !== '' && !hemi.utils.isNumeric(val)) {
					msg = 'must be a number';
				}
				
				return msg;
			});
			
			this.colorPicker = new module.ui.ColorPicker({
				inputId: 'fogFormColor',	
				container: wgt.find('#fogFormColorDiv'),
				buttonId: 'fogFormColorPicker'			
			});
			
			this.colorPicker.addListener(module.EventTypes.ColorPicked, function(clr) {
				if (wgt.start.val() !== '' && wgt.end.val() !== '') {
					wgt.saveBtn.removeAttr('disabled');
					wgt.cancelBtn.removeAttr('disabled');
				}
			});
			
			this.onOff.bind('change', function(evt) {
				var elem = jQuery(this),
					checked = elem.is(':checked');
				
				wgt.notifyListeners(module.EventTypes.FogOnOff, checked);
			});
			
			form.find('input:not(type["checkbox"])').bind('keydown', function(evt) {
				if (wgt.start.val() !== '' && wgt.end.val() !== '') {
					wgt.saveBtn.removeAttr('disabled');
					wgt.cancelBtn.removeAttr('disabled');
				}
			});
			
			this.saveBtn.bind('click', function(evt) {
				var vals = {
					color: wgt.colorPicker.getColor(),
					start: parseInt(wgt.start.val()),
					end: parseInt(wgt.end.val())
				};
				
				wgt.notifyListeners(module.EventTypes.SaveFog, vals);
				
				wgt.saveBtn.attr('disabled', 'disabled');
				wgt.cancelBtn.attr('disabled', 'disabled');
			});
			
			this.cancelBtn.bind('click', function(evt) {
				wgt.saveBtn.attr('disabled', 'disabled');
				wgt.notifyListeners(module.EventTypes.CancelFogEdit, null);
				wgt.find('input.error').removeClass('error');
			});
			
			form.bind('submit', function(evt) {
				return false;
			});
		},
		
		set: function(vals) {
			if (vals === null) {
				this.colorPicker.reset();
				this.start.val('');
				this.end.val('');
				this.onOff.attr('checked', false);
			} else {
				this.colorPicker.setColor(vals.color);
				this.start.val(vals.start);
				this.end.val(vals.end);
				this.onOff.attr('checked', true);
			}
			
			this.saveBtn.attr('disabled', 'disabled');
			this.cancelBtn.attr('disabled', 'disabled');
		},
		
		canSave: function() {
			
		}
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////  

    /*
     * Configuration object
     */
    module.tools.FogViewDefaults = {
        toolName: 'Fog',
		toolTip: 'Fog: Create and edit fog',
        widgetId: 'fogBtn'
    }; 
	
	module.tools.FogView = module.tools.ToolView.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.FogViewDefaults, options);
			this._super(newOpts);
			
			this.addSidebarWidget(new module.tools.FogFormSBWidget());
		}
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    module.tools.FogController = module.tools.ToolController.extend({
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
				fogWgt = view.fogFormSBWidget,
	        	that = this;
	        
			// special listener for when the toolbar button is clicked
	        view.addListener(module.EventTypes.ToolModeSet, function(value) {
	            var isDown = value == module.tools.ToolConstants.MODE_DOWN;			
	        });
			
			// fog sb widget specific
			fogWgt.addListener(module.EventTypes.FogOnOff, function(turnOn) {
				model.setVisible(turnOn);
			});
			fogWgt.addListener(module.EventTypes.SaveFog, function(params) {
				model.save(params);
			});
			fogWgt.addListener(module.EventTypes.CancelFogEdit, function() {
				var curVals = model.currentVals;
				
				if (curVals) {
					fogWgt.set(curVals);
				}
				else {
					fogWgt.set(null);
				}
			});
			
			// model specific
			model.addListener(module.EventTypes.FogVisible, function(visible) {
				fogWgt.onOff.attr('checked', visible);
			});
			model.addListener(module.EventTypes.FogWorldLoaded, function(params) {
				if (fogWgt.colorPicker != null) {
					fogWgt.set(params);
				}
			});
	    }
	});
	
	return module;
})(editor || {});
