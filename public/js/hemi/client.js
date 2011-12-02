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

	hemi.ClientBase = function() {
		this.bgColor = 0;
		this.bgAlpha = 1;
		this.camera = new hemi.Camera();
		this.scene = new THREE.Scene();
		this.picker = new hemi.Picker(this.scene, this.camera);
		this.renderer = null;
		this.lights = [];

		this.useCameraLight(true);
		hemi.clients.push(this);
	};

	hemi.ClientBase.prototype = {
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
		
		addLight: function(light) {
			var ndx = this.lights.indexOf(light);

			if (ndx === -1) {
				this.lights.push(light);
				this.scene.add(light);
			}
		},

		onRender: function() {
			this.renderer.render(this.scene, this.camera.threeCamera);
		},
		
		removeLight: function(light) {
			var ndx = this.lights.indexOf(light);
			
			if (ndx > -1) {
				this.lights.splice(ndx, 1);
				this.scene.remove(light);
			}
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
			this.bgColor = hex;
			this.bgAlpha = opt_alpha == null ? 1 : opt_alpha;
			this.renderer.setClearColorHex(this.bgColor, this.bgAlpha);
		},

		setRenderer: function(renderer) {
			var dom = renderer.domElement;
			dom.style.width = "100%";
			dom.style.height = "100%";
			hemi.input.init(dom);

			renderer.setClearColorHex(this.bgColor, this.bgAlpha);
			this.renderer = renderer;
			this.resize();
		},

		useCameraLight: function(useLight) {
			if (useLight) {
				this.addLight(this.camera.light);
			} else {
				this.removeLight(this.camera.light);
			}
		}
	};

	hemi.makeCitizen(hemi.ClientBase, 'hemi.Client', {
		msgs: [],
		toOctane: function() {
			return [
				{
					name: 'bgColor',
					val: this.bgColor
				}, {
					name: 'bgAlpha',
					val: this.bgAlpha
				}, {
					name: 'useCameraLight',
					arg: [false]
				}, {
					name: 'camera',
					id: this.camera._getId()
				}, {
					name: 'useCameraLight',
					arg: [true]
				}
			];
		}
	});

	return hemi;
})(hemi || {});
