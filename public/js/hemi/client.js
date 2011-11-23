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

	hemi.Client = function(renderer) {
		renderer.domElement.style.width = "100%";
		renderer.domElement.style.height = "100%";
		this.camera = new hemi.Camera();
		//this.light = new THREE.DirectionalLight(0xffffff);
		this.renderer = renderer;
		this.scene = new THREE.Scene();
		this.scene.add(this.camera.light);
		//this.scene.add(this.light);
		hemi.input.init(renderer.domElement);
		var dom = this.renderer.domElement;
		this.picker = new hemi.Picker(this.scene, this.camera, dom.clientWidth, dom.clientHeight);
	};

	hemi.Client.prototype = {
		addGrid: function() {
			var line_material = new THREE.LineBasicMaterial( { color: 0xcccccc, opacity: 0.2 } ),
				geometry = new THREE.Geometry(),
				floor = -0.04, step = 1, size = 14;

			for ( var i = 0; i <= size / step * 2; i ++ ) {

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( - size, floor, i * step - size ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3(   size, floor, i * step - size ) ) );

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( i * step - size, floor, -size ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( i * step - size, floor,  size ) ) );

			}

			var line = new THREE.Line( geometry, line_material, THREE.LinePieces );
			this.scene.add(line);
		},

		onRender: function() {
			this.renderer.render(this.scene, this.camera.threeCamera);
		},

		resize: function() {
			var dom = this.renderer.domElement,
				width = Math.max(1, dom.clientWidth),
				height = Math.max(1, dom.clientHeight);

			this.renderer.setSize(width, height);
			this.camera.threeCamera.aspect = width / height;
			this.camera.threeCamera.updateProjectionMatrix();
			this.picker.resize(width, height);
		},

		setBGColor: function(hex, opt_alpha) {
			this.renderer.setClearColorHex(hex, opt_alpha == null ? 1 : opt_alpha);
		}
	};

	return hemi;
})(hemi || {});
