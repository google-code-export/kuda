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

	var client,
        pump;

	function createWorld() {

		/**
		 * hemi.world is the default world created to manage all of our models,
		 *		cameras, effects, etc. When we set the model's file name, it
		 *		will begin loading that file.
		 */
		pump = new hemi.Model(client);		// Create a new Model
		pump.setFileName('assets/AlfaLavalPump_v21b/AlfaLavalPump_v21b.dae'); // Set the model file
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
	}

	function setupScene() {
		var vp = new hemi.Viewpoint();		// Create a new viewpoint
        vp.eye = new THREE.Vector3(-41.01455, 27.41051, 90.48234);
        vp.target = new THREE.Vector3(-9.798193, 17.47285, 36.63753);
        vp.np = 5;
        vp.fp = 5000;
        vp.fov = 0.6632251157578453;

		/**
		 * Move the camera from it's default position (eye : [0,0,-1],
		 *		target : [0,0,0]} to the new viewpoint, and take 120
		 *		render cycles (~2 seconds) to do so.
		 */
		client.camera.moveToView(vp, 0);
		client.camera.enableControl();	// Enable camera mouse control
 		
        pump.getTransform('camEye_camera').setVisible(false, true);
		pump.getTransform('camTarget_camera').setVisible(false, true);
		pump.getTransform('camCover1').setVisible(false, true);
		pump.getTransform('camCover2').setVisible(false, true);
		pump.getTransform('nutsAndBolts_G').setVisible(false, true);
		pump.getTransform('camGearUpper_G').setVisible(false, true);
		pump.getTransform('camGearLower_G').setVisible(false, true);
		pump.getTransform('gearCover').setVisible(false, true);
        pump.getTransform('pistonHousing_G').setVisible(false, true);
        pump.getTransform('piston1').setVisible(false, true);
		pump.getTransform('piston2').setVisible(false, true);
        pump.getTransform('pistonLock1_G').setVisible(false, true);
		pump.getTransform('pistonLock2_G').setVisible(false, true);
        pump.getTransform('pistonCover').setVisible(false, true);
		pump.getTransform('nuts_PistonCover_G').setVisible(false, true);
        pump.getTransform('gearBolts_G').setVisible(false, true);
        pump.getTransform('shaft_u').setVisible(true, true);
        pump.getTransform('shaft_L').setVisible(true, true);
       
        var animation = new hemi.AnimationGroup(0, 2830/60, pump),
            triggerTimes = [];

        triggerTimes.push(hemi.getTimeOfFrame(391));
        triggerTimes.push(hemi.getTimeOfFrame(637));
        triggerTimes.push(hemi.getTimeOfFrame(882));
        triggerTimes.push(hemi.getTimeOfFrame(1002));
        triggerTimes.push(hemi.getTimeOfFrame(1107));
        triggerTimes.push(hemi.getTimeOfFrame(1366));
        triggerTimes.push(hemi.getTimeOfFrame(1536));

		animation.subscribe(hemi.msg.animate, function(msg) {
		    var time = msg.data.time;
			var prev = msg.data.previous;

            for (var i = 0, il = triggerTimes.length; i < il; i++) {
                var triggerTime = triggerTimes[i];
    			if (triggerTime > prev && triggerTime < time) {
                    if (i == 0) {
        				pump.getTransform('gearCoverBolts_G').setVisible(false, true);
		        		pump.getTransform('nutsAndBolts_nut_pumpHousing1').setVisible(false, true);
        				pump.getTransform('nutsAndBolts_nut_pumpHousing2').setVisible(false, true);
        				pump.getTransform('nutsAndBolts_nut_pumpHousing3').setVisible(false, true);
        				pump.getTransform('nutsAndBolts_nut_pumpHousing4').setVisible(false, true);
        				pump.getTransform('camGearUpper_G').setVisible(false, true);
        				pump.getTransform('camGearLower_G').setVisible(false, true);
        				pump.getTransform('camCover1').setVisible(true, true);
        				pump.getTransform('camCover2').setVisible(true, true);
        				pump.getTransform('nutsAndBolts_G').setVisible(true, true);
                    } else if (i == 1) {
        				pump.getTransform('camGearUpper_G').setVisible(true, true);
        				pump.getTransform('camGearLower_G').setVisible(true, true);
        				pump.getTransform('gearBolts_G').setVisible(true, true);
                    } else if (i == 2) {
        				pump.getTransform('gearCover').setVisible(true, true);
        				pump.getTransform('gearCoverBolts_G').setVisible(true, true);
                    } else if (i == 3) {
        				pump.getTransform('pistonHousing_G').setVisible(true, true);
                    } else if (i == 4) {
	        			pump.getTransform('piston1').setVisible(true, true);
    		    		pump.getTransform('piston2').setVisible(true, true);
        				pump.getTransform('pistonLock1_G').setVisible(true, true);
        				pump.getTransform('pistonLock2_G').setVisible(true, true);
                    } else if (i == 5) {
    	    			pump.getTransform('nutsAndBolts_nut_pumpHousing1').setVisible(true, true);
	    	    		pump.getTransform('nutsAndBolts_nut_pumpHousing2').setVisible(true, true);
        				pump.getTransform('nutsAndBolts_nut_pumpHousing3').setVisible(true, true);
        				pump.getTransform('nutsAndBolts_nut_pumpHousing4').setVisible(true, true);
                    } else if (i == 6) {
	        			pump.getTransform('pistonCover').setVisible(true, true);
    		    		pump.getTransform('nuts_PistonCover_G').setVisible(true, true);
                    } else {

                    }
                }
            }
		});

        animation.start();
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
		client.setBGColor(0xb2cbff, 1);
		
		/**
		 * Set a prefix for the loader that will allow us to load assets as if
		 * the pump.html file was in the root directory.
		 */
		hemi.loadPath = '../../';
		
		createWorld();
	};
})();
