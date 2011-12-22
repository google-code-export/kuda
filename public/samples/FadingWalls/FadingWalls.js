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
	var client;
	
	function createWorld() {
	
		/*
		 * hemi.world.theWorld is the default world created to manage all of
		 * 		our models, cameras, effects, etc. New worlds can be created,
		 *		but we're happy with the default world in this case.
		 */
		var world = hemi.world;
		
		var house = new hemi.Model(client.scene);				// Create a new Model
		house.setFileName('assets/house_v12/house_v12.dae');	// Set the model file

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
		var vp1 = new hemi.Viewpoint();		// Create a new Viewpoint
		vp1.eye = house.getObject3Ds('camEye_outdoors')[0].position.clone();
		vp1.target = house.getObject3Ds('camTarget_outdoors')[0].position.clone();

		/*
		 * Move the camera from it's default position (eye : [0,0,-1],
		 * target : [0,0,0]} to the new viewpoint, and take 5 seconds to do so.
		 */
		client.camera.moveToView(vp1, 2);
		client.camera.enableControl();
		
		var cnt = 0;			// Counter to keep track of wall opacity
		var dir = 1;			// Whether wall is becoming more or less opaque
		
		/* Get the material used on the walls, add an opacity variable to its
		 * shader, and get the parameter that controls that opacity.
		 */
		var wallT = house.getObject3Ds('wallFront')[0],		
			opacity = 1.0;
		
		hemi.fx.setOpacity(client, wallT, wallT.material, opacity);
		
		/* On any keyDown, begin the fading. Reverse the direction each time */
		hemi.input.addKeyDownListener({
			onKeyDown : function(e) {
				if (cnt == 0) {
					cnt = 30;
					dir = -dir;
				} 
			}});
			
		/* Fade the wall a little more on each frame, between 1 and 0.4 */
		hemi.addRenderListener({
			onRender : function(e) {
				if (cnt > 0) {
					opacity += dir*0.02;
					hemi.fx.setOpacity(client, wallT, wallT.material, opacity);
					cnt--;
				}
			}});
		
	};

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
		client.setBGColor(0xbbccff, 1);
		
		/**
		 * Set a prefix for the loader that will allow us to load assets as if
		 * the helloWorld.html file was in the root directory.
		 */
		hemi.loadPath = '../../';
		
		createWorld();
	};
})();
