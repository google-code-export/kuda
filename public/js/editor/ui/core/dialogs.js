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
	module.ui = module.ui || {};
	
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
	
	module.ui.createLoadModelDialog = function(cb) {
		var dlg = createSimpleDialog('loadMdl', 'Load Model'),
			form = dlg.data('form'),
			msg = dlg.data('msg'),
			lbl = dlg.data('label').attr('for', 'loadMdlSel').text('Select a Model:'),
			sel = jQuery('<select id="loadMdlSel"></select>'),
			ipt = jQuery('<input type="text" id="loadMdlIpt" />').hide(),
			btn = jQuery('<button id="loadMdlBtn">Load</button>');
		
		form.append(sel).append(ipt).append(btn);
		
		btn.bind('click', function() {
			msg.text('Loading Model...').show();
			var val = ipt.is(':visible') ? ipt.val() : sel.val();
			cb(val, function() {
				msg.text('').hide();
				dlg.dialog('close');			
			});
		});		
			
		dlg.dialog({
			width: 300,
			resizable: false,
			autoOpen: false,
            modal: true
		})
		.bind('dialogopen', function() {				
			msg.text('Retrieving models...').show();
			form.hide();
			
			jQuery.ajax({
				url: '/models',
				dataType: 'json',
				success: function(data, status, xhr) {
					var models = data.models;
					
					ipt.hide();
					sel.empty().show();
					for (var i = 0, il = models.length; i < il; i++) {
						var mdl = models[i];
						var prj = jQuery('<option value="' + mdl.url + '">' + mdl.name + '</option>');
						sel.append(prj);
					}
					
					form.show();
					msg.hide();
				},
				error: function(xhr, status, err) {
					if (xhr.status !== 400) {
						msg.text('Cannot get models. Server is not running. Type in the URI instead.')
							.addClass('errMsg').show();
						
						sel.hide();
						form.show();
						ipt.show();
					}
					else {
						msg.text(xhr.responseText);
					}
				}
			});
		});
		
		return dlg;
	};
	
	module.ui.createUnloadModelDialog = function(cb) {
		var dlg = createSimpleDialog('unloadMdl', 'Unload Model'),
			form = dlg.data('form'),
			msg = dlg.data('msg'),
			lbl = dlg.data('label').attr('for', 'unloadMdlSel').text('Select a Model:'),
			sel = jQuery('<select id="unloadMdlSel"></select>'),
			btn = jQuery('<button id="unloadMdlBtn">Unload</button>');
		
		form.append(sel).append(btn);
		
		btn.bind('click', function() {
			msg.text('Unloading Model...').show();
			cb(parseInt(sel.val()), function() {
				msg.text('').hide();
				dlg.dialog('close');			
			});
		});
			
		dlg.dialog({
			width: 300,
			resizable: false,
			autoOpen: false,
            modal: true
		})
		.bind('dialogopen', function() {
			var models = hemi.world.getModels();
			sel.empty().show();
			
			if (models.length === 0) {
				btn.attr('disabled', 'disabled');
				var prj = jQuery('<option value="">No models loaded</option>');
				sel.append(prj);
			} else {
				btn.removeAttr('disabled');
				
				for (var i = 0, il = models.length; i < il; i++) {
					var mdl = models[i];
					var prj = jQuery('<option value="' + mdl.getId() + '">' + mdl.name + '</option>');
					sel.append(prj);
				}
			}
		});
		
		return dlg;
	};
	
	module.ui.createImportModelDialog = function(cb) {
		var dlg = createSimpleDialog('importMdl', 'Import Model'),
			form = dlg.data('form'),
			msg = dlg.data('msg'),
			lbl = dlg.data('label').attr('for', 'importMdlSel').text('Import a Model'),
			btn = jQuery('<button id="importMdlBtn">Choose a File</button>');
		
		form.append(btn);
			
		btn.file().choose(function(evt, input) {
			msg.text('Uploading Model...').show();
			
			// assuming no multi select file
			var file = input.files[0],
				name = file.fileName != null ? file.fileName : file.name;
				
			jQuery.ajax({
				url: '/model',
				dataType: 'json',
				type: 'post',
				data: file,
				processData: false,
				contentType: 'application/octet-stream',
				headers: {
					'X-File-Name': encodeURIComponent(name),
					'X-File-Size': file.size,
					'X-File-Type': file.type
				},
				success: function(data, status, xhr) {
					msg.text('Loading Model...').removeClass('errMsg');
					cb(data.url, function() {
						msg.text('').hide();
						dlg.dialog('close');
					});
				},
				error: function(xhr, status, err) {
					msg.text(xhr.responseText).addClass('errMsg').show();
				}
			});
		});
		
		dlg.dialog({
			width: 300,
			resizable: false,
			autoOpen: false,
            modal: true
		})
		.bind('dialogopen', function() {					
			jQuery.ajax({
				url: '/models',
				dataType: 'json',
				success: function(data, status, xhr) {	
					msg.text('').removeClass('errMsg');
					btn.show();
					dlg.find('label').show();
				},					
				error: function(xhr, status, err) {
					if (xhr.status !== 400) {
						msg.text('Server is not running').addClass('errMsg')
							.show();
						
						btn.hide();
						dlg.find('label').hide();
					}
					else {
						msg.text(xhr.responseText).addClass('errMsg').show();
					}
				}
			});
		});
		
		return dlg;
	};
	
	module.ui.createSaveProjectDialog = function(cb) {
		var dlg = createSimpleDialog('savePrj', 'Save Project'),
			form = dlg.data('form'),
			msg = dlg.data('msg'),
			lbl = dlg.data('label').attr('for', 'savePrjName').text('Project Name:'),
			ipt = jQuery('<input type="text" name="savePrjName" id="savePrjName" />'),
			btn = jQuery('<button id="savePrjBtn">Save</button>');
		
		form.append(ipt).append(btn);
				
		btn.click(function() {
			cb(ipt.val());
		});
        dlg.dialog({
            width: 300,
            resizable: false,
			autoOpen: false,
			modal: true
        })
		.bind('dialogopen', function() {
			form.show();
			msg.hide();
		});
		
		return dlg;
	};
	
	module.ui.createOpenProjectDialog = function(cb) {
		var dlg = createSimpleDialog('loadPrj', 'Open Project'),
			form = dlg.data('form'),
			msg = dlg.data('msg'),
			lbl = dlg.data('label').attr('for', 'loadPrjSel').text('Select a Project:'),
			sel = jQuery('<select id="loadPrjSel"></select>'),
			btn = jQuery('<button id="loadPrjBtn">Load</button>');
		
		form.append(sel).append(btn);
		
		btn.bind('click', function() {
			cb(sel.val());
		});	
			
		dlg.dialog({
			width: 300,
			resizable: false,
			autoOpen: false,
            modal: true
		})
		.bind('dialogopen', function() {
			msg.text('Retrieving projects...').show();
			form.hide();
			
			jQuery.ajax({
				url: '/projects',
				dataType: 'json',
				success: function(data, status, xhr) {
					var projects = data.projects;
					
					sel.empty();
					for (var ndx = 0, len = projects.length; ndx < len; ndx++) {
						var prj = jQuery('<option>' + projects[ndx] + '</option>');
						sel.append(prj);
					}
					
					form.show();
					msg.hide();
				},
				error: function(xhr, status, err) {
					if (xhr.status !== 400) {
						msg.text('Cannot get projects. Server is not running')
							.addClass('errMsg').show();
							
						setTimeout(function() {
							dlg.dialog('close');
						}, 3000);
					}
					else {
						msg.text(xhr.responseText);
					}
				}
			});
		});
		
		return dlg;
	};
	
	module.ui.createPublishProjectDialog = function(savePrjDlg, cb) {
		var dlg = createSimpleDialog('pubPrj', 'Publish Project'),
			form = dlg.data('form'),
			msg = dlg.data('msg'),
			lbl = dlg.data('label').attr('for', 'pubPrjName').text('Save project and create page for:'),
			spn = jQuery('<span id="pubPrjName"></span>'),
			btn = jQuery('<button id="pubPrjBtn">Publish</button>');
		
		form.append(spn).append(btn);
		
		btn.click(function() {
			btn.attr('disabled', 'disabled');
			var name = savePrjDlg.find('#savePrjName').val(),
				octane = JSON.stringify(editor.getProjectOctane());
			cb(name, octane);
		});
		
       dlg.dialog({
            width: 300,
            resizable: false,
			autoOpen: false,
			modal: true
        })
		.bind('dialogopen', function() {
			var name = savePrjDlg.find('#savePrjName').val();
			btn.removeAttr('disabled');
			
			if (name === '') {
				form.hide();
				msg.text('Please save your project first').show();
				
				setTimeout(function() {
					dlg.dialog('close');
					savePrjDlg.dialog('open');
				}, 2000);
			} else {
				form.show();
				msg.hide();
				spn.text(name);
			}
		});
		
		return dlg;
	};
	
	module.ui.createDependencyDialog = function(depList) {
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
	
	return module;
})(editor || {});
