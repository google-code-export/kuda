o3djs.require('hemi.msg');
o3djs.require('hemi.world');
o3djs.require('hext.tools.baseController');

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
	 * @class A SmokePufferController handles interactions between the
	 * SmokePuffer and its views.
	 * @extends hext.tools.BaseController
	 */
	hext.tools.SmokePufferController = function() {
		hext.tools.BaseController.call(this);
	};
	
	hext.tools.SmokePufferController.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: 'hext.tools.SmokePufferController',
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
		},

		/**
		 * Connect the SmokePuffer data model to the toolbar view so that they
		 * respond to each other.
		 * @see hext.tools.BaseController#setupToolbar
		 */
		setupToolbar: function() {
			var toolModel = this.model;
			var toolbarView = this.toolbarView;
			var that = this;

			this.toolbarView.button.bind('click', function(evt) {
				var enabled = !toolModel.enabled;
				toolModel.setEnabled(enabled);
				
				if (enabled) {
					hemi.world.setPickGrabber(that);
				} else {
				    hemi.world.removePickGrabber();
				}

				toolbarView.setClickedState(enabled);
			});
		},

		/**
		 * Check the shape from the pick to see if there is an associated
		 * smoke puff particle Effect. If so, trigger it. Otherwise, generate a
		 * 'default' puff at the picked world position.
		 * 
		 * @param {o3djs.picking.PickInfo} pickInfo pick event information
		 */
	    onPick: function(pickInfo) {
			if (pickInfo && this.model.enabled) {
				var puff = this.model.pickNames.get(pickInfo.shapeInfo.shape.name);

				if (puff == null) {
					var wi = pickInfo.worldIntersectionPosition;
					var ci = hemi.world.camera.getEye();
					puff = this.model.defaultPuff;
					puff.params.position = hemi.core.math.lerpVector(ci, wi, 0.9);
				}

				puff.trigger();
			}
		}
	};
	
	return hext;
})(hext || {});

/*
 * Wait until the DOM is loaded (and hext and hemi are defined) before
 * performing inheritance.
 */
jQuery(window).ready(function() {
	hext.tools.SmokePufferController.inheritsFrom(hext.tools.BaseController);
});