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
	editor.ui = editor.ui || {};
	
    editor.EventTypes = editor.EventTypes || {};
	
	// jquery triggered events
	editor.EventTypes.VectorValueSet = 'editor.vector.VectorValueSet';
	
	editor.ui.VectorDefaults = {
		container: null,
		inputs: ['x', 'y', 'z'],
		type: 'vector',
		inputType: 'number',
		paramName: '',
		onBlur: null,
		validator: null
	};
	
////////////////////////////////////////////////////////////////////////////////
//                                Component		                              //
////////////////////////////////////////////////////////////////////////////////
	
	editor.ui.Vector = editor.ui.Component.extend({
		init: function(options) {
			var newOpts =  jQuery.extend({}, editor.ui.VectorDefaults, 
					options),
				ipts = newOpts.inputs;
			
			this.unbounded = ipts.length === 0;
			this.multiDim = jQuery.isArray(ipts[0]);
			this.multiDimUnbounded = this.multiDim && ipts[0].length === 0;
			
			this.inputs = [];
			
			this._super(newOpts);
		},
		
		finishLayout: function() {
			// initialize container
			this.container = this.config.container;
			
			if (this.unbounded || this.multiDimUnbounded) {
				layoutUnbounded.call(this);
			}
			else {
				layoutBounded.call(this);
			}
			
			this.validator = new editor.ui.VectorValidator(this);
		},
		
		setValue: function(values) {	
			if (this.unbounded || this.multiDimUnbounded) {
				setUnboundedValue.call(this, values);
			}
			else {
				setBoundedValue.call(this, values);
			}
		},
		
		getValue: function() {
			return (this.unbounded || this.multiDimUnbounded) ?
				getUnboundedValue.call(this) :
				getBoundedValue.call(this);
		},
		
		reset: function() {
			this.find('.' + this.config.type).focus().val('').blur();
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                              Private Methods                               //
////////////////////////////////////////////////////////////////////////////////
	
	var createInput = function() {
			return jQuery('<input type="text" class="' + this.config.type + '" />');
		},
		
		createDiv = function(ndx) {
			var div = jQuery('<div class="vectorVec"></div>'),
				addBtn = jQuery('<button>Add</button>'),
				elem = new editor.ui.Input({
					validator: this.config.validator,
					inputClass: this.config.type,
					type: this.config.inputType
				}),
				wgt = this;
				
			addBtn.bind('click', function() {
				var btn = jQuery(this),
					i = btn.data('ndx'),
					newElem = new editor.ui.Input({
						validator: wgt.config.validator,
						inputClass: wgt.config.type,
						type: wgt.config.inputType
					});
					
				wgt.inputs[i].push(newElem);
				btn.before(newElem.container);
			})
			.data('ndx', ndx);
			
			div.append(elem.container).append(addBtn);
			
			return {
				div: div,
				inputs: [elem]
			};
		},
			
		getBoundedValue = function() {
			var values = [],
				isComplete = true;
			
			for (var i = 0, il = this.inputs.length; i < il && isComplete; i++) {
				var obj = this.inputs[i],
					val = obj.elem.getValue(),
					isComplete = val !== '' && val !== null;
				
				if (isComplete) {
					if (this.multiDim) {
						var a = values[obj.ndx1];
						
						if (a == null) {
							a = values[obj.ndx1] = [];
						}
						
						a[obj.ndx2] = val;
					}
					else {
						values[obj.ndx1] = val;
					}
				}
			}
			
			return isComplete ? values : null;
		},
		
		getUnboundedValue = function() {
			var values = [],
				isComplete = true,
				getVal = function(elem) {					
					var val = obj.elem.getValue();
					
					if (val === '') {
						val = null;
					}
					
					return val;
				};
			
			for (var i = 0, il = this.inputs.length; i < il && isComplete; i++) {
				var ipt = this.inputs[i];
				
				if (jQuery.isArray(ipt)) {
					var subVals = [];
					for (var j = 0, jl = ipt.length; j < jl && isComplete; j++) {
						var val = getVal(ipt[j]);
						subVals.push(val);
						isComplete = val != null;
					}
					values.push(subVals);
				}
				else {
					var val = getVal(ipt);
					values.push(val);
					isComplete = val != null;
				}
			}
			
			return isComplete ? values : null;
		},
		
		layoutBounded = function() {
			var inputs = this.config.inputs,
				param = this.config.paramName,
				type = this.config.type,
				wgt = this,
				il = inputs.length,
				noPlaceHolders = false;
				
			// first detect a number or a list of placeholders
			if (inputs.length === 1 && hemi.utils.isNumeric(inputs[0])) {
				il = inputs[0];
				noPlaceHolders = true;
			}
			for (var i = 0; i < il; i++) {
				var ipt = inputs[i];
				
				if (this.multiDim) {
					var div = jQuery('<div class="vectorVec"></div>');
					
					if (ipt.length === 1 && hemi.utils.isNumeric(ipt[0])) {
						jl = ipt[0];
						noPlaceHolders = true;
					}
					
					for (var j = 0; j < jl; j++) {
						var inputTxt = ipt[j],
							elem = new editor.ui.Input({
								validator: this.config.validator,
								inputClass: this.config.type,
								type: this.config.inputType
							});
						
						if (!noPlaceHolders) {
							elem.container.attr('placeholder', inputTxt);
						}
						
						this.inputs.push({
							ndx1: i,
							ndx2: j,
							key: inputTxt,
							elem: elem
						});
						div.append(elem.container);
					}
					this.container.append(div);
				}
				else {
					var elem = new editor.ui.Input({
						validator: this.config.validator,
						inputClass: this.config.type,
						type: this.config.inputType
					});
					
					if (!noPlaceHolders) {
						elem.container.attr('placeholder', ipt);
					}
					
					this.inputs.push({
						ndx1: i,
						key: ipt,
						elem: elem
					});
					this.container.append(elem.container);
				}
			}
				
			setupAutoFills.call(this);
		},
		
		layoutUnbounded = function() {
			var wgt = this,
				i = 0;
			
			this.addBtn = jQuery('<button>Add</button>');
			
			// initialize inputs
			do {
				if (this.multiDim) {
					var obj = createDiv.call(this, i);
					this.inputs.push(obj.inputs);
					this.container.append(obj.div);
				}
				else {
					var elem = new editor.ui.Input({
						validator: this.config.validator,
						inputClass: this.config.type,
						type: this.config.inputType
					});
					this.inputs.push(elem);
					this.container.append(elem.container);
				}
				
				i++;
			} while (i < this.config.inputs.length);
			
			this.addBtn.bind('click', function() {
				var btn = jQuery(this),
					ndx = btn.data('ndx');
				
				if (wgt.multiDim) {
					var obj = createDiv.call(wgt, ndx);
					wgt.inputs.push(obj.inputs);
					btn.before(obj.div);
				}
				else {
					var elem = new editor.ui.Input({
						validator: this.config.validator,
						inputClass: this.config.type,
						type: this.config.inputType
					});
					this.inputs.push(elem);
					btn.before(elem.container);
				}
				
				btn.data('ndx', ndx + 1);
			})
			.data('ndx', i);
										
			// add to container
			this.container.append(this.addBtn);
		},
	
		setupAutoFills = function() {
			var wgt = this,
				vectors = wgt.find('.' + this.config.type);
			
			vectors.bind('keydown', function(evt) {
				var elem = jQuery(this);
				elem.removeClass('vectorHelper');
			})
			.bind('blur', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					totVal = wgt.getValue();
				
				if (wgt.config.onBlur) {
					wgt.config.onBlur(elem, evt, wgt);
				}	
				else if (totVal != null) {
					wgt.notifyListeners(editor.EventTypes.VectorValueSet, 
						totVal);
				}
			});
		},
		
		setBoundedValue = function(values) {
			var inputs = this.inputs;
					
			if (jQuery.isArray(values)) {
				var find = function(ndx1, ndx2) {
						var found = null;
						
						for (var i = 0, il = inputs.length; i < il && found == null; i++) {
							var ipt = inputs[i],
								multi = ipt.ndx2 != null;
							
							if (multi && ipt.ndx1 === ndx1 && ipt.ndx2 === ndx2
									|| !multi && ipt.ndx1 === ndx1) {
								found = ipt;	
							}
						}	
						
						return found;				
					};
					
				// TODO: throw an error if values don't match our bounds
				for (var i = 0, il = values.length; i < il; i++) {
					var val = values[i];
					
					if (this.multiDim) {
						for (var j = 0, jl = val.length; j < jl; j++) {
							var subVal = val[j];							
							find(i, j).elem.setValue(subVal);
						}
					}
					else {
						find(i).elem.setValue(val);
					}
				}
			}
			else {
				for (var key in values) {
					var found = -1;
					
					for (var i = 0, il = inputs.length; i < il && found === -1; i++) {
						if (inputs[i].key == key) {
							found = i;
						}
					}
					
					var input = inputs[found].elem;
					
					if (input) {
						input.setValue(values[key]);
						input.container.removeClass('vectorHelper');
					}
				}
			}
		},
		
		setUnboundedValue = function(values) {
			this.container.find('.vectorVec').remove();
			this.inputs = [];
			
			for (var i = 0, il = values.length; i < il; i++) {
				var input = this.inputs[i],
					valRow = values[i],
					isArray = jQuery.isArray(valRow);
					
				if (input == null) {
					if (isArray) {
						var obj = createDiv.call(this, i);
						input = this.inputs[i] = obj.inputs;					
						this.addBtn.before(obj.div);	
						// for later
						input.div = obj.div;
					}
					else {
						input = this.inputs[i] = new editor.ui.Input({
							validator: this.config.validator,
							inputClass: this.config.type,
							type: this.config.inputType
						});					
						this.addBtn.before(input.container);	
					}				
				}
				
				if (isArray) {
					for (var j = 0, jl = valRow.length; j < jl; j++) {
						var val = valRow[j],
							ipt = input[j];
						
						if (ipt == null) {
							ipt = input[j] = new editor.ui.Input({
								validator: this.config.validator,
								inputClass: this.config.type,
								type: this.config.inputType
							});
						}
						ipt.setValue(val);
						input.div.find('button').before(ipt.container);
					}
				}
				else {
					input.setValue(values[i]);
				}
			}
		};
	
////////////////////////////////////////////////////////////////////////////////
//                               Helper Methods                               //
////////////////////////////////////////////////////////////////////////////////		
		
	var	contains = function(val, container) {
			var found = jQuery.inArray(val, container) !== -1;
			
			if (!found) {
				for (var i = 0, il = container.length; i < il && !found; i++) {
					var row = container[i];
					
					if (jQuery.isArray(row)) {
						found = jQuery.inArray(val, row) !== -1;
					} 
					else {
						break;
					}
				}
			}
			
			return found;
		};
			
	return editor;
})(editor || {});
