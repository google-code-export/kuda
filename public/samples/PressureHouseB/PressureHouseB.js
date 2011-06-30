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
 * This demo shows us how to set up a very complex script that takes advantage
 * of Scenes to organize behavior into logical segments. It also shows how to
 * set up the manometer, blower door, and smoke puffer weatherization tools as
 * well as the camera navigation tool. The script calls for a complex
 * PressureEngine with several Locations and many Portals. It also requires us
 * to define two custom classes (doors and pulsator) as well as a custom Message
 * type ("Swing").
 */
(function() {
	o3djs.require('hext.hud.paging');
	
	// Require the html extensions
	o3djs.require('hext.html.toolbar');
	o3djs.require('hext.html.toolViews');
	// Include the PressureEngine extension
	o3djs.require('hext.engines.pressure');
	// Require the appropriate tools
	o3djs.require('hext.tools.manometer');
	o3djs.require('hext.tools.manometerTube');
	o3djs.require('hext.tools.manometerView');
	o3djs.require('hext.tools.manometerController');
	o3djs.require('hext.tools.blowerDoor');
	o3djs.require('hext.tools.blowerDoorView');
	o3djs.require('hext.tools.blowerDoorController');
	o3djs.require('hext.tools.navigation');
	o3djs.require('hext.tools.navigationView');
	o3djs.require('hext.tools.navigationController');
	o3djs.require('hext.tools.shapeView');
	o3djs.require('hext.tools.smokepuffer');
	o3djs.require('hext.tools.smokePufferView');
	o3djs.require('hext.tools.smokePufferController');

	function init(clientElements) {
		hemi.core.init(clientElements[0]);
		hemi.view.setBGColor([1, 1, 1, 1]);
		hemi.loader.loadPath = '../../';
		
		// Load the model
		var house = new hemi.model.Model();
		house.setFileName('assets/ScenarioB_v017/scene.json');
		
		// When the World is initialized, create the script.
		hemi.world.subscribe(hemi.msg.ready,
			function(msg) {
				setupModel(house);
				var firstScene = setupWorld(house);
				// Once everything is set up, move to the first Scene.
				firstScene.load();
			});
		
		hemi.world.ready();
	}
	
	var setupModel = function(model) {
		// Set these Transforms to be hidden and non-pickable
		var t1 = model.getTransforms('BD_barrier')[0],
			t2 = model.getTransforms('spinDisk')[0],
			t3 = model.getTransforms('highlight_manometer')[0],
			t4 = model.getTransforms('highlight_bdHole')[0],
			t5 = model.getTransforms('highlight_fanPressTap')[0],
			t6 = model.getTransforms('highlight_frontDoor')[0],
			t7 = model.getTransforms('blowerArrowsExt_g')[0],
			t8 = model.getTransforms('B1_window_paneTL')[0],
			t9 = model.getTransforms('B1_window_paneTR')[0],
			t10 = model.getTransforms('B1_window_paneLL')[0],
			t11 = model.getTransforms('B1_window_paneLR')[0];
		
		model.setTransformVisible(t1, false);
		model.setTransformPickable(t1, false);
		model.setTransformVisible(t2, false);
		model.setTransformPickable(t2, false);
		model.setTransformVisible(t3, false);
		model.setTransformPickable(t3, false);
		model.setTransformVisible(t4, false);
		model.setTransformPickable(t4, false);
		model.setTransformVisible(t5, false);
		model.setTransformPickable(t5, false);
		model.setTransformVisible(t6, false);
		model.setTransformPickable(t6, false);
		model.setTransformVisible(t7, false);
		model.setTransformPickable(t7, false);
		model.setTransformVisible(t8, false);
		model.setTransformPickable(t8, false);
		model.setTransformVisible(t9, false);
		model.setTransformPickable(t9, false);
		model.setTransformVisible(t10, false);
		model.setTransformPickable(t10, false);
		model.setTransformVisible(t11, false);
		model.setTransformPickable(t11, false);

		var t = model.transforms;
		
		for(var i = 0; i < t.length; i++) {
			var name = t[i].name;
			
			if (name === 'SO_B2_1') {
				// Set this particular select Transform to be hidden and
				// non-pickable
				model.setTransformVisible(t[i], false);
				model.setTransformPickable(t[i], false);
			} else if(name.substring(0,3) === 'SO_') {
				// Set select Transforms to be hidden
				model.setTransformVisible(t[i], false);
			} else if(name.substring(0,3) === 'cam') {
				// Set camera Transforms to be hidden and non-pickable
				model.setTransformVisible(t[i], false);
				model.setTransformPickable(t[i], false);
			}
		}
		
		// Make the material of the highlight shapes pulse between two different
		// colors.
		var highlightTran = model.getTransforms('highlight_bdHole')[0];
		var highlightMat = highlightTran.shapes[0].elements[0].material;
		
		var pulsator = {
			diffuse: highlightMat.getParam('diffuse'),
			count: 0,
			direction: 1,
			onRender: function(event) {
				this.count += this.direction;
				if (this.count > 30) this.direction = -1;
				if (this.count < 0) this.direction = 1;
				
				if (this.diffuse.value != undefined) {
					this.diffuse.value = hemi.core.math.addVector(
						this.diffuse.value,
						[0, this.direction / 45, 0, 0]);
				}
			}
		};
		
		pulsator.diffuse.value = [1,0,0,1];
		hemi.view.addRenderListener(pulsator);
	};
	
	var setupWorld = function(model) {
		// Set up the PressureEngine
		var engine = new hext.engines.PressureEngine();
		
		// Locations
		var bathroom = new hext.engines.Location();
		bathroom.volume = 150;
		var bedroom1 = new hext.engines.Location();
		bedroom1.volume = 500;
		var bedroom2 = new hext.engines.Location();
		bedroom2.volume = 700;
		var livingroom = new hext.engines.Location();
		livingroom.volume = 2000;
		var outside = hext.engines.createOutsideLocation();
		
		// Window Portals
		var winWidth = 16;
		
		var lrWindow1Right = new hext.engines.Portal();
		lrWindow1Right.locationA = livingroom;
		lrWindow1Right.locationB = outside;
		lrWindow1Right.setWidth(winWidth);
		
		var lrWindow1Left = new hext.engines.Portal();
		lrWindow1Left.locationA = livingroom;
		lrWindow1Left.locationB = outside;
		lrWindow1Left.setWidth(winWidth);
		
		var lrWindow2Right = new hext.engines.Portal();
		lrWindow2Right.locationA = livingroom;
		lrWindow2Right.locationB = outside;
		lrWindow2Right.setWidth(winWidth);
		
		var lrWindow2Left = new hext.engines.Portal();
		lrWindow2Left.locationA = livingroom;
		lrWindow2Left.locationB = outside;
		lrWindow2Left.setWidth(winWidth);
		
		var lrWindow3Right = new hext.engines.Portal();
		lrWindow3Right.locationA = livingroom;
		lrWindow3Right.locationB = outside;
		lrWindow3Right.setWidth(winWidth);
		
		var lrWindow3Left = new hext.engines.Portal();
		lrWindow3Left.locationA = livingroom;
		lrWindow3Left.locationB = outside;
		lrWindow3Left.setWidth(winWidth);
		
		var lrWindow4Right = new hext.engines.Portal();
		lrWindow4Right.locationA = livingroom;
		lrWindow4Right.locationB = outside;
		lrWindow4Right.setWidth(winWidth);
		
		var lrWindow4Left = new hext.engines.Portal();
		lrWindow4Left.locationA = livingroom;
		lrWindow4Left.locationB = outside;
		lrWindow4Left.setWidth(winWidth);
		
		var kiWindow1Right = new hext.engines.Portal();
		kiWindow1Right.locationA = livingroom;
		kiWindow1Right.locationB = outside;
		kiWindow1Right.setWidth(winWidth);
		
		var kiWindow1Left = new hext.engines.Portal();
		kiWindow1Left.locationA = livingroom;
		kiWindow1Left.locationB = outside;
		kiWindow1Left.setWidth(winWidth);
		
		var b2Window1Right = new hext.engines.Portal();
		b2Window1Right.locationA = bedroom2;
		b2Window1Right.locationB = outside;
		b2Window1Right.setWidth(winWidth);
		
		var b2Window1Left = new hext.engines.Portal();
		b2Window1Left.locationA = bedroom2;
		b2Window1Left.locationB = outside;
		b2Window1Left.setWidth(winWidth);
		
		var b2Window2Right = new hext.engines.Portal();
		b2Window2Right.locationA = bedroom2;
		b2Window2Right.locationB = outside;
		b2Window2Right.setWidth(winWidth);
		b2Window2Right.setLength(5);
		
		var b2Window2Left = new hext.engines.Portal();
		b2Window2Left.locationA = bedroom2;
		b2Window2Left.locationB = outside;
		b2Window2Left.setWidth(winWidth);
		b2Window2Left.setLength(5);
		
		var b1Window1Right = new hext.engines.Portal();
		b1Window1Right.locationA = bedroom1;
		b1Window1Right.locationB = outside;
		b1Window1Right.setWidth(winWidth);
		b1Window1Right.setLength(12.5);
		
		var b1Window1Left = new hext.engines.Portal();
		b1Window1Left.locationA = bedroom1;
		b1Window1Left.locationB = outside;
		b1Window1Left.setWidth(winWidth);
		b1Window1Left.setLength(12.5);
		
		var baWindow1 = new hext.engines.Portal();
		baWindow1.locationA = bathroom;
		baWindow1.locationB = outside;
		baWindow1.setWidth(winWidth * 0.55);
		baWindow1.setLength(3.25);
		
		var fan = new hext.engines.Portal();
		fan.locationA = livingroom;
		fan.locationB = outside;
		fan.setWidth(winWidth * 0.5);
		fan.setLength(winWidth * 0.5);
		
		engine.addLocation(bathroom);
		engine.addLocation(bedroom1);
		engine.addLocation(bedroom2);
		engine.addLocation(livingroom);
		engine.addLocation(outside);
		
		engine.addPortal(lrWindow1Right);
		engine.addPortal(lrWindow1Left);
		engine.addPortal(lrWindow2Right);
		engine.addPortal(lrWindow2Left);
		engine.addPortal(lrWindow3Right);
		engine.addPortal(lrWindow3Left);
		engine.addPortal(lrWindow4Right);
		engine.addPortal(lrWindow4Left);
		engine.addPortal(kiWindow1Right);
		engine.addPortal(kiWindow1Left);
		engine.addPortal(b2Window1Right);
		engine.addPortal(b2Window1Left);
		engine.addPortal(b2Window2Right);
		engine.addPortal(b2Window2Left);
		engine.addPortal(b1Window1Right);
		engine.addPortal(b1Window1Left);
		engine.addPortal(baWindow1);
		engine.addPortal(fan);
		
		// Door Portals
		var doorWidth = 20;
		var doorLength = 45;
		
		var baDoor = new hext.engines.Portal();
		baDoor.locationA = livingroom;
		baDoor.locationB = bathroom;
		baDoor.setWidth(doorWidth);
		
		var b1Door = new hext.engines.Portal();
		b1Door.locationA = livingroom;
		b1Door.locationB = bedroom1;
		b1Door.setWidth(doorWidth);
		b1Door.setLength(doorLength);
		
		var b2Door = new hext.engines.Portal();
		b2Door.locationA = livingroom;
		b2Door.locationB = bedroom2;
		b2Door.setWidth(doorWidth);
		b2Door.setLength(doorLength);
		
		engine.addPortal(baDoor);
		engine.addPortal(b1Door);
		engine.addPortal(b2Door);
		
		// Create a set of Portals to represent a house's natural leakiness.
		var leaks = [];
		var leakNdx = 0;
		var leakWidth = 5;
		var leakLength = 24.2;
		
		leaks[leakNdx] = new hext.engines.Portal();
		leaks[leakNdx].locationA = bathroom;
		leaks[leakNdx].locationB = outside;
		leaks[leakNdx].setWidth(leakWidth);
		leaks[leakNdx++].setLength(leakLength);
		
		leaks[leakNdx] = new hext.engines.Portal();
		leaks[leakNdx].locationA = bathroom;
		leaks[leakNdx].locationB = livingroom;
		leaks[leakNdx].setWidth(leakWidth);
		leaks[leakNdx++].setLength(leakLength);
		
		// Create one particularly large leak for the user to find.
		var bigLeakWidth = 5;
		var bigLeakLength = 50;
		leaks[leakNdx] = new hext.engines.Portal();
		leaks[leakNdx].locationA = bedroom1;
		leaks[leakNdx].locationB = outside;
		leaks[leakNdx].setWidth(bigLeakWidth);
		leaks[leakNdx++].setLength(bigLeakLength);
		
		leaks[leakNdx] = new hext.engines.Portal();
		leaks[leakNdx].locationA = bedroom1;
		leaks[leakNdx].locationB = livingroom;
		leaks[leakNdx].setWidth(leakWidth);
		leaks[leakNdx++].setLength(leakLength);
		
		leaks[leakNdx] = new hext.engines.Portal();
		leaks[leakNdx].locationA = bedroom2;
		leaks[leakNdx].locationB = outside;
		leaks[leakNdx].setWidth(leakWidth);
		leaks[leakNdx++].setLength(leakLength);
		
		leaks[leakNdx] = new hext.engines.Portal();
		leaks[leakNdx].locationA = bedroom2;
		leaks[leakNdx].locationB = livingroom;
		leaks[leakNdx].setWidth(leakWidth);
		leaks[leakNdx++].setLength(leakLength);
		
		leaks[leakNdx] = new hext.engines.Portal();
		leaks[leakNdx].locationA = outside;
		leaks[leakNdx].locationB = livingroom;
		leaks[leakNdx].setWidth(leakWidth);
		leaks[leakNdx++].setLength(leakLength);
		
		for (var ndx = 0; ndx < leakNdx; ndx++) {
			engine.addPortal(leaks[ndx]);
		}
		
		// Set up the Draggable windows.
		var b1RightWinDrag = new hemi.manip.Draggable(hemi.manip.Plane.XY, [[0, 0], [0, 55]], [0, 44]);
		var b1RightWinTran = model.getTransforms('B1_window01_sashRight')[0];
		var b1RightWinTranSO = model.getTransforms('SO_B1_window_right')[0];
		b1RightWinDrag.addTransform(b1RightWinTran);
		b1RightWinDrag.addTransform(b1RightWinTranSO);
		
		// Set the position of the corresponding window Portal and register it
		// to handle updates from the Draggable.
		b1Window1Right.setClosedPosition([0, 0, -899]);
		b1Window1Right.setOpening([0, 44, -899]);
		b1RightWinDrag.subscribe(hemi.msg.drag,
			b1Window1Right,
			"adjustOpening",
			["msg:data.drag"]);
		
		var b1LeftWinDrag = new hemi.manip.Draggable(hemi.manip.Plane.XY, [[0, 0], [0, 55]], [0, 44]);
		var b1LeftWinTran = model.getTransforms('B1_window_sashLeft')[0];
		var b1LeftWinTranSO = model.getTransforms('SO_B1_window_left')[0];
		b1LeftWinDrag.addTransform(b1LeftWinTran);
		b1LeftWinDrag.addTransform(b1LeftWinTranSO);
		
		b1Window1Left.setClosedPosition([0, 0, -899]);
		b1Window1Left.setOpening([0, 44, -899]);
		b1LeftWinDrag.subscribe(hemi.msg.drag,
			b1Window1Left,
			"adjustOpening",
			["msg:data.drag"]);
		
		var b2RightWinDrag = new hemi.manip.Draggable(hemi.manip.Plane.YZ, [[0, 0], [0, 55]], [0, 17]);
		var b2RightWinTran = model.getTransforms('B2_window2_sashRight')[0];
		var b2RightWinTranSO = model.getTransforms('SO_B2_window2_right')[0];
		b2RightWinDrag.addTransform(b2RightWinTran);
		b2RightWinDrag.addTransform(b2RightWinTranSO);
		
		b2Window2Right.setClosedPosition([1000, 0, 0]);
		b2Window2Right.setOpening([1000, 17, 0]);
		b2RightWinDrag.subscribe(hemi.msg.drag,
			b2Window2Right,
			"adjustOpening",
			["msg:data.drag"]);
		
		var b2LeftWinDrag = new hemi.manip.Draggable(hemi.manip.Plane.YZ, [[0, 0], [0, 55]], [0, 17]);
		var b2LeftWinTran = model.getTransforms('B2_window2_sashLeft')[0];
		var b2LeftWinTranSO = model.getTransforms('SO_B2_window2_left')[0];
		b2LeftWinDrag.addTransform(b2LeftWinTran);
		b2LeftWinDrag.addTransform(b2LeftWinTranSO);
		
		b2Window2Left.setClosedPosition([1000, 0, 0]);
		b2Window2Left.setOpening([1000, 17, 0]);
		b2LeftWinDrag.subscribe(hemi.msg.drag,
			b2Window2Left,
			"adjustOpening",
			["msg:data.drag"]);
		
		var baWinDrag = new hemi.manip.Draggable(hemi.manip.Plane.YZ, [[0, 0], [32, 0]], [13, 0]);
		var baWinTran = model.getTransforms('BA_windowSashRight')[0];
		var baWinTranSO = model.getTransforms('SO_BA_window')[0];
		baWinDrag.addTransform(baWinTran);
		baWinDrag.addTransform(baWinTranSO);
		
		baWindow1.setClosedPosition([-654, 0, 0]);
		baWindow1.setOpening([-654, 0, 13]);
		baWinDrag.subscribe(hemi.msg.drag,
			baWindow1,
			"adjustOpening",
			["msg:data.drag"]);
		
		// Set up the swinging doors
		var cw = 1;
		var ccw = -1;
		
		var b1DoorTran = model.getTransforms('B1_door')[0];
		var b1DoorRot = new hemi.motion.Rotator(b1DoorTran, {
			origin: [16.758, -14.848, 0]
		});
		
		var door1 = createDoor(b1DoorRot, cw, true);
		door1.addAltName('SO_B1_2');
		
		var b2DoorTran = model.getTransforms('B2_door')[0];
		var b2DoorRot = new hemi.motion.Rotator(b2DoorTran, {
			origin: [394.4, -20.1, 0]
		});
		
		var door2 = createDoor(b2DoorRot, ccw, true);
		door2.addAltName('SO_B2_2');
		
		var baDoorTran = model.getTransforms('BA_door')[0];
		var baDoorRot = new hemi.motion.Rotator(baDoorTran, {
			origin: [-135, -63.9, 0]
		});
		
		var door3 = createDoor(baDoorRot, ccw, false);
		door3.addAltName('SO_BA_2');
		
		// Set the corresponding door Portals to handle updates from the
		// Rotators. This allows the PressureEngine to respond to doors that are
		// open or closed.
		b1DoorRot.subscribe("Swing", b1Door, "setOpening", ["msg:data.position"]);
		b2DoorRot.subscribe("Swing", b2Door, "setOpening", ["msg:data.position"]);
		baDoorRot.subscribe("Swing", baDoor, "setOpening", ["msg:data.position"]);
		
		// Set up the tools
		
		// Manometer
		var manConfig = new hext.tools.ManometerViewConfig();
		var manView = new hext.tools.ManometerView(manConfig);
        var manToolbarConfig = new hext.tools.ManometerToolbarViewConfig();
		var manToolbarView = new hext.tools.ManometerToolbarView(manToolbarConfig);
		
		var manometer = new hext.tools.Manometer();
		manometer.setLocation(livingroom);
        
        var manShapeView = new hext.tools.ShapeView();
        manShapeView.addTransform(model.getTransforms('LR_manometer')[0]);
		
		hext.html.toolViews.addView(manView);
		hext.html.toolbar.addView(manToolbarView);
		
		var manController = new hext.tools.ManometerController();
		manController.setModel(manometer);
		manController.setView(manView);
		manController.setShapeView(manShapeView);
		manController.setToolbarView(manToolbarView);
		manController.locationManager = engine;
		
		// Blower door
		var blowerDoor = new hext.tools.BlowerDoor();
		blowerDoor.toLocation = outside;
		blowerDoor.fromLocation = livingroom;
		engine.addPortal(blowerDoor);
		// Set the Blower door to add its update to the PressureEngine when the
		// fan Portal does. This allows us to calculate the manometer's CFM
		// reading.
		fan.subscribe(hext.msg.pressure,
			blowerDoor,
			"sendUpdate",
			["msg:data.airFlow"]);
		
		var viewCfg = new hext.tools.BlowerDoorViewConfig();
		var blowerDoorView = new hext.tools.BlowerDoorView(viewCfg);
        var bdToolbarConfig = new hext.tools.BlowerDoorToolbarViewConfig();
		var blowerDoorToolbarView = new hext.tools.BlowerDoorToolbarView(bdToolbarConfig);
		
		hext.html.toolViews.addView(blowerDoorView);
		hext.html.toolbar.addView(blowerDoorToolbarView);
		
		var blowerDoorController = new hext.tools.BlowerDoorController();
		blowerDoorController.setModel(blowerDoor);
		blowerDoorController.setView(blowerDoorView);
		blowerDoorController.setToolbarView(blowerDoorToolbarView);
		
		// Create a Rotator to animate the fan blades in response to the blower
		// door control.
		var fanTrans = model.getTransforms('fan_blades')[0];
		var fanRotator = new hemi.motion.Rotator(fanTrans, {
			origin: [19.9943, 41.8675, 0]
		});
		
		blowerDoor.subscribe(hext.msg.speed,
			function(msg) {
				fanRotator.setVel([0, 0, 0.3 * msg.data.speed]);
			});
		
		// Manometer tubes
		var tube1 = new hext.tools.ManometerTube(
			hext.tools.InputId.LowerLeft,
			hext.tools.TubeType.Pressure);
		tube1.manometer = manometer;
		tube1.setLocation(outside);
		
		var tube2 = new hext.tools.ManometerTube(
			hext.tools.InputId.UpperRight,
			hext.tools.TubeType.Cfm);
		tube2.manometer = manometer;
		tube2.setLocation(blowerDoor);
		
		var tube3 = new hext.tools.ManometerTube(
			hext.tools.InputId.UpperRight,
			hext.tools.TubeType.PressureYellow);
		tube3.manometer = manometer;
		tube3.setLocation(bathroom);
		
		var tube4 = new hext.tools.ManometerTube(
			hext.tools.InputId.UpperRight,
			hext.tools.TubeType.PressureYellow);
		tube4.manometer = manometer;
		tube4.setLocation(bedroom1);
		
		var tube5 = new hext.tools.ManometerTube(
			hext.tools.InputId.UpperRight,
			hext.tools.TubeType.PressureYellow);
		tube5.manometer = manometer;
		tube5.setLocation(bedroom2);
        
        var tube1ShapeView = new hext.tools.ShapeView();
        tube1ShapeView.addTransform(model.getTransforms('greenTube')[0]);
		
		var tube1Controller = new hext.tools.BaseController();
		tube1Controller.setModel(tube1);
		tube1Controller.setShapeView(tube1ShapeView);
		
        var tube2ShapeView = new hext.tools.ShapeView();
        tube2ShapeView.addTransform(model.getTransforms('redTube')[0]);
		
		var tube2Controller = new hext.tools.BaseController();
		tube2Controller.setModel(tube2);
		tube2Controller.setShapeView(tube2ShapeView);
		
        var tube3ShapeView = new hext.tools.ShapeView();
        tube3ShapeView.addTransform(model.getTransforms('tube_BA')[0]);
		
		var tube3Controller = new hext.tools.BaseController();
		tube3Controller.setModel(tube3);
		tube3Controller.setShapeView(tube3ShapeView);
		
        var tube4ShapeView = new hext.tools.ShapeView();
        tube4ShapeView.addTransform(model.getTransforms('tube_B1')[0]);
		
		var tube4Controller = new hext.tools.BaseController();
		tube4Controller.setModel(tube4);
		tube4Controller.setShapeView(tube4ShapeView);
		
        var tube5ShapeView = new hext.tools.ShapeView();
        tube5ShapeView.addTransform(model.getTransforms('tube_B2')[0]);
		
		var tube5Controller = new hext.tools.BaseController();
		tube5Controller.setModel(tube5);
		tube5Controller.setShapeView(tube5ShapeView);
		
		var tubeManager = new hext.tools.ManometerTubeManager();
		tubeManager.addTube(tube1);
		tubeManager.addTube(tube2);
		tubeManager.addTube(tube3);
		tubeManager.addTube(tube4);
		tubeManager.addTube(tube5);
		
		manController.tubeManager = tubeManager;
		
		// Location selectors to help place Manometer tubes
		var outsideSel = new hext.engines.LocationSelector();
		outsideSel.location = outside;
		outsideSel.shapeName = 'SO_bdHoleShape';
		engine.addLocationSelector(outsideSel);
		
		var blowerSel = new hext.engines.LocationSelector();
		blowerSel.location = blowerDoor;
		blowerSel.shapeName = 'SO_fanPressTapShape';
		engine.addLocationSelector(blowerSel);
		
		var bathSel = new hext.engines.LocationSelector();
		bathSel.location = bathroom;
		bathSel.shapeName = 'SO_BA_Shape2';
		engine.addLocationSelector(bathSel);
        var bathSel2 = new hext.engines.LocationSelector();
        bathSel2.location = bathroom;
        bathSel2.shapeName = 'SO_BA_Shape1';
        engine.addLocationSelector(bathSel2);
		
		var b1Sel = new hext.engines.LocationSelector();
		b1Sel.location = bedroom1;
		b1Sel.shapeName = 'SO_B1_Shape2';
		engine.addLocationSelector(b1Sel);
        var b1Sel2 = new hext.engines.LocationSelector();
        b1Sel2.location = bedroom1;
        b1Sel2.shapeName = 'SO_B1_Shape1';
        engine.addLocationSelector(b1Sel2);
		
		var b2Sel = new hext.engines.LocationSelector();
		b2Sel.location = bedroom2;
		b2Sel.shapeName = 'SO_B2_Shape2';
		engine.addLocationSelector(b2Sel);
        var b2Sel2 = new hext.engines.LocationSelector();
        b2Sel2.location = bedroom2;
        b2Sel2.shapeName = 'SO_B2_Shape1';
        engine.addLocationSelector(b2Sel2);
		
		// Smoke puffer
		var smokePufferToolbarView = new hext.tools.SmokePufferToolbarView();
		var smokePuffer = new hext.tools.SmokePuffer();
		// Create a new default puff.
		smokePuffer.defaultPuff = hext.tools.createSmokePuff(40, [0, 0, 0], [0, 0, 0], [0, 0, 0]);
		// Create custom smoke puffs for when the user clicks on the leaky area.
		var config1 = new hext.tools.SmokePuffConfig();
		config1.size = 40;
		config1.position = [-170, 50, -430];
		config1.wind = [0, 0, 110];
		config1.windVar = [10, 10, 20];
		smokePuffer.addSmokePuff('SO_B1_window_leftShape', config1);
		var config2 = new hext.tools.SmokePuffConfig();
		config2.size = 40;
		config2.position = [-130, 50, -430];
		config2.wind = [0, 0, 110];
		config2.windVar = [10, 10, 20];
		smokePuffer.addSmokePuff('SO_B1_window_rightShape', config2);
		
        hext.html.toolbar.addView(smokePufferToolbarView);
		
		var smokePufferController = new hext.tools.SmokePufferController();
		smokePufferController.setModel(smokePuffer);
		smokePufferController.setToolbarView(smokePufferToolbarView);
		
		// Navigation tool
		var eye = [79, 2742, 1393];
		var target = [98, 7, 88];
		var fov = hemi.core.math.degToRad(40);
		var np = 5;
		var fp = 5000;
		var defaultViewpoint = hemi.view.createCustomViewpoint("Start", eye, target, hemi.world.camera.up, fov, np, fp);
		
		var navTool = new hext.tools.Navigation(hemi.world.camera, defaultViewpoint);
		navTool.addArea('SO_BA_Shape1', createViewpoint(model, 'camEye_BA', 'camTarget_BA', 43));
		navTool.addArea('SO_B1_Shape1', createViewpoint(model, 'camEye_B1', 'camTarget_B1'));
		navTool.addArea('SO_B2_Shape1', createViewpoint(model, 'camEye_B2', 'camTarget_B2'));
		navTool.addArea('LR_floorShape', createViewpoint(model, 'camEye_overview', 'camTarget_overview', 43));
		navTool.addArea('AT_soffitFrontShape', createViewpoint(model, 'camEye_BDCam', 'camTarget_BDCam'));
		
		// Add select transforms for zoom in
		navTool.addZoomSelectTransform(model.getTransforms('SO_BA_1')[0]);
		navTool.addZoomSelectTransform(model.getTransforms('SO_B1_1')[0]);
		navTool.addZoomSelectTransform(model.getTransforms('SO_B2_1')[0]);
		
		var navToolbar = new hext.tools.NavigationToolbarView();
		// The script calls for being "zoomed" in at the start, so disable the
		// zoom in button.
		navToolbar.zoomInBtn.attr("disabled", "disabled");
		
		hext.html.toolbar.addView(navToolbar);
		
		var navController = new hext.tools.NavigationController();
		navController.setModel(navTool);
		navController.setToolbarView(navToolbar);
		
		// Script the scenes
		var scene1 = createScene1(model);
		var scene2 = createScene2(model, tube1, manometer, manView);
		var scene3 = createScene3(model, tube2, manView);
		var scene4 = createScene4(model, blowerDoor);
		var scene5 = createScene5(model, manometer);
		var scene6 = createScene6(model, smokePuffer, manView);
		
		scene1.next = scene2;
		scene2.prev = scene1;
		scene2.next = scene3;
		scene3.prev = scene2;
		scene3.next = scene4;
		scene4.prev = scene3;
		scene4.next = scene5;
		scene5.prev = scene4;
		scene5.next = scene6;
		scene6.prev = scene5;
		
		return scene1;
	};
	
	var createScene1 = function(model) {
		var scene = new hemi.scene.Scene();
		var viewpoint1 = createViewpoint(model, 'camEye_overview', 'camTarget_overview');
		
		scene.subscribe(hemi.msg.load,
			function(msg) {
				hemi.world.camera.moveToView(viewpoint1);
			});
		
		var text1 = new hemi.hud.HudText();
		text1.config.textSize = 13;
		text1.setText("Please select the front doorway to install a Blower Door.");
		text1.setWidth(hemi.core.client.width);
		text1.x = hemi.core.client.width / 2;
		text1.y = hemi.core.client.height - text1.wrappedHeight;
		
		var page1 = new hemi.hud.HudPage();
		page1.addElement(text1);
		
		var display1 = new hemi.hud.HudDisplay();
		display1.addPage(page1);
		
		hemi.world.camera.subscribe(hemi.msg.stop,
			function(msg) {
				if (msg.data.viewpoint === viewpoint1) {
					display1.show();
					model.setTransformVisible(model.getTransforms('highlight_frontDoor')[0], true);
				}
			});
		
		hemi.world.subscribe(hemi.msg.pick,
			function(msg) {
				if (scene.isLoaded && msg.data.pickInfo.shapeInfo.shape.name === 'SO_BDShape') {
					model.setTransformVisible(model.getTransforms('highlight_frontDoor')[0], false);
					display1.hide();
					scene.nextScene();
				}
			});
		
		return scene;
	};
	
	var createScene2 = function(model, tube, manometer, manometerView) {
		var scene = new hemi.scene.Scene();
		var viewpoint = createViewpoint(model, 'camEye_BDCam', 'camTarget_BDCam');
		
		scene.subscribe(hemi.msg.load,
			function(msg) {
				hemi.world.camera.moveToView(viewpoint);
			});
		
		var text1 = new hemi.hud.HudText();
		text1.config.textSize = 13;
		text1.setText("Activate the manometer by clicking the manometer tool on the left");
		text1.setWidth(hemi.core.client.width);
		text1.x = hemi.core.client.width / 2;
		text1.y = hemi.core.client.height - text1.wrappedHeight;
		
		var page1 = new hemi.hud.HudPage();
		page1.addElement(text1);
		
		var display1 = new hemi.hud.HudDisplay();
		display1.addPage(page1);
		
		hemi.world.camera.subscribe(hemi.msg.stop,
			function(msg) {
				if (msg.data.viewpoint === viewpoint) {
					// Replace the living room door with the blower door.
					model.setTransformVisible(model.getTransforms('BD_barrier')[0], true);
					model.setTransformVisible(model.getTransforms('LR_front_door')[0], false);
					model.setTransformPickable(model.getTransforms('LR_front_door')[0], false);
					display1.show();
				}
			});
		
		var text2 = new hemi.hud.HudText();
		text2.config.textSize = 13;
		text2.setText(["The manometer measures the difference in pressure between the top and bottom pressure tap for each channel.", "", "To begin measuring click the lower left pressure tap on the 2D device to the right"]);
		text2.setWidth(hemi.core.client.width);
		text2.x = hemi.core.client.width / 2;
		text2.y = hemi.core.client.height - text2.wrappedHeight;
		
		var page2 = new hemi.hud.HudPage();
		page2.addElement(text2);
		
		var display2 = new hemi.hud.HudDisplay();
		display2.addPage(page2);
		
		manometer.subscribe(hemi.msg.visible,
			function(msg) {
				if (scene.isLoaded && msg.data.visible) {
					display1.hide();
					display2.show();
					// Keep the Transform from obscuring the next pick.
					model.setTransformPickable(model.getTransforms('SO_BD')[0], false);
				}
			});
        
        var text3 = new hemi.hud.HudText();
		text3.config.textSize = 13;
		text3.setText("Now click the highlighted area to run the tube through the lower opening.");
		text3.setWidth(hemi.core.client.width);
		text3.x = hemi.core.client.width / 2;
		text3.y = hemi.core.client.height - text3.wrappedHeight;
		
		var page3 = new hemi.hud.HudPage();
		page3.addElement(text3);
		
		var display3 = new hemi.hud.HudDisplay();
		display3.addPage(page3);
		
		manometerView.subscribe(hext.msg.input,
			function(msg) {
				if (scene.isLoaded && msg.data.selected && msg.data.elementId === 'll') {
					model.setTransformVisible(model.getTransforms('highlight_bdHole')[0], true);
					display2.hide();
					display3.show();
				}
			});
		
		tube.subscribe(hemi.msg.visible,
			function(msg) {
				if (scene.isLoaded && msg.data.visible) {
					model.setTransformVisible(model.getTransforms('highlight_bdHole')[0], false);
					model.setTransformPickable(model.getTransforms('SO_BD')[0], true);
					display3.hide();
					scene.nextScene();
				}
			});
		
		return scene;
	};
	
	var createScene3 = function(model, tube, manometerView) {
		var scene = new hemi.scene.Scene();
		var viewpoint = createViewpoint(model, 'camEye_fanTap', 'camTarget_fanTap');
		
		scene.subscribe(hemi.msg.load,
			function(msg) {
				hemi.world.camera.moveToView(viewpoint);
			});
        
		var text1 = new hemi.hud.HudText();
		text1.config.textSize = 13;
		text1.setText("Click the upper right pressure tap on the 2D device to the right");
		text1.setWidth(hemi.core.client.width);
		text1.x = hemi.core.client.width / 2;
		text1.y = hemi.core.client.height - text1.wrappedHeight;
		
		var page1 = new hemi.hud.HudPage();
		page1.addElement(text1);
		
		var display1 = new hemi.hud.HudDisplay();
		display1.addPage(page1);
		
		hemi.world.camera.subscribe(hemi.msg.stop,
			function(msg) {
				if (msg.data.viewpoint === viewpoint) {
					model.setTransformVisible(model.getTransforms('highlight_fanPressTap')[0], true);
					// Keep the Transform from obscuring the next pick.
					model.setTransformPickable(model.getTransforms('SO_BD')[0], false);
					display1.show();
				}
			});
		
		var text2 = new hemi.hud.HudText();
		text2.config.textSize = 13;
		text2.setText("Click the highlighted box to connect the tube to the fan handle housing");
		text2.setWidth(hemi.core.client.width);
		text2.x = hemi.core.client.width / 2;
		text2.y = hemi.core.client.height - text2.wrappedHeight;
		
		var page2 = new hemi.hud.HudPage();
		page2.addElement(text2);
		
		var display2 = new hemi.hud.HudDisplay();
		display2.addPage(page2);
		
		manometerView.subscribe(hext.msg.input,
			function(msg) {
				if (scene.isLoaded && msg.data.selected && msg.data.elementId === 'ur') {
					display1.hide();
					display2.show();
				}
			});
		
		tube.subscribe(hemi.msg.visible,
			function(msg) {
				if (scene.isLoaded && msg.data.visible) {
					model.setTransformVisible(model.getTransforms('highlight_fanPressTap')[0], false);
					model.setTransformPickable(model.getTransforms('SO_BD')[0], true);
					display2.hide();
					scene.nextScene();
				}
			});
		
		return scene;
	};
	
	var createScene4 = function(model, blowerDoor) {
		var scene = new hemi.scene.Scene();
		
		var text1 = new hemi.hud.HudText();
		text1.config.textSize = 13;
		text1.setText("This red manometer tube will measure the pressure of the air flow across the flow sensors in the center of the fan. The manometer will translate this pressure reading into a measurement of the volume of air being drawn out through the fan.");
		text1.setWidth(hemi.core.client.width);
		text1.x = hemi.core.client.width / 2;
		text1.y = hemi.core.client.height - (text1.wrappedHeight + 25);
		
		var page1 = new hemi.hud.HudPage();
		page1.addElement(text1);
		
		var text2 = new hemi.hud.HudText();
		text2.config.textSize = 13;
		text2.setText("Before turning on the fan, close all exterior windows and open all interior doors (\"winter mode\"). Click on a door to open/close it or click and drag a window to open/close it.");
		text2.setWidth(hemi.core.client.width);
		text2.x = hemi.core.client.width / 2;
		text2.y = hemi.core.client.height - (text2.wrappedHeight + 25);
		
		var page2 = new hemi.hud.HudPage();
		page2.addElement(text2);
		
		var text3 = new hemi.hud.HudText();
		text3.config.textSize = 13;
		text3.setText("Use the Navigate tool to help. The magnifying glass with a '-' zooms out to a top-down view. The magnifying glass with a '+' zooms in after clicking on a room.");
		text3.setWidth(hemi.core.client.width);
		text3.x = hemi.core.client.width / 2;
		text3.y = hemi.core.client.height - (text3.wrappedHeight + 25);
		
		var page3 = new hemi.hud.HudPage();
		page3.addElement(text3);
		
		var text4 = new hemi.hud.HudText();
		text4.config.textSize = 13;
		text4.setText("Once all windows are closed and all doors are open, select the Blower Door tool.");
		text4.setWidth(hemi.core.client.width);
		text4.x = hemi.core.client.width / 2;
		text4.y = hemi.core.client.height - (text4.wrappedHeight + 25);
		
		var page4 = new hemi.hud.HudPage();
		page4.addElement(text4);
		
		var display1 = new hemi.hud.HudDisplay();
		display1.addPage(page1);
		display1.addPage(page2);
		display1.addPage(page3);
		display1.addPage(page4);
		hext.hud.addPagingInfo(display1);
		
		scene.subscribe(hemi.msg.load,
			function(msg) {
				display1.show();
			});
		
		var viewpoint1 = createViewpoint(model, 'camEye_BDCam', 'camTarget_BDCam');
		
		display1.subscribe(hemi.msg.visible,
			function(msg) {
				if (scene.isLoaded && msg.data.page === 2) {
					hemi.world.camera.moveToView(viewpoint1);
				}
			});
		
		blowerDoor.subscribe(hemi.msg.visible,
			function(msg) {
				if (scene.isLoaded && msg.data.visible) {
					display1.hide();
					hext.hud.removePagingInfo();
					scene.nextScene();
				}
			});
		
		return scene;
	};
	
	var createScene5 = function(model, manometer) {
		var scene = new hemi.scene.Scene();
		var viewpoint = createViewpoint(model, 'camEye_BDCam', 'camTarget_BDCam');
		
		scene.subscribe(hemi.msg.load,
			function(msg) {
				hemi.world.camera.moveToView(viewpoint);
			});
		
        var text1 = new hemi.hud.HudText();
		text1.config.textSize = 13;
		text1.setText("We have pre-configured this manometer for you. The left readout on the manometer reads 0 Pa and the right side reads \"----\" which means that it's not getting a usable reading.");
		text1.setWidth(hemi.core.client.width);
		text1.x = hemi.core.client.width / 2;
		text1.y = hemi.core.client.height - (text1.wrappedHeight + 25);
		
		var page1 = new hemi.hud.HudPage();
		page1.addElement(text1);
		
		var text2 = new hemi.hud.HudText();
		text2.config.textSize = 13;
		text2.setText("You can control the fan speed by clicking and dragging left and right on the fan control knob at the bottom of the manometer. Adjust the fan speed until you reach -50 Pa.");
		text2.setWidth(hemi.core.client.width);
		text2.x = hemi.core.client.width / 2;
		text2.y = hemi.core.client.height - (text2.wrappedHeight + 25);
		
		var page2 = new hemi.hud.HudPage();
		page2.addElement(text2);
		
		var display1 = new hemi.hud.HudDisplay();
		display1.addPage(page1);
		display1.addPage(page2);
		
		hemi.world.camera.subscribe(hemi.msg.stop,
			function(msg) {
				if (msg.data.viewpoint === viewpoint) {
					hext.hud.addPagingInfo(display1);
					display1.show();
				}
			});
		
		manometer.subscribe(hext.msg.pressure,
			function(msg) {
				// Wait for a pressure reading of -50 Pa.
				if (scene.isLoaded && msg.data.left + 50 <= 0.1) {
					display1.hide();
					hext.hud.removePagingInfo();
					scene.nextScene();
				}
			});
		
		return scene;
	};
	
	var createScene6 = function(model, smokePuffer, manometerView) {
		var scene = new hemi.scene.Scene();
		
		var text1 = new hemi.hud.HudText();
		text1.config.textSize = 13;
		text1.setText("This reading indicates that the house has 4,500 cubic feet of leakage per minute at -50 Pascals. The house is leaking more than recommended.");
		text1.setWidth(hemi.core.client.width);
		text1.x = hemi.core.client.width / 2;
		text1.y = hemi.core.client.height - (text1.wrappedHeight + 25);
		
		var page1 = new hemi.hud.HudPage();
		page1.addElement(text1);
		
		var text2 = new hemi.hud.HudText();
		text2.config.textSize = 13;
		text2.setText("The blower door blows air out from the house, creating a vacuum which reveals air leaks throughout the house. Begin zone testing to find any major leaks.");
		text2.setWidth(hemi.core.client.width);
		text2.x = hemi.core.client.width / 2;
		text2.y = hemi.core.client.height - (text2.wrappedHeight + 25);
		
		var page2 = new hemi.hud.HudPage();
		page2.addElement(text2);
		
		var text3 = new hemi.hud.HudText();
		text3.config.textSize = 13;
		text3.setText("To pressure test a room click the manometer upper right input tap of channel B and click the desired doorway.  This allows you to measure the pressure for each room. Close the door to each room to isolate it.");
		text3.setWidth(hemi.core.client.width);
		text3.x = hemi.core.client.width / 2;
		text3.y = hemi.core.client.height - (text3.wrappedHeight + 25);
		
		var page3 = new hemi.hud.HudPage();
		page3.addElement(text3);
		
		var text4 = new hemi.hud.HudText();
		text4.config.textSize = 13;
		text4.setText("When you test a room, the closer the pressure on channel B is to 0 Pa, the better that room is sealed against outside air.  Use the Smoke Puffer tool to locate the leak in a room with a high pressure reading.");
		text4.setWidth(hemi.core.client.width);
		text4.x = hemi.core.client.width / 2;
		text4.y = hemi.core.client.height - (text4.wrappedHeight + 25);
		
		var page4 = new hemi.hud.HudPage();
		page4.addElement(text4);
		
		var display1 = new hemi.hud.HudDisplay();
		display1.addPage(page1);
		display1.addPage(page2);
		display1.addPage(page3);
		display1.addPage(page4);
		
		var viewpoint1 = createViewpoint(model, 'camEye_overview', 'camTarget_overview');
		
		scene.subscribe(hemi.msg.load,
			function(msg) {
				hext.hud.addPagingInfo(display1);
				display1.show();
				hemi.world.camera.moveToView(viewpoint1);
			});
		
		var startFrame = 260;
		var endFrame = 292;
		var animation1 = hemi.animation.createModelAnimation(model, hemi.view.getTimeOfFrame(startFrame), hemi.view.getTimeOfFrame(endFrame));
		var loop1 = new hemi.animation.Loop();
		loop1.startTime = hemi.view.getTimeOfFrame(280);
		loop1.stopTime = hemi.view.getTimeOfFrame(292);
		animation1.addLoop(loop1);
		
		var viewpoint2 = createViewpoint(model, 'camEye_ExteriorCam', 'camTarget_ExteriorCam');
		var viewpoint3 = createViewpoint(model, 'camEye_overview', 'camTarget_overview');
		
		display1.subscribe(hemi.msg.visible,
			function(msg) {
				if (scene.isLoaded) {
					if (msg.data.page === 2) {
						hemi.world.camera.moveToView(viewpoint2);
						animation1.start();
						model.setTransformVisible(model.getTransforms('blowerArrowsExt_g')[0], true);
					} else if (msg.data.page === 3) {
						hemi.world.camera.moveToView(viewpoint3);
						model.setTransformVisible(model.getTransforms('blowerArrowsExt_g')[0], false);
						animation1.stop();
					}
				}
			});
		
		manometerView.subscribe(hext.msg.input,
			function(msg) {
				if (scene.isLoaded && msg.data.elementId === 'ur') {
					if (msg.data.selected) {
						model.setTransformPickable(model.getTransforms('SO_BA_1')[0], true);
						model.setTransformPickable(model.getTransforms('SO_B1_1')[0], true);
						model.setTransformPickable(model.getTransforms('SO_B2_1')[0], true);
					} else {
						model.setTransformPickable(model.getTransforms('SO_BA_1')[0], false);
						model.setTransformPickable(model.getTransforms('SO_B1_1')[0], false);
						model.setTransformPickable(model.getTransforms('SO_B2_1')[0], false);
					}
				}
			});
        
        var text5 = new hemi.hud.HudText();
		text5.config.textSize = 13;
		text5.setText("Very good work. You've found the source of the leak!");
		text5.setWidth(hemi.core.client.width);
		text5.x = hemi.core.client.width / 2;
		text5.y = hemi.core.client.height - text5.wrappedHeight;
		
		var page5 = new hemi.hud.HudPage();
		page5.addElement(text5);
		
		var display2 = new hemi.hud.HudDisplay();
		display2.addPage(page5);
		
		hemi.msg.subscribe(hemi.msg.burst,
			function(msg) {
				// If one of the custom puffs was generated, the user found the
				// leak!
				if (scene.isLoaded && msg.src !== smokePuffer.defaultPuff) {
					display1.hide();
					hext.hud.removePagingInfo();
					display2.show();
				}
			});
		
		return scene;
	};
	
	/*
	 * Create a Door object that rotates open/close when clicked on and uses its
	 * Rotator to send a custom Message.
	 */
	var createDoor = function(rotator, direction, open) {
		var door = {
			open: open,
			direction: direction,
			rotator: rotator,
			names: [rotator.transformObjs[0].offTran.name],
			addAltName: function(name) {
				this.names.push(name);
			},
			onPick: function(pickInfo) {
				var pickName = pickInfo.shapeInfo.parent.transform.name;
				
				for (var i = 0; i < this.names.length; i++) {
					if (pickName === this.names[i]) {
						this.swing();
						break;
					}
				}
			},
			swing: function() {
				// We found the amount to rotate by testing empirically for a
				// value that "looked right".
				if (this.rotator.rotate([0, 0, this.direction * Math.PI / 1.85], 1, true)) {
					this.open = !this.open;
					this.direction *= -1;
					
					var pos;
				
					if (this.open) {
						pos = [0, 0, 180];
					} else {
						pos = [0, 0, 0];
					}
					
					// Notify any handlers that the door is open/closed.
					this.rotator.send("Swing",
						{
							position: pos
						});
				}
			}
		};
		
		hemi.world.subscribe(
			hemi.msg.pick,
			door,
			"onPick",
			["msg:data.pickInfo"]);
		
		return door;
	};
	
	/*
	 * Create a Viewpoint by finding the Transforms with the specified names in
	 * the given Model and using their positions for the eye and target.
	 */
	var createViewpoint = function(model, eyeName, targetName, opt_fov) {
		var viewpoint = null;
		var up = hemi.world.camera.up;
		var np = 5;
		var fp = 5000;
		opt_fov = hemi.core.math.degToRad(opt_fov) || hemi.core.math.degToRad(40);
		
		var eyeTran = model.getTransforms(eyeName)[0];
		var targetTran = model.getTransforms(targetName)[0];
		
		if (eyeTran != null && targetTran != null) {
			var eye = hemi.core.math.matrix4.getTranslation(eyeTran.localMatrix);
			var target = hemi.core.math.matrix4.getTranslation(targetTran.localMatrix);
			viewpoint = hemi.view.createCustomViewpoint("", eye, target, up, opt_fov, np, fp);
		}
		
		return viewpoint;
	};

	jQuery(window).load(function() {
		o3djs.webgl.makeClients(init);
	});

	jQuery(window).unload(function() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	});
})();