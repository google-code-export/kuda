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

(function() {
	
	var client;
		
	function createWorld() {
		/**
		 * When we call the 'ready' function, it will wait for the model to
		 *		finish loading and then it will send out a Ready message. Here
		 *		we register a handler, setupScene(), to be run when the message
		 *		is sent.
		 */
		hemi.subscribe(hemi.msg.ready,
			function(msg) {
				setupScene();
			});
		
		hemi.ready();   // Indicate that we are ready to start our script
	};
	
	function setupScene(house) {
		var vp = new hemi.Viewpoint();		// Create a new Viewpoint
		vp.eye = new THREE.Vector3(0, 40, 150);					// Set viewpoint eye
		vp.target = new THREE.Vector3(0, 0, 0);					// Set viewpoint targetget

		/**
		 * Move the camera from it's default position (eye : [0,0,-1],
		 *		target : [0,0,0]} to the new viewpoint, and take 120
		 *		render cycles (~2 seconds) to do so.
		 */
		client.camera.moveToView(vp, 2.5);
		client.camera.enableControl();	// Enable camera mouse control
		
		/* Create a cube, size 10  */
		var cube = hemi.createShape({
				shape: 'cube',
				color: 0xff0000,
				size: 10
			});

		cube.position.x -= 90;
		cube.updateMatrix();
		client.scene.add(cube);

		/* Create a 5x5x20 box */
		var box = hemi.createShape({
			shape: 'box',
			color: 0xff8800,
			h: 20, w: 5, d: 5 });

		box.position.x -= 70;
		box.updateMatrix();
		client.scene.add(box);
			
		/* Create a sphere of radius 10 */
		var sphere = hemi.createShape({
			shape: 'sphere',
			color: 0xffff00,
			radius: 10 });

		sphere.position.x -= 50;
		sphere.updateMatrix();
		client.scene.add(sphere);
			
		/* Create a cylinder, radius 5, height 10 */
		var cylinder = hemi.createShape({
			shape: 'cylinder',
			color: 0x88ff00,
			r1: 2.5, r2: 2.5, h: 10 });

		cylinder.position.x -= 30;
		cylinder.updateMatrix();
		client.scene.add(cylinder);
			
		/* Create a cone, base radius 5, height 10 */
		var cone = hemi.createShape({
			shape: 'cone',
			color: 0x00ff00,
			r: 5, h: 10 });

		cone.position.x -= 10;
		cone.updateMatrix();
		client.scene.add(cone);
			
		/* Create a tetrahedron of size 10 */
		var tetra = hemi.createShape({
			shape: 'tetra',
			color: 0x00ffff,
			size: 10 });

		tetra.position.x += 10;
		tetra.updateMatrix();
		client.scene.add(tetra);
			
		/* Create a stellated octahedron, size 10 */
		var octa = hemi.createShape({
			shape: 'octa',
			color: 0x0000ff,
			size: 10 });

		octa.position.x += 30;
		octa.updateMatrix();
		client.scene.add(octa);
			
		/* Create a 5x10x15 pyramid */
		var pyramid = hemi.createShape({
			shape: 'pyramid',
			color: 0x8800ff,
			h: 10, w: 10, d: 10 });

		pyramid.position.x += 50;
		pyramid.updateMatrix();
		client.scene.add(pyramid);
			
		/* Create a custom shape from vertices */
		var custom = hemi.createShape({
			shape: 'custom',
			color: 0xff00ff,
			vertices: [new THREE.Vertex(new THREE.Vector3(-10, 0, 0)),
				new THREE.Vertex(new THREE.Vector3(0, 10, 3)),
				new THREE.Vertex(new THREE.Vector3(10, 2, -3))],
			faces: [new THREE.Face3(0, 1, 2),
				new THREE.Face3(0, 2, 1)],				
			faceVertexUvs: [[new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)],
			  	[new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)]]
		});

		custom.position.x += 70;
		custom.updateMatrix();
		client.scene.add(custom);
		
		/* Create an arrow */
		var arrow = hemi.createShape({
			shape: 'arrow',
			color: 0xff0088,
			size: 5, tail: 5, depth: 5 });

		arrow.position.x += 90;
		arrow.updateMatrix();
		client.scene.add(arrow);
	}

	window.onload = function() {
		/**
		 * It is possible to have multiple clients (i.e. multiple frames
		 * 		rendering 3d content) on one page that would have to be
		 * 		initialized. In this case, we only want to initialize the
		 *		first one.
		 */
		client = hemi.makeClients()[0];
		
		/**
		 * Set the background color to a light-bluish. The parameters are a hex
		 * 		code for the RGB values and an alpha value between 0 and 1.
		 */
		client.setBGColor(0x000033, 1);
		
		/**
		 * Set a prefix for the loader that will allow us to load assets as if
		 * the helloWorld.html file was in the root directory.
		 */
		hemi.loadPath = '../../';
		
		createWorld();
	};
})();
