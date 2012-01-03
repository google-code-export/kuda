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
		vp.eye = new THREE.Vector3(0, 40, 100);					// Set viewpoint eye
		vp.target = new THREE.Vector3(0, 0, 0);					// Set viewpoint targetget

		/**
		 * Move the camera from it's default position (eye : [0,0,-1],
		 *		target : [0,0,0]} to the new viewpoint, and take 120
		 *		render cycles (~2 seconds) to do so.
		 */
		client.camera.moveToView(vp, 2.5);
		client.camera.enableControl();	// Enable camera mouse control
		
		/* Create a cube, size 10  */
		hemi.shape.create(client, {
			shape: 'cube',
			color: 0xff0000,
			size: 10 }).translateX(-90);
			
		/* Create a 5x5x20 box */
		hemi.shape.create(client, {
			shape: 'box',
			color: 0xff8800,
			h: 20, w: 5, d: 5 }).translateX(-70);
			
		/* Create a sphere of radius 10 */
		hemi.shape.create(client, {
			shape: 'sphere',
			color: 0xffff00,
			radius: 10 }).translateX(-50);
			
		/* Create a cylinder, radius 5, height 10 */
		hemi.shape.create(client, {
			shape: 'cylinder',
			color: 0x88ff00,
			r: 5, h: 10 }).translateX(-30);
			
		/* Create a cone, base radius 5, height 10 */
		hemi.shape.create(client, {
			shape: 'cone',
			color: 0x00ff00,
			r: 5, h: 10 }).translateX(-10);
			
		/* Create a tetrahedron of size 10 */
		hemi.shape.create(client, {
			shape: 'tetra',
			color: 0x00ffff,
			size: 10 }).translateX(10);
			
		/* Create a stellated octahedron, size 10 */
		hemi.shape.create(client, {
			shape: 'octa',
			color: 0x0000ff,
			size: 10 }).translateX(30);
			
		/* Create a 5x10x15 pyramid */
		hemi.shape.create(client, {
			shape: 'pyramid',
			color: 0x8800ff,
			h: 15, w: 5, d: 10 }).translateX(50);
			
		/* Create a custom shape from vertices */
		hemi.shape.create(client, {
			shape: 'custom',
			color: 0xff00ff,
			vertices: [new THREE.Vertex(new THREE.Vector3(-10, 0, 0)),
				new THREE.Vertex(new THREE.Vector3(0, 10, 3)),
				new THREE.Vertex(new THREE.Vector3(10, 2, -3))],
			faces: [new THREE.Face3(0, 1, 2),
				new THREE.Face3(0, 2, 1)],				
			faceVertexUvs: [[new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)],
			  	[new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)]]
		}).translateX(70);
		
		/* Create an arrow */
		hemi.shape.create(client, {
			shape: 'arrow',
			color: 0xff0088,
			size: 5, tail: 5, depth: 5 }).translateX(90);
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
