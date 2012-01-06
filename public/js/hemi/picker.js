/*
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 * The MIT License (MIT)
 * 
 * Copyright (c) 2011 SRI International
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated  documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the  Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var hemi = (function(hemi) {

	// Static helper objects shared by all Pickers
	var _projector = new THREE.Projector(),
		_ray = new THREE.Ray(),
		_vector = new THREE.Vector3();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Picker class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Picker contains the logic for perfoming pick operations on 3D scenes from mouse
	 * clicks.
	 */
	hemi.Picker = function(scene, camera) {
		this.camera = camera;
		this.scene = scene;
		this.height = 1;
		this.width = 1;

		hemi.input.addMouseDownListener(this);
	};

	/**
	 * Handle the mouse down event by performing a pick operation. If a 3D object is picked, send
	 * out a message on the dispach.
	 * 
	 * @param {Object} mouseEvent the mouse down event
	 */
	hemi.Picker.prototype.onMouseDown = function(mouseEvent) {
		var x = (mouseEvent.x / this.width) * 2 - 1,
			y = -(mouseEvent.y / this.height) * 2 + 1,
			camPos = this.camera.threeCamera.position;

		_vector.set(x, y, 0.5);
		_projector.unprojectVector(_vector, this.camera.threeCamera);
		_ray.origin.copy(camPos);
		_ray.direction.copy(_vector.subSelf(camPos).normalize());

		var pickedObjs = _ray.intersectScene(this.scene);

		if (pickedObjs.length > 0) {
			for (var i = 0; i < pickedObjs.length; ++i) {
				var pickedObj = pickedObjs[i];

				if (pickedObj.object.parent.pickable) {
					hemi.send(hemi.msg.pick,
						{
							mouseEvent: mouseEvent,
							pickedMesh: pickedObj.object
						});
					break;
				}
			}
		}
	};

	return hemi;
})(hemi || {});
