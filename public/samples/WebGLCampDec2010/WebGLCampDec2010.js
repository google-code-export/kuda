/*
 * Kuda includes a library and editor for authoring interactive 3D content for the web.
 *  Copyright (C) 2011 SRI International.
 *
 *  This program is free software; you can redistribute it and/or modify it under the terms
 *  of the GNU General Public License as published by the Free Software Foundation; either 
 *  version 2 of the License, or (at your option) any later version.
 * 
 *  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 *  without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
 *  See the GNU General Public License for more details.
 * 
 *  You should have received a copy of the GNU General Public License along with this program; 
 *  if not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, 
 *  Boston, MA 02110-1301 USA.
 */

(function() {
	hemi.loader.loadPath = '../../';
	var SLIDE1_EYE = [0, 0, 9470],
		SLIDE1_TARGET = [0, 0, 8000],
		SLIDE_1Z = 9000,
		currentSlide = 1,
		slides = [{
			url: 'assets/images/Slide01.png',
			vector: [0, 0, SLIDE_1Z]
		}, {
			url: 'assets/images/Slide02.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide03.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide04.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide05.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide06.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide07.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide08.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide09.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide10.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide11.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide12.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide13.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide14.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide15.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide16.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide17.png',
			vector: [0, 0, -1000]
		}, {
			url: 'assets/images/Slide18.png',
			vector: [0, 0, -1000]
		}],
		loadedSlideCount = 0,
		digDisp = new hemi.model.Model(),
		vp = new hemi.view.Viewpoint({
				eye:	SLIDE1_EYE,
				target:	SLIDE1_TARGET,
				fov:	Math.PI / 3,
				fp:		40000
			}),
		tangents = [
			[0, -100, 0], [0, 0, -100],
			[0, 0, -100], [0, -100, 0]
		],
		dispDigits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		shapeNdx = [1, 7, 5, 4, 2, 8, 3, 6, 9],
		world = hemi.world,
		core = hemi.core,
		view = hemi.view,
		input = hemi.input,
		thirty = Math.PI / 6,
		sixty = Math.PI / 3,
		listNdx = null,
		pbar = null,
		camera = null;

	function init(clientElements) {
		core.init(clientElements[0]);
		view.setBGColor([1, 1, 1, 1]);
		pbar = new hext.progressUI.bar();
		digDisp.setFileName('assets/DigitalDisplay/scene.json');
		world.subscribe(hemi.msg.ready, function() {
			makeSlide(0, slides[0]);
		});
		world.ready();
	}

	function onSlideLoad(index, sprite) {
		sprite.setFrame(index);
		loadedSlideCount++;

		if (loadedSlideCount === slides.length) {
			setupScene();
		}
	}

	function makeSlide(index, slide) {
		if (index < slides.length) {
			var sprite = new hemi.sprite.Sprite(720, 540);
			slide.transform = sprite.transform;
			if (index) sprite.parent(slides[index - 1].transform);
			sprite.addFrame(slide.url, onSlideLoad);
			sprite.transform.translate(slide.vector);
			index++;
			makeSlide(index, slides[index]);
		}
	}

	function setupScene() {
		camera = world.camera;
		var pack = core.mainPack,
			checkerMaterial = core.material.createCheckerMaterial(pack,
				view.viewInfo, [0, 0, 0.5, 1], [1, 1, 1, 1], false, 50),
			shape = core.primitives.createPlane(pack, checkerMaterial, 20000, 20000, 1, 1),
			transform = pack.createObject('Transform');
		checkerMaterial.getParam('lightWorldPos').bind(camera.light.position);
		transform.parent = core.client.root;
		transform.translate([0, -270, 0]);
		transform.addShape(shape);

		makeOcta([1700, -120, 8000], 300);
		makeOcta([-900, -120, 0], 200);
		makePyramid([-3200, 480, -7400]);
		makeCylinder([-4200, 330, 7500 ]);
		makeGiantCube([-6400, 1730, -5000]);
		makeGiantCube([5000, 1730, -4000]);
		makeGiantCube([5600, 1730, 5000]);
		makeBigCube([2000, 230, 4000]);
		makeBigCube([-3000, 230, -2000]);
		makeBigCube([-6000, 230, 6000]);
		makeBigBox([1500, -145, 0]);
		makeBigBox([-2000, -145, 7500]);
		makeCubeStack3([-2200, -170, 300]);
		makeCubeStack3([-3500, -170, 4100]);
		makeCubeStack3([-600, -170, 8300]);

		digDisp.root.scale([2, 2, 2]);
		digDisp.root.translate(164, 120, SLIDE_1Z / 2 + 495);
		updateDigDisp(0, 1);

		// vp.eye = SLIDE1_EYE;
		// vp.target = SLIDE1_TARGET;
		// vp.fp = 40000;
		// vp.fov = sixty;
		camera.moveToView(vp, 0);
		camera.enableControl();
		var tout = setTimeout(function() {
			var msgH = camera.subscribe(hemi.msg.stop, moveOnRails),
				keyL = {
					onKeyDown: function(e) {
						camera.unsubscribe(msgH);
						input.removeKeyDownListener(keyL);
						camera.onCurve = false;
						camera.moveToView(vp, 0);
					}
				};
			input.addKeyDownListener(keyL);
			moveOnRails();
		}, 5000);
		var msgH = camera.subscribe(hemi.msg.stop, function() {
			camera.unsubscribe(msgH);

			input.addKeyDownListener({
				onKeyDown: function(e) {
					clearTimeout(tout);

					if (e.keyCode === 32 || e.keyCode === 38 || e.keyCode === 39) {
						currentSlide++;
						updateDigDisp(0, 1);
						moveCameraToSlide(currentSlide);
					} else if (e.keyCode === 37 || e.keyCode === 40) {
						currentSlide--;
						updateDigDisp(0, -1);
						moveCameraToSlide(0);
					} else if (e.keyCode === 84) {
						moveOnRails();
					}
				}
			});
		});
	}

	function updateDigDisp(ndx, upOrDown) {
		hemi.texture.translate(digDisp.shapes[ndx].elements[0], 0.1 * upOrDown, 0);
		dispDigits[ndx] = (dispDigits[ndx] + upOrDown) % 10;
		if (dispDigits[ndx] < 0) dispDigits[ndx] = 9;

		if ((dispDigits[ndx] == 0 && upOrDown == 1) || (dispDigits[ndx] == 9 && upOrDown == -1)) {
			if (ndx < 9) updateDigDisp(shapeNdx[ndx], upOrDown);
		} else {
			digDisp.root.translate(0, 0, -500 * upOrDown);
		}
	}

	function moveOnRails() {
		var eyes = [
				SLIDE1_EYE, [800, 0, SLIDE1_EYE[2]],
				[2800, 0, 4900], [1500, 2000, -9000],
				[-1200, 100, -9000], [-2000, 800, 0],
				[-1000, 300, SLIDE1_EYE[2]], SLIDE1_EYE
			],
			targets = [
				SLIDE1_TARGET, eyes[2],
				eyes[3], eyes[4],
				eyes[5], eyes[6],
				eyes[7], SLIDE1_TARGET
			],
			curveEye = new hemi.curve.Curve(eyes, hemi.curve.CurveType.Cardinal),
			curveTarget = new hemi.curve.Curve(targets, hemi.curve.CurveType.Cardinal),
			camCurve = new hemi.view.CameraCurve(curveEye, curveTarget);
			// curveEye.draw(50, { jointSize: 4 });
			camera.moveOnCurve(camCurve, 25);
	}

	function moveCameraToSlide(slide) {
		if (slide === 0) {
			var offset = (currentSlide - 1) * 1000;
			vp.eye = [0, 0, SLIDE1_EYE[2] - offset];
			vp.target = [0, 0, SLIDE1_TARGET[2] - offset];
			camera.onCurve = false;
			camera.moveToView(vp, 0);
		} else {
			var offset = (slide - 2) * 1000,
				Za = SLIDE1_EYE[2] - offset,
				Zb = Za - 170,
				Zc = Zb - 600,
				Zd = Za - 1000,
				Zt = SLIDE1_TARGET[2] - offset,
				eyes = [
				[0, 0, Za], [0, 400, Zb],
				[0, 400, Zc], [0, 0, Zd]],
				targets = [
				[0, 0, Zt], [0, 0, Zt]],
			curveEye = new hemi.curve.Curve(eyes, hemi.curve.CurveType.CubicHermite, { tangents: tangents }),
			curveTarget = new hemi.curve.Curve(targets, hemi.curve.CurveType.Linear),
			camCurve = new hemi.view.CameraCurve(curveEye, curveTarget);
			// curveEye.draw(50, { jointSize: 4 });
			camera.moveOnCurve(camCurve, 1.2);
		}
	}

	function makeOcta(vector, size) {
		hemi.shape.create({
			shape: 'octa',
			color: [Math.random(), Math.random(), Math.random(), 1],
			size: size}).translate(vector);
	}

	function makePyramid(vector) {
		var pyr = hemi.shape.create({
			shape: 'pyramid',
			color: [Math.random(), Math.random(), Math.random(), 1],
			h: 1500, w: 2000, d: 2000});
		pyr.translate(vector);
		pyr.rotateY(sixty);
	}

	function makeCylinder(vector) {
		hemi.shape.create({
			shape: 'cylinder',
			color: [Math.random(), Math.random(), Math.random(), 1],
			r: 500, h: 1200}).translate(vector);
	}

	function makeGiantCube(vector) {
		var cube = hemi.shape.create({ shape: 'cube', color: [Math.random(), Math.random(), Math.random(), 1], size: 4000 });
		cube.translate(vector);
		cube.rotateY(thirty);
	}

	function makeBigCube(vector) {
		var cube = hemi.shape.create({ shape: 'cube', color: [Math.random(), Math.random(), Math.random(), 1], size: 1000 });
		cube.translate(vector);
		cube.rotateY(sixty);
	}

	function makeBigBox(vector) {
		var box = hemi.shape.create({
			shape: 'box',
			color: [Math.random(), Math.random(), Math.random(), 1],
			h: 250, w: 1500, d: 500 });
		box.translate(vector);
		box.rotateY(thirty);
	}

	function makeCubeStack3(vector) {
		var cubea = hemi.shape.create({ shape: 'cube', color: [Math.random(), Math.random(), Math.random(), 1], size: 200 }),
			cubeb = hemi.shape.create({ shape: 'cube', color: [Math.random(), Math.random(), Math.random(), 1], size: 100 }),
			cubec = hemi.shape.create({ shape: 'cube', color: [Math.random(), Math.random(), Math.random(), 1], size: 50 });
		cubeb.parent = cubea;
		cubec.parent = cubeb;
		cubea.translate(vector);
		cubea.rotateY(thirty);
		cubeb.translate([20, 150, 0]); // 1 / 2 cubea size + 1 / 2 cubeb size
		cubeb.rotateY(thirty);
		cubec.translate([0, 75, 10]);
		cubec.rotateY(thirty);
	}

	jQuery(window).load(function() {
		o3djs.webgl.makeClients(init);
	});

	jQuery(window).unload(function() {
		if (core.client) {
			core.client.cleanup();
		}
	});
})();
