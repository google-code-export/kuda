/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
/*
The MIT License (MIT)

Copyright (c) 2011 SRI International

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var hemi = (function(hemi) {

	hemi.Picker = function(scene, camera) {
		this.scene = scene;
		this.camera = camera;
		this.width = 1;
		this.height = 1;

		this.projector = new THREE.Projector();

		hemi.input.addMouseDownListener(this);
	};

	hemi.Picker.prototype = {
		onMouseDown : function(mouseEvent) {
			var x = (mouseEvent.x / this.width) * 2 - 1;
			var y = -(mouseEvent.y / this.height) * 2 + 1;
			var projVector = new THREE.Vector3(x, y, 0.5);

			this.projector.unprojectVector(projVector, this.camera.threeCamera);
			var ray = new THREE.Ray(this.camera.threeCamera.position, projVector.subSelf(this.camera.threeCamera.position).normalize());

			var pickedObjs = ray.intersectScene(this.scene);

			if (pickedObjs.length > 0) {
				for (var i = 0; i < pickedObjs.length; ++i) {
					if (pickedObjs[i].object.parent.pickable) {
						hemi.send(hemi.msg.pick,
							{
								mouseEvent: mouseEvent,
								pickedMesh: pickedObjs[0].object
							});
						break;
					}
				}
			}
		},

		resize : function(width, height) {
			this.width = width;
			this.height = height;
		}
	};

	return hemi;
})(hemi || {});