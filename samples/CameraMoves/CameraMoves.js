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
	o3djs.require('o3djs.util');
	o3djs.require('hemi.msg');
	o3djs.require('hemi.curve');
	
	function initStep1() {
		o3djs.util.makeClients(initStep2);
	};
	
	function initStep2 (clientElements) {
		hemi.core.init(clientElements[0]);	
		hemi.view.setBGColor([0.7, 0.8, 1, 1]);	
		createWorld();
	};
	
	function uninit() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	};
	
	function createWorld() {
		var world = hemi.world;	
		var town = new hemi.model.Model();				// Create a new Model
		town.setFileName('assets/test_03.o3dtgz');	// Set the model file
		town.subscribe(hemi.msg.load,
			function(msg) {	
				setUpScene(town);
			});
	};
	
	function setUpScene(town) {
		var cam = hemi.world.camera;
		var vp = [];
	
			// Viewpoint 1
		vp[0] = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp[0].eye = [45,14,28];					// Set viewpoint eye
		vp[0].target = [-3,0,12];					// Set viewpoint target
			// Viewpoint 2
		vp[1] = new hemi.view.Viewpoint();
		vp[1].eye = [10,10,20];
		vp[1].target = [20,0,5];
			// Viewpoint 3
		vp[2] = new hemi.view.Viewpoint();
		vp[2].eye = [15,13,27];
		vp[2].target = [10,0,37];
			// Viewpoint 4
		vp[3] = new hemi.view.Viewpoint();
		vp[3].eye = [22,1,22];
		vp[3].target = [25,0,40];
			// Viewpoint 5
		vp[4] = new hemi.view.Viewpoint();
		vp[4].eye = [-5,3,20];
		vp[4].target = [-5,1,5];
		
		var overview = new hemi.view.Viewpoint();
		overview.eye = [20,90,70];
		overview.target = [10,0,20];
		
		var skyEye = [20,40,20];
		var currentView = vp[0];
		var currentVPNum = 1;
		var camMoving = false;
		var onTour = false;
		var atOV = false;
		
		cam.moveToView(currentView);
		cam.enableControl();
		cam.fixEye();
		
		var curves = [];
		
		for (var i = 0; i < vp.length; i++) {
			for (var j = 0; j < vp.length; j++) {
				curve = {
					start : vp[i],
					end : vp[j],
					curve : new hemi.curve.Curve([vp[i].eye,vp[i].eye,skyEye,vp[j].eye,vp[j].eye],hemi.curve.curveType.Cardinal),
				};
				curve.transform = curve.curve.draw(30,{joints:false,edgeSize:0.1,edgeColor:[1,1,0,1]});
				curve.transform.visible = false;
				curves.push(curve);
			}
		}
		
		var myTgt = vp[0].target;
		var eyes = [vp[0].eye,
					[10,15,50],
					[-10,15,50],
					[-20,9,-10],
					[0,35,-25],
					[30,8,-15],
					vp[0].eye];					
		var tangents = [[0,0,0],
						[-55,0,22],
						[-30,-6,-60],
						[10,20,-75],
						[50,0,-5],
						[45,-20,43],
						[0,0,0]];	
		var tourCurves = [];
		var tourTransforms = [];
		for(var i = 0; i < eyes.length-1; i++) {
			tourCurves.push(
				new hemi.curve.Curve(
					[eyes[i],eyes[i+1]],
					hemi.curve.curveType.CubicHermite,
					{tangents:[tangents[i],tangents[i+1]]}));
			tourTransforms.push(tourCurves[i].draw(30,{joints:false,edgeSize:0.1,edgeColor:[1,1,0,1]}));
			tourTransforms[i].visible = false
		}
		tourTargetCurve = new hemi.curve.Curve([myTgt,myTgt],hemi.curve.curveType.Linear);
		
		var easingFuncs = [hemi.utils.penner.linearTween,
						   hemi.utils.penner.easeInOutQuad,
						   hemi.utils.penner.easeInOutCubic,
						   hemi.utils.penner.easeInOutQuart,
						   hemi.utils.penner.easeInOutQuint,
						   hemi.utils.penner.easeInOutExpo,
						   hemi.utils.penner.easeInOutSine,
						   hemi.utils.penner.easeInOutCirc];
		
		hemi.input.addKeyDownListener({
			onKeyDown : function(e) {
				if (camMoving) return;
				hideCurves();
				var ndx = $("#Easing").val();
				var funco = easingFuncs[ndx];
				cam.setEasing(easingFuncs[ndx]);
				if (e.keyCode == 84) {
					if (e.shiftKey) {
						showTourCurves();
					} else {
						takeTour();
					}
				}
				if (e.keyCode == 79) {
					if (atOV) {
						cam.moveToView(vp[currentVPNum-1],20);
					} else {
						cam.moveToView(overview,20);
					}
					atOV = !atOV;
				}
				var newView = vp[e.keyCode-49];
				if (newView) {
					if (e.shiftKey) {
						showCurve(currentVPNum-1,e.keyCode-49);
					} else {
						atOV = false;
						var eyeCurve = findCurve(currentVPNum-1,e.keyCode-49);
						var targetCurve = new hemi.curve.Curve(
							[cam.getTarget(),newView.target],
							hemi.curve.curveType.Linear);
						cam.moveOnCurve(eyeCurve,targetCurve,120);
						currentView = newView;
						camMoving = true;
						currentVPNum = e.keyCode - 48;
						$("#currentVP").html("-");
					}
				}
				function takeTour() {
					camMoving = true;
					onTour = true;
					atOV = false;
					var origView = currentView;
					var cvndx = 0;
					var handler = cam.subscribe(hemi.msg.stop,onCamStop);
					cam.setEasing(hemi.utils.penner.easeInOutSine);
					cam.moveToView(vp[0],30);
					$("#currentVP").html('On Tour');
					function onCamStop(msg) {
						switch(cvndx) {
							case 0:
								cam.setEasing(hemi.utils.penner.linearTween);
							case 1:
							case 2:
							case 3:
							case 4:
							case 5:
								cam.moveOnCurve(tourCurves[cvndx],tourTargetCurve,120);
								break;
							case 6:
								cam.setEasing(hemi.utils.penner.easeInOutSine);
								var found = cam.unsubscribe(handler);
								onTour = false;
								cam.moveToView(origView,30);
								break;
						}
						cvndx++;
					}
				}
			}});
			
		cam.subscribe(hemi.msg.stop, function () {
				if (onTour) return;
				$("#currentVP").html(currentVPNum);
				camMoving = false;
			});
		
		function showCurves(start) {
			for (var i = 0; i < vp.length*vp.length; i++) {
				if(curves[i].start == vp[start]) {
					curves[i].transform.visible = true;
				}
			}
		}
		
		function showCurve(start,end) {
			for (var i = 0; i < vp.length*vp.length; i++) {
				if(curves[i].start == vp[start] &&
				   curves[i].end == vp[end]) {
					curves[i].transform.visible = true;
				   }
			}
		}
		
		function showTourCurves() {
			for(var i = 0; i < tourTransforms.length; i++) {
				tourTransforms[i].visible = true;
			}		
		}
		
		function findCurve(start,end) {
			for (var i = 0; i < vp.length*vp.length; i++) {
				if(curves[i].start == vp[start] &&
				   curves[i].end == vp[end]) {
					return curves[i].curve;
				   }
			}	
		}
		
		function hideCurves() {
			for(var i = 0; i < vp.length*vp.length; i++) {
				curves[i].transform.visible = false;
			}
			for(i = 0; i < tourTransforms.length; i++) {
				tourTransforms[i].visible = false;
			}
		}
		
	};
	
	window.onload = function() {
		initStep1();
	};
	window.onunload = function() {
		uninit();
	};
})();
