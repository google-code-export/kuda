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

(function() {

	// Static helper objects shared by all Pickers
	var _projector = new THREE.Projector(),
		_ray = new THREE.Ray(),
		_vector = new THREE.Vector3();

	// This is a small enough precision for our samples while still maintaining performance.
	// TODO: maybe set precision programmatically based upon bounding sphere
	_ray.setPrecision(0.000001);

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

		this.pickGrabber = null;

		hemi.input.addMouseDownListener(this);
	};

	/*
	 * Remove all references in the Picker.
	 */
	hemi.Picker.prototype.cleanup = function() {
		hemi.input.removeMouseDownListener(this);
		this.camera = null;
		this.pickGrabber = null;
		this.scene = null;
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
			camPos = this.camera.threeCamera.position,
			toPick = [];

		_vector.set(x, y, 1);
		_projector.unprojectVector(_vector, this.camera.threeCamera);
		_ray.origin.copy(camPos);
		_ray.direction.copy(_vector.subSelf(camPos).normalize());

		buildPickList(this.scene.children, toPick);
		var pickedObjs = _ray.intersectObjects(toPick);

		if (pickedObjs.length > 0) {
			for (var i = 0; i < pickedObjs.length; ++i) {
				var pickedObj = pickedObjs[i];

				if (pickedObj.object.pickable) {
					var worldIntersectionPosition = pickedObj.object.parent.matrixWorld.multiplyVector3(
						pickedObj.point.clone());

					var pickInfo =	{
						mouseEvent: mouseEvent,
						pickedMesh: pickedObj.object,
						pickedFace: pickedObj.face,
						pickedPoint: pickedObj.point,
						pickedDistance: pickedObj.distance,
						worldIntersectionPosition: worldIntersectionPosition
					};

					if (this.pickGrabber !== null) {
						this.pickGrabber.onPick(pickInfo);
					} else {
						hemi.send(hemi.msg.pick, pickInfo);
					}
					break;
				}
			}
		}
	};
	
	/**
	 * Remove the current 'pick grabber'. Allow pick messages to continue being
	 * passed to the other registered handlers.
	 * 
	 * @return {Object} the removed grabber or null
	 */
	hemi.Picker.prototype.removePickGrabber = function() {
		var grabber = this.pickGrabber;
		this.pickGrabber = null;

		return grabber;
	};

		/**
	 * Register the given handler as the 'pick grabber'. The pick grabber
	 * intercepts pick messages and prevents them from being passed to other
	 * handlers. It should be used if the user enters an 'interaction mode' that
	 * overrides default behavior.
	 * 
	 * @param {Object} grabber an object that implements onPick()
	 */
	hemi.Picker.prototype.setPickGrabber = function(grabber) {
		this.pickGrabber = grabber;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Recursively build a list of all of the children, grandchildren, etc. of the Transforms in the
	 * given array.
	 * 
	 * @param {hemi.Transform[]} array of Transforms to add to list
	 * @param {hemi.Transform[]} the list to fill
	 */
	function buildPickList(objects, pickList) {
		for (var i = 0, il = objects.length; i < il; ++i) {
			var obj = objects[i];
			pickList.push(obj);

			if (obj.children.length > 0) {
				buildPickList(obj.children, pickList);
			}
		}
	}

})();
