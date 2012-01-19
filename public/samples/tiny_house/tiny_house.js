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
 * This demo shows us how to set up a script that shows how to set up the
 * manometer, and blower door weatherization tools. The script calls for a simple
 * PressureEngine with two Locations and three Portals.
 */
(function() {
	var house;
	var houseWindow;
	var blowerFan;
	var client;

	function init(clientElements) {
		client = hemi.makeClients()[0];
		client.setBGColor(0xb2cbff, 1);
		hemi.loadPath = '../../';
		
		house = new hemi.Model(client);
		house.setFileName('assets/TinyHouse_v07/TinyHouse_v07.dae');
		
		hemi.subscribe(hemi.msg.ready,
			function(msg) {
				setupScene();
			});
		
		hemi.ready();
	}

	function setupScene() {
		house.getTransforms('spinDisk')[0].visible = false;
		house.getTransforms('fan_ring1')[0].visible = false;
		house.getTransforms('cam_Eye')[0].visible = false;
		house.getTransforms('cam_Target')[0].visible = false;
		house.getTransforms('SO_window')[0].visible = false;

		var winWidth = 16; // Typical window width
		var engine = new hext.engines.PressureEngine();
		var inside = new hext.engines.Location();
		inside.volume = 300; // A guess of the size since we don't have the actual sizes
		var outside = hext.engines.createOutsideLocation();

		blowerFan = {
			transform: house.getTransforms('fan_blades')[0],
			msgHandler: function(msg) {
				blowerFan.transform.addMotion('rotate', new THREE.Vector3(0, 0, 0.3 * msg.data.speed));
			},
			// A fan is a special case where it has an active portal and a leaking portal
			portal: new hext.engines.Portal(),
			leakPortal: new hext.engines.Portal(),
			init: function() {
				hemi.utils.centerGeometry(this.transform);
				this.portal.locationA = inside;
				this.portal.locationB = outside;
				this.portal.setWidth(winWidth * 1.1);
				this.portal.setLength(winWidth * 2.0);
				this.leakPortal.locationA = inside;
				this.leakPortal.locationB = outside;
				this.leakPortal.setWidth(10);
				this.leakPortal.setLength(4);
				return this;
			}
		}.init();

		houseWindow = {
			transform: house.getTransforms('SO_window')[0],
			msgHandler: function(msg) {
				houseWindow.portal.adjustOpening(msg.data.delta);
			},
			portal: new hext.engines.Portal(),
			init: function() {
				this.portal.locationA = inside;
				this.portal.locationB = outside;
				this.portal.setWidth(winWidth);
				this.portal.setClosedPosition(new THREE.Vector3(166, 0, 0));
				// Make the Transform movable on the YZ plane. Y always maps to the V coordinate, so
				// the Transform can be dragged from 0 to 0 on the Z plane and 0 to 55 on the Y
				// plane.
				this.transform.makeMovable(hemi.Plane.YZ, [0, 0, 0, 55], house.getTransforms('tinyHouseWindow_sash'));
				this.transform.subscribe(hemi.msg.move, this.msgHandler);
				return this;
			}
		}.init();

		// Add the locations and portals to the pressure engine
		engine.addLocation(inside);
		engine.addLocation(outside);
		engine.addPortal(houseWindow.portal);
		engine.addPortal(blowerFan.portal);
		engine.addPortal(blowerFan.leakPortal);
		// Create the manometer model
		var manometerModel = new hext.tools.Manometer();
		manometerModel.setVisible(true);
		manometerModel.setLocation(outside);
		// Create the manometer tubes
		var greenTube = new hext.tools.ManometerTube(hext.tools.InputId.UpperLeft, hext.tools.TubeType.Pressure);
		greenTube.manometer = manometerModel;
		greenTube.setLocation(inside);
		var redTube = new hext.tools.ManometerTube(hext.tools.InputId.UpperRight, hext.tools.TubeType.Cfm);
		redTube.manometer = manometerModel;
		// Create the manometer view's
		var manometerView = new hext.tools.ManometerView();
		manometerView.setVisible(true);
		var manometerToolbarView = new hext.tools.ManometerToolbarView();
		manometerToolbarView.setClickedState(true);
		manometerView.addLoadCallback(function() {
			manometerModel.setInput(greenTube);
			manometerModel.setInput(redTube);
			manometerView.setTapToDoor('ul', true);
			manometerView.setTapToBlower('ur', true);
			// Remove the ability to click the tap's on the manometer
			// Wait for the ManometerController to bind the click functionality
			setTimeout(function() {
				// Now unbind it
				manometerView.container.unbind('click');
			}, 500);
		});
		// Create the manometer controller
		var manController = new hext.tools.ManometerController();
		manController.setModel(manometerModel);
		manController.setToolbarView(manometerToolbarView);
		//  NOTE: Set the view after adding any callbacks, as done above
		manController.setView(manometerView);
		// Create the blower door model
		var blowerDoorModel = new hext.tools.BlowerDoor();
		blowerDoorModel.toLocation = outside;
		blowerDoorModel.fromLocation = inside;
		blowerDoorModel.setVisible(true);
		// The blower door is a special active portal, the others are not, it has to be added to the engine
		engine.addPortal(blowerDoorModel);
		// The blower door model does not have an id until added to the engine, the tube and handler have to be done after
		redTube.setLocation(blowerDoorModel);
		blowerDoorModel.subscribe(hext.msg.speed, blowerFan.msgHandler);
		// Set the Blower door to add its update to the PressureEngine when the
		// fan Portal does. This allows us to calculate the manometer's CFM
		// reading.
		blowerFan.portal.subscribe(
			hext.msg.pressure,
			blowerDoorModel,
			"sendUpdate",
			["msg:data.airFlow"]);
		// Create the blower door view's
		var blowerDoorView = new hext.tools.BlowerDoorView();
		blowerDoorView.setVisible(true);
		var blowerDoorToolbarView = new hext.tools.BlowerDoorToolbarView();
		blowerDoorToolbarView.setClickedState(true);
		// Create the blower door controller
		var blowerDoorController = new hext.tools.BlowerDoorController();
		blowerDoorController.setModel(blowerDoorModel);
		blowerDoorController.setView(blowerDoorView);
		blowerDoorController.setToolbarView(blowerDoorToolbarView);
		// Now we can put the views into the page
		hext.html.toolViews.addView(manometerView);
		hext.html.toolbar.addView(manometerToolbarView);
		hext.html.toolViews.addView(blowerDoorView);
		hext.html.toolbar.addView(blowerDoorToolbarView);
		// Place our camera in the desired spot
		var viewpoint = new hemi.Viewpoint();
		viewpoint.eye = new THREE.Vector3(500, 300, 1300);
		viewpoint.target = new THREE.Vector3(-425,-40,200);
		viewpoint.fov = 40 * hemi.DEG_TO_RAD;
		client.camera.moveToView(viewpoint, 1);
	}

	jQuery(window).load(function() {
		init();
	});
})();
