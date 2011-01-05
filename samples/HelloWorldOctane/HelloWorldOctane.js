/**
 * This sample is based off of the Hello World sample, except the entire World
 * was created using the Kuda World Editor and saved as a JSON file in the Kuda
 * format called "Octane". Instead of scripting, the file is loaded and the
 * World is created from it.
 */
(function() {
	o3djs.require('o3djs.util');
	o3djs.require('hemi.loader');

	function init(clientElements) {
		hemi.core.init(clientElements[0]);
		hemi.view.setBGColor([0.7, 0.8, 1, 1]);
		loadWorld();
	}
	
	function loadWorld() {
		// All we have to do is pass the file name to the Hemi loader.
		hemi.loader.loadOctane('assets/helloWorld.json');
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
