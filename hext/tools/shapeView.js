o3djs.require('hemi.picking');
o3djs.require('hemi.world');

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
	 * @class A ShapeView represents the functionality common to 3D shape views
	 * for all tools.
	 * @extends hemi.world.Citizen
	 */
	hext.tools.ShapeView = function() {
		hemi.world.Citizen.call(this);
		
        this.transforms = [];
	};
	
	hext.tools.ShapeView.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.ShapeView',
		
		/**
		 * Send a cleanup Message and remove all references in the ShapeView.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.transforms = [];
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			var octane = {
				
			};
			
			for (var ndx = 0, len = this.transforms.length; ndx < len; ndx++) {
				octane.ts.push(this.transforms[ndx]);
			}
			
			return octane;
		},
		
		/**
		 * Add the given Transform to the ShapeView's list of Transforms.
		 * 
		 * @param {o3d.Tranform} transform the Transform to add
		 */
		addTransform: function(transform) {
			this.transforms.push(transform);
		},
		
		/**
		 * Remove the given Transform from the ShapeView's list of Transforms.
		 * 
		 * @param {o3d.Transform} transform the Transform to remove
		 * @return {boolean} true if the Transform was removed
		 */
		removeTransform: function(transform) {
            var ndx = this.transforms.indexOf(transform);
			var removed = false;
            
            if (ndx != -1) {
                this.transforms.splice(ndx, 1);
				removed = true;
            }
			
			return removed;
		},
		
		/**
		 * Set the visibility (and pickability) for all of the ShapeView's
		 * Transforms.
		 * 
		 * @param {boolean} visible flag indicating if the Transforms should be
		 *     visible
		 */
		setVisible: function(visible) {
			for (var ndx = 0, len = this.transforms.length; ndx < len; ndx++) {
				var transform = this.transforms[ndx];
				transform.visible = visible;
				hemi.picking.setPickable(transform, visible, true);
			}
		}
	};
	
	hext.tools.ShapeView.inheritsFrom(hemi.world.Citizen);
	
	return hext;
})(hext || {});
