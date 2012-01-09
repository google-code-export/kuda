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

(function(editor) {
	"use strict";
	
	editor.ui = editor.ui || {};
	
	var createSimpleDialog = function(prefix, title) {
		var dlg = jQuery('<div title="' + title + '" id="' + prefix + 'Dlg" class="simpleDialog">\
				<p></p>\
				<form method="post" action="">\
					<label></label>\
				</form>\
			</div>'),
			form = dlg.find('form').submit(function() {
				return false;
			}),
			msg = dlg.find('p').hide(),
			lbl = dlg.find('label');
		
		dlg.data('msg', msg).data('label', lbl).data('form', form);
		
		return dlg;
	};
	
	editor.ui.createDependencyDialog = function(depList) {
		var dlg = createSimpleDialog('showDeps', 'Unable to Remove'),
			form = dlg.data('form').attr('style', 'float:none;'),
			msg = dlg.data('msg').attr('style', 'text-align:left;'),
			list = jQuery('<p style="text-align:left;" id="depList"></p>'),
			btn = jQuery('<button id="okayBtn">Okay</button>');
		
		form.append(list);
		dlg.append(btn);
		msg.text('The following elements depend on this element either directly\
				or indirectly. Please remove or modify them first.');
		list.html(depList);
		
		btn.click(function() {
			dlg.dialog('close');
		});
		dlg.dialog({
			width: 300,
			resizable: false,
			autoOpen: false,
			modal: true
		})
		.bind('dialogopen', function() {
			form.show();
			msg.show();
		});
		
		return dlg;
	};
	
})(editor);
