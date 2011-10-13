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

var hemi = (function(hemi) {

	/**
	 * @class A object that allows the assigning of keys to functions in the code, and a tab list, so that elements can be selected without a mouse.
	 */
	hemi.Accessibility = function() {
		this.init();
	};
	
	hemi.Accessibility.prototype = {
		currentSelectionItem: 0,
		selectionList: new Array(),
		selectionTrigger: null,
		mapKey: function(keyNum, obj){
			hemi.input.addKeyDownListener({
				onKeyDown : function(e) {
				if (e.keyCode == keyNum) {
					obj.down();
				}
			}});
			hemi.input.addKeyUpListener({
				onKeyUp : function(e) {
				if (e.keyCode == keyNum) {
					obj.up();
				}
			}});
			
		},
		init: function(){
			hemi.input.addKeyDownListener(this); 
			hemi.input.addKeyUpListener(this);
		},
		onKeyUp : function(e) {
			//ENTER Key
			if (e.keyCode == 13) {
				this.selectionList[this.currentSelectionItem].up();
			}
		},
		onKeyDown : function(e) {
			//Trigger
			if (e.keyCode == this.selectionTrigger) {
				this.cycleSelectionItems();
			}
			//ENTER Key
			if (e.keyCode == 13) {
				this.selectionList[this.currentSelectionItem].down();
			}
		},
		setCycleTrigger: function(trigger){
			this.selectionTrigger = trigger;
		},
		cycleSelectionItems: function(){
			if (this.currentSelectionItem < this.selectionList.length - 1) {
				this.currentSelectionItem++;
			} else {
				this.selectionList[this.selectionList.length - 1].deselect();
				this.currentSelectionItem = 0;
			}
			if(this.selectionList[this.currentSelectionItem - 1]) this.selectionList[this.currentSelectionItem - 1].deselect();
			this.selectionList[this.currentSelectionItem].select();
		},
		addSelectionItem: function(selectionItem){
			this.selectionList.push(selectionItem);
		},
		removeSelectionItem: function(idx){
			this.selectionList.splice(idx, 1);			
		}
	};
	
	return hemi;
})(hemi || {});