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

	/*
	 * The projector used to cast rays from screen space into 3D space.
	 * @type THREE.Projector
	 */
	var projector = new THREE.Projector();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Client class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class Client represents a viewable 3D element on a webpage. It encapsulates all of the
	 * single components necessary for rendering such as Scene and Camera.
	 * 
	 * @param {boolean} opt_init optional flag indicating if the Client should create its own Camera
	 *     and Scene
	 */
	var Client = function(opt_init) {
		/*
		 * The color of the background, in hex. This should not be set directly.
		 * @type number
		 * @default 0
		 */
		this._bgColor = 0;

		/*
		 * The opacity of the background, between 0 and 1. This should not be set directly.
		 * @type number
		 * @default 1
		 */
		this._bgAlpha = 1;

		/**
		 * The Camera that represents the viewing position and direction.
		 * @type hemi.Camera
		 */
		this.camera = opt_init ? new hemi.Camera() : null;

		/**
		 * The Scene containing all 3D elements to be rendered.
		 * @type hemi.Scene
		 */
		this.scene = opt_init ? new hemi.Scene() : null;

		/**
		 * The Picker that manages mouse picking of 3D elements.
		 * @type hemi.Picker
		 */
		this.picker = new hemi.Picker(this.scene, this.camera);

		/**
		 * The renderer which performs the actual work to render a 3D image.
		 * @type THREE.WebGLRenderer
		 */
		this.renderer = null;

		if (opt_init) {
			this.useCameraLight(true);
			this.scene.add(this.camera.threeCamera);
		}

		hemi.clients.push(this);
	};

	/*
	 * Octane properties for Client.
	 * @type string[]
	 */
	Client.prototype._octane = function() {
		return [
			{
				name: '_bgColor',
				val: this._bgColor
			}, {
				name: '_bgAlpha',
				val: this._bgAlpha
			}, {
				name: 'setScene',
				arg: [hemi.dispatch.ID_ARG + this.scene._getId()]
			}, {
				name: 'setCamera',
				arg: [hemi.dispatch.ID_ARG + this.camera._getId()]
			}
		];
	};

	/*
	 * Update the Client's renderer, Camera, and Picker with the current size of the viewport.
	 */
	Client.prototype._resize = function() {
		var dom = this.renderer.domElement,
			width = dom.clientWidth > 1 ? dom.clientWidth : 1,
			height = dom.clientHeight > 1 ? dom.clientHeight : 1;

		this.renderer.setSize(width, height);
		this.camera.threeCamera.aspect = width / height;
		this.camera.threeCamera.updateProjectionMatrix();
		this.picker.width = width;
		this.picker.height = height;
	};

	/**
	 * Add a quick grid to the XZ plane of the Client's Scene.
	 */
	Client.prototype.addGrid = function() {
		var line_material = new THREE.LineBasicMaterial({ color: 0xcccccc, opacity: 0.2 }),
			geometry = new THREE.Geometry(),
			floor = -0.04, step = 1, size = 14;

		for (var i = 0, il = size / step * 2; i <= il; ++i) {
			geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(-size, floor, i * step - size)));
			geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(size, floor, i * step - size)));
			geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(i * step - size, floor, -size)));
			geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(i * step - size, floor,  size)));
		}

		var line = new THREE.Line(geometry, line_material, THREE.LinePieces);
		this.scene.add(line);
	};

	/**
	 * Create a ray from the Camera's position, through the given screen coordinates, and into the
	 * 3D scene.
	 * 
	 * @param {number} x x screen coordinate
	 * @param {number} y y screen coordinate
	 * @return {THREE.Ray} the new ray
	 */
	Client.prototype.castRay = function(clientX, clientY) {
		var dom = this.renderer.domElement,
			x = (clientX / dom.clientWidth) * 2 - 1,
			y = -(clientY / dom.clientHeight) * 2 + 1,
			projVector = new THREE.Vector3(x, y, 0.5),
			threeCam = this.camera.threeCamera;

		projector.unprojectVector(projVector, threeCam);
		projVector.subSelf(threeCam.position).normalize();
		return new THREE.Ray(threeCam.position, projVector);
	};

	/**
	 * Get the width of the client's viewport in pixels.
	 * 
	 * @return {number} width of the client viewport
	 */
	Client.prototype.getWidth = function() {
		return this.renderer.domElement.clientWidth;
	};

	/**
	 * Get the height of the client's viewport in pixels.
	 * 
	 * @return {number} height of the client viewport
	 */
	Client.prototype.getHeight = function() {
		return this.renderer.domElement.clientHeight;
	};

	/**
	 * Use the Client's renderer to render its Scene from the perspective of its Camera.
	 */
	Client.prototype.onRender = function() {
		this.renderer.render(this.scene, this.camera.threeCamera);
	};

	/**
	 * Set the color and opacity of the background of the Client.
	 * 
	 * @param {number} hex the background color in hex
	 * @param {number} opt_alpha optional alpha value between 0 and 1
	 */
	Client.prototype.setBGColor = function(hex, opt_alpha) {
		this._bgColor = hex;
		this._bgAlpha = opt_alpha === undefined ? 1 : opt_alpha;
		this.renderer.setClearColorHex(this._bgColor, this._bgAlpha);
	};

	/**
	 * Set the given Camera to be the viewing Camera for the Client.
	 * 
	 * @param {hemi.Camera} the new Camera to use
	 */
	Client.prototype.setCamera = function(camera) {
		if (this.scene) {
			if (this.camera) {
				this.scene.remove(this.camera.threeCamera);
				this.scene.remove(this.camera.light);
			}

			this.scene.add(camera.threeCamera);
			this.scene.add(camera.light);
		}
		if (this.camera) {
			this.camera.cleanup();
		}

		this.picker.camera = camera;
		this.camera = camera;
	};

	/**
	 * Set the given renderer for the Client to use. Typically a WebGLRenderer.
	 * 
	 * @param {THREE.WebGLRenderer} renderer renderer to use
	 */
	Client.prototype.setRenderer = function(renderer) {
		var dom = renderer.domElement;
		dom.style.width = "100%";
		dom.style.height = "100%";
		hemi.input.init(dom);

		renderer.setClearColorHex(this._bgColor, this._bgAlpha);
		this.renderer = renderer;
		this._resize();
	};

	/**
	 * Set the given Scene for the Client to render.
	 * 
	 * @param {hemi.Scene} scene scene to render
	 */
	Client.prototype.setScene = function(scene) {
		if (this.scene) {
			if (this.camera) {
				this.scene.remove(this.camera.threeCamera);
				this.scene.remove(this.camera.light);
			}

			this.scene.cleanup();
		}
		if (this.camera) {
			scene.add(this.camera.threeCamera);
			scene.add(this.camera.light);
		}

		this.picker.scene = scene;
		this.scene = scene;
	};

	/**
	 * Set whether the Client should use the Camera's light (always the same position and direction
	 * as the Camera to guarantee visibility).
	 * 
	 * @param {boolean} useLight flag indicating if Camera light should be used
	 */
	Client.prototype.useCameraLight = function(useLight) {
		if (useLight) {
			this.scene.add(this.camera.light);
		} else {
			this.scene.remove(this.camera.light);
		}
	};

	hemi.makeCitizen(Client, 'hemi.Client', {
		toOctane: Client.prototype._octane
	});

})();
