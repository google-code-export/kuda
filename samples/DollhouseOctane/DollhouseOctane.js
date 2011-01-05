/**
 * This sample shows how to take a World that was created using the Kuda World
 * Editor and modify it after loading it from Octane. We define two new particle
 * effects as well as binding camera movement to HTML buttons in the viewer.
 */
(function() {
	o3djs.require('o3djs.util');
	o3djs.require('hemi.loader');

	function init(clientElements) {
		hemi.core.init(clientElements[0]);
		hemi.view.setBGColor([1, 1, 1, 1]);
		loadWorld();
	}
	
	function loadWorld() {
		hemi.loader.loadOctane('assets/dollhouse.json',
			function() {
				// This will be executed before hemi.world.ready() is called.
				hemi.world.subscribe(hemi.msg.ready,
					function(msg) {
						// We are not currently able to disable camera control
						// from the Kuda World Editor, so we must do it here.
						hemi.world.camera.disableControl();
						bindJavascript();
					});
			});
	}
	
	/*
	 * Find the Viewpoints that were created in the Kuda World Editor and bind
	 * a camera move for each one to an HTML button.
	 */
	function bindJavascript() {
		var viewpoint1, viewpoint2, viewpoint3, viewpoint4, viewpoint5,
			viewpoint6, viewpoint7, viewpoint8, viewpoint9;
		
		var viewpoints = hemi.world.getViewpoints();
		
		for (var ndx = 0, len = viewpoints.length; ndx < len; ndx++) {
			var vp = viewpoints[ndx];
			
			switch (vp.name) {
				case 'Main':
					viewpoint1 = vp;
					break;
				case 'Front':
					viewpoint2 = vp;
					break;
				case 'Basement':
					viewpoint3 = vp;
					break;
				case 'Attic Door':
					viewpoint4 = vp;
					break;
				case 'Attic':
					viewpoint5 = vp;
					break;
				case 'Kitchen':
					viewpoint6 = vp;
					break;
				case 'Bathroom':
					viewpoint7 = vp;
					break;
				case 'Ceiling Fan':
					viewpoint8 = vp;
					break;
				case 'Air Conditioner':
					viewpoint9 = vp;
					break;
			}
		}
		
		var camera = hemi.world.camera;
		
		jQuery('#viewpoint1').click(function() {
			camera.moveToView(viewpoint1);
		});
		jQuery('#viewpoint2').click(function() {
			camera.moveToView(viewpoint2);
		});
		jQuery('#viewpoint3').click(function() {
			camera.moveToView(viewpoint3);
		});
		jQuery('#viewpoint4').click(function() {
			camera.moveToView(viewpoint4);
		});
		jQuery('#viewpoint5').click(function() {
			camera.moveToView(viewpoint5);
		});
		jQuery('#viewpoint6').click(function() {
			camera.moveToView(viewpoint6);
		});
		jQuery('#viewpoint7').click(function() {
			camera.moveToView(viewpoint7);
		});
		jQuery('#viewpoint8').click(function() {
			camera.moveToView(viewpoint8);
		});
		jQuery('#viewpoint9').click(function() {
			camera.moveToView(viewpoint9);
		});
	}

	jQuery(window).load(function() {
		o3djs.util.makeClients(init);
	});

	jQuery(window).unload(function() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	});
})();
