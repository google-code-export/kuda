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
		isNumeric: true,
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
			
			this.inputs = this.unbounded || this.multiDimUnbounded ? [] : 
				new Hashtable();
			
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
				elem = createInput.call(this),
				wgt = this;
				
			addBtn.bind('click', function() {
				var btn = jQuery(this),
					i = btn.data('ndx'),
					newElem = createInput.call(wgt);
					
				wgt.inputs[i].push(newElem);
				btn.before(newElem);
			})
			.data('ndx', ndx);
			
			div.append(elem).append(addBtn);
			
			return {
				div: div,
				inputs: [elem]
			};
		},
			
		getBoundedValue = function() {
			var keys = this.inputs.keys(),
				values = [],
				isComplete = true;
			
			for (var i = 0, il = keys.length; i < il && isComplete; i++) {
				var key = keys[i],
					obj = this.inputs.get(key),
					val = obj.elem.val(),
					newVal = null;
				
				if (this.config.isNumeric && hemi.utils.isNumeric(val)) {
					newVal = parseFloat(val);	
				}
				else if (val && val !== '') {
					newVal = val;
				}
				else {
					isComplete = false;
				}
				
				if (isComplete) {					
					if (this.multiDim) {
						var a = values[obj.ndx1];
						
						if (a == null) {
							a = values[obj.ndx1] = [];
						}
						
						a[obj.ndx2] = newVal;
					}
					else {
						values[obj.ndx1] = newVal;
					}
				}
			}
			
			return values;
		},
		
		getUnboundedValue = function() {
			var values = [],
				isComplete = true,
				wgt = this,
				getVal = function(ipt) {					
					var val = ipt.val(),
						retVal = val;
					
					if (wgt.config.isNumeric && hemi.utils.isNumeric(val)) {				
						retVal = parseFloat(val);	
					}
					else if (!val || val === '') {
						retVal = null;
					}
					
					return retVal;
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
				wgt = this;
				
			for (var i = 0, il = inputs.length; i < il; i++) {
				var ipt = inputs[i];
				
				if (this.multiDim) {
					var div = jQuery('<div class="vectorVec"></div>');
					for (var j = 0, jl = ipt.length; j < jl; j++) {
						var inputTxt = ipt[j];
							elem = createInput.call(this).data('ndx', inputTxt)
								.attr('placeholder', inputTxt);
						
						this.inputs.put(inputTxt, {
							ndx1: i,
							ndx2: j,
							elem: elem
						});
						div.append(elem);
					}
					this.container.append(div);
				}
				else {
					var elem = createInput.call(this).data('ndx', ipt)
						.attr('placeholder', ipt);
					
					this.inputs.put(ipt, {
						ndx1: i,
						elem: elem
					});
					this.container.append(elem);
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
					var elem = createInput.call(this);
					this.inputs.push(elem);
					this.container.append(elem);
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
					btn.before(createInput.call(this));
				}
				
				btn.data('ndx', ndx + 1);
			})
			.data('ndx', i);
										
			// add to container
			this.container.append(this.addBtn);
		},
	
		setupAutoFills = function() {
			var wgt = this,
				vectors = wgt.find('.' + this.config.type),
				inputs = this.inputs.values();
						
			if (wgt.config.validator) {
				wgt.config.validator.setElements(vectors);
			}
										
			vectors.bind('keydown', function(evt) {
				var elem = jQuery(this);
				elem.removeClass('vectorHelper');
			})
			.bind('blur', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					ndx = elem.data('ndx'),
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
			if (jQuery.isArray(values)) {
				var inputs = this.inputs.values(),
					find = function(ndx1, ndx2) {
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
							find(i, j).elem.val(subVal);
						}
					}
					else {
						find(i).elem.val(val);
					}
				}
			}
			else {
				for (var key in values) {
					var input = this.inputs.get(key).elem;
					
					if (input) {
						input.val(values[key]).removeClass('vectorHelper');
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
						input = this.inputs[i] = createInput.call(this);					
						this.addBtn.before(input);	
					}				
				}
				
				if (isArray) {
					for (var j = 0, jl = valRow.length; j < jl; j++) {
						var val = valRow[j],
							ipt = input[j];
						
						if (ipt == null) {
							ipt = input[j] = createInput.call(this);
						}
						ipt.val(val);
						input.div.find('button').before(ipt);
					}
				}
				else {
					input.val(values[i]);
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
