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

var hemi = (function(hemi) {

	hemi.Picker = function(scene, camera, width, height) {
		this.scene = scene;
		this.camera = camera;
		this.width = width;
		this.height = height;

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
				hemi.send(hemi.msg.pick,
					{
						mouseEvent: mouseEvent,
						//PABNOTE right now return the parent of the picked obj
						//due to how the loader works
						pickedMesh: pickedObjs[0].object.parent
					});
			}
		},

		resize : function(width, height) {
			this.width = width;
			this.height = height;
		}
	};

	return hemi;
})(hemi || {});