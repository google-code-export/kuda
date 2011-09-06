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
	
	function init(clientElements) {
		hemi.core.init(clientElements[0]);	
		hemi.view.setBGColor([0, 0, 0.3, 1]);
		hemi.loader.loadPath = '../../';
		hemi.world.subscribe(hemi.msg.ready, setupScene);
		hemi.world.ready();
	}

	function setupScene() {
		var vp = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp.eye = [0,40,100];					// Set viewpoint eye
		vp.target = [0,0,0];					// Set viewpoint target
		hemi.world.camera.moveToView(vp, 5);
		hemi.world.camera.enableControl();	// Enable camera mouse control
		
		/* Create a cube, size 10  */
		hemi.shape.create({
			shape: 'cube',
			color: [1,0,0,1],
			size: 10 }).translate(-90,0,0);
			
		/* Create a 5x5x20 box */
		hemi.shape.create({
			shape: 'box',
			color: [1,0.5,0,1],
			h: 20, w: 5, d: 5 }).translate(-70,0,0);
			
		/* Create a sphere of radius 10 */
		hemi.shape.create({
			shape: 'sphere',
			color: [1,1,0,1],
			radius: 10 }).translate(-50,0,0);
			
		/* Create a cylinder, radius 5, height 10 */
		hemi.shape.create({
			shape: 'cylinder',
			color: [0.5,1,0,1],
			r: 5, h: 10 }).translate(-30,0,0);
			
		/* Create a cone, base radius 5, height 10 */
		hemi.shape.create({
			shape: 'cone',
			color: [0,1,0,1],
			r: 5, h: 10 }).translate(-10,0,0);
			
		/* Create a tetrahedron of size 10 */
		hemi.shape.create({
			shape: 'tetra',
			color: [0,1,1,1],
			size: 10 }).translate(10,0,0);
			
		/* Create a stellated octahedron, size 10 */
		hemi.shape.create({
			shape: 'octa',
			color: [0,0,1,1],
			size: 10 }).translate(30,0,0);
			
		/* Create a 5x10x15 pyramid */
		hemi.shape.create({
			shape: 'pyramid',
			color: [0.5,0,1,1],
			h: 15, w: 5, d: 10 }).translate(50,0,0);
			
		/* Create a custom shape from vertices */
		hemi.shape.create({
			shape: 'custom',
			color: [1,0,1,1],
			vertices: [[[-10,0,0],[0,10,3],[10,2,-3]],
					   [[-10,0,0],[10,2,-3],[0,10,3]]] }).translate(70,0,0);
		
		/* Create an arrow */
		hemi.shape.create({
			shape: 'arrow',
			color: [1,0,0.5,1],
			size: 5, tail: 5 }).translate(90,0,0);
	}

	jQuery(window).load(function() {
		o3djs.webgl.makeClients(init);
	});

	jQuery(window).unload(function() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	});
})();
