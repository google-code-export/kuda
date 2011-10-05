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

var hext = (function(hext) {
	
	hext.tools = hext.tools || {};
	
	/**
	 * @class A BaseController represents the functionality common to
	 * controllers for all tools. It sets up Message handling between the model
	 * and views.
	 * @extends hemi.world.Citizen
	 */
	hext.tools.BaseController = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			/**
			 * The tool model.
			 * @type hext.tools.BaseTool
			 */
			this.model = null;
			
			/**
			 * The tool HTML view.
			 * @type hext.tools.HtmlView
			 */
			this.view = null;
			
			/**
			 * The tool shape view.
			 * @type hext.tools.ShapeView
			 */
			this.shapeView = null;
			
			/**
			 * The tool toolbar view.
			 * @type hext.tools.ToolbarView
			 */
			this.toolbarView = null;
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.BaseController',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * BaseController.
		 */
		cleanup: function() {
			this._super();
			
			this.model = null;
			this.view = null;
			this.shapeView = null;
			this.toolbarView = null;
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			var octane = {
				// TODO... or maybe not!
			};
			
			return octane;
		},
		
		/**
		 * Set the BaseController's tool model that it interacts with.
		 * 
		 * @param {hext.tools.BaseTool} model the tool model
		 */
		setModel: function(model) {
			this.model = model;
			
			if (this.model && this.toolbarView) {
				this.setupToolbar();
			}
			if (this.model && this.view) {
                this.setupView();
                this.view.loadConfig();
			}
		},
		
		/**
		 * Set the BaseController's tool view that represents the tool as an
		 * HTML widget.
		 * 
		 * @param {hext.tools.HtmlView} view the tool view
		 */
		setView: function(view) {
			this.view = view;
			
			if (this.model && this.view) {
				this.setupView();
                this.view.loadConfig();
			}
		},
		
		/**
		 * Set the BaseController's tool shape view that represents the tool as
		 * a 3D shape.
		 * 
		 * @param {hext.tools.ShapeView} shapeView the tool shape view
		 */
		setShapeView: function(shapeView) {
			this.shapeView = shapeView;
			
			if (this.model && this.shapeView) {
				this.setupShape();
			}
		},
		
		/**
		 * Set the BaseController's toolbar view that represents the tool as a
		 * toolbar icon.
		 * 
		 * @param {hext.tools.ToolbarView} toolbarView the toolbar view
		 */
		setToolbarView: function(toolbarView) {
			this.toolbarView = toolbarView;
			
			if (this.model && this.toolbarView) {
				this.setupToolbar();
			}
		},
		
		/**
		 * Setup the tool's HTML view to handle Messages from the tool model.
		 * This is called automatically when the view is set.
		 */
		setupView: function() {
			this.model.subscribe(
				hemi.msg.visible,
				this.view,
				'setVisible',
				[hemi.dispatch.MSG_ARG + 'data.visible']);
		},
		
		/**
		 * Setup the tool's shape view to handle Messages from the tool model.
		 * This is called automatically when the shape view is set.
		 */
		setupShape: function() {
			this.shapeView.setVisible(this.model.visible);
			
			this.model.subscribe(
				hemi.msg.visible,
				this.shapeView,
				'setVisible',
				[hemi.dispatch.MSG_ARG + 'data.visible']);
		},
		
		/**
		 * Setup the tool's toolbar view to update the tool model when it is
		 * clicked. This is called automatically when the toolbar view is set.
		 */
		setupToolbar: function() {
			var toolModel = this.model;
			var toolbarView = this.toolbarView;
			
			this.toolbarView.button.bind('click', function(evt) {
				toolModel.setVisible(!toolModel.visible);
				toolbarView.setClickedState(toolModel.visible);
			});
		}
	});
	
	return hext;
})(hext || {});
