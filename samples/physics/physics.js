/**
 * This is a simple hello world, showing how to set up a simple world, 
 *		load a model, and set the camera to a viewpoint once the model
 *		has loaded.
 */

var wait = false;
 
function clearWait() {
	wait = false;
}
 
(function() {
	o3djs.require('o3djs.util');
	o3djs.require('hemi.fx');
	o3djs.require('hemi.texture');

	var system;
	
	function init(clientElements) {
		/**
		 * It is possible to have multiple clients (i.e. multiple frames
		 * 		rendering 3d content) on one page that would have to be
		 * 		initialized. In this case, we only want to initialize the
		 *		first one.
		 */
		hemi.core.init(clientElements[0]);	

		/**
		 * Set the background color to a light-bluish. The parameter is in
		 * 		the form [red,blue,green,alpha], with each value on a 
		 *		scale of 0-1.
		 */
		hemi.view.setBGColor([0, 0, 0.3, 1]);
		createWorld();
	}

	function createWorld() {
	
		system = jigLib.PhysicsSystem.getInstance();
		system.setGravity([0,-60,0,0]);
		jigLib.GLMatrix = mat4;
		var ground=new jigLib.JPlane(null,[0,1,0,0]);
		ground.set_friction(0);
		system.addBody(ground);	
		system.setSolverType('ACCUMULATED');
		/**
		 * When we call the world's 'ready' function, it will wait for the model
		 *		to finish loading and then it will send out a Ready message.
		 *		Here we register a handler, setupScene(), to be run when the
		 *		message is sent.
		 */
		hemi.world.subscribe(hemi.msg.ready,
			function(msg) {
				setupScene();
			});
		
		hemi.world.ready();   // Indicate that we are ready to start our script
	}

	function setupScene() {
		var vp = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp.eye = [400,415,575];					// Set viewpoint eye
		vp.target = [0,150,0];					// Set viewpoint target

		/**
		 * Move the camera from it's default position (eye : [0,0,-1],
		 *		target : [0,0,0]} to the new viewpoint, and take 1
		 *		second to do so
		 */
		hemi.world.camera.moveInSeconds();
		hemi.world.camera.moveToView(vp,1);
		hemi.world.camera.enableControl();	// Enable camera mouse control
		
		hemi.shape.create(
			{shape:'box',
			color:[0,0.8,0,1],
			h:20,w:300,d:300}).translate([0,-10,0]);
			
		var links = [];
		
		hemi.view.addRenderListener({onRender:function(e) {
			system.integrate(e.activeTime);
			for(var i = 0; i < links.length; i++) {
				applyJig(links[i].jig,links[i].kuda);
			}
		}});

		hemi.input.addKeyDownListener({onKeyDown:function(e){
			if (wait) return;
			wait = true;
			var jCube = new jigLib.JBox(null,20,20,20);
			jCube.set_mass(1);
			jCube.set_friction(0);
			system.addBody(jCube);
			jCube.moveTo([0,360,0]);
			jCube.setRotation(randomAngle());	
			var cubet = hemi.shape.create({shape:'cube',color:[1,1,0,1],size:20});
			links.push({jig:jCube,kuda:cubet});
			setTimeout("clearWait()",1000);
		}});
		
		function randomAngle() {
			return [Math.floor(Math.random()*90), Math.floor(Math.random()*90), Math.floor(Math.random()*90)];
		}
		
		function applyJig(jigObj,transform) {
			var glmat = jigObj.get_currentState().get_orientation().glmatrix;
			var pos = jigObj.get_currentState().position;
			transform.localMatrix = [
				[glmat[0],glmat[4],glmat[8],0],
				[glmat[1],glmat[5],glmat[9],0],
				[glmat[2],glmat[6],glmat[10],0],
				[pos[0],pos[1],pos[2],1]];		
		}

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
