/*
 * Port of O3D's gpu-enabled particle system to Three.js with minor modifications.
 * @author Erik Kitson
 */

/*
 * Copyright 2009, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains various functions and classes for rendering
 * gpu based particles.
 */
var hemi = (function(hemi) {
	/**
	 * A Module with various GPU particle functions and classes.
	 * Note: GPU particles have the issue that they are not sorted per particle
	 * but rather per emitter.
	 * @namespace
	 */
	hemi.particles = hemi.particles || {};

// Utilities
	var convertToPixels = function(values) {
			var pixels = new Uint8Array(values.length),
				pixel;

			for (var i = 0; i < values.length; ++i) {
				pixel = values[i] * 256.0;
				pixels[i] = pixel > 255 ? 255 : pixel < 0 ? 0 : pixel;
			}

			return pixels;
		},
		SHADERS = {
			particle3d: {
				attributes: {
					uvLifeTimeFrameStart: { type: 'v4', value: [] },
					positionStartTime: { type: 'v4', value: [] },
					velocityStartSize: { type: 'v4', value: [] },
					accelerationEndSize: { type: 'v4', value: [] },
					spinStartSpinSpeed: { type: 'v4', value: [] },
					orientation: { type: 'v4', value: [] },
					colorMult: { type: 'v4', value: [] }
				},
				uniforms: {
					worldVelocity: { type: 'v3', value: new THREE.Vector3() },
					worldAcceleration: { type: 'v3', value: new THREE.Vector3() },
					timeRange: { type: 'f', value: 0.0 },
					time: { type: 'f', value: 0.0 },
					timeOffset: { type: 'f', value: 0.0 },
					frameDuration: { type: 'f', value: 0.0 },
					numFrames: { type: 'f', value: 0.0 },
					rampSampler: { type: 't', value: 0, texture: null },
					colorSampler: { type: 't', value: 1, texture: null }
				},
				vertexShader: '' +
					'uniform vec3 worldVelocity;\n' +
					'uniform vec3 worldAcceleration;\n' +
					'uniform float timeRange;\n' +
					'uniform float time;\n' +
					'uniform float timeOffset;\n' +
					'uniform float frameDuration;\n' +
					'uniform float numFrames;\n' +
					'\n' +
					'attribute vec4 uvLifeTimeFrameStart; \n' +
					'attribute vec4 positionStartTime; \n' +
					'attribute vec4 velocityStartSize; \n' +
					'attribute vec4 accelerationEndSize; \n' +
					'attribute vec4 spinStartSpinSpeed; \n' +
					'attribute vec4 orientation; \n' +
					'attribute vec4 colorMult; \n' +
					'\n' +
					'varying vec4 v_position;\n' +
					'varying vec2 v_texcoord;\n' +
					'varying float v_percentLife;\n' +
					'varying vec4 v_colorMult;\n' +
					'\n' +
					'void main() {\n' +
					'  vec2 uv = uvLifeTimeFrameStart.xy;\n' +
					'  float lifeTime = uvLifeTimeFrameStart.z;\n' +
					'  float frameStart = uvLifeTimeFrameStart.w;\n' +
					'  vec3 position = positionStartTime.xyz;\n' +
					'  float startTime = positionStartTime.w;\n' +
					'  vec3 velocity = (objectMatrix * vec4(velocityStartSize.xyz, 0)).xyz\n' +
					'      + worldVelocity;\n' +
					'  float startSize = velocityStartSize.w;\n' +
					'  vec3 acceleration = (objectMatrix *\n' +
					'      vec4(accelerationEndSize.xyz, 0)).xyz + worldAcceleration;\n' +
					'  float endSize = accelerationEndSize.w;\n' +
					'  float spinStart = spinStartSpinSpeed.x;\n' +
					'  float spinSpeed = spinStartSpinSpeed.y;\n' +
					'\n' +
					'  float localTime = mod((time - timeOffset - startTime),\n' +
					'      timeRange);\n' +
					'  float percentLife = localTime / lifeTime;\n' +
					'\n' +
					'  float frame = mod(floor(localTime / frameDuration + frameStart),\n' +
					'                     numFrames);\n' +
					'  float uOffset = frame / numFrames;\n' +
					'  float u = uOffset + (uv.x + 0.5) * (1.0 / numFrames);\n' +
					'\n' +
					'  v_texcoord = vec2(u, uv.y + 0.5);\n' +
					'  v_colorMult = colorMult;\n' +
					'\n' +
					'  float size = mix(startSize, endSize, percentLife);\n' +
					'  size = (percentLife < 0.0 || percentLife > 1.0) ? 0.0 : size;\n' +
					'  float s = sin(spinStart + spinSpeed * localTime);\n' +
					'  float c = cos(spinStart + spinSpeed * localTime);\n' +
					'\n' +
					'  vec4 rotatedPoint = vec4((uv.x * c + uv.y * s) * size, 0.0,\n' +
					'                               (uv.x * s - uv.y * c) * size, 1.0);\n' +
					'  vec3 center = velocity * localTime +\n' +
					'                  acceleration * localTime * localTime + \n' +
					'                  position;\n' +
					'  \n' +
					'      vec4 q2 = orientation + orientation;\n' +
					'      vec4 qx = orientation.xxxw * q2.xyzx;\n' +
					'      vec4 qy = orientation.xyyw * q2.xyzy;\n' +
					'      vec4 qz = orientation.xxzw * q2.xxzz;\n' +
					'  \n' +
					'      mat4 localMatrix = mat4(\n' +
					'        (1.0 - qy.y) - qz.z, \n' +
					'        qx.y + qz.w, \n' +
					'        qx.z - qy.w,\n' +
					'        0,\n' +
					'  \n' +
					'        qx.y - qz.w, \n' +
					'        (1.0 - qx.x) - qz.z, \n' +
					'        qy.z + qx.w,\n' +
					'        0,\n' +
					'  \n' +
					'        qx.z + qy.w, \n' +
					'        qy.z - qx.w, \n' +
					'        (1.0 - qx.x) - qy.y,\n' +
					'        0,\n' +
					'  \n' +
					'        center.x, center.y, center.z, 1.0);\n' +
					'  rotatedPoint = localMatrix * rotatedPoint;\n' +
					'  gl_Position = projectionMatrix * modelViewMatrix * rotatedPoint;\n' +
					'  v_percentLife = percentLife;\n' +
					'}\n',
				fragmentShader: '' +
					'varying vec4 v_position;\n' +
					'varying vec2 v_texcoord;\n' +
					'varying float v_percentLife;\n' +
					'varying vec4 v_colorMult;\n' +
					'\n' +
					'// We need to implement 1D!\n' +
					'uniform sampler2D rampSampler;\n' +
					'uniform sampler2D colorSampler;\n' +
					'\n' +
					'void main() {\n' +
					'  vec4 colorMult = texture2D(rampSampler, \n' +
					'      vec2(v_percentLife, 0.5)) * v_colorMult;\n' +
					'  vec4 color = texture2D(colorSampler, v_texcoord) * colorMult;\n' +
					'  gl_FragColor = color;\n' +
					'}\n'
			},
			particle2d: {
				attributes: {
					uvLifeTimeFrameStart: { type: 'v4', value: [] },
					positionStartTime: { type: 'v4', value: [] },
					velocityStartSize: { type: 'v4', value: [] },
					accelerationEndSize: { type: 'v4', value: [] },
					spinStartSpinSpeed: { type: 'v4', value: [] },
					colorMult: { type: 'v4', value: [] }
				},
				uniforms: {
					viewInverse: { type: 'm4', value: null },
					worldVelocity: { type: 'v3', value: new THREE.Vector3() },
					worldAcceleration: { type: 'v3', value: new THREE.Vector3() },
					timeRange: { type: 'f', value: 0.0 },
					time: { type: 'f', value: 0.0 },
					timeOffset: { type: 'f', value: 0.0 },
					frameDuration: { type: 'f', value: 0.0 },
					numFrames: { type: 'f', value: 0.0 },
					rampSampler: { type: 't', value: 0, texture: null },
					colorSampler: { type: 't', value: 1, texture: null }
				},
				vertexShader: '' +
					'uniform mat4 viewInverse;\n' +
					'uniform vec3 worldVelocity;\n' +
					'uniform vec3 worldAcceleration;\n' +
					'uniform float timeRange;\n' +
					'uniform float time;\n' +
					'uniform float timeOffset;\n' +
					'uniform float frameDuration;\n' +
					'uniform float numFrames;\n' +
					'\n' +
					'attribute vec4 uvLifeTimeFrameStart; \n' +
					'attribute vec4 positionStartTime; \n' +
					'attribute vec4 velocityStartSize; \n' +
					'attribute vec4 accelerationEndSize; \n' +
					'attribute vec4 spinStartSpinSpeed; \n' +
					'attribute vec4 colorMult; \n' +
					'\n' +
					'varying vec4 v_position;\n' +
					'varying vec2 v_texcoord;\n' +
					'varying float v_percentLife;\n' +
					'varying vec4 v_colorMult;\n' +
					'\n' +
					'void main() {\n' +
					'  vec2 uv = uvLifeTimeFrameStart.xy;\n' +
					'  float lifeTime = uvLifeTimeFrameStart.z;\n' +
					'  float frameStart = uvLifeTimeFrameStart.w;\n' +
					'  vec3 position = (objectMatrix * vec4(positionStartTime.xyz, 1.0)).xyz;\n' +
					'  float startTime = positionStartTime.w;\n' +
					'  vec3 velocity = (objectMatrix * vec4(velocityStartSize.xyz, 0)).xyz \n' +
					'      + worldVelocity;\n' +
					'  float startSize = velocityStartSize.w;\n' +
					'  vec3 acceleration = (objectMatrix *\n' +
					'      vec4(accelerationEndSize.xyz, 0)).xyz + worldAcceleration;\n' +
					'  float endSize = accelerationEndSize.w;\n' +
					'  float spinStart = spinStartSpinSpeed.x;\n' +
					'  float spinSpeed = spinStartSpinSpeed.y;\n' +
					'\n' +
					'  float localTime = mod((time - timeOffset - startTime),\n' +
					'      timeRange);\n' +
					'  float percentLife = localTime / lifeTime;\n' +
					'\n' +
					'  float frame = mod(floor(localTime / frameDuration + frameStart),\n' +
					'                     numFrames);\n' +
					'  float uOffset = frame / numFrames;\n' +
					'  float u = uOffset + (uv.x + 0.5) * (1.0 / numFrames);\n' +
					'\n' +
					'  v_texcoord = vec2(u, uv.y + 0.5);\n' +
					'  v_colorMult = colorMult;\n' +
					'\n' +
					'  vec3 basisX = viewInverse[0].xyz;\n' +
					'  vec3 basisZ = viewInverse[1].xyz;\n' +
					'\n' +
					'  float size = mix(startSize, endSize, percentLife);\n' +
					'  size = (percentLife < 0.0 || percentLife > 1.0) ? 0.0 : size;\n' +
					'  float s = sin(spinStart + spinSpeed * localTime);\n' +
					'  float c = cos(spinStart + spinSpeed * localTime);\n' +
					'\n' +
					'  vec2 rotatedPoint = vec2(uv.x * c + uv.y * s, \n' +
					'                               -uv.x * s + uv.y * c);\n' +
					'  vec3 localPosition = vec3(basisX * rotatedPoint.x +\n' +
					'                                basisZ * rotatedPoint.y) * size +\n' +
					'                         velocity * localTime +\n' +
					'                         acceleration * localTime * localTime + \n' +
					'                         position;\n' +
					'\n' +
					'  gl_Position = (projectionMatrix * viewMatrix * vec4(localPosition, 1.0));\n' +
					'  v_percentLife = percentLife;\n' +
					'}\n',
				fragmentShader: '' +
					'varying vec4 v_position;\n' +
					'varying vec2 v_texcoord;\n' +
					'varying float v_percentLife;\n' +
					'varying vec4 v_colorMult;\n' +
					'\n' +
					'// We need to implement 1D!\n' +
					'uniform sampler2D rampSampler;\n' +
					'uniform sampler2D colorSampler;\n' +
					'\n' +
					'void main() {\n' +
					'  vec4 colorMult = texture2D(rampSampler, \n' +
					'      vec2(v_percentLife, 0.5)) * v_colorMult;\n' +
					'  vec4 color = texture2D(colorSampler, v_texcoord) * colorMult;\n' +
					'  gl_FragColor = color;\n' +
					'}\n'
			}
		},
		// Corner UV values
		PARTICLE_CORNERS = [
			[-0.5, -0.5],
			[+0.5, -0.5],
			[+0.5, +0.5],
			[-0.5, +0.5]
		];

	/**
	 * An Object to manage Particles.
	 * You only need one of these to run multiple emitters of different types
	 * of particles.
	 * 
	 * @param {function(): number} opt_randomFunction A function that returns
	 *     a random number between 0.0 and 1.0. This allows you to pass in a
	 *     pseudo random function if you need particles that are reproducable.
	 */
	hemi.particles.System = function(opt_randomFunction) {
		var pixelBase = [0, 0.20, 0.70, 1, 0.70, 0.20, 0, 0],
			pixels = [];

		for (var yy = 0; yy < 8; ++yy) {
			for (var xx = 0; xx < 8; ++xx) {
				var pixel = pixelBase[xx] * pixelBase[yy];
				pixels.push(pixel, pixel, pixel, pixel);
			}
		}

		var colorPixels = convertToPixels(pixels),
			colorTexture = new THREE.DataTexture(colorPixels, 8, 8, THREE.RGBAFormat),
			rampPixels = convertToPixels(
				[1, 1, 1, 1,
				 1, 1, 1, 0.5,
				 1, 1, 1, 0]),
			rampTexture = new THREE.DataTexture(rampPixels, 3, 1, THREE.RGBAFormat);

		colorTexture.needsUpdate = rampTexture.needsUpdate = true;

		this._randomFunction = opt_randomFunction || function() {
			return Math.random();
		};

		/**
		 * The default color texture for particles.
		 * @type {THREE.Texture}
		 */
		this.defaultColorTexture = colorTexture;

		/**
		 * The default ramp texture for particles.
		 * @type {THREE.Texture}
		 */
		this.defaultRampTexture = rampTexture;

		/**
		 * List of Emitters controlled by this System.
		 */
		this.emitters = [];
	};

	/**
	 * Creates a particle emitter.
	 * 
	 * @param {THREE.Camera} camera the camera that will be used to view this
	 *     Emitter.
	 * @param {THREE.Texture} opt_texture The texture to use for the particles.
	 *     If you don't supply a texture a default is provided.
	 * @return {hemi.particles.Emitter} The new emitter.
	 */
	hemi.particles.System.prototype.createEmitter = function(camera, opt_texture) {
		return new hemi.particles.Emitter(this, camera, opt_texture);
	};

	/**
	 * Creates a Trail particle emitter.
	 * You can use this for jet exhaust, etc...
	 * 
	 * @param {THREE.Camera} camera the camera that will be used to view this
	 *     Emitter.
	 * @param {number} maxParticles Maximum number of particles to appear at once.
	 * @param {hemi.particles.Spec} parameters The parameters used to
	 *     generate particles.
	 * @param {THREE.Texture} opt_texture The texture to use for the particles.
	 *     If you don't supply a texture a default is provided.
	 * @param {function(number, hemi.particles.Spec): void} opt_paramSetter A
	 *     function that is called for each particle to allow it's parameters to
	 *     be adjusted per particle. The number is the index of the particle
	 *     being created, in other words, if numParticles is 20 this value will
	 *     be 0 to 19. The ParticleSpec is a spec for this particular particle.
	 *     You can set any per particle value before returning.
	 * @return {hemi.particles.Trail} A Trail object.
	 */
	hemi.particles.System.prototype.createTrail = function(camera, maxParticles, parameters, opt_texture, opt_paramSetter) {
		return new hemi.particles.Trail(this, camera, maxParticles, parameters, opt_texture, opt_paramSetter);
	};

	/**
	 * Update emitters with the given time delta.
	 * 
	 * @param {number} delta amount of time to advance the particles by
	 */
	hemi.particles.System.prototype.update = function(delta) {
		for (var i = 0, il = this.emitters.length; i < il; ++i) {
			this.emitters[i]._timeParam.value += delta;
		}
	};

	/**
	* A particle Spec specifies how to emit particles.
	*
	* NOTE: For all particle functions you can specify a particle Spec as a
	* Javascript object, only specifying the fields that you care about.
	*
	* <pre>
	* emitter.setParameters({
	*   numParticles: 40,
	*   lifeTime: 2,
	*   timeRange: 2,
	*   startSize: 50,
	*   endSize: 90,
	*   positionRange: [10, 10, 10],
	*   velocity:[0, 0, 60], velocityRange: [15, 15, 15],
	*   acceleration: [0, 0, -20],
	*   spinSpeedRange: 4}
	* );
	* </pre>
	*
	* Many of these parameters are in pairs. For paired paramters each particle
	* specfic value is set like this
	*
	* particle.field = value + Math.random() - 0.5 * valueRange * 2;
	*
	* or in English
	*
	* particle.field = value plus or minus valueRange.
	*
	* So for example, if you wanted a value from 10 to 20 you'd pass 15 for value
	* and 5 for valueRange because
	*
	* 15 + or - 5  = (10 to 20)
	*
	* @constructor
	*/
	hemi.particles.Spec = function() {
		/**
		* The number of particles to emit.
		* @type {number}
		*/
		this.numParticles = 1;

		/**
		* The number of frames in the particle texture.
		* @type {number}
		*/
		this.numFrames = 1;

		/**
		* The frame duration at which to animate the particle texture in seconds per
		* frame.
		* @type {number}
		*/
		this.frameDuration = 1;

		/**
		* The initial frame to display for a particular particle.
		* @type {number}
		*/
		this.frameStart = 0;

		/**
		* The frame start range.
		* @type {number}
		*/
		this.frameStartRange = 0;

		/**
		* The life time of the entire particle system.
		* To make a particle system be continuous set this to match the lifeTime.
		* @type {number}
		*/
		this.timeRange = 99999999;

		/**
		* The startTime of a particle.
		* @type {number}
		*/
		this.startTime = null;

		/**
		* The lifeTime of a particle.
		* @type {number}
		*/
		this.lifeTime = 1;

		/**
		* The lifeTime range.
		* @type {number}
		*/
		this.lifeTimeRange = 0;

		/**
		* The starting size of a particle.
		* @type {number}
		*/
		this.startSize = 1;

		/**
		* The starting size range.
		* @type {number}
		*/
		this.startSizeRange = 0;

		/**
		* The ending size of a particle.
		* @type {number}
		*/
		this.endSize = 1;

		/**
		* The ending size range.
		* @type {number}
		*/
		this.endSizeRange = 0;

		/**
		* The starting position of a particle in local space.
		* @type {number[3]}
		*/
		this.position = [0, 0, 0];

		/**
		* The starting position range.
		* @type {number[3]}
		*/
		this.positionRange = [0, 0, 0];

		/**
		* The velocity of a paritcle in local space.
		* @type {number[3]}
		*/
		this.velocity = [0, 0, 0];

		/**
		* The velocity range.
		* @type {number[3]}
		*/
		this.velocityRange = [0, 0, 0];

		/**
		* The acceleration of a particle in local space.
		* @type {number[3]}
		*/
		this.acceleration = [0, 0, 0];

		/**
		* The accleration range.
		* @type {number[3]}
		*/
		this.accelerationRange = [0, 0, 0];

		/**
		* The starting spin value for a particle in radians.
		* @type {number}
		*/
		this.spinStart = 0;

		/**
		* The spin start range.
		* @type {number}
		*/
		this.spinStartRange = 0;

		/**
		* The spin speed of a particle in radians.
		* @type {number}
		*/
		this.spinSpeed = 0;

		/**
		* The spin speed range.
		* @type {number}
		*/
		this.spinSpeedRange = 0;

		/**
		* The color multiplier of a particle.
		* @type {number[4]}
		*/
		this.colorMult = [1, 1, 1, 1];

		/**
		* The color multiplier range.
		* @type {number[4]}
		*/
		this.colorMultRange = [0, 0, 0, 0];

		/**
		* The velocity of all paritcles in world space.
		* @type {number[3]}
		*/
		this.worldVelocity = [0, 0, 0];

		/**
		* The acceleration of all paritcles in world space.
		* @type {number[3]}
		*/
		this.worldAcceleration = [0, 0, 0];

		/**
		* Whether these particles are oriented in 2d or 3d. true = 2d, false = 3d.
		* @type {boolean}
		*/
		this.billboard = true;

		/**
		* The orientation of a particle. This is only used if billboard is false.
		* @type {number[4]}
		*/
		this.orientation = [0, 0, 0, 1];
	};

	/**
	* A ParticleEmitter
	* @constructor
	* 
	* @param {hemi.particles.System} particleSystem The particle system to
	*     manage this Emitter.
	* @param {THREE.Camera} camera the camera that will be used to view this
	*     Emitter.
	* @param {THREE.Texture} opt_texture The texture to use for the particles.
	*     If you don't supply a texture a default is provided.
	*/
	hemi.particles.Emitter = function(particleSystem, camera, opt_texture) {
		this._camera = camera;
		this._colorTexture = opt_texture || null;
		/*
		* The particle system managing this emitter.
		* @type {hemi.particles.System}
		*/
		this._particleSystem = null;
		this._rampTexture = null;
		this._timeParam = null;

		/**
		* The material used by this emitter.
		* @type {THREE.ShaderMaterial}
		*/
		this.material = new THREE.ShaderMaterial({
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			transparent: true
		});

		this.material.name = 'particles';

		/**
		* The Shape used to render these particles.
		* @type {THREE.Geometry}
		*/
		this.shape = new THREE.Geometry();

		if (particleSystem) {
			this._colorTexture = opt_texture || particleSystem.defaultColorTexture;
			this._rampTexture = particleSystem.defaultRampTexture;
			this._particleSystem = particleSystem;
			particleSystem.emitters.push(this);
		}
	};

	/**
	* Sets the blending for the particles.
	* You can use this to set the emitter to draw with BLEND, ADD, SUBTRACT, etc.
	* 
	* @param {number} blending Enumeration for the blend to use.
	*/
	hemi.particles.Emitter.prototype.setBlending = function(blending) {
		this.material.blending = blending;
	};

	/**
	* Sets the colorRamp for the particles.
	* The colorRamp is used as a multiplier for the texture. When a particle
	* starts it is multiplied by the first color, as it ages to progressed
	* through the colors in the ramp.
	*
	* <pre>
	* particleEmitter.setColorRamp([
	*   1, 0, 0, 1,    // red
	*   0, 1, 0, 1,    // green
	*   1, 0, 1, 0]);  // purple but with zero alpha
	* </pre>
	*
	* The code above sets the particle to start red, change to green then
	* fade out while changing to purple.
	*
	* @param {number[]} colorRamp An array of color values in the form RGBA.
	*/
	hemi.particles.Emitter.prototype.setColorRamp = function(colorRamp) {
		var width = colorRamp.length / 4;

		if (width % 1 !== 0) {
			hemi.error('colorRamp must have multiple of 4 entries');
		}

		var rampPixels = convertToPixels(colorRamp);

		if (this._rampTexture === this._particleSystem.defaultRampTexture || this._rampTexture.image.width !== width) {
			this._rampTexture = new THREE.DataTexture(rampPixels, width, 1, THREE.RGBAFormat);
			this._rampTexture.needsUpdate = true;

			if (this.uniforms) {
				this.uniforms.rampSampler.texture = this._rampTexture;
			}
		} else {
			this._rampTexture.image.data = rampPixels;
		}
	};

	/**
	* Validates and adds missing particle parameters.
	* 
	* @param {hemi.particles.Spec} parameters The parameters to validate.
	*/
	hemi.particles.Emitter.prototype.validateParameters = function(parameters) {
		var defaults = new hemi.particles.Spec();

		for (var key in parameters) {
			if (typeof defaults[key] === 'undefined') {
				hemi.error('unknown particle parameter "' + key + '"');
			}
		}
		for (key in defaults) {
			if (typeof parameters[key] === 'undefined') {
				parameters[key] = defaults[key];
			}
		}
	};

	/**
	* Sets the parameters of the particle emitter.
	*
	* Each of these parameters are in pairs. The used to create a table
	* of particle parameters. For each particle a specfic value is
	* set like this
	*
	* particle.field = value + Math.random() - 0.5 * valueRange * 2;
	*
	* or in English
	*
	* particle.field = value plus or minus valueRange.
	*
	* So for example, if you wanted a value from 10 to 20 you'd pass 15 for value
	* and 5 for valueRange because
	*
	* 15 + or - 5  = (10 to 20)
	*
	* @param {hemi.particles.Spec} parameters The parameters for the emitter.
	* @param {function(number, hemi.particles.Spec): void} opt_paramSetter A
	*     function that is called for each particle to allow it's parameters to
	*     be adjusted per particle. The number is the index of the particle
	*     being created, in other words, if numParticles is 20 this value will
	*     be 0 to 19. The ParticleSpec is a spec for this particular particle.
	*     You can set any per particle value before returning.
	*/
	hemi.particles.Emitter.prototype.setParameters = function(parameters, opt_paramSetter) {
		setupMaterial.call(this, parameters);

		var numParticles = parameters.numParticles;

		allocateParticles.call(this, numParticles);
		createParticles.call(this, 0, numParticles, parameters, opt_paramSetter);
	};

	/**
	* Creates a OneShot particle emitter instance.
	* You can use this for dust puffs, explosions, fireworks, etc...
	* 
	* @param {THREE.Object3D} opt_parent The parent for the OneShot.
	* @return {hemi.particles.OneShot} A OneShot object.
	*/
	hemi.particles.Emitter.prototype.createOneShot = function(opt_parent) {
		return new hemi.particles.OneShot(this, opt_parent);
	};

	/**
	* An object to manage a particle emitter instance as a one shot. Examples of
	* one shot effects are things like an explosion, some fireworks.
	* @constructor
	* 
	* @param {hemi.particles.Emitter} emitter The emitter to use for the
	*     OneShot.
	* @param {THREE.Object3D} opt_parent The parent for this OneShot.
	*/
	hemi.particles.OneShot = function(emitter, opt_parent) {
		this._emitter = emitter;
		this._timeOffsetParam = emitter.material.uniforms.timeOffset;

		/**
		* Transform for OneShot.
		* @type {THREE.Mesh}
		*/
		this.transform = new THREE.Mesh(emitter.shape, emitter.material);
		this.transform.visible = false;

		if (opt_parent) {
			opt_parent.add(this.transform);
		}
	};

	/**
	* Triggers the oneshot.
	*
	* Note: You must have set the parent either at creation, with setParent, or by
	* passing in a parent here.
	*
	* @param {THREE.Vector3} opt_position The position of the one shot
	*     relative to its parent.
	* @param {THREE.Object3D} opt_parent The parent for this one shot.
	*/
	hemi.particles.OneShot.prototype.trigger = function(opt_position, opt_parent) {
		if (opt_parent) {
			opt_parent.add(this._transform);
		}
		if (opt_position) {
			this._transform.position.copy(opt_position);
		}

		this._transform.visible = true;
		this._timeOffsetParam.value = this._emitter._timeParam.value;
	};

	/**
	* A type of emitter to use for particle effects that leave trails like exhaust.
	* @constructor
	* @extends {hemi.particles.Emitter}
	* 
	* @param {hemi.particles.System} particleSystem The particle system to
	*     manage this emitter.
	* @param {THREE.Camera} camera the camera that will be used to view this
	*     Emitter.
	* @param {number} maxParticles Maximum number of particles to appear at once.
	* @param {hemi.particles.Spec} parameters The parameters used to generate
	*     particles.
	* @param {THREE.Texture} opt_texture The texture to use for the particles.
	*     If you don't supply a texture a default is provided.
	* @param {function(number, hemi.particles.Spec): void} opt_paramSetter A
	*     function that is called for each particle to allow it's parameters to
	*     be adjusted per particle. The number is the index of the particle
	*     being created, in other words, if numParticles is 20 this value will
	*     be 0 to 19. The ParticleSpec is a spec for this particular particle.
	*     You can set any per particle value before returning.
	*/
	hemi.particles.Trail = function(particleSystem, camera, maxParticles, parameters, opt_texture, opt_paramSetter) {
		hemi.particles.Emitter.call(this, particleSystem, camera, opt_texture);

		this._birthIndex = 0;
		this._maxParticles = maxParticles;
		this._parameters = parameters;
		this._paramSetter = opt_paramSetter;

		allocateParticles.call(this, maxParticles);
		setupMaterial.call(this, parameters);
	};

	hemi.particles.Trail.prototype = new hemi.particles.Emitter();
	hemi.particles.Trail.constructor = hemi.particles.Trail;

	/**
	* Births particles from this Trail.
	* 
	* @param {number[3]} position Position to birth particles at.
	*/
	hemi.particles.Trail.prototype.birthParticles = function(position) {
		var numParticles = this._parameters.numParticles;
		this._parameters.startTime = this._timeParam.value;
		this._parameters.position = position;

		while (this._birthIndex + numParticles >= this._maxParticles) {
			var numParticlesToEnd = this._maxParticles - this._birthIndex;
			createParticles.call(this, this._birthIndex, numParticlesToEnd, this._parameters, this._paramSetter);
			numParticles -= numParticlesToEnd;
			this._birthIndex = 0;
		}

		createParticles.call(this, this._birthIndex, numParticles, this._parameters, this._paramSetter);
		this._birthIndex += numParticles;
	};

// Private functions

		/**
		* Allocates particles.
		* 
		* @param {number} numParticles Number of particles to allocate.
		*/
	var allocateParticles = function(numParticles) {
			for (var i = 0; i < numParticles; ++i) {
				for (var j = 0; j < 4; ++j) {
					this.shape.vertices.push(new THREE.Vertex());
				}

				var index = i * 4;
				this.shape.faces.push(new THREE.Face3(index, index + 1, index + 2));
				this.shape.faces.push(new THREE.Face3(index, index + 2, index + 3));
			}
		},

		/**
		* Creates particles.
		*  
		* @param {number} firstParticleIndex Index of first particle to create.
		* @param {number} numParticles The number of particles to create.
		* @param {hemi.particles.Spec} parameters The parameters for the
		*     emitter.
		* @param {function(number, hemi.particles.Spec): void} opt_paramSetter A
		*     function that is called for each particle to allow it's parameters to
		*     be adjusted per particle. The number is the index of the particle
		*     being created, in other words, if numParticles is 20 this value will
		*     be 0 to 19. The ParticleSpec is a spec for this particular particle.
		*     You can set any per particle value before returning.
		*/
		createParticles = function(firstParticleIndex, numParticles, parameters, opt_paramSetter) {
			var attributes = this.material.attributes,
				uniforms = this.material.uniforms,
				uvLifeTimeFrameStart = attributes.uvLifeTimeFrameStart;
				positionStartTime = attributes.positionStartTime;
				velocityStartSize = attributes.velocityStartSize;
				accelerationEndSize = attributes.accelerationEndSize;
				spinStartSpinSpeed = attributes.spinStartSpinSpeed;
				orientation = attributes.orientation;
				colorMult = attributes.colorMult,
				wv = parameters.worldVelocity,
				wa = parameters.worldAcceleration,
				random = this._particleSystem._randomFunction,

				plusMinus = function(range) {
					return (random() - 0.5) * range * 2;
				},

				plusMinusVector = function(v, range) {
					var r = [];

					for (var i = 0, il = v.length; i < il; ++i) {
						r[i] = v[i] + plusMinus(range[i]);
					}

					return r;
				};

			// Set the globals.
			uniforms.colorSampler.texture = this._colorTexture;
			uniforms.rampSampler.texture = this._rampTexture;
			uniforms.timeRange.value = parameters.timeRange;
			uniforms.numFrames.value = parameters.numFrames;
			uniforms.frameDuration.value = parameters.frameDuration;
			uniforms.worldVelocity.value.set(wv[0], wv[1], wv[2]);
			uniforms.worldAcceleration.value.set(wa[0], wa[1], wa[2]);

			if (parameters.billboard) {
				uniforms.viewInverse.value = this._camera.matrixWorld;
			}

			for (var ii = 0; ii < numParticles; ++ii) {
				if (opt_paramSetter) {
					opt_paramSetter(ii, parameters);
				}

				var pLifeTime = parameters.lifeTime,
					pStartTime = (parameters.startTime === null) ?
						(ii * pLifeTime / numParticles) : parameters.startTime,
					pFrameStart =
						parameters.frameStart + plusMinus(parameters.frameStartRange),
					pPosition = plusMinusVector(parameters.position, parameters.positionRange),
					pVelocity = plusMinusVector(parameters.velocity, parameters.velocityRange),
					pAcceleration = plusMinusVector(parameters.acceleration, parameters.accelerationRange),
					pColorMult =plusMinusVector(parameters.colorMult, parameters.colorMultRange),
					pSpinStart =
						parameters.spinStart + plusMinus(parameters.spinStartRange),
					pSpinSpeed =
						parameters.spinSpeed + plusMinus(parameters.spinSpeedRange),
					pStartSize =
						parameters.startSize + plusMinus(parameters.startSizeRange),
					pEndSize = parameters.endSize + plusMinus(parameters.endSizeRange),
					pOrientation = parameters.orientation;

				// make each corner of the particle.
				for (var jj = 0; jj < 4; ++jj) {
					var offset = ii * 4 + jj + firstParticleIndex;

					uvLifeTimeFrameStart.value[offset] = new THREE.Vector4(
						PARTICLE_CORNERS[jj][0],
						PARTICLE_CORNERS[jj][1],
						pLifeTime,
						pFrameStart);

					positionStartTime.value[offset] =  new THREE.Vector4(
						pPosition[0],
						pPosition[1],
						pPosition[2],
						pStartTime);

					velocityStartSize.value[offset] =  new THREE.Vector4(
						pVelocity[0],
						pVelocity[1],
						pVelocity[2],
						pStartSize);

					accelerationEndSize.value[offset] =  new THREE.Vector4(
						pAcceleration[0],
						pAcceleration[1],
						pAcceleration[2],
						pEndSize);

					spinStartSpinSpeed.value[offset] =  new THREE.Vector4(
						pSpinStart,
						pSpinSpeed,
						0,
						0);

					colorMult.value[offset] =  new THREE.Vector4(
						pColorMult[0],
						pColorMult[1],
						pColorMult[2],
						pColorMult[3]);
					
					if (orientation) {
						orientation.value[offset] =  new THREE.Vector4(
							pOrientation[0],
							pOrientation[1],
							pOrientation[2],
							pOrientation[3]);
					}
				}
			}

			uvLifeTimeFrameStart.needsUpdate = true;
			positionStartTime.needsUpdate = true;
			velocityStartSize.needsUpdate = true;
			accelerationEndSize.needsUpdate = true;
			spinStartSpinSpeed.needsUpdate = true;
			colorMult.needsUpdate = true;

			if (orientation) orientation.needsUpdate = true;
		},

		setupMaterial = function(parameters) {
			this.validateParameters(parameters);

			var shader = SHADERS[parameters.billboard ? 'particle2d' : 'particle3d'];

			this.material.attributes = THREE.UniformsUtils.clone(shader.attributes);
			this.material.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
			this.material.vertexShader = shader.vertexShader;
			this.material.fragmentShader = shader.fragmentShader;
			this._timeParam = this.material.uniforms.time;
		};

	return hemi;
})(hemi || {});
