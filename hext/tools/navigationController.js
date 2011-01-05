o3djs.require('hemi.core');
o3djs.require('hemi.world');
o3djs.require('hext.tools.baseController');

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
	 * @class A NavigationController handles interactions between the
	 * Navigation tool and its views.
	 * @extends hext.tools.BaseController
	 */
	hext.tools.NavigationController = function() {
		hext.tools.BaseController.call(this);
	};
	
	hext.tools.NavigationController.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.NavigationController',
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
		},
		
		/**
		 * Connect the Navigation data model to the toolbar view so that they
		 * respond to each other.
		 * @see hext.tools.BaseController#setupToolbar
		 */
		setupToolbar: function() {
			var toolModel = this.model;
			var toolbarView = this.toolbarView;
			var that = this;
			
			toolbarView.zoomInBtn.bind('click', function(evt) {
				// change the cursor
				// change the mode by setting the pickgrabber
				if (!toolModel.picking) {
					hemi.core.client.cursor = hemi.core.o3d.Cursor.POINTER;
					hemi.world.setPickGrabber(that);
					toolModel.setPicking(true);
					toolbarView.setClickedState(true);
				}
				else {
					that.cleanupAfterPick();
				}
			});
			
			toolbarView.zoomOutBtn.bind('click', function(evt) {
				toolModel.zoomOut();
				toolbarView.zoomInBtn.attr('disabled', '');
			});
		},
		
		/**
		 * Check the shape from the pick to see if there is an associated
		 * Viewpoint to zoom to.
		 * 
		 * @param {o3djs.picking.PickInfo} pickInfo pick event information
		 */
		onPick: function(pickInfo) {
			var shapeName = pickInfo.shapeInfo.shape.name;
			
			if (this.model.zoomIn(shapeName)) {
				this.cleanupAfterPick();
	            this.toolbarView.zoomInBtn.attr('disabled', 'disabled');
			}
		},
		
		/**
		 * Clean up pick Message interception and view styling.
		 */
		cleanupAfterPick: function() {
			hemi.core.client.cursor = hemi.core.o3d.Cursor.DEFAULT;
			hemi.world.removePickGrabber();
			this.model.setPicking(false);
			this.toolbarView.setClickedState(false);
		}
	};
	
	return hext;
})(hext || {});

/*
 * Wait until the DOM is loaded (and hext and hemi are defined) before
 * performing inheritance.
 */
jQuery(window).ready(function() {
	hext.tools.NavigationController.inheritsFrom(hext.tools.BaseController);
});