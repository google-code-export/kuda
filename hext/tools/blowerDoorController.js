o3djs.require('hemi.dispatch');
o3djs.require('hext.msg');
o3djs.require('hext.tools.baseController');

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
	 * @class A BlowerDoorController handles interactions between the
	 * BlowerDoor and its views.
	 * @extends hext.tools.BaseController
	 */
	hext.tools.BlowerDoorController = function() {
		hext.tools.BaseController.call(this);
	};

	hext.tools.BlowerDoorController.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: 'hext.tools.BlowerDoorController',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * BlowerDoorController.
		 */
		cleanup: function() {
			hext.tools.BaseController.prototype.cleanup.call(this);
			jQuery('body').unbind('mouseup');
		},

		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
		},

		/**
		 * Connect the BlowerDoor data model to the knob HTML view so that they
		 * respond to each other.
		 * @see hext.tools.BaseController#setupView
		 */
		setupView: function() {
			hext.tools.BaseController.prototype.setupView.call(this);
		
			this.model.subscribe(hext.msg.speed,
				this.view,
				'rotateKnob',
				[hemi.dispatch.MSG_ARG + 'data.speed']);
			
			var toolModel = this.model;
			var toolView = this.view;
			var lastX = 0;

			this.view.addLoadCallback(function() {
				toolView.knob.rotate({
					maxAngle: toolModel.max,
					minAngle: toolModel.min,
					bind: [{
						'mousedown': function(event) {
							lastX = event.pageX;
							toolView.canvasKnob = jQuery(this);
							jQuery('body').bind('mousemove', function(event) {
								var deltaX = (lastX - event.pageX) * -2;
								var newValue = toolModel.currentSpeed + deltaX;
								if (newValue >= 0 && newValue <= toolModel.max) {
									toolModel.setFanSpeed(newValue);
								}
								lastX = event.pageX;
							});
						}
					}]
				});
			});
			
			// Should this be added to the bind in the load callback above?
			jQuery('body').bind('mouseup', function(event) {
				jQuery(this).unbind('mousemove');
			});
		}
	};

	return hext;
})(hext || {});

/*
 * Wait until the DOM is loaded (and hext and hemi are defined) before
 * performing inheritance.
 */
jQuery(window).ready(function() {
	hext.tools.BlowerDoorController.inheritsFrom(hext.tools.BaseController);
});