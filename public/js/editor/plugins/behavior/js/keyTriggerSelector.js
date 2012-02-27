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
	"use strict";
	
	var shorthand = editor.tools.behavior;

////////////////////////////////////////////////////////////////////////////////////////////////////
// KeyTriggerSelector Component
////////////////////////////////////////////////////////////////////////////////////////////////////
		
	shorthand.KeyTriggerSelector = function() {
	    editor.ui.Component.call(this);
	};
		
	shorthand.KeyTriggerSelector.prototype = new editor.ui.Component();
	shorthand.KeyTriggerSelector.prototype.constructor = shorthand.KeyTriggerSelector;
		
	shorthand.KeyTriggerSelector.prototype.layout = function() {
		this.container = jQuery('<div />');

		var lbl = jQuery('<label class="keyTriggerLabel">Press a key to set as the trigger</label>'),
			ipt = this.input = jQuery('<input type="text" class="keyTrigger" />');
		editor.ipt = ipt;

		ipt.bind('keydown', function(e) {
			var code = e.keyCode ? e.keyCode : e.which;

			if (code !== 9 && code !== 16 && code !== 17 && code !== 18) {
				ipt.val('');
			}
		}).bind('keyup', function(e) {
			var code = e.keyCode ? e.keyCode : e.which,
				initVal = String.fromCharCode(code).toLowerCase(),
				newVal = [];

			if (code !== 9 && code !== 16 && code !== 17 && code !== 18) {
				ipt.data('code', {
					keyCode: code,
					altKey: e.altKey,
					ctrlKey: e.ctrlKey,
					shiftKey: e.shiftKey
				});

				if (e.ctrlKey) {
					newVal.push('ctrl');
				}
				if (e.altKey) {
					newVal.push('alt');
				}
				if (e.shiftKey) {
					newVal.push('shift');
				}

				newVal.push(initVal);
				ipt.val(newVal.join('+'));
			}
		});

		this.container.append(lbl).append(ipt);
	};

	shorthand.KeyTriggerSelector.prototype.getValue = function() {
		return this.input.data('code');
	};

	shorthand.KeyTriggerSelector.prototype.reset = function() {
		this.input.val('').data('code', null);
	};

	shorthand.KeyTriggerSelector.prototype.setValue = function(code) {
		var newVal = [];

		if (code.ctrlKey) {
			newVal.push('ctrl');
		}
		if (code.altKey) {
			newVal.push('alt');
		}
		if (code.shiftKey) {
			newVal.push('shift');
		}

		newVal.push(String.fromCharCode(code.keyCode).toLowerCase());
		this.input.val(newVal.join('+')).data('code', code);
	}
})();
