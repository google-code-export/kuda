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
	
	module.ui.Position = {
		TOP_LEFT: 0,
		TOP_RIGHT: 1,
		BOTTOM_LEFT: 2,
		BOTTOM_RIGHT: 3,
		CENTER: 4
	};

	/*
	 * Configuration object for the Dialog.
	 */
	module.ui.DialogDefaults = {
		inset : 10,
		position: module.ui.Position.TOP_LEFT
	};

	module.ui.Dialog = module.ui.Component.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.ui.DialogDefaults, options);
			
			this.isLoaded = false;
			this.isVisible = false;
			this.positionSaved = false;
			
			this._super(newOpts);
		},

		/**
		 * Empty method. Override to provide your own reset for a dialog.
		 * Calling this should result in the dialog being reset to its original
		 * state.
		 */
		reset : function() {

		},

		load : function() {
			var dlg = this;

			if (this.config.uiFile && this.config.uiFile !== '') {
				hemi.loader.loadHtml(this.config.uiFile, function(data) {
					// clean the string of html comments
					var cleaned = data.replace(/<!--(.|\s)*?-->/, '');
					dlg.container = jQuery(cleaned);
					dlg.container.dialog({
						autoOpen : false,
						resizable : false
					});

					dlg.container.bind('dialogclose', function(evt, ui) {
						dlg.isVisible = false;
						dlg.reset();
					});
					
					dlg.finishLayout();
				});
			}
			else {
				this.container = jQuery('<div class="toolDialogBox" title=""></div>');
				
				if (this.config.id !== '') {
					this.container.attr('id', this.config.id);
				}
				
				this.finishLayout();
			}
		},

		resize : function() {
			var dlg = this.container,
				dlgWrapper = dlg.parent(),
				vwr = jQuery('.mainView'),
				form = dlg.find('form'),
			
				dlgPadding = parseInt(dlg.css('paddingTop'))
					+ parseInt(dlg.css('paddingBottom')),
				dlgBorder = parseInt(dlgWrapper.css('borderTopWidth'))
					+ parseInt(dlgWrapper.css('borderBottomWidth')),

				titlebarHeight = dlgWrapper.find('.ui-dialog-titlebar')
					.outerHeight(true),
				maxHeight = vwr.height() - (this.config.inset * 2),
				formHeight = form.outerHeight(true) + titlebarHeight
					+ dlgPadding,
				newHeight = formHeight > maxHeight ? maxHeight : 'auto',
				newWidth = dlg.css('width').replace('px', '');

			dlg.dialog('option', {
				height : newHeight,
				width : newWidth
			});
		},

		setPosition : function() {
			var pnl = jQuery('.mainView'),
				dlg = this.container,
				uiDlg = dlg.parent(),
				title = uiDlg.find('.ui-dialog-titlebar'),
				offset = pnl.offset(),
				bdrHeight = parseInt(uiDlg.css('borderTopWidth')) +
					parseInt(uiDlg.css('borderBottomWidth')),
				bdrWidth = parseInt(uiDlg.css('borderLeftWidth')) +
					parseInt(uiDlg.css('borderRightWidth')),
				ttlHeight = title.outerHeight(true),
				dlgHeight = dlg.outerHeight() + bdrHeight + ttlHeight,
				dlgWidth = dlg.outerWidth() + bdrWidth,
				pnlHeight = pnl.outerHeight(),
				pnlWidth = pnl.outerWidth(),
				inset = this.config.inset,
				posVal;

			switch(this.config.position) {
				case module.ui.Position.TOP_LEFT:
					posVal = [offset.left + inset, offset.top + inset];
					break;
				case module.ui.Position.TOP_RIGHT:
					posVal = [pnlWidth + offset.left - dlgWidth - inset, 
						offset.top + inset];
					break;
				case module.ui.Position.BOTTOM_LEFT:
					posVal = [offset.left + inset, 
						pnlHeight + offset.top - dlgHeight - inset];
					break;
				case module.ui.Position.BOTTOM_RIGHT:
					posVal = [pnlWidth + offset.left - dlgWidth - inset, 
						pnlHeight + offset.top - dlgHeight - inset];
					break;
				case module.ui.Position.CENTER:
					posVal = 'center';	    
					break;
			}


			this.container.dialog('option', 'position', posVal);
		},

		setVisible : function(visible) {
			if (this.isVisible != visible) {
				this.container.dialog(visible ? 'open' : 'close');

				if (!this.positionSaved) {
					this.setPosition();
					this.positionSaved = true;
				}

				this.isVisible = visible;
			}
		},
		
		bind: function(event, fcn) {
			this.container.bind(event, fcn);
		}
	});

	return module;
})(editor || {});
