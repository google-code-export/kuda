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

/**
 * This is a simple hello world, showing how to set up a simple world, 
 *		load a model, and set the camera to a viewpoint once the model
 *		has loaded.
 */
(function() {
	
	function initStep1() {
		o3djs.webgl.makeClients(initStep2);
	};
	
	function initStep2 (clientElements) {
		
		/*
		 * It is possible to have multiple clients (i.e. multiple frames
		 * 		rendering 3d content) on one page that would have to be
		 * 		initialized. In this case, we only want to initialize the
		 *		first one.
		 */
		hemi.core.init(clientElements[0]);	
		
		/*
		 * Set the background color to a light-bluish. The parameter is in
		 * 		the form [red,blue,green,alpha], with each value on a 
		 *		scale of 0-1.
		 */
		hemi.view.setBGColor([0.7, 0.8, 1, 1]);
		hemi.loader.loadPath = '../../';
		createWorld();
	};
	
	function uninit() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	};
	
	function createWorld() {
	
		/*
		 * hemi.world.theWorld is the default world created to manage all of
		 * 		our models, cameras, effects, etc. New worlds can be created,
		 *		but we're happy with the default world in this case.
		 */
		var world = hemi.world;
		
		var house = new hemi.model.Model();				// Create a new Model
		house.setFileName('assets/house_v12/scene.json');	// Set the model file

		/*
		 * When the file name for the house model was set, it began loading.
		 *		When it finishes, it will send out a load message. Here, we
		 *		register a handler, setUpScene(), to be run when house finishes
		 *		loading and sends the message.
		 */
		house.subscribe(hemi.msg.load,
			function(msg) {	
				setUpScene(house);
			});
	};
	
	function setUpScene(house) {
		var vp1 = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp1.eye = hemi.core.math.matrix4.getTranslation(house.getTransforms('camEye_outdoors')[0].localMatrix);
		vp1.target = hemi.core.math.matrix4.getTranslation(house.getTransforms('camTarget_outdoors')[0].localMatrix);

		/*
		 * Move the camera from it's default position (eye : [0,0,-1],
		 * target : [0,0,0]} to the new viewpoint, and take 5 seconds to do so.
		 */
		hemi.world.camera.moveToView(vp1, 5);
		hemi.world.camera.enableControl();
		
		var count = 0;			// Counter to keep track of wall opacity
		var dir = 1;			// Whether wall is becoming more or less opaque
		
		/* Get the material used on the walls, add an opacity variable to its
		 * shader, and get the parameter that controls that opacity.
		 */
		var wallT = house.getTransforms('wallFront')[0],		
			opacity = 1.0;
		
		house.setTransformOpacity(wallT, opacity);
		
		/* On any keyDown, begin the fading. Reverse the direction each time */
		hemi.input.addKeyDownListener({
			onKeyDown : function(e) {
				if (count == 0) {
					count = 30;
					dir = -dir;
				} 
			}});
			
		/* Fade the wall a little more on each frame, between 1 and 0.4 */
		hemi.view.addRenderListener({
			onRender : function(e) {
				if (count > 0) {
					opacity += dir*0.02;
					house.setTransformOpacity(wallT, opacity);
					count--;
				}
			}});
		
	};
	
	window.onload = function() {
		initStep1();
	};
	window.onunload = function() {
		uninit();
	};
})();
