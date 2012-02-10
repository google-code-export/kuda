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
	
	shorthand.events.SetArgument = 'params.SetArgument';
	
	var CIT_TREE_PNL_ID = 'objPkrCitTreePnl',
		CIT_TREE_ID = 'objPkrCitTree';
	
	var citTree = null,
		citTreePnl = jQuery('<div id="' + CIT_TREE_PNL_ID +'" class="treeSelectorPnl"></div>'),
		outerWidth = 0;
		
	citTreePnl.css({
		position: 'absolute'
	});
				
	function createCitizenTree(objPicker, filter) {
		try {
			if (citTree == null) {
				citTree = shorthand.createCitizensTree();
				initCitizenTree(citTree.tree, filter);
				
				citTree.addListener(shorthand.events.SelectCitizen, function(data){
					var elem = citTreePnl.data('curElem'), 
						btn = elem.children('button'), 
						ipt = elem.children('input'), 
						wgt = ipt.data('widget');
					
					citTreePnl.hide().data('curElem', null);
					citTree.currentParamIpt = null;
					
					jQuery(document).unbind('click.' + wgt.argName + 'CitTree');
					citTreePnl.data('docBound', false);
					ipt.removeClass('open');
					btn.removeClass('open');
					
					if (wgt.config.sendsNotifications) {
						wgt.notifyListeners(shorthand.events.SetArgument, data);
					}
				});
			}
			else {
				citTree.filter(filter);
			}
		}
		catch (err) {
			objPicker.cannotFilter = true;
		}
	}
	
	function initCitizenTree(tree, filter) {	
		citTreePnl.append(tree);
		tree.attr('id', CIT_TREE_ID);	
		jQuery('body').append(citTreePnl);
		citTreePnl.hide();
		
		outerWidth = citTreePnl.outerWidth() - citTreePnl.width();
			
		citTree.bindSelect(function(evt, data) {
			var elem = data.rslt.obj,
				metadata = elem.data('jstree'),
				citizen = metadata.citizen,
				paramIpt = citTree.currentParamIpt,
				citParam = '',
				citName = '';
				
			if (metadata.type === 'citizen') {
				citParam = hemi.dispatch.ID_ARG + citizen._getId();
				citName = citizen._octaneType.split('.').pop() + '.' + citizen.name;
				jQuery(this).parent().hide(200);
				tree.jstree('close_all').jstree('deselect_all');
				citTree.currentParamIpt = null;
			} else if (metadata.type === 'citType') {
				tree.jstree('toggle_node', elem);
			}
			
			if (paramIpt != null && citParam != '') {
				// TODO: change trueval to citizen...or not
				paramIpt.val(citName).data('trueVal', citParam);
				
				var e = citTreePnl.data('curElem'),
					btn = e.children('button'), 
					ipt = e.children('input'),
					wgt = ipt.data('widget');
				
				citTreePnl.hide().data('curElem', null);
				citTree.currentParamIpt = null;
				
				jQuery(document).unbind('click.' + wgt.argName + 'CitTree');
				citTreePnl.data('docBound', false);
				ipt.removeClass('open');
				btn.removeClass('open');
			}
		});

		citTree.filter(filter);
	}
	
	shorthand.ObjectPicker = function(argName, filter) {
		this.argName = argName;
		this.filter = filter;
		
		createCitizenTree(this, filter);
		
		editor.ui.Component.call(this);
	};
		
	shorthand.ObjectPicker.prototype = new editor.ui.Component();
	shorthand.ObjectPicker.prototype.constructor = shorthand.ObjectPicker;
		
	shorthand.ObjectPicker.prototype.layout = function() {
		this.container = jQuery('<div class="objectPicker"></div>');
					
		var argName = this.argName,
			toggleFcn = function(evt){
				var oldElem = citTreePnl.data('curElem'),
					elem = jQuery(this).parent(),
					btn = elem.children('button'), 
					ipt = elem.children('input');
				
				if (citTreePnl.is(':visible') && oldElem  && elem[0] === oldElem[0]) {
					citTreePnl.slideUp(200).data('curElem', null);
					citTree.currentParamIpt = null;
					
					jQuery(document).unbind('click.' + argName + 'CitTree');
					citTreePnl.data('docBound', false);
					ipt.removeClass('open');
					btn.removeClass('open');
				}
				else {
					var position = ipt.offset(),
						isDocBound = citTreePnl.data('docBound'),
						width = ipt.outerWidth() + btn.outerWidth() -
							outerWidth;
					
					position.top += ipt.outerHeight();
					ipt.addClass('open');
					btn.addClass('open');
					citTreePnl.css({
						top: position.top,
						left: position.left
					}).width(width).slideDown(200).data('curElem', elem);
					
					if (!isDocBound) {
						jQuery(document).bind('click.' + argName + 'CitTree', function(evt){
							var target = jQuery(evt.target),
								parent = target.parents('#' + CIT_TREE_PNL_ID),
								id = target.attr('id');
							
							if (parent.size() == 0 &&
								id != CIT_TREE_PNL_ID &&
								!target.hasClass('treeSelectorBtn') &&
								!target.hasClass('treeSelectorIpt')) {
								citTreePnl.slideUp(200);
								ipt.removeClass('open');
								btn.removeClass('open');
							}
						});
						citTreePnl.data('docBound', true);
					}
					
					citTree.currentParamIpt = ipt;
				}
			},			
			ip = jQuery('<input type="text" class="treeSelectorIpt" id="objPkr_' + argName + '"></input>'),
			cb = jQuery('<button class="treeSelectorBtn dialogBtn">Citizens</button>');
		
        this.container.append(ip).append(cb);
		
		ip.data('widget', this).bind('click', toggleFcn);		
		cb.bind('click', toggleFcn);
		
		this.input = ip;
		
		if (this.cannotFilter) {
			this.input.val('none available');
			cb.attr('disabled', 'disabled');
			ip.attr('disabled', 'disabled');
		}
	};
	
	shorthand.ObjectPicker.prototype.getValue = function() {
		return this.input.data('trueVal');
	};
	
	shorthand.ObjectPicker.prototype.setValue = function(citizen) {
		if (citizen != null && citizen._octaneType === this.filter) {
			var nodeId = shorthand.treeData.getNodeName(citizen, {
				prefix: citTree.pre,
				id: citizen._getId()
			});
			
			citTreePnl.data('curElem', this.container);
			citTree.currentParamIpt = this.input;
			citTree.getUI().jstree('select_node', '#' + nodeId);
		}
		else if (citizen != null) {
			alert('not the correct type');
		}
	};
		
})();