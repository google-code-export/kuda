/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

Detector = {

	canvas : !! window.CanvasRenderingContext2D,
	webgl : ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )(),
	workers : !! window.Worker,
	fileapi : window.File && window.FileReader && window.FileList && window.Blob,

	getWebGLErrorMessage : function () {

		var domElement = document.createElement( 'div' );

		domElement.style.fontFamily = 'monospace';
		domElement.style.fontSize = '13px';
		domElement.style.textAlign = 'center';
		domElement.style.background = '#eee';
		domElement.style.color = '#000';
		domElement.style.padding = '1em';
		domElement.style.width = '475px';
		domElement.style.margin = '5em auto 0';

		if ( ! this.webgl ) {

			domElement.innerHTML = window.WebGLRenderingContext ? [
				'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br />',
				'Find out how to get it <a href="http://get.webgl.org/">here</a>.'
			].join( '\n' ) : [
				'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/>',
				'Find out how to get it <a href="http://get.webgl.org/">here</a>.'
			].join( '\n' );

		}

		return domElement;

	},

	addGetWebGLMessage : function ( parameters ) {

		var parent, id, domElement;

		parameters = parameters || {};

		parent = parameters.parent !== undefined ? parameters.parent : document.body;
		id = parameters.id !== undefined ? parameters.id : 'oldie';

		domElement = Detector.getWebGLErrorMessage();
		domElement.id = id;

		parent.appendChild( domElement );

	}

};
/**
 * Copyright 2010 Tim Down.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * jshashtable
 *
 * jshashtable is a JavaScript implementation of a hash table. It creates a single constructor function called Hashtable
 * in the global scope.
 *
 * Author: Tim Down <tim@timdown.co.uk>
 * Version: 2.1
 * Build date: 21 March 2010
 * Website: http://www.timdown.co.uk/jshashtable
 */

var Hashtable = (function() {
	var FUNCTION = "function";

	var arrayRemoveAt = (typeof Array.prototype.splice == FUNCTION) ?
		function(arr, idx) {
			arr.splice(idx, 1);
		} :

		function(arr, idx) {
			var itemsAfterDeleted, i, len;
			if (idx === arr.length - 1) {
				arr.length = idx;
			} else {
				itemsAfterDeleted = arr.slice(idx + 1);
				arr.length = idx;
				for (i = 0, len = itemsAfterDeleted.length; i < len; ++i) {
					arr[idx + i] = itemsAfterDeleted[i];
				}
			}
		};

	function hashObject(obj) {
		var hashCode;
		if (typeof obj == "string") {
			return obj;
		} else if (typeof obj.hashCode == FUNCTION) {
			// Check the hashCode method really has returned a string
			hashCode = obj.hashCode();
			return (typeof hashCode == "string") ? hashCode : hashObject(hashCode);
		} else if (typeof obj.toString == FUNCTION) {
			return obj.toString();
		} else {
			try {
				return String(obj);
			} catch (ex) {
				// For host objects (such as ActiveObjects in IE) that have no toString() method and throw an error when
				// passed to String()
				return Object.prototype.toString.call(obj);
			}
		}
	}

	function equals_fixedValueHasEquals(fixedValue, variableValue) {
		return fixedValue.equals(variableValue);
	}

	function equals_fixedValueNoEquals(fixedValue, variableValue) {
		return (typeof variableValue.equals == FUNCTION) ?
			   variableValue.equals(fixedValue) : (fixedValue === variableValue);
	}

	function createKeyValCheck(kvStr) {
		return function(kv) {
			if (kv === null) {
				throw new Error("null is not a valid " + kvStr);
			} else if (typeof kv == "undefined") {
				throw new Error(kvStr + " must not be undefined");
			}
		};
	}

	var checkKey = createKeyValCheck("key"), checkValue = createKeyValCheck("value");

	/*----------------------------------------------------------------------------------------------------------------*/

	function Bucket(hash, firstKey, firstValue, equalityFunction) {
        this[0] = hash;
		this.entries = [];
		this.addEntry(firstKey, firstValue);

		if (equalityFunction !== null) {
			this.getEqualityFunction = function() {
				return equalityFunction;
			};
		}
	}

	var EXISTENCE = 0, ENTRY = 1, ENTRY_INDEX_AND_VALUE = 2;

	function createBucketSearcher(mode) {
		return function(key) {
			var i = this.entries.length, entry, equals = this.getEqualityFunction(key);
			while (i--) {
				entry = this.entries[i];
				if ( equals(key, entry[0]) ) {
					switch (mode) {
						case EXISTENCE:
							return true;
						case ENTRY:
							return entry;
						case ENTRY_INDEX_AND_VALUE:
							return [ i, entry[1] ];
					}
				}
			}
			return false;
		};
	}

	function createBucketLister(entryProperty) {
		return function(aggregatedArr) {
			var startIndex = aggregatedArr.length;
			for (var i = 0, len = this.entries.length; i < len; ++i) {
				aggregatedArr[startIndex + i] = this.entries[i][entryProperty];
			}
		};
	}

	Bucket.prototype = {
		getEqualityFunction: function(searchValue) {
			return (typeof searchValue.equals == FUNCTION) ? equals_fixedValueHasEquals : equals_fixedValueNoEquals;
		},

		getEntryForKey: createBucketSearcher(ENTRY),

		getEntryAndIndexForKey: createBucketSearcher(ENTRY_INDEX_AND_VALUE),

		removeEntryForKey: function(key) {
			var result = this.getEntryAndIndexForKey(key);
			if (result) {
				arrayRemoveAt(this.entries, result[0]);
				return result[1];
			}
			return null;
		},

		addEntry: function(key, value) {
			this.entries[this.entries.length] = [key, value];
		},

		keys: createBucketLister(0),

		values: createBucketLister(1),

		getEntries: function(entries) {
			var startIndex = entries.length;
			for (var i = 0, len = this.entries.length; i < len; ++i) {
				// Clone the entry stored in the bucket before adding to array
				entries[startIndex + i] = this.entries[i].slice(0);
			}
		},

		containsKey: createBucketSearcher(EXISTENCE),

		containsValue: function(value) {
			var i = this.entries.length;
			while (i--) {
				if ( value === this.entries[i][1] ) {
					return true;
				}
			}
			return false;
		}
	};

	/*----------------------------------------------------------------------------------------------------------------*/

	// Supporting functions for searching hashtable buckets

	function searchBuckets(buckets, hash) {
		var i = buckets.length, bucket;
		while (i--) {
			bucket = buckets[i];
			if (hash === bucket[0]) {
				return i;
			}
		}
		return null;
	}

	function getBucketForHash(bucketsByHash, hash) {
		var bucket = bucketsByHash[hash];

		// Check that this is a genuine bucket and not something inherited from the bucketsByHash's prototype
		return ( bucket && (bucket instanceof Bucket) ) ? bucket : null;
	}

	/*----------------------------------------------------------------------------------------------------------------*/

	function Hashtable(hashingFunctionParam, equalityFunctionParam) {
		var that = this;
		var buckets = [];
		var bucketsByHash = {};

		var hashingFunction = (typeof hashingFunctionParam == FUNCTION) ? hashingFunctionParam : hashObject;
		var equalityFunction = (typeof equalityFunctionParam == FUNCTION) ? equalityFunctionParam : null;

		this.put = function(key, value) {
			checkKey(key);
			checkValue(value);
			var hash = hashingFunction(key), bucket, bucketEntry, oldValue = null;

			// Check if a bucket exists for the bucket key
			bucket = getBucketForHash(bucketsByHash, hash);
			if (bucket) {
				// Check this bucket to see if it already contains this key
				bucketEntry = bucket.getEntryForKey(key);
				if (bucketEntry) {
					// This bucket entry is the current mapping of key to value, so replace old value and we're done.
					oldValue = bucketEntry[1];
					bucketEntry[1] = value;
				} else {
					// The bucket does not contain an entry for this key, so add one
					bucket.addEntry(key, value);
				}
			} else {
				// No bucket exists for the key, so create one and put our key/value mapping in
				bucket = new Bucket(hash, key, value, equalityFunction);
				buckets[buckets.length] = bucket;
				bucketsByHash[hash] = bucket;
			}
			return oldValue;
		};

		this.get = function(key) {
			checkKey(key);

			var hash = hashingFunction(key);

			// Check if a bucket exists for the bucket key
			var bucket = getBucketForHash(bucketsByHash, hash);
			if (bucket) {
				// Check this bucket to see if it contains this key
				var bucketEntry = bucket.getEntryForKey(key);
				if (bucketEntry) {
					// This bucket entry is the current mapping of key to value, so return the value.
					return bucketEntry[1];
				}
			}
			return null;
		};

		this.containsKey = function(key) {
			checkKey(key);
			var bucketKey = hashingFunction(key);

			// Check if a bucket exists for the bucket key
			var bucket = getBucketForHash(bucketsByHash, bucketKey);

			return bucket ? bucket.containsKey(key) : false;
		};

		this.containsValue = function(value) {
			checkValue(value);
			var i = buckets.length;
			while (i--) {
				if (buckets[i].containsValue(value)) {
					return true;
				}
			}
			return false;
		};

		this.clear = function() {
			buckets.length = 0;
			bucketsByHash = {};
		};

		this.isEmpty = function() {
			return !buckets.length;
		};

		var createBucketAggregator = function(bucketFuncName) {
			return function() {
				var aggregated = [], i = buckets.length;
				while (i--) {
					buckets[i][bucketFuncName](aggregated);
				}
				return aggregated;
			};
		};

		this.keys = createBucketAggregator("keys");
		this.values = createBucketAggregator("values");
		this.entries = createBucketAggregator("getEntries");

		this.remove = function(key) {
			checkKey(key);

			var hash = hashingFunction(key), bucketIndex, oldValue = null;

			// Check if a bucket exists for the bucket key
			var bucket = getBucketForHash(bucketsByHash, hash);

			if (bucket) {
				// Remove entry from this bucket for this key
				oldValue = bucket.removeEntryForKey(key);
				if (oldValue !== null) {
					// Entry was removed, so check if bucket is empty
					if (!bucket.entries.length) {
						// Bucket is empty, so remove it from the bucket collections
						bucketIndex = searchBuckets(buckets, hash);
						arrayRemoveAt(buckets, bucketIndex);
						delete bucketsByHash[hash];
					}
				}
			}
			return oldValue;
		};

		this.size = function() {
			var total = 0, i = buckets.length;
			while (i--) {
				total += buckets[i].entries.length;
			}
			return total;
		};

		this.each = function(callback) {
			var entries = that.entries(), i = entries.length, entry;
			while (i--) {
				entry = entries[i];
				callback(entry[0], entry[1]);
			}
		};

		this.putAll = function(hashtable, conflictCallback) {
			var entries = hashtable.entries();
			var entry, key, value, thisValue, i = entries.length;
			var hasConflictCallback = (typeof conflictCallback == FUNCTION);
			while (i--) {
				entry = entries[i];
				key = entry[0];
				value = entry[1];

				// Check for a conflict. The default behaviour is to overwrite the value for an existing key
				if ( hasConflictCallback && (thisValue = that.get(key)) ) {
					value = conflictCallback(key, thisValue, value);
				}
				that.put(key, value);
			}
		};

		this.clone = function() {
			var clone = new Hashtable(hashingFunctionParam, equalityFunctionParam);
			clone.putAll(that);
			return clone;
		};
	}

	return Hashtable;
})();/*
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
		this.transform.doubleSided = true; // turn off face culling
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

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
var hemi = (function(hemi){
    var initializing = false, 
		fnTest = /xyz/.test(function(){
	        xyz;
	    }) ? /\b_super\b/ : /.*/;
    
    // The base Class implementation (does nothing)
    hemi.Class = function(){};
    
    // Create a new Class that inherits from this class
    hemi.Class.extend = function(prop){
        var _super = this.prototype;
        
        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;
        
        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
            typeof _super[name] == "function" &&
            fnTest.test(prop[name]) ? (function(name, fn){
                return function(){
                    var tmp = this._super;
                    
                    // Add a new ._super() method that is the same method
                    // but on the super-class
                    this._super = _super[name];
                    
                    // The method only need to be bound temporarily, so we
                    // remove it when we're done executing
                    var ret = fn.apply(this, arguments);
                    this._super = tmp;
                    
                    return ret;
                };
            })(name, prop[name]) : prop[name];
        }
        
        // The dummy class constructor
        function Class(){
            // All construction is actually done in the init method
            if (!initializing && this.init) 
                this.init.apply(this, arguments);
        }
        
        // Populate our constructed prototype object
        Class.prototype = prototype;
        
        // Enforce the constructor to be what we expect
        Class.constructor = Class;
        
        // And make this class extendable
        Class.extend = arguments.callee;
        
        return Class;
    };
	
	return hemi;
})(hemi || {});
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
	/**
	 * @namespace A module to provide various utilities for Hemi.
	 */
	hemi.utils = hemi.utils || {};
	
	/*
	 * Here we extend Hashtable to allow it to be queried for Object attributes
	 * that are not the Hash key.
	 */
	hemi.utils.Hashtable = Hashtable;
	
	/**
	 * Search the Hashtable for values with attributes that match the given
	 * set of attributes. The attributes may be single values or arrays of
	 * values which are alternatives.
	 * @example
	 * query({
	 *     a: 1
	 *     b: [2, 3]
	 * });
	 * 
	 * will return any values that have a === 1 and b === 2 or b === 3
	 * 
	 * @param {Object} attributes a set of attributes to search for
	 * @return {Object[]} an array of matching values
	 */
	hemi.utils.Hashtable.prototype.query = function(attributes) {
		var values = this.values(),
			props = [],
			arrProps = [],
			results = [],
			value,
			propName,
			propVal,
			propArr,
			pN,
			aN,
			aL,
			match;
		
		// Copy the property names out of the attributes object just once
		// since this is less efficient than a simple array.
		for (x in attributes) {
			if (hemi.utils.isArray(attributes[x])) {
				arrProps.push(x);
			} else {
				props.push(x);
			}
		}
		
		var pLen = props.length,
			aLen = arrProps.length;
		
		for (var ndx = 0, len = values.length; ndx < len; ndx++) {
			value = values[ndx];
			match = true;
			// First test the single value properties.
			for (pN = 0; match && pN < pLen; pN++) {
				propName = props[pN];
				match = value[propName] === attributes[propName];
			}
			// Next test the array of value properties.
			for (pN = 0; match && pN < aLen; pN++) {
				match = false;
				propName = arrProps[pN];
				propVal = value[propName];
				propArr = attributes[propName];
				aL = propArr.length;
				// Search through the array until we find a match for the
				// Hashtable value's property.
				for (aN = 0; !match && aN < aL; aN++) {
					match = propVal === propArr[aN];
				}
			}
			// If it all matches up, we'll return it.
			if (match) {
				results.push(value);
			}
		}
		
		return results;
	};
	
	return hemi;
})(hemi || {});
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
	hemi.utils = hemi.utils || {};
	
	/**
	 * Create a copy of the given Object (or array).
	 * 
	 * @param {Object} src an Object (or array) to clone
	 * @param {boolean} opt_deep optional flag to indicate if deep copying
	 *     should be performed (default is deep copying)
	 * @return {Object} the created Object (or array)
	 */
	hemi.utils.clone = function(src, opt_deep) {
		var dest = hemi.utils.isArray(src) ? [] : {},
			opt_deep = opt_deep == null ? true : opt_deep;
		
		hemi.utils.join(dest, src, opt_deep);
		return dest;
	};
	
	/**
	 * Compare the two given arrays of numbers. The arrays should be the same
	 * length.
	 * 
	 * @param {number[]} a the first array
	 * @param {number[]} b the second array
	 * @return {boolean} true if the arrays are equal
	 */
	hemi.utils.compareArrays = function(a, b) {
		var eq = a.length === b.length;
		
		for (var i = 0; eq && i < a.length; i++) {
			if (a[i] instanceof Array) { 
				eq = hemi.utils.compareArrays(a[i], b[i]);
			} else {
				eq = Math.abs(a[i] - b[i]) <= 0.001;
			}
		}
		
		return eq;
	};
	
	/**
	 * Perform an asynchronous AJAX GET for the resource at the given URL.
	 * 
	 * @param {string} url url of the resource to get
	 * @param {function(string, string):void)} callback function to pass the
	 *     data retrieved from the URL as well as the status text of the request
	 */
	hemi.utils.get = function(url, callback) {
		var xhr = new window.XMLHttpRequest();
		
		xhr.onreadystatechange = function() {
			if (this.readyState === 4) {
				this.onreadystatechange = hemi.utils.noop;
				var data = null;
				
				if (this.status === 200 || window.location.href.indexOf('http') === -1) {
					var ct = this.getResponseHeader('content-type');
					
					if (ct && ct.indexOf('xml') >= 0) {
						data = this.responseXML;
					} else {
						data = this.responseText;
					}
				}
				
				callback(data, this.statusText);
			}
		};
		xhr.open('GET', url, true);
		
		try {
			xhr.send(null);
		} catch (err) {
			callback(null, err.name + ': ' + err.message);
		}
	};
	
	/** 
	 * The "best" way to test if a value is an array or not.
	 *
	 * @param {Object} val value to test
	 * @return {boolean} true if the value is an array
	 */
	hemi.utils.isArray = Array.isArray || function(val) {
		return Object.prototype.toString.call(val) === '[object Array]';
	};

	/** 
	 * The "best" way to test if a value is a function or not.
	 *
	 * @param {Object} val value to test
	 * @return {boolean} true if the value is a function
	 */
	hemi.utils.isFunction = function(val) {
		return Object.prototype.toString.call(val) === '[object Function]';
	};
	
	/**
	 * Merge all of the properties of the given objects into the first object.
	 * If any of the objects have properties with the same name, the later
	 * properties will overwrite earlier ones. The exception to this is if both
	 * properties are objects or arrays and the merge is doing a deep copy. In
	 * that case, the properties will be merged recursively.
	 * 
	 * @param {Object} obj1 the first object which will receive all properties
	 * @param {Object} objN any number of objects to copy properties from
	 * @param {boolean} opt_deep optional flag to indicate if deep copying
	 *     should be performed (default is deep copying)
	 * @return {Object} the first object now merged with all other objects
	 */
	hemi.utils.join = function() {
		var target = arguments[0],
			il = arguments.length,
			lastArg = arguments[il - 1],
			deep = true;
		
		if (typeof lastArg === 'boolean') {
			deep = lastArg;
			--il;
		}
		
		for (var i = 1; i < il; i++) {
			var obj = arguments[i];
			
			for (var j in obj) {
				var src = obj[j];
				
				if (deep && src != null && typeof src === 'object') {
					var dest = target[j],
						srcArr = hemi.utils.isArray(src);
					
					if (dest == null || typeof dest !== 'object' || hemi.utils.isArray(dest) !== srcArr) {
						dest = srcArr ? [] : {};
					}
					
					target[j] = hemi.utils.join(dest, src);
				} else {
					target[j] = src;
				}
			}
		}
		
		return target;
	};
	
	/**
	 * A no-operation function for utility use.
	 */
	hemi.utils.noop = function() {};
	
	return hemi;
})(hemi || {});
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
	hemi.utils = hemi.utils || {};
	
	/** 
	 * General function to convert from cartesian to spherical coordinates.
	 *
	 * @param {number[3]} coords XYZ cartesian coordinates
	 * @return {number[3]} Radius, Theta, Phi
	 */
	hemi.utils.cartesianToSpherical = function(coords) {
		var x = coords[0];
		var y = coords[1];
		var z = coords[2];
		var r = Math.sqrt(x*x + y*y + z*z);
		var theta = Math.acos(y/r);
		var phi = Math.atan2(x,z);
		return [r,theta,phi];	
	};
	
	/** 
	 * A choose function (also called the binomial coefficient).
	 *
	 * @param {number} n top input of choose
	 * @param {number} m bottom input of choose
	 * @return {number} choose output, (n!)/(m!*(n-m)!)
	 */
	hemi.utils.choose = function(n, m) {
		return hemi.utils.factorial(n, (n-m)+1) / hemi.utils.factorial(m);
	};
	
	/** 
	 * Clamp the given value between the given min and max.
	 *
	 * @param {number} val value to clamp
	 * @param {number} min minimum for value
	 * @param {number} max maximum for value
	 * @return {number} the clamped value
	 */
	hemi.utils.clamp = function(val, min, max) {
		return Math.min(max, Math.max(min, val));
	};

	/**
	 * Calculate the cubic hermite interpolation between two points with
	 * associated tangents.
	 *
	 * @param {number} t time (between 0 and 1)
	 * @param {number[3]} p0 the first waypoint
	 * @param {number[3]} m0 the tangent through the first waypoint
	 * @param {number[3]} p1 the second waypoint
	 * @param {number[3]} m1 the tangent through the second waypoint
	 * @return {number[3]} the interpolated point
	 */
	hemi.utils.cubicHermite = function(t,p0,m0,p1,m1) {
		var t2 = t*t,
			t3 = t2*t,
			tp0 = 2*t3 - 3*t2 + 1,
			tm0 = t3 - 2*t2 + t,
			tp1 = -2*t3 + 3*t2,
			tm1 = t3 - t2;
		
		return tp0*p0 + tm0*m0 + tp1*p1 + tm1*m1;
	};
	
	/**
	 * Calculate the factorial of the given number.
	 *
	 * @param {number} num number to factorialize
	 * @param {number} opt_stop optional number to stop the factorial at (if it
	 *     should be stopped before 1
	 * @return {number} (num!) or (num! - opt_stop!)
	 */
	hemi.utils.factorial = function(num, opt_stop) {
		var f = 1,
			x = opt_stop ? opt_stop : 2;
		
		while (x <= num) {
			f *= x++;
		}
		
		return f;
	};
	
	/**
	 * Calculate the intersection between a ray and a plane.
	 * 
	 * @param {THREE.Ray} ray Ray described by a near xyz point and a far xyz point
	 * @param {THREE.Vector3[3]} plane Array of 3 xyz coordinates defining a plane
	 * @return {number[3]} Array [t: Time value on ray, u: U-coordinate on plane,
	 *		v: V-coordinate on plane} of intersection point
	 */
	hemi.utils.intersect = function(ray, plane) {
		var A = hemi.utils.inverse(
			[[ray.direction.x, plane[1].x - plane[0].x, plane[2].x - plane[0].x],
			 [ray.direction.y, plane[1].y - plane[0].y, plane[2].y - plane[0].y],
			 [ray.direction.z, plane[1].z - plane[0].z, plane[2].z - plane[0].z]]),
			B = [ray.origin.x - plane[0].x, ray.origin.y - plane[0].y, ray.origin.z - plane[0].z],
			t = A[0][0] * B[0] + A[0][1] * B[1] + A[0][2] * B[2],
			u = A[1][0] * B[0] + A[1][1] * B[1] + A[1][2] * B[2],
			v = A[2][0] * B[0] + A[2][1] * B[1] + A[2][2] * B[2];
		
		return [t,u,v];
	};
	
	/**
	 * Perform linear interpolation on the given values. Values can be numbers
	 * or arrays or even nested arrays (as long as their lengths match).
	 * 
	 * @param {number} a first number (or array of numbers) for interpolation
	 * @param {number} v second number (or array of numbers) for interpolation
	 * @param {number} t coefficient for interpolation (usually time)
	 * @return {number} the interpolated number (or array of numbers)
	 */
	hemi.utils.lerp = function(a, b, t) {
		var ret;
		
		if (hemi.utils.isArray(a)) {
			ret = [];
			
			for (var i = 0; i < a.length; ++i) {
				ret[i] = hemi.utils.lerp(a[i], b[i], t);
			}
		} else {
			ret = a + (b - a) * t;
		}
		
		return ret;
	};
	
	/**
	 * Convert the given linear interpolated value to a sinusoidal interpolated
	 * value.
	 * 
	 * @param {number} val the linear value
	 * @return {number} the sinusoidal value
	 */
	hemi.utils.linearToSine = function(val) {
		return (Math.sin(Math.PI * val - hemi.HALF_PI) + 1) / 2;
	};
	
	/**
	 * Convert the given linear interpolated value to a parabolic interpolated
	 * value.
	 * 
	 * @param {number} val the linear value
	 * @return {number} the parabolic value
	 */
	hemi.utils.linearToParabolic = function(val) {
		return val * val;
	};
	
	/**
	 * Convert the given linear interpolated value to a inverse parabolic
	 * interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @return {number} the inverse parabolic value
	 */
	hemi.utils.linearToParabolicInverse = function(val) {
		return 1 - (1 - val) * (1 - val);
	};
	
	/**
	 * Convert the given linear interpolated value to an exponential
	 * interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @param {number} x the exponent to use
	 * @return {number} the exponential value
	 */
	hemi.utils.linearToExponential = function(val, x) {
		return (Math.pow(x, val) - 1) / (x - 1);
	};
	
	/**
	 * Convert the given linear interpolated value to an inverse exponential
	 * interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @param {number} x the exponent to use
	 * @return {number} the inverse exponential value
	 */
	hemi.utils.linearToExponentialInverse = function(val, x) {
		return 1 - hemi.utils.linearToExponential(1 - val, x);
	};
	
	/**
	 * A container for all the common penner easing equations - 
	 * 		linear
	 *		quadratic 
	 *		cubic
	 *		quartic
	 *		quintic
	 *		exponential
	 *		sinusoidal
	 *		circular
	 */
	hemi.utils.penner = {
	
		linearTween : function (t, b, c, d) {
			return c*t/d + b;
		},
		
		easeInQuad : function (t, b, c, d) {
			t /= d;
			return c*t*t + b;
		},
		
		easeOutQuad : function (t, b, c, d) {
			t /= d;
			return -c * t*(t-2) + b;
		},
		
		easeInOutQuad : function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t + b;
			t--;
			return -c/2 * (t*(t-2) - 1) + b;
		},
	
		easeInCubic : function (t, b, c, d) {
			t /= d;
			return c*t*t*t + b;
		},
		
		easeOutCubic : function (t, b, c, d) {
			t /= d;
			t--;
			return c*(t*t*t + 1) + b;
		},
		
		easeInOutCubic : function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t*t + b;
			t -= 2;
			return c/2*(t*t*t + 2) + b;
		},
		
		easeInQuart : function (t, b, c, d) {
			t /= d;
			return c*t*t*t*t + b;
		},
		
		easeOutQuart : function (t, b, c, d) {
			t /= d;
			t--;
			return -c * (t*t*t*t - 1) + b;
		},
		
		easeInOutQuart : function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t*t*t + b;
			t -= 2;
			return -c/2 * (t*t*t*t - 2) + b;
		},
		
		easeInQuint : function (t, b, c, d) {
			t /= d;
			return c*t*t*t*t*t + b;
		},
		
		easeOutQuint : function (t, b, c, d) {
			t /= d;
			t--;
			return c*(t*t*t*t*t + 1) + b;
		},
		
		easeInOutQuint : function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t*t*t*t + b;
			t -= 2;
			return c/2*(t*t*t*t*t + 2) + b;
		},
		
		easeInSine : function (t, b, c, d) {
			return -c * Math.cos(t/d * hemi.HALF_PI) + c + b;
		},
		
		easeOutSine : function (t, b, c, d) {
			return c * Math.sin(t/d * hemi.HALF_PI) + b;
		},
		
		easeInOutSine : function (t, b, c, d) {
			return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
		},
		
		easeInExpo : function (t, b, c, d) {
			return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
		},
		
		easeOutExpo : function (t, b, c, d) {
			return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
		},
		
		easeInOutExpo : function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
			t--;
			return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
		},
		
		easeInCirc : function (t, b, c, d) {
			t /= d;
			return -c * (Math.sqrt(1 - t*t) - 1) + b;
		},
		
		easeOutCirc : function (t, b, c, d) {
			t /= d;
			t--;
			return c * Math.sqrt(1 - t*t) + b;
		},
		
		easeInOutCirc : function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
			t -= 2;
			return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
		}

	};
	
	hemi.utils.sphericalToCartesian = function(coords) {
		var r = coords[0];
		var t = coords[1];
		var p = coords[2];
		return [r*Math.sin(t)*Math.cos(p),	// x
				r*Math.sin(t)*Math.sin(p),  // y
				r*Math.cos(t)];				// z
	};
	
	/**
	 * Convert the given UV coordinates for the given plane into XYZ coordinates
	 * in 3D space.
	 * 
	 * @param {number[2]} uv uv coordinates on a plane
	 * @param {THREE.Vector3[3]} plane array of 3 xyz coordinates defining the plane
	 * @return {number[3]} xyz coordinates of the uv location on the plane
	 */
	hemi.utils.uvToXYZ = function(uv, plane) {
		var uf = new THREE.Vector3().sub(plane[1], plane[0]).multiplyScalar(uv[0]),
		vf = new THREE.Vector3().sub(plane[2], plane[0]).multiplyScalar(uv[1]),
		pos = uf.addSelf(vf).addSelf(plane[0]);
		return pos;
	};
	
	/**
	 * Calculate the screen coordinates from a 3d position in the world.
	 * @param {number[3]} p XYZ point to calculate from
	 * @return {number[2]} XY screen position of point
	 */
	hemi.utils.worldToScreen = function(p0) {
		var VM = hemi.view.viewInfo.drawContext.view,
			PM = hemi.view.viewInfo.drawContext.projection,
			w = hemi.view.clientSize.width,
			h = hemi.view.clientSize.height,
			m4 = hemi.core.math.matrix4,
			v = m4.transformPoint(VM,p0),
			z = v[2],
			p = m4.transformPoint(PM, v);
		
		if (z > 0) {
			p[0] = -p[0];
			p[1] = -p[1];
		}
		var x = (p[0]+1.0)*0.5*w;
		var y = (-p[1]+1.0)*0.5*h;
		return [Math.round(x),Math.round(y)];
	};
	
	/**
	 * Calculate the screen coordinates from a 3d position in the world.
	 * @param {hemi.client} The current client
	 * @param {THREE.Vector3} point XYZ point to calculate from
	 * @return {THREE.Vector3} XY screen position of point, plus z-distance,
	 *		where 0.0 = near clip and 1.0 = flar clip
	 */
	hemi.utils.worldToScreenFloat = function(client, point) {
		var viewVec = client.camera.threeCamera.matrixWorldInverse.multiplyVector3(point.clone()),
			projVec = client.camera.threeCamera.projectionMatrix.multiplyVector3(viewVec.clone());
		
		if (viewVec.z > 0) {
			projVec.x = -projVec.x;
			projVec.y = -projVec.y;
		}

		var x = (projVec.x + 1.0) * 0.5 * client.getWidth();
		var y = (-projVec.y + 1.0) * 0.5 * client.getHeight();
		return new THREE.Vector3(x, y, projVec.z);
	};

	/**
	 * Computes the normal given three vertices that form a triangle
	 * 
	 * @param {THREE.Vertex} a vertex a
	 * @param {THREE.Vertex} b vertex b
	 * @param {THREE.Vertex} c vertex c
	 */
	hemi.utils.computeNormal = function(a, b, c) {
		var cb = new THREE.Vector3(), 
			ab = new THREE.Vector3();
			
		cb.sub(c.position, b.position);
		ab.sub(a.position, b.position);
		cb.crossSelf(ab);

		if (!cb.isZero()) {
			cb.normalize();
		}

		return cb;
	};

	
	/**
	 * Computes the inverse of a 3-by-3 matrix.
	 * @param {number[3][3]} m The matrix.
	 * @return {number[3][3]} The inverse of m.
	 */
	hemi.utils.inverse = function(m) {
		var t00 = m[1][1] * m[2][2] - m[1][2] * m[2][1];
		var t10 = m[0][1] * m[2][2] - m[0][2] * m[2][1];
		var t20 = m[0][1] * m[1][2] - m[0][2] * m[1][1];
		var d = 1.0 / (m[0][0] * t00 - m[1][0] * t10 + m[2][0] * t20);
		return [[d * t00, -d * t10, d * t20],
			  [-d * (m[1][0] * m[2][2] - m[1][2] * m[2][0]),
				d * (m[0][0] * m[2][2] - m[0][2] * m[2][0]),
			   -d * (m[0][0] * m[1][2] - m[0][2] * m[1][0])],
			  [d * (m[1][0] * m[2][1] - m[1][1] * m[2][0]),
			  -d * (m[0][0] * m[2][1] - m[0][1] * m[2][0]),
			   d * (m[0][0] * m[1][1] - m[0][1] * m[1][0])]];
	};
	return hemi;
})(hemi || {});
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
	hemi.utils = hemi.utils || {};
	
	/**
	 * Build a shader source string from the given parsed source structure.
	 * 
	 * @param {Object} parsed structure populated with parsed shader source:
	 *     (all fields are optional)
	 *     preHdr: source positioned before the header
	 *     hdr: header source
	 *     postHdr: source positioned after the header
	 *     preSprt: source positioned before the support
	 *     sprt: support source
	 *     postSprt: source positioned after the support
	 *     preBody: source positioned before the body
	 *     body: body source
	 *     postBody: source positioned after the body
	 *     preGlob: source positioned before the global
	 *     glob: global variable assignment source
	 *     postGlob: source positioned after the global
	 * @return {string} the new shader source string
	 */
	hemi.utils.buildSrc = function(parsed) {
		var src = (parsed.preHdr ? parsed.preHdr : '') +
			(parsed.hdr ? parsed.hdr : '') +
			(parsed.postHdr ? parsed.postHdr : '') +
			(parsed.preSprt ? parsed.preSprt : '') +
			(parsed.sprt ? parsed.sprt : '') +
			(parsed.postSprt ? parsed.postSprt : '') +
			parsed.main +
			(parsed.preBody ? parsed.preBody : '') +
			(parsed.body ? parsed.body : '') +
			(parsed.postBody ? parsed.postBody : '') +
			(parsed.preGlob ? parsed.preGlob : '') +
			(parsed.glob ? parsed.glob : '') +
			(parsed.postGlob ? parsed.postGlob : '') +
			parsed.end;
		
		return src;
	};
	
	/**
	 * Combine the given strings into one cohesive fragment shader source
	 * string.
	 * 
	 * @param {string} src the original shader source string
	 * @param {Object} cfg configuration object for how to build the new shader:
	 *     (all fields are optional)
	 *     preHdr: source to prepend to the existing header
	 *     hdr: source to replace the existing header
	 *     postHdr: source to append to the existing header
	 *     preSprt: source to prepend to the existing support
	 *     sprt: source to replace the existing support
	 *     postSprt: source to append to the existing support
	 *     preBody: source to prepend to the existing body
	 *     body: source to replace the existing body
	 *     postBody: source to append to the existing body
	 *     preGlob: source to prepend to the existing global
	 *     glob: source to replace the existing global variable assignment
	 *     postGlob: source to append to the existing global
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineFragSrc = function(src, cfg) {
		return this.combineSrc(src, cfg, 'gl_FragColor');
	};
	
	/**
	 * Combine the given strings into one cohesive shader source string.
	 * 
	 * @param {string} src the original shader source string
	 * @param {Object} cfg configuration object for how to build the new shader:
	 *     (all fields are optional)
	 *     preHdr: source to prepend to the existing header
	 *     hdr: source to replace the existing header
	 *     postHdr: source to append to the existing header
	 *     preSprt: source to prepend to the existing support
	 *     sprt: source to replace the existing support
	 *     postSprt: source to append to the existing support
	 *     preBody: source to prepend to the existing body
	 *     body: source to replace the existing body
	 *     postBody: source to append to the existing body
	 *     preGlob: source to prepend to the existing global
	 *     glob: source to replace the existing global variable assignment
	 *     postGlob: source to append to the existing global
	 * @param {string} globName name of the global variable to set in main()
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineSrc = function(src, cfg, globName) {
		var parsed = this.parseSrc(src, globName);
		hemi.utils.join(parsed, cfg);
		return this.buildSrc(parsed);
	};
	
	/**
	 * Combine the given strings into one cohesive vertex shader source string.
	 * 
	 * @param {string} src the original shader source string
	 * @param {Object} cfg configuration object for how to build the new shader:
	 *     (all fields are optional)
	 *     preHdr: source to prepend to the existing header
	 *     hdr: source to replace the existing header
	 *     postHdr: source to append to the existing header
	 *     preSprt: source to prepend to the existing support
	 *     sprt: source to replace the existing support
	 *     postSprt: source to append to the existing support
	 *     preBody: source to prepend to the existing body
	 *     body: source to replace the existing body
	 *     postBody: source to append to the existing body
	 *     preGlob: source to prepend to the existing global
	 *     glob: source to replace the existing global variable assignment
	 *     postGlob: source to append to the existing global
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineVertSrc = function(src, cfg) {
		return this.combineSrc(src, cfg, 'gl_Position');
	};
	
	/**
	 * Get the vertex and pixel shaders (as well as their source) for the given
	 * Material.
	 * 
	 * @param {o3d.Material} material the material to get shaders for
	 * @return {Object} object containing shaders and source strings
	 */
	hemi.utils.getShaders = function(client, material) {
		var gl = client.renderer.context,
			program = material.program,
			shaders = gl.getAttachedShaders(program),
			source1 = gl.getShaderSource(shaders[0]),
			source2 = gl.getShaderSource(shaders[1]),
			obj;
		
		if (source1.search('gl_FragColor') > 0) {
			obj = {
				fragShd: shaders[0],
				fragSrc: source1,
				vertShd: shaders[1],
				vertSrc: source2
			};
		} else {
			obj = {
				fragShd: shaders[1],
				fragSrc: source2,
				vertShd: shaders[0],
				vertSrc: source1
			};
		}
		
		return obj;
	};
	
	/**
	 * Parse the given shader source into logical groupings as follows:
	 *   Header - uniform, attribute, and varying parameters
	 *   Support - support/utility functions
	 *   Body - all of the main function except Global
	 *   Global - where the shader's global variable is assigned
	 * 
	 * Example:
	 * (HEADER_START)
	 * #ifdef MYVAR
	 * #endif
	 * uniform mat4 worldViewProjection;
	 * attribute vec4 position;
	 * (HEADER_END)
	 * (SUPPORT_START)
	 * float getOne() {
	 *   return 1.0;
	 * }
	 * (SUPPORT_END)
	 * void main() {
	 *   (BODY_START)
	 *   float one = getOne();
	 *   vec4 realPos = worldViewProjection*position;
	 *   (BODY_END)
	 *   (GLOBAL_START)
	 *   gl_Position = realPos;
	 *   (GLOBAL_END)
	 * }
	 * 
	 * @param {string} src full shader source
	 * @param {string} global global variable assigned by shader
	 * @return {Object} structure populated with parsed shader source
	 */
	hemi.utils.parseSrc = function(src, global) {
		var hdrEnd = src.lastIndexOf(';', src.indexOf('{')) + 1,
			sprtEnd = src.indexOf('void main', hdrEnd),
			bodyStart = src.indexOf('{', sprtEnd) + 1,
			bodyEnd = src.lastIndexOf(global),
			globEnd = src.lastIndexOf('}');
		
		if (src.charAt(hdrEnd) === '\n') {
			++hdrEnd;
		}
		if (src.charAt(bodyStart) === '\n') {
			++bodyStart;
		}
		if (src.charAt(bodyEnd) === '\n') {
			++bodyEnd;
		}
		if (src.charAt(globEnd) === '\n') {
			++globEnd;
		}
		
		var parsedSrc = {
			hdr: src.slice(0, hdrEnd),
			sprt: src.slice(hdrEnd, sprtEnd),
			main: src.slice(sprtEnd, bodyStart),
			body: src.slice(bodyStart, bodyEnd),
			glob: src.slice(bodyEnd, globEnd),
			end: src.slice(globEnd)
		};
		
		return parsedSrc;
	};
	
	return hemi;
})(hemi || {});
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
	hemi.utils = hemi.utils || {};
	
	/*
	 * Add a function to the Javascript string to remove whitespace from the
	 * beginning and end.
	 */
	String.prototype.trim = function() {
		return this.replace(/^\s*/, "").replace(/\s*$/, "");
	};
	
	/*
	 * Adds a method to the Javascript string to capitalize the first letter 
	 */
	String.prototype.capitalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};
	
	/**
	 * Test if the given string is numeric.
	 *  
	 * @param {string} str the string to test
	 * @return {boolean} true if the string can be converted directly to a number
	 */
	hemi.utils.isNumeric = function(str) {
		return !(str === null || isNaN(str) || str.length === 0);
	};
	
	
	/*
	 * A table of characters to break a line on (for text wrapping), weighted
	 * by preference.
	 */
	var breakable = new Hashtable();
	breakable.put(' ', 10);
	breakable.put(',', 20);
	breakable.put(';', 30);
	breakable.put('.', 10);
	breakable.put('!', 40);
	breakable.put('?', 40);
	
	/**
	 * Perform strict text wrapping on the given text. The returned text is
	 * guaranteed to be no wider than the specified target width, though it may
	 * be farther from that width than with loose text wrapping.
	 * 
	 * @param {string} text the string to perform text wrapping on
	 * @param {number} targetWidth maximum desired width for text in pixels
	 * @param {CanvasRenderingContext2D} canvas object used to measure text's
	 *     on-screen size
	 * @return {string[]} array of wrapped text
	 */
	hemi.utils.wrapTextStrict = function(text, targetWidth, canvas) {
		var wrapLines = [],
			text = hemi.utils.cleanseText(text),
			textLength = text.length,
			metric = canvas.measureText(text),
			charWidth = metric.width / textLength,
			chars = Math.floor(targetWidth / charWidth),
			increment = Math.ceil(chars / 10),
			start = 0,
			end = chars,
			line, width;
		
		while (end < textLength) {
			line = text.substring(start, end).trim();
			metric = canvas.measureText(line);
			width = metric.width;
			
			while (width < targetWidth && end < textLength) {
				end += increment;
				
				if (end > textLength) {
					end = textLength;
				}
				
				line = text.substring(start, end).trim();
				metric = canvas.measureText(line);
				width = metric.width;
			}
			
			while (width > targetWidth) {
				end--;
				line = text.substring(start, end).trim();
				metric = canvas.measureText(line);
				width = metric.width;
			}
			
			var breakNdx = end - 1,
				ch = text.charAt(breakNdx);
			
			while (!breakable.containsKey(ch) && breakNdx > start) {
				breakNdx--;
				ch = text.charAt(breakNdx);
			}
			
			if (breakNdx > start) {
				end = breakNdx + 1;
			}
			
			line = text.substring(start, end).trim();
			wrapLines.push(line);
			start = end;
			end += chars;
		}
			
		if (start != textLength || wrapLines.length === 0) {
			line = text.substring(start, textLength).trim();
			wrapLines.push(line);
		}
		
		return wrapLines;
	};
	
	/**
	 * Perform loose text wrapping on the given text. The returned text will be
	 * close to the specified target width, but may be a little wider.
	 * 
	 * @param {string} text the string to perform text wrapping on
	 * @param {number} targetWidth desired width for text in pixels
	 * @param {number} charWidth average width of a character of the text in
	 *     pixels
	 * @return {string[]} array of wrapped text
	 */
	hemi.utils.wrapText = function(text, targetWidth, charWidth) {
		var wrapLines = [],
			text = hemi.utils.cleanseText(text),
			textLength = text.length,
			cols = parseInt(targetWidth / charWidth),
        	rows = Math.ceil(textLength / cols),
			start = cols,
			index = 0,
			last;
		
		for (var i = 0; i < rows - 1; i++) {
			last = index;
			index = bestBreak(text, start, 10);
			wrapLines.push(text.substring(last, index).trim());
			start = index + cols;
		}
		
		wrapLines.push(text.substring(index, textLength));
		return wrapLines;
	};
	
	/**
	 * Replace any newline characters in the text with spaces. This is used to
	 * prepare text for text wrapping.
	 * 
	 * @param {string} text string to clean
	 * @return {string} string with all newline characters replaced
	 */
	hemi.utils.cleanseText = function(text) {
		text = text.replace('\n', ' ');
		return text;
	};
	
	/*
	 * Internal function to calculate the "best" index to break a line of
	 * text at, given a certain weighted preference for characters to break on.
	 * 
	 * @param {string} text string of text to break into two lines
	 * @param {number} start estimated index the user would like to break at
	 * @param {number} radius maximum distance before and after the start index
	 *     to search for a "best" break
	 */
	function bestBreak(text, start, radius) {
		var bestIndex = start,
			bestWeight = 0,
			textLength = text.length,
			beginRadius = start - Math.max(start - radius, 0),
			endRadius = Math.min(start + radius, textLength - 1) - start,
			examWeight, weight;
		
		for (var i = parseInt(start - beginRadius); i <= start + endRadius; i++) {
			weight = breakable.get(text.charAt(i));
			if (weight === null) 
				continue;
			
			examWeight = weight / Math.abs(start - i);
			if (examWeight > bestWeight) {
				bestIndex = i;
				bestWeight = examWeight;
			}
		}
		
		return Math.min(bestIndex + 1, textLength - 1);
	};
	
	return hemi;
})(hemi || {});
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
	hemi.utils = hemi.utils || {};
	
	/**
	 * Check to see if the given Transform has key frame animations bound to it.
	 * 
	 * @param {o3d.Transform} transform the Transform to check
	 * @return {boolean} true if Transform has key frame animations
	 */
	hemi.utils.isAnimated = function(transform) {
		var lm = transform.getParam('o3d.localMatrix');
		
		return lm.inputConnection != null;
	};
	
	/**
	 * Create a new child Transform for the given Transform and move all of its
	 * current children and shapes onto the new child.
	 * 
	 * @param {o3d.Transform} transform the Transform to foster from
	 * @return {o3d.Transform} the created child Transform
	 */
	hemi.utils.fosterTransform = function(transform) {
		var children = transform.children,
			shapes = transform.shapes,
			newTran = hemi.core.mainPack.createObject('Transform');
		
		while (children.length > 0) {
			children[0].parent = newTran;
		}
		
		newTran.parent = transform;
		
		while (shapes.length > 0) {
			var shape = shapes[0];
			newTran.addShape(shape);
			transform.removeShape(shape);
		}
		
		return newTran;
	};
	
	/**
	 * Interprets a point in world space into local space.
	 */
	hemi.utils.pointAsLocal = function(transform, point) {
		var inv = new THREE.Matrix4().getInverse(transform.matrixWorld);
	    return inv.multiplyVector3(point.clone());
	};
	
	/**
	 * Interprets a point in local space into world space.
	 */
	hemi.utils.pointAsWorld = function(transform, point) {
		return transform.matrixWorld.multiplyVector3(point.clone());
	};
	
	/**
	 * Point the y axis of the given matrix toward the given point.
	 *
	 * @param {THREE.Matrix4} matrix the matrix to rotate
	 * @param {THREE.Vector3} eye XYZ point from which to look (may be the origin)
	 * @param {THREE.Vector3} target XYZ point at which to aim the y axis
	 * @return {THREE.Object3D} the rotated transform
	 */
	hemi.utils.pointYAt = function(matrix, eye, target) {
		var dx = target.x - eye.x,
			dy = target.y - eye.y,
			dz = target.z - eye.z,
			dxz = Math.sqrt(dx*dx + dz*dz),
			rotY = Math.atan2(dx,dz),
			rotX = Math.atan2(dxz,dy);
		
//		tran.rotation.y += rotY;
//		tran.rotation.x += rotX;
//		tran.updateMatrix();
		matrix.rotateY(rotY);
		matrix.rotateX(rotX);

		
		return matrix;
	};
	
	/**
	 * Point the z axis of the given transform toward the given point.
	 *
	 * @param {THREE.Object3D} tran the transform to rotate
	 * @param {THREE.Vector3} eye XYZ point from which to look (may be the origin)
	 * @param {THREE.Vector3} target XYZ point at which to aim the z axis
	 * @return {THREE.Object3D} the rotated transform
	 */
	hemi.utils.pointZAt = function(tran, eye, target) {
		var delta = new THREE.Vector3().sub(target, eye),
			rotY = Math.atan2(delta.x, delta.z),
			rotX = -Math.asin(delta.y / delta.length());
		
		tran.rotation.y += rotY;
		tran.rotation.x += rotX;
		tran.updateMatrix();
		
		return tran;
	};

	/**
	 * Rotate the texture UV coordinates of the given Geometry.
	 * 
	 * @param {THREE.Geometry} geometry the Geometry to translate the texture for
	 * @param {number} theta amount to rotate the UV coordinates (in radians)
	 */
	hemi.utils.rotateUVs = function(geometry, theta) {
		var uvSet = geometry.faceVertexUvs[0],
			cosT = Math.cos(theta),
			sinT = Math.sin(theta);

		for (var i = 0, il = uvSet.length; i < il; ++i) {
			var uvs = uvSet[i];

			for (var j = 0, jl = uvs.length; j < jl; ++j) {
				var uv = uvs[j],
					u = uv.u,
					v = uv.v;

				uv.u = u * cosT - v * sinT;
				uv.v = u * sinT + v * cosT;
			}
		}

		// Magic to get the WebGLRenderer to update the vertex buffer
		for (var i = 0, il = geometry.geometryGroupsList.length; i < il; ++i) {
			var group = geometry.geometryGroupsList[i],
				verts = group.faces3.length * 3 + group.faces4.length * 4;

			group.__uvArray = new Float32Array(verts * 2);
			group.__inittedArrays = true;
		}

		geometry.__dirtyUvs = true;
	};

	/**
	 * Scale the texture UV coordinates of the given Geometry.
	 * 
	 * @param {THREE.Geometry} geometry the Geometry to translate the texture for
	 * @param {number} uScale amount to scale the U coordinate
	 * @param {number} vScale amount to scale the V coordinate
	 */
	hemi.utils.scaleUVs = function(geometry, uScale, vScale) {
		var uvSet = geometry.faceVertexUvs[0];

		for (var i = 0, il = uvSet.length; i < il; ++i) {
			var uvs = uvSet[i];

			for (var j = 0, jl = uvs.length; j < jl; ++j) {
				uvs[j].u *= uScale;
				uvs[j].v *= vScale;
			}
		}

		// Magic to get the WebGLRenderer to update the vertex buffer
		for (var i = 0, il = geometry.geometryGroupsList.length; i < il; ++i) {
			var group = geometry.geometryGroupsList[i],
				verts = group.faces3.length * 3 + group.faces4.length * 4;

			group.__uvArray = new Float32Array(verts * 2);
			group.__inittedArrays = true;
		}

		geometry.__dirtyUvs = true;
	};

	/**
	 * Apply the given transform matrix to the vertices of the given transform's
	 * geometry as well as the geometry of any child transforms.
	 * 
	 * @param {THREE.Object3D} transform the transform to start shifting at
	 * @param {THREE.Matrix4} matrix the transform matrix to apply
	 * @param {THREE.Scene} scene the transform's scene
	 */
	hemi.utils.shiftGeometry = function(transform, matrix, scene) {
		var geometry = transform.geometry,
			children = transform.children;

		if (geometry) {
			// Shift geometry
			geometry.applyMatrix(matrix);
			geometry.computeBoundingBox();

			// Do some magic since Three.js doesn't currently have a way to flush cached vertices
			geometry.dynamic = true;
			transform.__webglInit = false;
			delete geometry.geometryGroupsList[0].__webglVertexBuffer;
			scene.__objectsAdded.push(transform);
		}

		// Shift geometry of all children
		for (var i = 0, il = children.length; i < il; ++i) {
			var child = children[i];
			hemi.utils.shiftGeometry(child, matrix, scene);
		}
	};

	/**
	 * Translate the texture UV coordinates of the given Geometry.
	 * 
	 * @param {THREE.Geometry} geometry the Geometry to translate the texture for
	 * @param {number} uDelta amount to translate the U coordinate
	 * @param {number} vDelta amount to translate the V coordinate
	 */
	hemi.utils.translateUVs = function(geometry, uDelta, vDelta) {
		var uvSet = geometry.faceVertexUvs[0];

		for (var i = 0, il = uvSet.length; i < il; ++i) {
			var uvs = uvSet[i];

			for (var j = 0, jl = uvs.length; j < jl; ++j) {
				uvs[j].u += uDelta;
				uvs[j].v += vDelta;
			}
		}

		// Magic to get the WebGLRenderer to update the vertex buffer
		for (var i = 0, il = geometry.geometryGroupsList.length; i < il; ++i) {
			var group = geometry.geometryGroupsList[i],
				verts = group.faces3.length * 3 + group.faces4.length * 4;

			group.__uvArray = new Float32Array(verts * 2);
			group.__inittedArrays = true;
		}

		geometry.__dirtyUvs = true;
	};

	/**
	 * Move all of the children and shapes off of the given foster Transform and
	 * back to the original parent Transform. Destroy the foster Transform
	 *
	 * @param {o3d.Transform} transform the foster Transform previously created
	 * @return {o3d.Transform} the original parent Transform
	 */
	hemi.utils.unfosterTransform = function(transform) {
		var children = transform.children,
			shapes = transform.shapes,
			tParent = transform.parent;

		while (children.length > 0) {
			children[0].parent = tParent;
		}

		while (shapes.length > 0) {
			var shape = shapes[0];
			tParent.addShape(shape);
			transform.removeShape(shape);
		}

		transform.parent = null;
		hemi.core.mainPack.removeObject(transform);
		return tParent;
	};
	
	/**
	 * Rotate the transform by the given angle along the given world space axis.
	 *
	 * @param {THREE.Vector3} axis rotation axis defined as an XYZ vector
	 * @param {number} angle amount to rotate by in radians
	 * @param {THREE.Object3D} transform the transform to rotate
	 */
	hemi.utils.worldRotate = function(axis, angle, transform) {
		var iW = new THREE.Matrix4().getInverse(transform.matrixWorld),
			lA = hemi.utils.transformDirection(iW, axis);

		hemi.utils.axisRotate(lA, angle, transform);
	};
	
	/**
	 * Scale the transform by the given scale amounts in world space.
	 *
	 * @param {THREE.Vector3} scale scale factors defined as an XYZ vector
	 * @param {THREE.Object3D} transform the transform to scale
	 */
	hemi.utils.worldScale = function(scale, transform) {
		var matrix3x3 = THREE.Matrix4.makeInvert3x3(transform.parent.matrixWorld);
		transform.scale.multiplySelf(hemi.utils.multiplyVector3(matrix3x3, scale.clone()));
		transform.updateMatrix();
	};
	
	/**
	 * Translate the transform by the given world space vector.
	 *
	 * @param {THREE.Vector3} v XYZ vector to translate by
	 * @param {THREE.Object3D} transform the transform to translate
	 */
	hemi.utils.worldTranslate = function(v, transform) {
		var iW = new THREE.Matrix4().getInverse(transform.matrixWorld),
			lV = hemi.utils.transformDirection(iW, v);
		
		transform.translateX(lV.x);
		transform.translateY(lV.y);
		transform.translateZ(lV.z);
		transform.updateMatrix();
	};

	/**
	 * @param {THREE.Vector3} axis rotation axis defined as an XYZ vector
	 * @param {number} angle amount to rotate by in radians
	 * @param {THREE.Object3D} transform the transform to rotate
	*/
	hemi.utils.axisRotate = function(axis, angle, transform) {
		if (!transform.useQuaternion) {
			transform.useQuaternion = true;
			transform.quaternion.setFromEuler(THREE.Vector3(hemi.utils.radToDeg(transform.rotation.x),
			 hemi.utils.radToDeg(transform.rotation.y),
			 hemi.utils.radToDeg(transform.rotation.z)));
		}						
		transform.quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle).multiplySelf(transform.quaternion);
		transform.updateMatrix();
	};

	/**
	 * Return the Object3D to the identity matrix
	 *
	 * @param {THREE.Object3D} object3D the Object3D to modify
	 */
    hemi.utils.identity = function(object3d) {
        object3d.position = new THREE.Vector3(0, 0, 0);
        object3d.rotation = new THREE.Vector3(0, 0, 0);
        object3d.scale = new THREE.Vector3(1, 1, 1);
        object3d.updateMatrix();
    };

	/**
	 * Get all of the child Object3Ds of an Object3D
	 *
	 * @param {THREE.Object3D} object3D The parent of the Object3Ds to find
	 * @param {Object3D[]} an array where the child Object3Ds will be placed 
	 */
    hemi.utils.getChildren = function(parent, returnObjs) {
		for (var i = 0; i < parent.children.length; ++i) {
			var child = parent.children[i];
			returnObjs.push(child);
			hemi.utls.getChildren(child, returnObjs);
		}
	};


	/**
	 * Takes a 4-by-4 matrix and a vector with 3 entries, interprets the vector as a
	 * direction, transforms that direction by the matrix, and returns the result;
	 * assumes the transformation of 3-dimensional space represented by the matrix
	 * is parallel-preserving, i.e. any combination of rotation, scaling and
	 * translation, but not a perspective distortion. Returns a vector with 3
	 * entries.
	 * @param {THREE.Matrix4} m The matrix.
	 * @param {THREE.Vector3} v The direction.
	 * @return {THREE.Vector3} The transformed direction.
	 */
	hemi.utils.transformDirection = function(m, v) {
	  return new THREE.Vector3(v.x * m.n11 + v.y * m.n21 + v.z * m.n31,
	    v.x * m.n12 + v.y * m.n22 + v.z * m.n32,
	    v.x * m.n13 + v.y * m.n23 + v.z * m.n33);
	};


	hemi.utils.multiplyVector3 = function (matrix, vector) {

		var vx = vector.x, vy = vector.y, vz = vector.z;

		vector.x = matrix.m[0] * vx + matrix.m[3] * vy + matrix.m[6] * vz;
		vector.y = matrix.m[1] * vx + matrix.m[4] * vy + matrix.m[7] * vz;
		vector.z = matrix.m[2] * vx + matrix.m[5] * vy + matrix.m[8] * vz;

		return vector;
	};

	return hemi;
})(hemi || {});
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
	/**
	 * @namespace A module for managing the string literals for Message types.
	 * @example
	 * The documentation for each Message type has an example of a typical
	 * Message body for that type (the 'data' property of a Message).
	 */
	hemi.msg = {
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.model.Model - the Model's animation time changes
		 * data = {
		 *     previous: (number) the previous animation time for the Model
		 *     time: (number) the new animation time for the Model
		 * }
		 */
		animate: 'hemi.animate',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.effect.Burst - the Burst effect is triggered
		 * data = {
		 *     position: (number[3]) the XYZ position the Burst was triggered at
		 * }
		 */
		burst: 'hemi.burst',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.world - the World is being cleaned up and emptied
		 * data = { }
		 * @example
		 * hemi.world.Citizen - the Citizen is being removed from the World
		 * data = { }
		 */
		cleanup: 'hemi.cleanup',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.manip.Draggable - the Draggable has been dragged
		 * data = {
		 *     drag: (number[3]) the change in XYZ position caused by the drag
		 * }
		 */
		drag: 'hemi.drag',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hext.tools.BaseTool - the tool is enabled or disabled
		 * data = {
		 *     enabled: (boolean) a flag indicating if the tool is enabled
		 * }
		 */
		enable: 'hemi.enable',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.audio.Audio - the Audio's media content is loaded
		 * data = {
		 *     src: (string) the URL of the audio file loaded
		 * }
		 * @example
		 * hemi.hud.HudImage - the HudImage's image data is loaded
		 * data = { }
		 * @example
		 * hemi.hud.HudVideo - the HudVideo's media content is loaded
		 * data = {
		 *     src: (string) the URL of the video file loaded
		 * }
		 * @example
		 * hemi.model.Model - the Model's 3D data is loaded
		 * data = { }
		 * @example
		 * hemi.scene.Scene - the Scene is set as the "current" Scene
		 * data = { }
		 */
		load: 'hemi.load',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.world - a shape is picked by a mouse click
		 * data = {
		 *     mouseEvent: (o3d.Event) the event generated by the mouse click
		 *     pickInfo: (o3djs.picking.PickInfo) the info generated by the pick
		 * }
		 */
		pick: 'hemi.pick',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.world - a task's progress data has been updated
		 * data = {
		 *     isTotal: (boolean) a flag indicating if percent is for a specific
		 *                        task or a total of all current tasks
		 *     percent: (number) the task's percentage complete, 0-100
		 *     task: (string) an id for the task, ex: url of a file being loaded
		 * }
		 */
		progress: 'hemi.progress',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.world - the World's resources are loaded and ready
		 * data = { }
		 */
        ready: 'hemi.ready',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.manip.Scalable - the Scalable has been scaled
		 * data = {
		 *     scale: (number) the new scale
		 * }
		 */
        scale: 'hemi.scale',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.animation.Animation - the Animation starts
		 * data = { }
		 * @example
		 * hemi.audio.Audio - the Audio starts playing
		 * data = { }
		 * @example
		 * hemi.effect.Trail - the Trail effect starts generating particles
		 * data = { }
		 * @example
		 * hemi.motion.Rotator - the Rotator starts rotating
		 * data = { }
		 * @example
		 * hemi.motion.Translator - the Translator starts translating
		 * data = { }
		 * @example
		 * hemi.time.Timer - the Timer starts counting down
		 * data = {
		 *     time: (number) the milliseconds the Timer will count down for
		 * }
		 * @example
		 * hemi.view.Camera - the Camera starts moving to a Viewpoint
		 * data = {
		 *     viewpoint: (hemi.view.Viewpoint) the Viewpoint the Camera is
		 *                                      moving to
		 * }
		 */
		start: 'hemi.start',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.animation.Animation - the Animation finishes or is stopped
		 * data = { }
		 * @example
		 * hemi.audio.Audio - the Audio finishes playing
		 * data = { }
		 * @example
		 * hemi.effect.Trail - the Trail effect stops generating particles
		 * data = { }
		 * @example
		 * hemi.motion.Rotator - the Rotator stops rotating
		 * data = { }
		 * @example
		 * hemi.motion.Translator - the Translator stops translating
		 * data = { }
		 * @example
		 * hemi.time.Timer - the Timer stops counting down
		 * data = {
		 *     time: (number) the milliseconds the Timer counted down
		 * }
		 * @example
		 * hemi.view.Camera - the Camera arrives at a Viewpoint
		 * data = {
		 *     viewpoint: (hemi.view.Viewpoint) the Viewpoint the Camera moved
		 *                                      to
		 * }
		 */
		stop: 'hemi.stop',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.audio.Audio - the Audio's media content is unloaded
		 * data = { }
		 * @example
		 * hemi.model.Model - the Model's 3D data is unloaded
		 * data = { }
		 * @example
		 * hemi.scene.Scene - the Scene is set to not be the "current" Scene
		 * data = { }
		 */
		unload: 'hemi.unload',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.effect.Emitter - the Emitter is shown or hidden
		 * data = {
		 *     visible: (boolean) a flag indicating if the Emitter is visible
		 * }
		 * @example
		 * hemi.hud.HudDisplay - the HudDisplay shows a page or is hidden
		 * data = {
		 *     page: (number) the page number being shown or 0 if the HudDisplay
		 *                    is hidden
		 * }
		 * @example
		 * hext.tools.BaseTool - the tool is shown or hidden
		 * data = {
		 *     visible: (boolean) a flag indicating if the tool is visible
		 * }
		 */
		visible: 'hemi.visible'
	};

	return hemi;
})(hemi || {});
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
	/**
	 * @namespace A module for displaying log, warning, and error messages to a
	 * console element on a webpage.
	 */
	hemi.console = hemi.console || {};
	
	/**
	 * The priority level for an error message.
	 * @type string
	 * @constant
	 */
	hemi.console.ERR = 'ERR';
	
	/**
	 * The priority level for a warning message.
	 * @type string
	 * @constant
	 */
	hemi.console.WARN = 'WARN';
	
	/**
	 * The priority level for a log message.
	 * @type string
	 * @constant
	 */
	hemi.console.LOG = 'LOG';
	
	/* Flag indicating if the console should display log messages */
	var enabled = false;
	/* Flag indicating if timestamps should be added to log messages */
	var showTime = true;
	
	/*
	 * The actual function for logging a message.
	 * 
	 * @param {string} msg the message to log
	 * @param {string} level the priority level of the message
	 */
	var logMessage = function(msg, level) {
		level = level || hemi.console.LOG;
		
		if (testPriority(level)) {
			var fullMsg = level + ':\t' + msg;
			
			if (showTime) {
				var time = getTime();
				fullMsg = time + '\t' + fullMsg;
			}
			
			output(fullMsg);
		}
	};
	
	/*
	 * The default method for displaying a log message.
	 * 
	 * @param {string} msg the full log message to display
	 */
	var output = function(msg) {
		try {
			console.log(msg);
		} catch(e) { }
	};
	
	/*
	 * Get a timestamp for the current time.
	 * 
	 * @return {string} the current timestamp
	 */
	var getTime = function() {
		var currentTime = new Date();
		var hours = currentTime.getHours();
		hours = hours < 10 ? '0' + hours : '' + hours;
		var minutes = currentTime.getMinutes();
		minutes = minutes < 10 ? ':0' + minutes : ':' + minutes;
		var seconds = currentTime.getSeconds();
		seconds = seconds < 10 ? ':0' + seconds : ':' + seconds;
		
		return hours + minutes + seconds;
	};
	
	/*
	 * Test if the given priority level for a message is high enough to display
	 * when the console is set to LOG priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	var logTest = function(level) {
		return level === hemi.console.LOG ||
		       level === hemi.console.WARN ||
		       level === hemi.console.ERR;
	};
	
	/*
	 * Test if the given priority level for a message is high enough to display
	 * when the console is set to WARN priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	var warnTest = function(level) {
		return level === hemi.console.WARN ||
		       level === hemi.console.ERR;
	};
	
	/*
	 * Test if the given priority level for a message is high enough to display
	 * when the console is set to ERR priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	var errTest = function(level) {
		return level === hemi.console.ERR;
	};
	
	/*
	 * This function is aliased to the proper test function for the console's
	 * current priority level.
	 */
	var testPriority = logTest;
	
	/**
	 * Log the given message if the console is enabled or ignore the message if
	 * the console is disabled.
	 * 
	 * @param {string} msg the message to display
	 * @param {string} level the priority level of the message
	 */
	hemi.console.log = hemi.utils.noop;
	
	/**
	 * Enable or disable the console to receive log messages.
	 * 
	 * @param {boolean} en flag indicating if the console should be enabled
	 */
	hemi.console.setEnabled = function(en) {
		if (en == enabled) {
			return;
		}
		
		enabled = en;
		
		if (enabled) {
			hemi.console.log = logMessage;
		} else {
			hemi.console.log = hemi.utils.noop;
		}
	};
	
	/**
	 * Set the function that will be used to display log messages.
	 * 
	 * @param {function(string):void} outFunc
	 */
	hemi.console.setOutput = function(outFunc) {
		output = outFunc;
	};
	
	/**
	 * Set the current priority level of the console. Log messages at the given
	 * priority level or higher will be displayed. Log messages below the
	 * priority level will be ignored.
	 * 
	 * @param {string} priority the priority level to set the console to
	 */
	hemi.console.setPriority = function(priority) {
		switch (priority) {
			case hemi.console.LOG:
				testPriority = logTest;
				break;
			case hemi.console.WARN:
				testPriority = warnTest;
				break;
			case hemi.console.ERR:
				testPriority = errTest;
				break;
		}
	};
	
	/**
	 * Enable or disable timestamping for received log messages.
	 * 
	 * @param {boolean} show flag indicating if messages should be timestamped
	 */
	hemi.console.setShowTime = function(show) {
		showTime = show;
	};
	
	return hemi;
})(hemi || {});/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
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


/*
 * Because Internet Explorer does not support Array.indexOf(), we can add
 * it in so that subsequent calls do not break.
 *
 * @param {Object} obj
 */
if (!Array.indexOf) {
	Array.prototype.indexOf = function(obj) {
		for (var i = 0; i < this.length; i++) {
			if (this[i] == obj) {
				return i;
			}
		}
		return -1;
	};
}

/**
 * Create the requestAnimationFrame function if needed. Each browser implements
 * it as d different name currently. Default to a timeout if not supported.
 * Credit to http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * and others...
 */
if (!window.requestAnimationFrame) {
	window.requestAnimationFrame = (function() {
		return window.mozRequestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			function(callback, element) {
				window.setTimeout(callback, 1000 / 60);
			};
	})();
}

/**
 * @namespace The core Hemi library used by Kuda.
 * @version 1.5.0
 */
var hemi = (function(hemi) {
	
	var errCallback = null,
	
		fps = 60,
		
		hz = 1 / fps,
	
		/*
		 * The time of the last render in seconds.
		 * @type {number}
		 */
		lastRenderTime = 0,
	
		renderListeners = [],
		
		getRenderer = function(element) {
			var renderer = null;
			
			if (Detector.webgl) {
				renderer = new THREE.WebGLRenderer();
			} else {
				if (Detector.canvas) {
					renderer = new THREE.CanvasRenderer();
				}
				
				Detector.addGetWebGLMessage({
					id: 'warn_' + element.id,
					parent: element
				});
				
				(function(elem) {
					setTimeout(function() {
						var msg = document.getElementById('warn_' + elem.id);
						elem.removeChild(msg);
					}, 5000);
				})(element);
			}
			
			return renderer;
		},
		
		render = function(update) {
			requestAnimationFrame(render);
			
			var renderTime = new Date().getTime() * 0.001,
				event = {
					elapsedTime: hz
				};
			
			while (renderTime - lastRenderTime > hz) {
				update = true;
				lastRenderTime += hz;
				
				for (var i = 0; i < renderListeners.length; ++i) {
					renderListeners[i].onRender(event);
				}
			}
			
			if (update) {
				for (var i = 0; i < hemi.clients.length; ++i) {
					hemi.clients[i].onRender(event);
				}
			}
		},
		
		resize = function() {
			for (var i = 0; i < hemi.clients.length; ++i) {
				hemi.clients[i].resize();
			}
		};
	
	/**
	 * The version of Hemi released: 10/11/11
	 * @constant
	 */
	hemi.version = '1.5.0';
	hemi.console.setEnabled(true);
	
	/**
	 * The list of Clients being rendered on the current webpage.
	 */
	hemi.clients = [];
	
	/**
	 * Search the webpage for any divs with an ID starting with "kuda" and
	 * create a Client and canvas within each div that will be rendered to using
	 * WebGL.
	 */
	hemi.makeClients = function() {
		var elements = document.getElementsByTagName('div'),
			numClients = hemi.clients.length;
		
		for (var i = 0; i < elements.length; ++i) {
			var element = elements[i];
			
			if (element.id && element.id.match(/^kuda/)) {
				var renderer = getRenderer(element);
				
				if (renderer) {
					var client = i < numClients ? hemi.clients[i] : new hemi.Client();
					
					element.appendChild(renderer.domElement);
					client.setRenderer(renderer);
					hemi.hudManager.addClient(client);
				}
			}
		}
		
		hemi.init();
		return hemi.clients;
	};

	/**
	 * Initialize hemi features. This does not need to be called if
	 * hemi.makeClients() is called, but it can be used on its own if you don't
	 * want to use hemi's client system.
	 */
	hemi.init = function() {
		window.addEventListener('resize', resize, false);
		lastRenderTime = new Date().getTime() * 0.001;
		render(true);
	};
	
	/**
	 * Add the given render listener to hemi. A listener must implement the
	 * onRender function.
	 * 
	 * @param {Object} listener the render listener to add
	 */
	hemi.addRenderListener = function(listener) {
		var ndx = renderListeners.indexOf(listener);
		
		if (ndx === -1) {
			renderListeners.push(listener);
		}
	};

	/**
	 * Remove the given render listener from hemi.
	 * 
	 * @param {Object} listener the render listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.removeRenderListener = function(listener) {
		var ndx = renderListeners.indexOf(listener),
			retVal = null;
		
		if (ndx !== -1) {
			retVal = renderListeners.splice(ndx, 1)[0];
		}

		return retVal;
	};
	
	/**
	 * Pass the given error message to the registered error handler or throw an
	 * Error if no handler is registered.
	 * 
	 * @param {string} msg error message
	 */
	hemi.error = function(msg) {
		if (errCallback) {
			errCallback(msg);
		} else {
			var err = new Error(msg);
			err.name = 'HemiError';
			throw err;
		}
	};

	/**
	 * Get the time that the specified animation frame occurs at.
	 *
	 * @param {number} frame frame number to get the time for
	 * @return {number} time that the frame occurs at
	 */
	hemi.getTimeOfFrame = function(frame) {
		return frame * hz;
	};
	
	/**
	 * Set the given function as the error handler for Hemi errors.
	 * 
	 * @param {function(string):void} callback error handling function
	 */
	hemi.setErrorCallback = function(callback) {
		errCallback = callback;
	};
	
	/**
	 * Get the current frames-per-second that will be enforced for rendering.
	 * 
	 * @return {number} current frames-per-second
	 */
	hemi.getFPS = function() {
		return fps;
	};

	/**
	 * Set the current frames-per-second that will be enforced for rendering.
	 * 
	 * @param {number} newFps frames-per-second to enforce
	 */
	hemi.setFPS = function(newFps) {
		fps = newFps;
		hz = 1/fps;
	};

	// Useful constants to cache
	hemi.DEG_TO_RAD = Math.PI / 180;
	hemi.HALF_PI = Math.PI / 2;
	hemi.RAD_TO_DEG = 180 / Math.PI;
	
	return hemi;
})(hemi || {});
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

	var colladaLoader = new THREE.ColladaLoader(),
		resetCB = null,
		taskCount = 1,

		decrementTaskCount = function() {
			if (--taskCount === 0) {
				taskCount = 1;
				hemi.send(hemi.msg.ready, {});

				if (resetCB) {
					resetCB();
					resetCB = null;
				}
			}
		};

	/**
	 * The relative path from the referencing HTML file to the Kuda directory.
	 * @type string
	 * @default ''
	 */
	hemi.loadPath = '';

	/*
	 * Get the correct path for the given URL. If the URL is absolute, then leave it alone.
	 * Otherwise prepend it with the load path.
	 * 
	 * @param {string} url the url to update
	 * @return {string} the udpated url
	 */
	hemi.getLoadPath = function(url) {
		if (url.substr(0, 4) === 'http') {
			return url;
		} else {
			return hemi.loadPath + url;
		}
	};

	/**
	 * Load the COLLADA file at the given url and pass it to the given callback
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda directory
	 * @param {function(Object):void} callback a function to pass the loaded COLLADA data
	 */
	hemi.loadCollada = function(url, callback) {
		url = hemi.getLoadPath(url);
		++taskCount;

		colladaLoader.load(url, function (collada) {
			if (callback) {
				callback(collada);
			}

			decrementTaskCount();
		});
	};

	/**
	 * Load the image file at the given URL. If an error occurs, it is logged. Otherwise the given
	 * callback is executed and passed the loaded image.
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda directory
	 * @param {function(Image):void} callback a function to pass the loaded image
	 */
	hemi.loadImage = function(url, callback) {
		var img = new Image();
		++taskCount;

		img.onabort = function() {
			hemi.error('Aborted loading: ' + url);
			decrementTaskCount();
		};
		img.onerror = function() {
			hemi.error('Error loading: ' + url);
			decrementTaskCount();
		};
		img.onload = function() {
			callback(img);
			decrementTaskCount();
		};

		img.src = hemi.getLoadPath(url);
	};

	/**
	 * Load the Octane file at the given URL. If an error occurs, an alert is  thrown. Otherwise the
	 * loaded data is decoded into JSON and passed to the Octane module. If the Octane is for an
	 * object, it is created and passed to the given optional callback. If the Octane is for a
	 * World, the current World is cleaned up and the new World is created. The given optional
	 * callback is then executed after hemi.ready().
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda directory
	 * @param {function([Object]):void} opt_callback an optional function to either pass the Object
	 *     created or execute after the created World's ready function is called
	 */
	hemi.loadOctane = function(url, opt_callback) {
		url = hemi.getLoadPath(url);
		++taskCount;

		hemi.utils.get(url, function(data, status) {
			decrementTaskCount();

			if (data === null) {
				hemi.error(status);
			} else {
				if (typeof data === 'string') {
					data = JSON.parse(data);
				}

				var obj = hemi.fromOctane(data);

				if (!data.type) {
					hemi.makeClients();
					hemi.ready();
				}

				if (opt_callback) {
					opt_callback(obj);
				}
			}
		});
	};

	/**
	 * Load the texture at the given URL. If an error occurs, an alert is thrown. Otherwise the
	 * given callback is executed and passed the texture.
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda directory
	 * @param {function(THREE.Texture):void} callback a function to pass the loaded texture
	 */
	hemi.loadTexture = function(url, callback) {
		hemi.loadImage(url, function(image) {
			var texture = new THREE.Texture(image);
			texture.needsUpdate = true;
			callback(texture);
		});
	};

	/**
	 * Activate the World once all resources are loaded. This function should
	 * only be called after all scripting and setup is complete.
	 */
	hemi.ready = decrementTaskCount;

	/**
	 * Make sure all outstanding load tasks are completed and then reset the
	 * load task count.
	 *
	 * @param {function():void} opt_callback an optional function to call when
	 *     the load tasks have been reset
	 */
	hemi.resetLoadTasks = function(opt_callback) {
		resetCB = opt_callback;
		decrementTaskCount();
	};

	return hemi;
})(hemi || {});
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

	var createClass = function(clsCon, clsName) {
			var names = clsName.split('.'),
				il = names.length - 1,
				scope = window;

			for (var i = 0; i < il; ++i) {
				var name = names[i];

				if (!scope[name]) {
					scope[name] = {};
				}

				scope = scope[name];
			}

			scope[names[il]] = clsCon;
		},

		/*
		 * Get the Citizen's id.
		 * 
		 * @return {number} the id
		 */        
        _getId = function() {
			return this._worldId;
        },

		/*
		 * Set the Citizen's id.
		 * 
		 * @param {number} id the id to set
		 */
        _setId = function(id) {
			var oldId = this._worldId;
			this._worldId = id;

			if (oldId !== null) {
				hemi.world.citizens.remove(oldId);
				hemi.world.citizens.put(id, this);
			}
        },

		/*
		 * Send a Message with the given attributes from the Citizen to any
		 * registered MessageTargets.
		 * 
		 * @param {string} type type of Message
		 * @param {Object} data container for any and all information relevant
		 *        to the Message
		 */
		send = function(type, data) {
			hemi.dispatch.postMessage(this, type, data);
		},

		/*
		 * Register the given handler to receive Messages of the specified type
		 * from the Citizen. This creates a MessageTarget.
		 * 
		 * @param {string} type type of Message to handle
		 * @param {Object} handler either a function or an object
		 * @param {string} opt_func name of the function to call if handler is
		 *     an object
		 * @param {string[]} opt_args optional array of names of arguments to
		 *     pass to the handler. Otherwise the entire Message is just passed
		 *     in.
		 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
		 */
		subscribe = function(type, handler, opt_func, opt_args) {
			return hemi.dispatch.registerTarget(this._worldId, type, handler,
				opt_func, opt_args);
		},

		/*
		 * Register the given handler to receive Messages of all types from the
		 * Citizen. This creates a MessageTarget.
		 * 
		 * @param {Object} handler either a function or an object
		 * @param {string} opt_func name of the function to call if handler is
		 *     an object
		 * @param {string[]} opt_args optional array of names of arguments to
		 *     pass to the handler. Otherwise the entire Message is just passed
		 *     in.
		 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
		 */
		subscribeAll = function(handler, opt_func, opt_args) {
			return hemi.dispatch.registerTarget(this._worldId, hemi.dispatch.WILDCARD,
				handler, opt_func, opt_args);
		},

		/*
		 * Remove the given MessageTarget for Messages of the specified type for
		 * the Citizen.
		 * 
		 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to
		 *     remove from the Dispatch
		 * @param {string} opt_type Message type the MessageTarget was
		 *     registered for
		 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or
		 *     null
		 */
		unsubscribe = function(target, opt_type) {
			return hemi.dispatch.removeTarget(target, {
				src: this._worldId,
				msg: opt_type
			});
		},

		/*
		 * Storage for the base classes that new Citizen classes were created from.
		 */
		baseClasses = {};

	/**
	 * Get the base class that the specified Citizen class was created from.
	 * This can be useful if you want to extend functionality and create a new
	 * Citizen class yourself.
	 * 
	 * @param {string} clsName name of the Citizen class
	 * @return {function} the base class constructor or undefined
	 */
	hemi.getBaseClass = function(clsName) {
		return baseClasses[clsName];
	};

	/**
	 * Take the given base class constructor and create a new class from it that
	 * has all of the required functionality of a Citizen.
	 *  
	 * @param {function} clsCon constructor function for the base class
	 * @param {string} clsName name for the new Citizen class
	 * @param {Object} opts options including:
	 *     cleanup - function to execute for cleanup
	 *     msgs - array of messages Citizen may send
	 *     toOctane - array of properties for octaning or function to execute
	 * @return {function} the constructor for the new Citizen class
	 */
	hemi.makeCitizen = function(clsCon, clsName, opts) {
		opts = opts || {};
		var cleanFunc = opts.cleanup,
			msgs = opts.msgs || [];

		baseClasses[clsName] = clsCon;
		msgs.push(hemi.msg.cleanup);

		/*
		 * A Citizen is a uniquely identifiable member of a World that is
		 * able to send Messages through the World's dispatch. The Citizen's id is
		 * all that is necessary to retrieve the Citizen from its World, regardless
		 * of its type.
		 */
        function Citizen() {
			clsCon.apply(this, arguments);

            /*
			 * The name of the Citizen.
			 * @type string
			 * @default ''
			 */
            this.name = this.name || '';
			/* The unique identifier for any Citizen of the World */
			this._worldId = null;
			hemi.world.addCitizen(this);
        }

        // Populate our constructed prototype object
        Citizen.prototype = clsCon.prototype;

		/*
		 * Array of Hemi Messages that the Citizen is known to send.
		 * @type string[]
		 */
        Citizen.prototype._msgSent = msgs;

        /*
		 * Send a cleanup Message and remove the Citizen from the World.
		 * Base classes should extend this so that it removes all references to
		 * the Citizen.
		 */
        Citizen.prototype.cleanup = function() {
			this.send(hemi.msg.cleanup, {});

			if (cleanFunc) {
				cleanFunc.apply(this, arguments);
			}

			hemi.dispatch.removeSpecs({
				src: this._worldId
			}, true);
			hemi.dispatch.removeTargets({
				handler: this
			}, true);
			hemi.world.removeCitizen(this);
		};

        Citizen.prototype._getId = _getId;
        Citizen.prototype._setId = _setId;
        Citizen.prototype.send = send;
        Citizen.prototype.subscribe = subscribe;
        Citizen.prototype.subscribeAll = subscribeAll;
        Citizen.prototype.unsubscribe = unsubscribe;

        // Enforce the constructor to be what we expect
        Citizen.constructor = Citizen;

        hemi.makeOctanable(Citizen, clsName, opts.toOctane);
        createClass(Citizen, clsName);

        return Citizen;
	};

	/**
	 * @namespace A module for managing all elements of a 3D world. The World
	 * manages a set of Citizens and provides look up services for them.
	 */
	hemi.world = hemi.world || {};

	hemi.world.WORLD_ID = 0;

	/* The next id to assign to a Citizen requesting a world id */
	var nextId = 1;

	/* All of the Citizens of the World */
	hemi.world.citizens = new hemi.utils.Hashtable();

	/**
	 * Set the id for the World to assign to the next Citizen.
	 * 
	 * @param {number} id the next id to assign
	 */
	hemi.world.setNextId = function(id) {
		nextId = id;
	};

	/**
	 * Get the next id to assign and increment the World's nextId token.
	 * 
	 * @return {number} the next id ready to assign to a Citizen
	 */
	hemi.world.getNextId = function() {
		return nextId++;
	};

	/**
	 * Check to see what the next id to assign will be without incrementing the
	 * World's nextId token.
	 * 
	 * @return {number} the next id that will be assigned to a Citizen
	 */
	hemi.world.checkNextId = function() {
		return nextId;
	};

	/**
	 * Get the id for the World.
	 * 
	 * @return {number} the id of the World
	 */
	hemi.world._getId = function() {
		return hemi.world.WORLD_ID;
	};

	/**
	 * Add the given Citizen to the World and give it a world id if it does not
	 * already have one.
	 * 
	 * @param {hemi.world.Citizen} citizen the Citizen to add
	 */
	hemi.world.addCitizen = function(citizen) {
		var id = citizen._getId();

		if (id == null) {
			id = this.getNextId();
			citizen._setId(id);
		}

		var toRemove = this.citizens.get(id);

		if (toRemove !== null) {
			hemi.console.log('Citizen with id ' + id + ' already exists.', hemi.console.ERR);
			toRemove.cleanup();
		}

		this.citizens.put(id, citizen);
	};

	/**
	 * Perform cleanup on the World and release all resources. This effectively
	 * resets the World.
	 */
	hemi.world.cleanup = function() {
		hemi.resetLoadTasks();
		hemi.send(hemi.msg.cleanup, {});

		hemi.world.citizens.each(function(key, value) {
			value.cleanup();
		});

		if (hemi.world.citizens.size() > 0) {
			hemi.console.log('World cleanup did not remove all citizens.', hemi.console.ERR);
		}

		nextId = 1;
	};

	/**
	 * Remove the given Citizen from the World.
	 * 
	 * @param {hemi.world.Citizen} citizen the Citizen to remove
	 * @return {boolean} true if the Citizen was found and removed
	 */
	hemi.world.removeCitizen = function(citizen) {
		var id = citizen._getId();
		var removed = this.citizens.remove(id);

		if (removed === null) {
			hemi.console.log('Unable to remove Citizen with id ' + id, hemi.console.WARN);
		}

		return removed !== null;
	};
	
	/**
	 * Get any Citizens with the given attributes. If no attributes are given,
	 * all Citizens will be returned. Valid attributes are:
	 * - name
	 * - citizenType
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Citizen): boolean} opt_filter optional filter function
	 *     that takes a Citizen and returns true if the Citizen should be
	 *     included in the returned array
	 * @return {hemi.world.Citizen[]} an array of Citizens with matching
	 *     attributes
	 */
	hemi.world.getCitizens = function(attributes, opt_filter) {
		var atts = {};

		if (attributes != undefined) {
			if (attributes.worldId !== undefined) {
				atts.worldId = attributes.worldId;
			}
			if (attributes.name !== undefined) {
				atts.name = attributes.name;
			}
			if (attributes.citizenType !== undefined) {
				atts.citizenType = attributes.citizenType;
			}
		}

		var matches = this.citizens.query(atts);

		if (opt_filter) {
			for (var ndx = 0, len = matches.length; ndx < len; ndx++) {
				if (!opt_filter(matches[ndx])) {
					matches.splice(ndx, 1);
					ndx--;
					len--;
				}
			}
		}

		return matches;
	};

	/**
	 * Get the Citizen with the given id and log an error if exactly one result
	 * is not returned.
	 * 
	 * @param {number} id world id of the Citizen to get
	 * @return {hemi.world.Citizen} the found Citizen or null
	 */
	hemi.world.getCitizenById = function(id) {
		var cit = this.citizens.get(id);

		if (cit === null) {
			hemi.console.log('Tried to get Citizen with id ' + id + ', returned null.', hemi.console.ERR);
		}

		return cit;
	};

	/**
	 * Get any Audio with the given attributes. If no attributes are given, all
	 * Audio will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Audio): boolean} opt_filter optional filter function
	 *     that takes an Audio and returns true if the Audio should be included
	 *     in the returned array
	 * @return {hemi.audio.Audio[]} an array of Audio with matching attributes
	 */
	hemi.world.getAudio = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.audio.Audio.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any CameraCurves with the given attributes. If no attributes are
	 * given, all CameraCurves will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(CameraCurve): boolean} opt_filter optional filter
	 *     function that takes a CameraCurve and returns true if the CameraCurve
	 *     should be included in the returned array
	 * @return {hemi.view.CameraCurve[]} an array of CameraCurves with matching
	 *     attributes
	 */
	hemi.world.getCamCurves = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.view.CameraCurve.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any HudDisplays with the given attributes. If no attributes are
	 * given, all HudDisplays will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(HudDisplay): boolean} opt_filter optional filter
	 *     function that takes a HudDisplay and returns true if the HudDisplay
	 *     should be included in the returned array
	 * @return {hemi.hud.HudDisplay[]} an array of HudDisplays with matching
	 *     attributes
	 */
	hemi.world.getHudDisplays = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.hud.HudDisplay.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any HudElements with the given attributes. If no attributes are
	 * given, all HudElements will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(HudElement): boolean} opt_filter optional filter
	 *     function that takes a HudElement and returns true if the HudElement
	 *     should be included in the returned array
	 * @return {hemi.hud.HudElement[]} an array of HudElements with matching
	 *     attributes
	 */
	hemi.world.getHudElements = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.hud.HudElement.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Models with the given attributes. If no attributes are given, all
	 * Models will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Model): boolean} opt_filter optional filter function
	 *     that takes a Model and returns true if the Model should be included
	 *     in the returned array
	 * @return {hemi.model.Model[]} an array of Models with matching attributes
	 */
	hemi.world.getModels = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.model.Model.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Animations with the given attributes. If no attributes are given,
	 * all Animations will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Animation): boolean} opt_filter optional filter function
	 *     that takes a Animation and returns true if the Animation should be
	 *     included in the returned array
	 * @return {hemi.animation.Animation[]} an array of Animations with matching
	 *     attributes
	 */
    hemi.world.getAnimations = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.animation.Animation.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Effects with the given attributes. If no attributes are given,
	 * all Effects will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Effect): boolean} opt_filter optional filter function
	 *     that takes a Effect and returns true if the Effect should be
	 *     included in the returned array
	 * @return {hemi.effect.Effect[]} an array of Effect with matching
	 *     attributes
	 */
    hemi.world.getEffects = function(attributes, opt_filter) {
		var retVal = [];

		attributes = attributes || {};
		attributes.citizenType = hemi.effect.Emitter.prototype.citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));

		attributes.citizenType = hemi.effect.Burst.prototype.citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));

		attributes.citizenType = hemi.effect.Trail.prototype.citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));

		return retVal; 
	};

	/**
	 * Get any Viewpoints with the given attributes. If no attributes are given,
	 * all Viewpoints will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Viewpoint): boolean} opt_filter optional filter function
	 *     that takes a Viewpoint and returns true if the Viewpoint should be
	 *     included in the returned array
	 * @return {hemi.view.Viewpoint[]} an array of Viewpoints with matching
	 *     attributes
	 */
	hemi.world.getViewpoints = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.view.Viewpoint.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any PressureEngines with the given attributes. If no attributes are
	 * given, all PressureEngines will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(PressureEngine): boolean} opt_filter optional filter
	 *     function that takes a PressureEngine and returns true if the
	 *     PressureEngine should be included in the returned array
	 * @return {hext.engines.PressureEngine[]} an array of PressureEngines with
	 *     matching attributes
	 */
	hemi.world.getPressureEngines = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hext.engines.PressureEngine.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Draggables with the given attributes. If no attributes are given,
	 * all Draggables will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Draggable): boolean} opt_filter optional filter function
	 *     that takes a Draggable and returns true if the Draggable should be
	 *     included in the returned array
	 * @return {hemi.manip.Draggable[]} an array of Draggables with matching
	 *     attributes
	 */
	hemi.world.getDraggables = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.manip.Draggable.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Turnables with the given attributes. If no attributes are given,
	 * all Turnables will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Turnable): boolean} opt_filter optional filter function
	 *     that takes a Turnable and returns true if the Turnable should be
	 *     included in the returned array
	 * @return {hemi.manip.Turnable[]} an array of Turnables with matching
	 *     attributes
	 */
	hemi.world.getTurnables = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.manip.Turnable.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Rotators with the given attributes. If no attributes are given,
	 * all Rotators will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Rotator): boolean} opt_filter optional filter function
	 *     that takes a Rotator and returns true if the Rotator should be
	 *     included in the returned array
	 * @return {hemi.motion.Rotator[]} an array of Rotators with matching
	 *     attributes
	 */
	hemi.world.getRotators = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.motion.Rotator.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Scenes with the given attributes. If no attributes are given, all
	 * Scenes will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Scene): boolean} opt_filter optional filter function
	 *     that takes a Scene and returns true if the Scene should be included
	 *     in the returned array
	 * @return {hemi.scene.Scene[]} an array of Scenes with matching attributes
	 */
	hemi.world.getScenes = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.scene.Scene.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Timers with the given attributes. If no attributes are given, all
	 * Timers will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Timer): boolean} opt_filter optional filter function
	 *     that takes a Timer and returns true if the Timer should be included
	 *     in the returned array
	 * @return {hemi.time.Timer[]} an array of Timers with matching attributes
	 */
	hemi.world.getTimers = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.time.Timer.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Translators with the given attributes. If no attributes are
	 * given, all Translators will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Translator): boolean} opt_filter optional filter
	 *     function that takes a Translator and returns true if the Translator
	 *     should be included in the returned array
	 * @return {hemi.motion.Translator[]} an array of Translators with matching
	 *     attributes
	 */
	hemi.world.getTranslators = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.motion.Translator.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Shapes with the given attributes. If no attributes are given, all
	 * Shapes will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Shape): boolean} opt_filter optional filter function
	 *     that takes a Shape and returns true if the Shape should be included
	 *     in the returned array
	 * @return {hemi.shape.Shape[]} an array of Shapes with matching attributes
	 */
	hemi.world.getShapes = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.shape.Shape.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get the owning Citizen that the given transform is a part of.
	 * 
	 * @param {o3d.Transform} transform the transform to get the owner for
	 * @return {hemi.world.Citizen} the containing Citizen or null
	 */
	hemi.world.getTranOwner = function(transform) {
		var param = transform.getParam('ownerId'),
			owner = null;

		if (param !== null) {
			owner = this.getCitizenById(param.value);
		}

		return owner;
	};

	/**
	 * Get the Octane structure for the World.
     * 
	 * @param {function(Citizen): boolean} opt_filter optional filter function
	 *     that takes a Citizen and returns true if the Citizen should be
	 *     included in the returned Octane
     * @return {Object} the Octane structure representing the World
	 */
	hemi.world.toOctane = function(opt_filter) {
		var octane = {
			version: hemi.version,
			nextId: nextId,
			citizens: []
		};

		this.citizens.each(function(key, value) {
			var accept = opt_filter ? opt_filter(value) : true;

			if (accept) {
				var oct = value._toOctane();

				if (oct !== null) {
					octane.citizens.push(oct);
				} else {
					hemi.console.log('Null Octane returned by Citizen with id ' + value._getId(), hemi.console.WARN);
				}
			}
		});

		octane.dispatch = hemi.dispatch._toOctane();

		return octane;
	};

	return hemi;
})(hemi || {});
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
	
		/**
		 * Create an object from the given Octane structure and set its id. No other
		 * properties will be set yet.
		 * 
		 * @param {Object} octane the structure containing information for creating
		 *     an object
		 * @return {Object} the newly created object
		 */
	var createObject = function(octane) {
			if (!octane.type) {
				alert("Unable to process octane: missing type");
				return null;
			}
			
			var con = constructors[octane.type],
				object = null;

			if (con) {
				object = new con();

				if (octane.id !== undefined) {
					object._setId(octane.id);
				}
			} else {
				hemi.console.log('Cannot find constructor for type: ' + octane.type, hemi.console.ERR);
			}
			
			return object;
		},
	
		parseProps = function(obj, propNames) {
			var oct = [];
			
			for (var i = 0; i < propNames.length; ++i) {
				var name = propNames[i],
					prop = obj[name],
					entry = {
						name: name	
					};

				if (hemi.utils.isFunction(prop)) {
					entry.arg = [];
				} else if (hemi.utils.isArray(prop)) {
					if (prop.length > 0) {
						var p = prop[0];

						if (p._getId && p._worldId) {
							entry.id = [];

							for (var j = 0; j < prop.length; ++j) {
								entry.id[j] = prop[j]._getId();
							}
						} else if (prop._toOctane) {
							entry.oct = [];

							for (var j = 0; j < prop.length; ++j) {
								entry.oct[j] = prop[j]._toOctane();
							}
						} else {
							entry.val = prop;
						}
					} else {
						entry.val = prop;
					}
				} else if (prop._getId && prop._worldId) {
					entry.id = prop._getId();
				} else if (prop._toOctane) {
					entry.oct = prop._toOctane();
				} else {
					entry.val = prop;
				}
				
				oct.push(entry);
			}
			
			return oct;
		},

		/*
		 * Iterate through the given Octane structure and set properties for the
		 * given object. Properties stored by value will be set directly, by Octane
		 * will be recursively created, by id will be retrieved from the World, and
		 * by arg will be set by calling the specified function on the object.
		 * 
		 * @param {Object} object the object created from the given Octane
		 * @param {Object} octane the structure containing information about the
		 *     given object
		 */
		setProperties = function(object, octane) {
			for (var ndx = 0, len = octane.props.length; ndx < len; ndx++) {
				var property = octane.props[ndx];
				var name = property.name;
				
				if (property.oct !== undefined) {
					if (property.oct instanceof Array) {
						value = [];
						
						for (var p = 0, pLen = property.oct.length; p < pLen; p++) {
							var child = createObject(property.oct[p]);
							setProperties(child, property.oct[p]);
							value.push(child);
						}
					} else {
						value = createObject(property.oct);
						setProperties(value, property.oct);
					}
					
					object[name] = value;
				} else if (property.val !== undefined) {
					object[name] = property.val;
				} else if (property.id !== undefined) {
					var value;
					
					if (property.id instanceof Array) {
						value = [];
						
						for (var p = 0, pLen = property.id.length; p < pLen; p++) {
							value.push(hemi.world.getCitizenById(property.id[p]));
						}
					} else {
						value = hemi.world.getCitizenById(property.id);
					}
					
					object[name] = value;
				} else if (property.arg !== undefined) {
					var func = object[name],
						args = hemi.dispatch.getArguments(null, property.arg);

					func.apply(object, args);
				} else {
					alert('Unable to process octane for ' + octane.id + ': missing property value');
				}
			}
		},

		constructors = {};
	
	/**
	 * Restore the original object from the given Octane.
	 * 
	 * @param {Object} octane the structure containing information for creating
	 *     the original object
	 * @return {Object} the created object
	 */
	hemi.fromOctane = function(octane) {
		var created = null;

		if (octane.type) {
			created = createObject(octane);
			setProperties(created, octane);
		} else {
			hemi.world.cleanup();
			var citizenCount = octane.citizens.length;
			// Set the nextId value to a negative number so that we don't have to
			// worry about overlapping world ids between the constructed Citizens
			// and their actual ids that are restored from Octane.
			var fakeId = citizenCount * -2;
			hemi.world.setNextId(fakeId);
			
			// Do the bare minimum: create Citizens and set their ids
			for (var ndx = 0; ndx < citizenCount; ndx++) {
				var citOctane = octane.citizens[ndx];
				createObject(citOctane);
			}
			
			// Now set the World nextId to its proper value.
			hemi.world.setNextId(octane.nextId);
			
			// Next set up the message dispatch
			var entryOctane = octane.dispatch.ents,
				entries = [];
			
			for (var ndx = 0, len = entryOctane.length; ndx < len; ndx++) {
				var entry = createObject(entryOctane[ndx]);
				setProperties(entry, entryOctane[ndx]);
				entries.push(entry);
			}
			
			hemi.dispatch.loadEntries(entries);
			hemi.dispatch.setNextId(octane.dispatch.nextId);
			
			// Now set Citizen properties and resolve references to other Citizens
			for (var ndx = 0; ndx < citizenCount; ndx++) {
				var citOctane = octane.citizens[ndx];
				setProperties(hemi.world.getCitizenById(citOctane.id), citOctane);
			}
		}

		return created;
	};
	
	hemi.makeOctanable = function(clsCon, clsName, octProps) {
		octProps = octProps || [];
		
		constructors[clsName] = clsCon;
		
		/*
         * Essentially a class name.
         * @type string
         */
		clsCon.prototype._citizenType = clsName;
		
		/*
	     * Get the Octane structure for the class. The structure returned is:
	     * <pre>
	     * {
	     *     id: the Citizen's world id (optional)
	     *     type: the class name
	     *     props: the class properties (name and id/value) 
	     * }
	     * </pre>
	     *
	     * @return {Object} the Octane structure representing the class
	     */
		clsCon.prototype._toOctane = function() {
			var props = hemi.utils.isFunction(octProps) ? octProps.call(this) : parseProps(this, octProps),
				octane = null;

			if (props !== null) {
				octane = {
					type: this._citizenType,
					props: props
				};

				if (this._worldId != null) {
					octane.id = this._worldId;
				}

				if (this.name && this.name.length > 0 && !octane.props.name) {
					octane.props.unshift({
						name: 'name',
						val: this.name
					});
				}
			}

			return octane;
		};
	};

	return hemi;
})(hemi || {});
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Audio class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class An Audio contains an audio DOM element that can be played, paused, etc.
	 */
	var Audio = function() {
		/**
		 * Flag indicating if a seek operation is currently happening.
		 * @type boolean
		 * @default false
		 */
		this._seeking = false;

		/**
		 * Flag indicating if the Audio should start playing when the current seek operation
		 * finishes.
		 * @type boolean
		 * @default false
		 */
		this._startPlay = false;

		/**
		 * Array of objects containing source URLs, types, and DOM elements.
		 */
		this._urls = [];

		/**
		 * The actual audio DOM element.
		 * @type Object
		 */
		this.audio = document.createElement('audio');

		/**
		 * Flag indicating if the Audio should loop when it ends.
		 * @type boolean
		 * @default false
		 */
		this.looping = false;

		var that = this;

		// For now, onevent functions (like onemptied) are not supported for media elements in
		// Webkit browsers.
		this.audio.addEventListener('emptied', function(e) {
				that.send(hemi.msg.unload, { });
			}, true);
		this.audio.addEventListener('loadeddata', function(e) {
	//				that.setLoop_();	*see below*
				that.send(hemi.msg.load, {
					src: that.audio.currentSrc
				});
			}, true);
		this.audio.addEventListener('playing', function(e) {
				that.send(hemi.msg.start, { });
			}, true);
		this.audio.addEventListener('ended', function(e) {
				if (that.looping) {
					that.play();
				}

				that.send(hemi.msg.stop, { });
			}, true);
	};

	/*
	 * Remove all references in the Audio.
	 */
	Audio.prototype._clean = function() {
		this.audio = null;
		this._urls = [];
	};

	/*
	 * Array of Hemi Messages that Audio is known to send.
	 * @type string[]
	 */
	Audio.prototype._msgSent = [hemi.msg.load, hemi.msg.start, hemi.msg.stop, hemi.msg.unload];

	/*
	 * Octane properties for Audio.
	 * @type string[]
	 */
	Audio.prototype._octane = function() {
		var props = [{
			name: 'looping',
			val: this.looping
		}];

		for (var i = 0, il = this._urls.length; i < il; ++i) {
			var urlObj = this._urls[i];

			octane.props.push({
				name: 'addUrl',
				arg: [urlObj.url, urlObj.type]
			});
		}

		return octane;
	};

	/**
	 * Add the given URL as a source for the audio file to load.
	 * 
	 * @param {string} url the URL of the audio file
	 * @param {string} type the type of the audio file (ogg, mpeg, etc)
	 */
	Audio.prototype.addUrl =  function(url, type) {
		var src = document.createElement('source'),
			loadUrl = hemi.getLoadPath(url);

		src.setAttribute('src', loadUrl);
		src.setAttribute('type', 'audio/' + type);
		this.audio.appendChild(src);
		this._urls.push({
			url: url,
			type: type,
			node: src
		});
	};

	/**
	 * Get the length of the current audio media.
	 * 
	 * @return {number} length of media in seconds
	 */
	Audio.prototype.getDuration = function() {
		return this.audio ? this.audio.duration : null;
	};

	/**
	 * Get the current volume of the audio media. Volume ranges from 0.0 to  1.0.
	 * 
	 * @return {number} the current volume
	 */
	Audio.prototype.getVolume = function() {
		return this.audio ? this.audio.volume : null;
	};

	/**
	 * Pause the audio media if it is currently playing.
	 */
	Audio.prototype.pause = function() {
		if (this.audio && !this.audio.paused) {
			this.audio.pause();
			this._startPlay = false;
		}
	};

	/**
	 * Play the audio media if it is not already doing so. If the media is in the middle of a seek
	 * operation, the Audio will wait until it finishes before playing.
	 */
	Audio.prototype.play = function() {
		if (this.audio) {
			if (this._seeking) {
				this._startPlay = true;
			} else if (this.audio.paused || this.audio.ended) {
				this.audio.play();
			}
		}
	};

	/**
	 * Remove the given URL as a source for the audio file to load.
	 * 
	 * @param {string} url the URL to remove
	 */
	Audio.prototype.removeUrl = function(url) {
		for (var i = 0, il = this._urls.length; i < il; ++i) {
			var urlObj = this._urls[i];

			if (urlObj.url === url) {
				this.audio.removeChild(urlObj.node);
				this._urls.splice(i, 1);

				if (urlObj.node.src === this.audio.currentSrc) {
					this.audio.load();
				}

				break;
			}
		}
	};

	/**
	 * Set the audio media's current time to the given time. If the media is currently playing,
	 * it will pause until the seek operation finishes.
	 * 
	 * @param {number} time the time to seek to in seconds
	 */
	Audio.prototype.seek = function(time) {
		if (this.audio && time >= 0 && time < this.audio.duration) {
			var that = this,
				notify = function() {
					that.audio.removeEventListener('seeked', notify, true);
					that._seeking = false;

					if (that._startPlay) {
						that._startPlay = false;
						that.play();
					}
				};

			this.audio.addEventListener('seeked', notify, true);
			this._seeking = true;
			this._startPlay = !this.audio.paused;
			this.audio.currentTime = time;
		}
	};

	/**
	 * Set if the audio media should loop when it ends.
	 * 
	 * @param {boolean} looping flag to indicate if the media should loop
	 */
	Audio.prototype.setLoop = function(looping) {
		if (this.looping !== looping) {
			this.looping = looping;

			if (this.audio) {
//					this.setLoop_();	*see below*
			}
		}
	};

	/**
	 * Set the volume of the audio media. Volume ranges from 0.0 to 1.0.
	 * 
	 * @param {number} volume the volume to set
	 */
	Audio.prototype.setVolume = function(volume) {
		if (this.audio) {
			this.audio.volume = volume;
		}
	};

// Private functions for Audio

	/*
	 * This is the proper way to set looping for HTML5 audio tags. Unfortunately Firefox doesn't
	 * currently support this feature, so we have to hack it in the ended event.
	 */
	var setLoopProper = function() {
			if (this.looping) {
				this.audio.setAttribute('loop', 'loop');
			} else {
				this.audio.removeAttribute('loop');
			}
		};

	hemi.makeCitizen(Audio, 'hemi.Audio', {
		cleanup: Audio.prototype._clean,
		toOctane: Audio.prototype._octane
	});

	return hemi;
})(hemi || {});
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
	/**
	 * @namespace A module for message dispatching and handling. The Dispatch
	 * receives Messages and sends them to MessageTargets that are registered
	 * with MessageSpecs.
	 */
	hemi.dispatch = hemi.dispatch || {};
	
	/* The next id to assign to a MessageTarget */
	var nextId = 0;
	
	/**
	 * String literal to indicate that all entries for a field are desired.
	 * @constant
	 */
	hemi.dispatch.WILDCARD = '*';
	
	/** 
	  * First part of an argument string indicating it is an id for the actual
	  * argument desired.
	  * @constant
	  * @example
	  * 'id:12' will execute: hemi.world.getCitizenById(12);
	  */ 
	hemi.dispatch.ID_ARG = 'id:';
	
	/** 
	  * First part of an argument string indicating it should be used to parse
	  * the actual message structure passed to the handler.
	  * @constant
	  * @example
	  * 'msg:data.shape.name' will parse: message.data.shape.name
	  */ 
	hemi.dispatch.MSG_ARG = 'msg:';
	
	/**
	 * @class A Message is sent whenever an event occurs.
	 */
	hemi.dispatch.Message = function() {
		/**
		 * The Message originator.
		 * @type hemi.world.Citizen
		 */
		this.src = null;
		
		/**
		 * The type of the Message.
		 * @type string
		 */
		this.msg = null;
		
		/**
		 * Container for any and all Message data.
		 * @type Object
		 */
		this.data = {};
	};
	
	/**
	 * @class A MessageSpec specifies a certain Message type and source and
	 * contains a set of MessageTargets that have registered to receive Messages
	 * with matching specs.
	 */
	hemi.dispatch.MessageSpec = function() {
		/**
		 * The id of the Message originator to handle Messages from. This can
		 * also be hemi.dispatch.WILDCARD to match all source ids.
		 * @type number
		 */
		this.src = null;
		
		/**
		 * The type of Message to handle. This can also be
		 * hemi.dispatch.WILDCARD to match all Message types.
		 * @type string
		 */
		this.msg = null;
		
		/**
		 * The MessageTargets to pass Messages with matching source ids and
		 * types.
		 * @type hemi.dispatch.MessageTarget[]
		 */
		this.targets = [];
	};
	
	hemi.dispatch.MessageSpec.prototype = {
		/**
		 * Clean up the MessageSpec so all references in it are removed.
		 */
		cleanup: function() {
			for (var ndx = 0, len = this.targets.length; ndx < len; ndx++) {
				this.targets[ndx].cleanup();
			}
			
			this.targets = [];
		},
		
		/**
		 * Register the given MessageTarget with the MessageSpec.
		 * 
		 * @param {hemi.dispatch.MessageTarget} target the target to add
		 */
		addTarget: function(target) {
			if (this.targets.indexOf(target) != -1) {
				hemi.console.log('MessageSpec already contains MessageTarget', hemi.console.WARN);
			}
			
			this.targets.push(target);
		},
		
		/**
		 * Remove the given MessageTarget from the MessageSpec.
		 * 
		 * @param {hemi.dispatch.MessageTarget} target the target to remove
		 * @return {hemi.dispatch.MessageTarget} the removed target or null
		 */
		removeTarget: function(target) {
			var found = null,
				ndx = this.targets.indexOf(target);
			
			if (ndx != -1) {
				var spliced = this.targets.splice(ndx, 1);
				
				if (spliced.length === 1) {
					found = spliced[0];
				}
			} else {
				hemi.console.log('MessageTarget not found in MessageSpec', hemi.console.WARN);
			}
	        
	        return found;
		},
		
		/**
		 * Get the unique hash key for the MessageSpec.
		 * 
		 * @return {string} the hash key
		 */
		getHash: function() {
			return this.msg + this.src;
		}
	};

	hemi.makeOctanable(hemi.dispatch.MessageSpec, 'hemi.dispatch.MessageSpec',
		function() {
			var targetsOct = [];
			
			for (var ndx = 0, len = this.targets.length; ndx < len; ndx++) {
				var oct = this.targets[ndx]._toOctane();
				
				if (oct !== null) {
					targetsOct.push(oct);
				} else {
					hemi.console.log('Null Octane returned by MessageTarget', hemi.console.WARN);
				}
			}
			
			return [
				{
					name: 'src',
					val: this.src
				},{
					name: 'msg',
					val: this.msg
				},{
					name: 'targets',
					oct: targetsOct
				}
			];
		});
	
	/**
	 * @class A MessageTarget registers with a MessageSpec to receive Messages
	 * that match its attributes.
	 * @example
	 * A MessageTarget with the following values:
	 * handler = myObj;
	 * func = 'myFunction';
	 * args = ['msg:src', 12];
	 * 
	 * will execute:
	 * myObj.myFunction(message.src, 12);
	 */
	hemi.dispatch.MessageTarget = function() {
		/**
		 * The id of the MessageTarget.
		 * @type number
		 */
		this._dispatchId = null;
		
		/**
		 * The name of the MessageTarget.
		 * @type string
		 * @default ''
		 */
		this.name = '';
		
		/**
		 * The handler for Messages passed through a MessageSpec. It may be an
		 * object or function.
		 * @type Object || function
		 */
		this.handler = null;
		
		/**
		 * The name of the object function to call if handler is an object.
		 * @type string
		 */
		this.func = null;
		
		/**
		 * Optional array to specify arguments to pass to the handler. Otherwise
		 * just pass it the Message.
		 * @type string[]
		 */
		this.args = null;
	};
	
	hemi.dispatch.MessageTarget.prototype = {
		/**
		 * Clean up the MessageTarget so all references in it are removed.
		 */
		cleanup: function() {
			this.handler = null;
		}
	};

	hemi.makeOctanable(hemi.dispatch.MessageTarget, 'hemi.dispatch.MessageTarget',
		function() {
			if (!this.handler._getId) {
				hemi.console.log('Handler object in MessageTarget can not be saved to Octane', hemi.console.WARN);
				return null;
			}
			
			var names = ['_dispatchId', 'name', 'func', 'args'],
				oct = [
					{
						name: 'handler',
						id: this.handler._getId()
					}
				];
			
			for (var ndx = 0, len = names.length; ndx < len; ndx++) {
				var name = names[ndx];
				
				oct.push({
					name: name,
					val: this[name]
				});
			}
			
			return oct;
		});
	
	/* All of the MessageSpecs (and MessageTargets) in the Dispatch */
	hemi.dispatch.msgSpecs = new hemi.utils.Hashtable();
	
	/**
	 * Set the id for the Dispatch to assign to the next MessageTarget.
	 * 
	 * @param {number} id the next id to assign
	 */
	hemi.dispatch.setNextId = function(id) {
		nextId = id;
	};
	
	/**
	 * Get the next id to assign and increment the Dispatch's nextId token.
	 * 
	 * @return {number} the next id ready to assign to a MessageTarget
	 */
	hemi.dispatch.getNextId = function() {
		return nextId++;
	};
	
	/**
	 * Check to see what the next id to assign will be without incrementing the
	 * Dispatch's nextId token.
	 * 
	 * @return {number} the next id that will be assigned to a MessageTarget
	 */
	hemi.dispatch.checkNextId = function() {
		return nextId;
	};
	
    /**
	 * Load the given MessageSpec entries into the MessageSpec database.
	 * 
	 * @param {hemi.dispatch.MessageSpec[]} entries MessageSpecs to load into
	 *     the Dispatch
	 */
	hemi.dispatch.loadEntries = function(entries) {
		for (var ndx = 0, len = entries.length; ndx < len; ndx++) {
			var entry = entries[ndx];
			this.msgSpecs.put(entry.getHash(), entry);
		}
	};
	
	/**
	 * Empty the MessageSpec database of all entries.
	 */
	hemi.dispatch.cleanup = function() {
		this.msgSpecs.each(function(key, value) {
			value.cleanup();
		});
		
		this.msgSpecs.clear();
	};
	
	/**
	 * Get the Octane structure for the Dispatch.
     *
     * @return {Object} the Octane structure representing the MessageDispatcher
	 */
	hemi.dispatch._toOctane = function() {
		var octane = {
			nextId: nextId,
			ents: []
		};
		
		this.msgSpecs.each(function(key, value) {
			var oct = value._toOctane();
			
			if (oct !== null) {
				octane.ents.push(oct);
			} else {
				hemi.console.log('Null Octane returned by MessageSpec', hemi.console.ERR);
			}
		});
		
		return octane;
	};
	
	/**
	 * Get any MessageSpecs with the given attributes. If no attributes are
	 * given, all MessageSpecs will be returned. Valid attributes are:
	 * - src
	 * - msg
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be
	 *     included in the search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageSpec[]} an array of MessageSpecs with
	 *     matching attributes
	 */
	hemi.dispatch.getSpecs = function(attributes, wildcards) {
		var specs;
		
		if (attributes === undefined) {
			specs = this.msgSpecs.values();
		} else {
			var atts = {};
			
			if (wildcards) {
				if (attributes.src !== undefined) {
					if (attributes.src === hemi.dispatch.WILDCARD) {
						atts.src = hemi.dispatch.WILDCARD;
					} else {
						atts.src = [attributes.src, hemi.dispatch.WILDCARD];
					}
				}
				if (attributes.msg !== undefined) {
					if (attributes.msg === hemi.dispatch.WILDCARD) {
						atts.msg = hemi.dispatch.WILDCARD;
					} else {
						atts.msg = [attributes.msg, hemi.dispatch.WILDCARD];
					}
				}
			} else {
				if (attributes.src !== undefined) {
					atts.src = attributes.src;
				}
				if (attributes.msg !== undefined) {
					atts.msg = attributes.msg;
				}
			}
			
			specs = this.msgSpecs.query(atts);
		}
		
		return specs;
	};
	
	/**
	 * Get the MessageSpec with the given source id and Message type. If
	 * wildcards are allowed, search for wildcard sources and types as well.
	 * This is much faster than getSpecs.
	 * 
	 * @param {number} src id of the Message originator to search for
	 * @param {string} type type of Message to search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be
	 *     included in the search results
	 * @return {hemi.dispatch.MessageSpec[]} an array of found MessageSpecs
	 */
	hemi.dispatch.getSpecsFast = function(src, msg, wildcards) {
		var specs = [],
			hash = msg + src,
			spec = this.msgSpecs.get(hash);
		
		if (spec !== null) {
			specs.push(spec);
		}
		
		if (wildcards) {
			var wildSrc = src === hemi.dispatch.WILDCARD;
			
			if (!wildSrc) {
				hash = msg + hemi.dispatch.WILDCARD;
				spec = this.msgSpecs.get(hash);
				if (spec !== null) {
					specs.push(spec);
				}
			}
			if (msg !== hemi.dispatch.WILDCARD) {
				hash = hemi.dispatch.WILDCARD + src;
				spec = this.msgSpecs.get(hash);
				if (spec !== null) {
					specs.push(spec);
				}
				
				if (!wildSrc) {
					hash = hemi.dispatch.WILDCARD + hemi.dispatch.WILDCARD;
					spec = this.msgSpecs.get(hash);
					if (spec !== null) {
						specs.push(spec);
					}
				}
			}
		}
		
		return specs;
	};
	
	/**
	 * Get any MessageTargets registered with the given attributes. If no
	 * attributes are given, all MessageTargets will be returned. Valid
	 * attributes are:
	 * - src
	 * - msg
	 * - dispatchId
	 * - name
	 * - handler
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be
	 *     included in the search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageTarget[]} an array of MessageTargets
	 *     registered with matching attributes
	 */
	hemi.dispatch.getTargets = function(attributes, wildcards) {
		var specs = this.getSpecs(attributes, wildcards),
			results = [],
			dispatchId,
			name,
			handler;
		
		if (attributes !== undefined) {
			dispatchId = attributes.dispatchId;
			name = attributes.name;
			handler = attributes.handler;
		}
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			var targets = specs[ndx].targets;
			
			for (var t = 0, tLen = targets.length; t < tLen; t++) {
				var result = targets[t];
				var add = true;
				
				if (dispatchId !== undefined) {
					add = result._dispatchId === dispatchId;
				}
				if (add && name !== undefined) {
					add = result.name === name;
				}
				if (add && handler !== undefined) {
					add = result.handler === handler;
				}
				
				if (add) {
					results.push(result);
				}
			}
		}
		
		return results;
	};
	
	/**
	 * Get the MessageSpec that the given MessageTarget is currently
	 * registered with.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to get
	 *     the MessageSpec for
	 * @return {hemi.dispatch.MessageSpec} the found MessageSpec or null
	 */
	hemi.dispatch.getTargetSpec = function(target) {
		var specs = this.getSpecs(),
			dispatchId = target._dispatchId;
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			var spec = specs[ndx],
				targets = spec.targets;
			
			for (var t = 0, tLen = targets.length; t < tLen; t++) {
				if (targets[t]._dispatchId === dispatchId) {
					return spec;
				}
			}
		}
		
		return null;
	};
	
	/**
	 * Get the MessageSpec with the given attributes or create one if it does
	 * not already exist.
	 * 
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 * @return {hemi.dispatch.MessageSpec} the created/found MessageSpec
	 */
	hemi.dispatch.createSpec = function(src, msg) {
		var specs = this.getSpecsFast(src, msg, false),
			spec;
		
		if (specs.length === 0) {
			spec = new hemi.dispatch.MessageSpec();
			spec.src = src;
			spec.msg = msg;
			this.msgSpecs.put(spec.getHash(), spec);
		} else {
			if (specs.length > 1) {
				hemi.console.log('Found ' + specs.length + ' MessageSpecs with the same src and msg.', hemi.console.ERR);
			}
			
			spec = specs[0];
		}
		
		return spec;
	};
	
	/**
	 * Setup a MessageTarget with the given attributes and register it to
	 * receive Messages.
	 * 
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 * @param {Object} handler either a function that will take the Message as a
	 *     parameter, or an object that will receive it
	 * @param {string} opt_func name of the function to call if handler is an
	 *     object
	 * @param {string[]} opt_args optional array to specify arguments to pass to
	 *     opt_func. Otherwise the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	hemi.dispatch.registerTarget = function(src, msg, handler, opt_func, opt_args) {
		var spec = this.createSpec(src, msg),
			msgTarget = new hemi.dispatch.MessageTarget();
		msgTarget._dispatchId = this.getNextId();
		msgTarget.handler = handler;
		
		if (opt_func) {
			msgTarget.func = opt_func;
		}
		if (opt_args) {
			msgTarget.args = opt_args;
		}
		
		spec.addTarget(msgTarget);
		return msgTarget;
	};
	
	/**
	 * Remove any MessageSpecs with the given attributes from the dispatch.
	 * Valid attributes are:
	 * - src
	 * - msg
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be
	 *     included in the search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageSpec[]} an array of removed MessageSpecs
	 */
	hemi.dispatch.removeSpecs = function(attributes, wildcards) {
		var specs = hemi.dispatch.getSpecs(attributes, wildcards),
			removed = [],
			spec;

		for (var i = 0, il = specs.length; i < il; ++i) {
			spec = this.msgSpecs.remove(specs[i].getHash());
			if (spec) removed.push(spec);
		}

		return removed;
	};
	
	/**
	 * Remove the given MessageTarget from the dispatch.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to
	 *     remove
	 * @param {Object} opt_attributes optional structure with MessageSpec
	 *     attributes to search for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or null
	 */
	hemi.dispatch.removeTarget = function(target, opt_attributes) {
		var specs = this.getSpecs(opt_attributes, false),
			removed = null;
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			var spec = specs[ndx];
			removed = spec.removeTarget(target);
			
			if (removed !== null) {
				break;
			}
		}
		
		if (removed === null) {
			hemi.console.log('MessageTarget was not found and therefore not removed', hemi.console.WARN);
		}
		
		return removed;
	};
	
	/**
	 * Remove any MessageTargets registered with the given attributes. If no
	 * attributes are given, all MessageTargets will be returned. Valid
	 * attributes are:
	 * - src
	 * - msg
	 * - dispatchId
	 * - name
	 * - handler
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be
	 *     included in the search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageTarget[]} array of removed MessageTargets
	 */
	hemi.dispatch.removeTargets = function(attributes, wildcards) {
		var specs = this.getSpecs(attributes, wildcards),
			results = [],
			dispatchId,
			name,
			handler;
		
		if (attributes !== undefined) {
			dispatchId = attributes.dispatchId;
			name = attributes.name;
			handler = attributes.handler;
		}
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			var spec = specs[ndx],
				targets = spec.targets;
			
			for (var t = 0, tLen = targets.length; t < tLen; t++) {
				var result = targets[t],
					remove = true;
				
				if (dispatchId !== undefined) {
					remove = result._dispatchId === dispatchId;
				}
				if (remove && name !== undefined) {
					remove = result.name === name;
				}
				if (remove && handler !== undefined) {
					remove = result.handler === handler;
				}
				
				if (remove) {
					spec.removeTarget(result);
					results.push(result);
				}
			}
		}
		
		return results;
	};
	
	/**
	 * Remove the given MessageTarget from its current MessageSpec and register
	 * it with the given specifications.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to
	 *     register
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 */
	hemi.dispatch.setTargetSpec = function(target, src, msg) {
		var spec = this.getTargetSpec(target);
		
		if (spec !== null) {
			spec.removeTarget(target);
		} else {
			hemi.console.log('Previous MessageSpec for MessageTarget not found', hemi.console.WARN);
		}
		
		spec = this.createSpec(src, msg);
		spec.addTarget(target);
	};
	
	/**
	 * Create a Message from the given attributes and send it to all
	 * MessageTargets with matching source id and message type.
	 * 
	 * @param {hemi.world.Citizen} src the Message originator
	 * @param {string} msg type of Message to send
	 * @param {Object} data container for any and all information relevant to
	 *     the Message
	 */
	hemi.dispatch.postMessage = function(src, msg, data) {
		var message = new hemi.dispatch.Message(),
			id = src._getId();
		message.src = src;
		message.msg = msg;
		message.data = data;
		
		var specs = this.getSpecsFast(id, msg, true);
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			// Make a local copy of the array in case it gets modified while
			// sending the message (such as a MessageHandler unsubscribes itself
			// or another one as part of its handle).
			var targets = specs[ndx].targets.slice(0);
			
			for (var t = 0, tLen = targets.length; t < tLen; t++) {
				var msgTarget = targets[t];
				var args, func;
				
				if (msgTarget.args !== null) {
					// Parse the specified arguments from the Message.
					args = this.getArguments(message, msgTarget.args);
				} else {
					// No arguments specified, so just pass the Message.
					args = [message];
				}
				
				if (msgTarget.func) {
					// The handler is an object. Use the specified function to
					// handle the Message.
					func = msgTarget.handler[msgTarget.func];
				}
				else {
					// The handler is a function. Just pass it the arguments.
					func = msgTarget.handler;
				}
				
				func.apply(msgTarget.handler, args);
			}
		}
	};

	/**
	 * Create an array of arguments from the given array of parameter strings. A
	 * string starting with 'id:' indicates the world id for a Citizen to
	 * retrieve. A string starting with 'msg:' indicates a period-delimited
	 * string of attributes to parse from within message. Otherwise the argument
	 * is passed through unmodified.
	 * For example:
	 * 'id:12' will fetch hemi.world.getCitizens({worldId:12})
	 * 'msg:data.shape.name' will parse message.data.shape.name
	 * 
	 * @param {hemi.dispatch.Message} message the Message to parse data from
	 * @param {Object[]} params the list of parameters to create arguments from
	 * @return {Object[]} array of arguments created
	 */
	hemi.dispatch.getArguments = function(message, params) {
		var args = [];
		
		for (var ndx = 0, len = params.length; ndx < len; ndx++) {
			var param = params[ndx];
			
			if (typeof param != 'string') {
				args[ndx] = param;
			} else if (param.substring(0,3) === hemi.dispatch.ID_ARG) {
				var id = parseInt(param.substring(3), 10);
				args.push(hemi.world.getCitizenById(id));
			} else if (param.substring(0,4) === hemi.dispatch.MSG_ARG) {
				param = param.substring(4);
				var tokens = param.split('.');
				var arg = message;
				
				for (aNdx = 0, aLen = tokens.length; arg != null && aNdx < aLen; aNdx++) {
					arg = arg[tokens[aNdx]];
				}
				
				args.push(arg);
			} else {
				args[ndx] = param;
			}
		}
		
		return args;
	};

	// Wildcard functions
	var anon = {
		_getId: function() {
			return hemi.dispatch.WILDCARD;
		}
	};
	
	/**
	 * Send a Message with the given attributes from an anonymous wildcard
	 * source to any registered MessageTargets.
	 * 
	 * @param {string} type type of Message
	 * @param {Object} data container for any and all information relevant to
	 *     the Message
	 */
	hemi.send = function(type, data) {
		hemi.dispatch.postMessage(anon, type, data);
	};
	
	/**
	 * Register the given handler to receive Messages of the specified type
	 * from any source. This creates a MessageTarget.
	 * 
	 * @param {string} type type of Message to handle
	 * @param {Object} handler either a function or an object
	 * @param {string} opt_func name of the function to call if handler is
	 *     an object
	 * @param {string[]} opt_args optional array of names of arguments to
	 *     pass to the handler. Otherwise the entire Message is just passed
	 *     in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	hemi.subscribe = function(type, handler, opt_func, opt_args) {
		return hemi.dispatch.registerTarget(hemi.dispatch.WILDCARD, type,
			handler, opt_func, opt_args);
	};
	
	/**
	 * Remove the given MessageTarget for the specified Message type. Note
	 * that this removes a MessageTarget registered with the wildcard as the
	 * source id. It does not remove the MessageTarget from any Citizens it
	 * may be directly registered with.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to
	 *     remove from the Dispatch
	 * @param {string} opt_type Message type the MessageTarget was
	 *     registered for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or
	 *     null
	 */
	hemi.unsubscribe = function(target, opt_type) {
		return hemi.dispatch.removeTarget(target, {
			src: hemi.dispatch.WILDCARD,
			msg: opt_type
		});
	};
	
	return hemi;
})(hemi || {});
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
	/**
	 * @namespace A module for handling all keyboard and mouse input.
	 */
	hemi.input = hemi.input || {};
	
	hemi.input.mouseDownListeners = [];
	hemi.input.mouseUpListeners = [];
	hemi.input.mouseMoveListeners = [];
	hemi.input.mouseWheelListeners = [];
	hemi.input.keyDownListeners = [];
	hemi.input.keyUpListeners = [];
	hemi.input.keyPressListeners = [];
	
	/**
	 * Setup the listener lists and register the event handlers.
	 */
	hemi.input.init = function(canvas) {
		canvas.addEventListener('mousedown', function(event) {
			hemi.input.mouseDown(event);
		}, true);
		canvas.addEventListener('mousemove', function(event) {
			hemi.input.mouseMove(event);
		}, true);
		canvas.addEventListener('mouseup', function(event) {
			hemi.input.mouseUp(event);
		}, true);
		canvas.addEventListener('mousewheel', function(event) {
			hemi.input.scroll(event);
		}, false);
		canvas.addEventListener('DOMMouseScroll', function(event) {
			hemi.input.scroll(event);
		}, false);

		document.addEventListener('keypress', function(event) {
			hemi.input.keyPress(event);
		}, true);
		document.addEventListener('keydown', function(event) {
			hemi.input.keyDown(event);
		}, true);
		document.addEventListener('keyup', function(event) {
			hemi.input.keyUp(event);
		}, true);
	};
	
	/**
	 * Register the given listener as a "mouse down" listener.
	 *  
	 * @param {Object} listener an object that implements onMouseDown()
	 */
	hemi.input.addMouseDownListener = function(listener) {
		addListener(hemi.input.mouseDownListeners, listener);
	};
	
	/**
	 * Register the given listener as a "mouse up" listener.
	 *  
	 * @param {Object} listener an object that implements onMouseUp()
	 */
	hemi.input.addMouseUpListener = function(listener) {
		addListener(hemi.input.mouseUpListeners, listener);
	};
	
	/**
	 * Register the given listener as a "mouse move" listener.
	 *  
	 * @param {Object} listener an object that implements onMouseMove()
	 */
	hemi.input.addMouseMoveListener = function(listener) {
		addListener(hemi.input.mouseMoveListeners, listener);
	};
	
	/**
	 * Register the given listener as a "mouse wheel" listener.
	 *  
	 * @param {Object} listener an object that implements onScroll()
	 */
	hemi.input.addMouseWheelListener = function(listener) {
		addListener(hemi.input.mouseWheelListeners, listener);
	};
    
	/**
	 * Register the given listener as a "key down" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyDown()
	 */
    hemi.input.addKeyDownListener = function(listener) {
		addListener(hemi.input.keyDownListeners, listener);
    };
    
	/**
	 * Register the given listener as a "key up" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyUp()
	 */
    hemi.input.addKeyUpListener = function(listener) {
		addListener(hemi.input.keyUpListeners, listener);
    };
    
	/**
	 * Register the given listener as a "key press" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyPress()
	 */
    hemi.input.addKeyPressListener = function(listener) {
		addListener(hemi.input.keyPressListeners, listener);
    };
	
	/**
	 * Remove the given listener from the list of "mouse down" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseDownListener = function(listener) {
		return removeListener(hemi.input.mouseDownListeners, listener);
	};
	
	/**
	 * Remove the given listener from the list of "mouse up" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseUpListener = function(listener) {
		return removeListener(hemi.input.mouseUpListeners, listener);
	};
	
	/**
	 * Remove the given listener from the list of "mouse move" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseMoveListener = function(listener) {
		return removeListener(hemi.input.mouseMoveListeners, listener);
	};
	
	/**
	 * Remove the given listener from the list of "mouse wheel" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseWheelListener = function(listener) {
		return removeListener(hemi.input.mouseWheelListeners, listener);
	};
    
	/**
	 * Remove the given listener from the list of "key down" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
    hemi.input.removeKeyDownListener = function(listener) {
		return removeListener(hemi.input.keyDownListeners, listener);
    };
    
	/**
	 * Remove the given listener from the list of "key up" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
    hemi.input.removeKeyUpListener = function(listener) {
		return removeListener(hemi.input.keyUpListeners, listener);
    };
    
	/**
	 * Remove the given listener from the list of "key press" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
    hemi.input.removeKeyPressListener = function(listener) {
		return removeListener(hemi.input.keyPressListeners, listener);
    };
	
	/**
	 * Handle the event generated by the user pressing a mouse button down.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "mouse down" listeners
	 */
	hemi.input.mouseDown = function(event) {
        var newEvent = getRelativeEvent(event);
		for (var ndx = 0; ndx < hemi.input.mouseDownListeners.length; ndx++) {
			hemi.input.mouseDownListeners[ndx].onMouseDown(newEvent);
		}
	};
	
	/**
	 * Handle the event generated by the user releasing a pressed mouse button.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "mouse up" listeners
	 */
	hemi.input.mouseUp = function(event) {
        var newEvent = getRelativeEvent(event);
		for (var ndx = 0; ndx < hemi.input.mouseUpListeners.length; ndx++) {
			hemi.input.mouseUpListeners[ndx].onMouseUp(newEvent);
		}
	};
	
	/**
	 * Handle the event generated by the user moving the mouse.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "mouse move" listeners
	 */
	hemi.input.mouseMove = function(event) {
        var newEvent = getRelativeEvent(event);
		for (var ndx = 0; ndx < hemi.input.mouseMoveListeners.length; ndx++) {
			hemi.input.mouseMoveListeners[ndx].onMouseMove(newEvent);
		}
	};
	
	/**
	 * Handle the event generated by the user scrolling a mouse wheel.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "mouse wheel" listeners
	 */
	hemi.input.scroll = function(event) {
        var newEvent = getRelativeEvent(event);
        newEvent.deltaY = event.detail ? -event.detail : event.wheelDelta;
        cancelEvent(event);
		for (var ndx = 0; ndx < hemi.input.mouseWheelListeners.length; ndx++) {
			hemi.input.mouseWheelListeners[ndx].onScroll(newEvent);
		}
	};
    
	/**
	 * Handle the event generated by the user pressing a key down.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "key down" listeners
	 */
    hemi.input.keyDown = function(event) {
        for (var ndx = 0; ndx < hemi.input.keyDownListeners.length; ndx++) {
            hemi.input.keyDownListeners[ndx].onKeyDown(event);
        }
    };
    
	/**
	 * Handle the event generated by the user releasing a pressed key.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "key up" listeners
	 */
    hemi.input.keyUp = function(event) {
        for (var ndx = 0; ndx < hemi.input.keyUpListeners.length; ndx++) {
            hemi.input.keyUpListeners[ndx].onKeyUp(event);
        }
    };
    
	/**
	 * Handle the event generated by the user pressing a key down and releasing
	 * it.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "key press" listeners
	 */
    hemi.input.keyPress = function(event) {
        for (var ndx = 0; ndx < hemi.input.keyPressListeners.length; ndx++) {
            hemi.input.keyPressListeners[ndx].onKeyPress(event);
        }
    };
	
	// Internal functions
	
	/*
	 * Add the given listener to the given set of listeners.
	 * 
	 * @param {Object[]} listenerSet list to add to
	 * @param {Object} listener object to add
	 */
	var addListener = function(listenerSet, listener) {
		listenerSet.push(listener);
	};
	
	/*
	 * Remove the given listener from the given set of listeners.
	 * 
	 * @param {Object[]} listenerSet list to remove from
	 * @param {Object} listener object to remove
	 * @return {Object} the removed listener if successful or null 
	 */
	var removeListener = function(listenerSet, listener) {
        var found = null;
		var ndx = listenerSet.indexOf(listener);
		
		if (ndx != -1) {
			var spliced = listenerSet.splice(ndx, 1);
			
			if (spliced.length == 1) {
				found = spliced[0];
			}
		}
        
        return found;
	};

    var getRelativeXY = function(event) {
        var element = event.target ? event.target : event.srcElement;
        var xy = {x: 0, y: 0};
        for (var e = element; e; e = e.offsetParent) {
            xy.x += e.offsetLeft;
            xy.y += e.offsetTop;
        }

        xy.x = event.pageX - xy.x;
        xy.y = event.pageY - xy.y;

        return xy;
    };

    var getRelativeEvent = function(event) {
        var newEvent = hemi.utils.clone(event, false);
        var xy = getRelativeXY(newEvent);
        newEvent.x = xy.x;
        newEvent.y = xy.y;

        return newEvent;
    };

    var cancelEvent = function(event) {
        if (!event)
            event = window.event;
        event.cancelBubble = true;
        if (event.stopPropagation)
            event.stopPropagation();
        if (event.preventDefault)
            event.preventDefault();
    };

	return hemi;
})(hemi || {});
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
		/*
		 * Perform clean up on the Transform/mesh
		 */
	var cleanFunc = function() {
			this.parent.remove(this);

			for (var i = 0, il = this.children.length; i < il; ++i) {
				this.children[i].cleanup();
			}
		},
		/*
		 * Set all transform properties to their identity values.
		 */
		identityFunc = function() {
			this.position.set(0, 0, 0);
			this.quaternion.set(0, 0, 0, 1);
			this.rotation.set(0, 0, 0);
			this.scale.set(1, 1, 1);
			this.matrix.identity();
			this.updateMatrixWorld();
		},
		/*
		 * Initialize Transform properties using the given Object3D.
		 */
		initFunc = function(obj, toConvert) {
			var children = this.children;
			// This is important since THREE.KeyFrameAnimation relies on updating a shared reference
			// to the matrix.
			this.matrix = obj.matrix;
			this.matrixWorld = obj.matrixWorld;
			this.updateMatrix();
			this.updateMatrixWorld();
			this.children = [];

			if (toConvert[obj.id] !== undefined) {
				toConvert[obj.id] = this;
			}

			for (var i = 0, il = children.length; i < il; ++i) {
				var child = children[i],
					childObj = obj.getChildByName(child.name, false);

				this.add(child);
				child._init(childObj, toConvert);
			}
		},
		/*
		 * Shared Octane properties for hemi.Transform and hemi.Mesh.
		 */
		octaneProps = ['name', 'children', 'pickable', 'visible', 'position', 'rotation',
			'quaternion', 'scale', 'useQuaternion'];

////////////////////////////////////////////////////////////////////////////////////////////////////
// Transform class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Transform performs hierarchical matrix transformations.
	 */
	var Transform = function() {
		THREE.Object3D.call(this);

		this.pickable = true;
		// this.opacity?
	};

	Transform.prototype = new THREE.Object3D();
	Transform.constructor = Transform;

	Transform.prototype._clean = cleanFunc;

	Transform.prototype._init = initFunc;

	Transform.prototype._octane = octaneProps;

	/**
	 * Use the given Object3D to initialize properties.
	 * 
	 * @param {THREE.Object3D} obj Object3D to use to initialize properties
	 * @param {Object} toConvert look-up structure to get the Transform equivalent of an Object3D
	 *     for animations
	 */
	Transform.prototype.identity = identityFunc;

	hemi.makeCitizen(Transform, 'hemi.Transform', {
		cleanup: Transform.prototype._clean,
		toOctane: Transform.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Mesh class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Mesh performs hierarchical matrix transformations and contains geometry and
	 * rendering materials.
	 */
	var Mesh = function() {
		THREE.Mesh.call(this);

		this.pickable = true;
		// this.opacity?
	};

	Mesh.prototype = new THREE.Mesh();
	Mesh.constructor = Mesh;

	Mesh.prototype._clean = cleanFunc;

	/*
	 * Use the given Mesh to initialize properties.
	 * 
	 * @param {THREE.Mesh} obj Mesh to use to initialize properties
	 * @param {Object} toConvert look-up structure to get the hemi.Mesh equivalent of a THREE.Mesh
	 *     for animations
	 */
	Mesh.prototype._init = function(obj, toConvert) {
		this.geometry = obj.geometry;
		this.material = obj.material;
		this.boundRadius = obj.boundRadius;

		if (this.geometry.morphTargets.length) {
			this.morphTargetBase = obj.morphTargetBase;
			this.morphTargetForcedOrder = obj.morphTargetForcedOrder;
			this.morphTargetInfluences = obj.morphTargetInfluences;
			this.morphTargetDictionary = obj.morphTargetDictionary;
		}

		initFunc.call(this, obj, toConvert);
	};

	Mesh.prototype._octane = octaneProps;

	Mesh.prototype.identity = identityFunc;

	hemi.makeCitizen(Mesh, 'hemi.Mesh', {
		cleanup: Mesh.prototype._clean,
		toOctane: Mesh.prototype._octane
	});

// No extra functionality, but these are useful as Citizens/Octanable.

	hemi.makeCitizen(THREE.Scene, 'hemi.Scene');
	hemi.makeOctanable(THREE.Vector3, 'THREE.Vector3', ['x', 'y', 'z']);
	hemi.makeOctanable(THREE.Quaternion, 'THREE.Quaternion', ['x', 'y', 'z', 'w']);

	return hemi;
})(hemi || {});
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

/**
 * @fileoverview Classes used for setting viewpoints, controlling the camera,
 *		and setting camera view options are defined here.
 */

var hemi = (function(hemi) {
	hemi.viewDefaults = {
		MOUSE_SPEED : 0.005,
		MOUSE_DELTA : 0.0015,
		TRUCK_SPEED : 0.02,
		FOV         : 0.707107,
		NP          : 1,
		FP          : 10000,
		MOVE_TIME   : 72,
		MIN_FOV     : 0.05,
		MAX_FOV     : Math.PI/3,
		MIN_TILT    : -Math.PI/2.001,
		MAX_TILT    : Math.PI/2.001
	};
	
	hemi.viewProjection = {
		PERSPECTIVE : 0,
		XY          : 1,
		XZ          : 2,
		YZ          : 3
	};

	/**
	 * @class A Camera controls the point of view and perspective when viewing a
	 * 3D scene.
	 * @extends hemi.world.Citizen
	 */
	hemi.CameraBase = function() {
            this.panTilt = new THREE.Object3D();
            this.panTilt.name = 'panTilt';
            this.panTilt.eulerOrder = 'ZYX';
            this.cam = new THREE.Object3D();
            this.cam.name = 'cam';
            this.cam.eulerOrder = 'ZYX';
            this.panTilt.add(this.cam);
            
            this.cam.position.z = 1;
            this.cam.updateMatrix();
            this.updateWorldMatrices();

	        this.distance = 1;
			this.vd = { current: null, last: null };
			this.light = new THREE.PointLight( 0xffffff, 1.35 );
            this.tiltMax = hemi.viewDefaults.MAX_TILT;
            this.tiltMin = hemi.viewDefaults.MIN_TILT;

	        this.fov = {
				current : hemi.viewDefaults.FOV,
				min     : hemi.viewDefaults.MIN_FOV,
				max     : hemi.viewDefaults.MAX_FOV
			};
	        this.lookLimits = {
	        	panMax: null,
	        	panMin: null,
	        	tiltMax: null,
	        	tiltMin: null
	        };
			this.mode = {
				scroll     : true,
				scan       : true,
				fixed      : false,
				control    : false,
				projection : hemi.viewProjection.PERSPECTIVE,
                fixedLight : true
			};	
			this.state = {
				moving : false,
				curve  : null,
				time   : { current: 0.0, end: 0.0 },
				mouse  : false,
				xy     : { current: [-1,-1], last: [-1,-1] },
				shift  : false,
				update : false,
				vp     : null
			};
            this.threeCamera = new THREE.PerspectiveCamera(
            		this.fov.current * hemi.RAD_TO_DEG,
            		window.innerWidth / window.innerHeight,
            		hemi.viewDefaults.NP,
            		hemi.viewDefaults.FP);

            var tween = hemi.utils.penner.linearTween;
			this.easeFunc = [tween,tween,tween];
			this.update();

            hemi.addRenderListener(this);
		};

	hemi.CameraBase.prototype = {
		/**
		 * Disable control of the Camera through the mouse and keyboard.
		 */
		disableControl : function() {
			if (!this.mode.control) {
				return false;
			} else {
				hemi.input.removeMouseDownListener(this);
				hemi.input.removeMouseUpListener(this);
				hemi.input.removeMouseMoveListener(this);
				hemi.input.removeMouseWheelListener(this);
				hemi.input.removeKeyDownListener(this);
				hemi.input.removeKeyUpListener(this);	
				this.mode.control = false;
				this.state.mouse = false;
				return true;
			}
		},
		
		/**
		 * Disable the shiftkey scanning functionality.
		 */
		disableScan : function() {
			this.mode.scan = false;
		},
		
		/**
		 * Disable the scroll wheel zooming functionality.
		 */
		disableZoom : function() {
			this.mode.scroll = false;
		},
			
		/**
		 * Enable control of the Camera through the mouse and keyboard.
		 */
		enableControl : function(element) {
			if (this.mode.control) {
				return false;
			} else {
				hemi.input.addMouseDownListener(this);
				hemi.input.addMouseUpListener(this);
				hemi.input.addMouseMoveListener(this);
				hemi.input.addMouseWheelListener(this);
				hemi.input.addKeyDownListener(this);
				hemi.input.addKeyUpListener(this);
				this.mode.control = true;
				return true;
			}
		},
		
		/**
		 * Enable the shiftkey dragging functionality.
		 */
		enableScan : function() {
			this.mode.scan = true;
		},
		
		/**
		 * Enable the camera to zoom with the mouse scroll.
		 */
		enableZoom : function() {
			this.mode.scroll = true;
		},
		
		/**
		 * Fix the eye to current spot, and use mouse movements to look around.
		 */
		fixEye : function() {
			this.mode.fixed = true;
			this.update();
			return this;
		},
		
		/**
		 * Attach the light source to the Camera.
		 */
		lightOnCam : function() {
			this.mode.fixedLight = true;
			this.update();
			return this;
		},
		
		/**
		 * Allow the eye to rotate about a fixed target. This is the default mode.
		 */
		freeEye : function() {
			this.setEyeTarget(this.getEye(), this.getTarget());
			this.mode.fixed = false;
			this.update();
			return this;
		},
		
		/**
		 * Set the light source to be at the given position.
		 * 
		 * @param {Vector3} position XYZ position of the light source
		 */
		lightAtPosition : function(position) {
			this.light.position = position;
            this.light.updateMatrix();
			this.mode.fixedLight = false;
			this.update();
			return this;
		},

		/**
		 * Get the current position of the Camera eye.
		 *
		 * @return {Vector3} XYZ coordinates of the eye
		 */
		getEye : function() {
			return this.cam.matrixWorld.getPosition().clone();
		},

		/**
		 * Get the current position of the Camera target.
		 *
		 * @return {Vector3} XYZ coordinates of the target
		 */
		getTarget : function() {
			if (this.mode.fixed) {
				// Create a target vector that is transformed by cam's matrix
				// but adds a negative Z translation of "distance" length
				var tgt = new THREE.Vector3(0, 0, 1);
				this.cam.matrixWorld.rotateAxis(tgt).multiplyScalar(-this.distance);
				return tgt.addSelf(this.cam.matrixWorld.getPosition());
			} else {
				return this.panTilt.matrixWorld.getPosition().clone();
			}
		},
		
		/**
		 * Move the Camera along the specified curve.
		 *
		 * @param {hemi.CameraCurve} curve curve for the Camera eye and
		 *     target to follow
		 * @param {number} opt_time the number of seconds for the Camera to take
		 *     to move along the curve (0 is instant)
		 */
		moveOnCurve : function(curve, opt_time) {
			if (this.vd.current !== null) {
				this.vd.last = this.vd.current;
			} else {
				this.vd.last = hemi.createViewData(this);
			}
			
			this.vd.current = new hemi.ViewData({
				eye: curve.eye.getEnd(),
				target: curve.target.getEnd(),
				fov: this.fov.current,
				np: this.threeCamera.near,
				fp: this.threeCamera.far
			});
			this.state.curve = curve;
			this.state.moving = true;
			this.state.vp = null;
			this.state.time.end = (opt_time == null) ? 1.0 : (opt_time > 0) ? opt_time : 0.001;
			this.state.time.current = 0.0;
			this.send(hemi.msg.start, { viewdata: this.vd.current });
		},
		
		/**
		 * Move the Camera when the Camera is in orthographic viewing mode.
		 *
		 * @param {number} xMovement The mouse movement, in pixels, along the x-axis
		 * @param {number} yMovement The mouse movement, in pixels, along the y-axis
		 */
		moveOrthographic : function(xMovement,yMovement) {
			var xDis = xMovement * 2 * this.distance / hemi.core.client.width;
			var yDis = yMovement * 2 * this.distance / hemi.core.client.width;
			switch(this.mode.projection) {
				case hemi.viewProjection.XY:
				case hemi.viewProjection.YZ:
					this.panTilt.translateX(-xDis);
                    this.panTilt.translateY(yDis);
                    this.panTilt.updateMatrix();
					break;
				case hemi.viewProjection.XZ:
				    this.panTilt.translateX(xDis);
                    this.panTilt.translateZ(yDis);
                    this.panTilt.updateMatrix();
					break;
			}
		},

		/**
		 * Move the Camera when the Camera is in perspective viewing mode.
		 *
		 * @param {number} xMovement The mouse movement, in pixels, along the x-axis
		 * @param {number} yMovement The mouse movement, in pixels, along the y-axis
		 */		
		movePerspective : function(xMovement,yMovement) {
			if (this.state.shift && this.mode.scan) {
				var deltaX = hemi.viewDefaults.MOUSE_DELTA * this.distance
					* (xMovement);
				var deltaY = hemi.viewDefaults.MOUSE_DELTA * this.distance
					* (yMovement);
				this.panTilt.translateX(-deltaX);
				this.panTilt.translateY(deltaY);
                this.panTilt.updateMatrix();
				this.update();
			} else {
				if (this.mode.fixed) {
					this.rotate(
						-xMovement * hemi.viewDefaults.MOUSE_SPEED,
						-yMovement * hemi.viewDefaults.MOUSE_SPEED);
				} else {
					this.orbit(
						-xMovement * hemi.viewDefaults.MOUSE_SPEED,
						-yMovement * hemi.viewDefaults.MOUSE_SPEED);
				}		
			}
		},
		
		/**
		 * Move the Camera to the given Viewpoint.
		 *
		 * @param {hemi.Viewpoint} view Viewpoint to move to
		 * @param {number} opt_time the number of seconds for the Camera to take
		 *     to move to the Viewpoint (0 is instant)
		 */
		moveToView : function(view, opt_time) {
			var t = (opt_time == null) ? 1.0 : opt_time,
				pkg;
			
			if (view.getData != null) {
				this.vd.current = view.getData();
				this.state.vp = view;
				pkg = {viewpoint: view};
			} else {
				this.vd.current = view;
				this.state.vp = null;
				pkg = {viewdata: view};
			}
			
			this.vd.last = hemi.createViewData(this);
			this.state.curve = null;
			this.state.time.end = (t > 0) ? t : 0.001;
			this.state.time.current = 0.0;
			this.state.moving = true;
			this.send(hemi.msg.start, pkg);
		},
		
		/**
		 * Keyboard key-down listener.
		 *
		 * @param {o3d.Event} keyEvent Message describing key down
		 */
		onKeyDown : function(keyEvent) {
			this.state.shift = (keyEvent.keyCode == 16);
		},

		/**
		 * Keyboard key-up listener.
		 *
		 * @param {o3d.Event} keyEvent Message describing key up
		 */
		onKeyUp : function(keyEvent) {
			if (keyEvent.keyCode == 16) this.state.shift = false;
		},

		/**
		 * Mouse-down listener - set parameters to reflect that fact.
		 *
		 * @param {o3d.Event} mouseEvent Message describing mouse down
		 */
		onMouseDown : function(mouseEvent) {
			this.state.mouse = true;
			this.state.xy.current[0] = this.state.xy.last[0] = mouseEvent.x;
			this.state.xy.current[1] = this.state.xy.last[1] = mouseEvent.y;
		},

		/**
		 * Mouse-move listener - move the camera if the mouse is down.
		 *
		 * @param {o3d.Event} mouseEvent Message describing mouse move
		 */
		onMouseMove : function(mouseEvent) {
			if (this.state.mouse) {
				this.state.xy.last[0] = this.state.xy.current[0];
				this.state.xy.last[1] = this.state.xy.current[1];
				this.state.xy.current[0] = mouseEvent.x;
				this.state.xy.current[1] = mouseEvent.y;
				var xMovement = this.state.xy.current[0] - this.state.xy.last[0];
				var yMovement = this.state.xy.current[1] - this.state.xy.last[1];
					if (this.mode.projection) {
						this.moveOrthographic(xMovement,yMovement);			
					} else {
						this.movePerspective(xMovement,yMovement);
					}	
			}
		},

		/**
		 * Mouse-up listener
		 *
		 * @param {o3d.Event} mouseEvent Message describing mouse up
		 */
		onMouseUp : function(mouseEvent) {
			this.state.mouse = false;
		},
		
		/**
		 * Render listener - check mouse and camera parameters and decide if the
		 * Camera needs to be updated.
		 *
		 * @param {o3d.Event} renderEvent Message desribing render loop
		 */
		onRender : function(renderEvent) {
			var state = this.state,
				xy = state.xy;	
			
			if ((state.mouse && (xy.current[0] !== xy.last[0] ||
				                 xy.current[1] !== xy.last[1])) ||
				state.moving ||
				state.update) {
				this.update(renderEvent.elapsedTime);
			}
			state.update = false;
		},
		
		/**
		 * Mouse-scroll listener - zoom the camera in or out.
		 *
		 * @param {o3d.Event} mouseEvent Message describing mouse behavior
		 */
		onScroll : function(mouseEvent) {
			if (!this.mode.scroll) {
				return;
			}
			if (this.state.shift) {
				var dis = this.distance * hemi.viewDefaults.TRUCK_SPEED,
					dir = (mouseEvent.deltaY > 0) ? 1 : -1;
				this.truck(dis*dir);
			} else {
				if (this.mode.fixed) {
					var breakpoint = (this.fov.max + this.fov.min)/2;
					if (mouseEvent.deltaY > 0) {
						if (this.fov.current < breakpoint) {
							this.fov.current = this.fov.min + (this.fov.current - this.fov.min)*11/12;
						} else {
							this.fov.current = this.fov.max - (this.fov.max - this.fov.current)*13/12;
						}
					} else {
						if (this.fov.current < breakpoint) {
							this.fov.current = this.fov.min + (this.fov.current - this.fov.min)*13/12;
						} else {
							this.fov.current = this.fov.max - (this.fov.max - this.fov.current)*11/12;
						}
					}
					this.threeCamera.fov = this.fov.current * hemi.RAD_TO_DEG;
					this.threeCamera.updateProjectionMatrix();
					this.state.update = true;
					return;
				} else {
					var t = (mouseEvent.deltaY > 0) ? 11/12 : 13/12;
					this.distance = hemi.utils.lerp(0, this.distance, t);
					if (!this.mode.projection) {
						this.cam.position.z = this.distance;
						this.cam.updateMatrix();
					}
					this.state.update = true;
				}
			}
		},
		
		/**
		 * Orbit the Camera about the target point it is currently looking at.
		 * 
		 * @param {number} pan amount to pan around by (in radians)
		 * @param {number} tilt amount to tilt up and down by (in radians)
		 */
		orbit : function(pan,tilt) {
			if (tilt == null) tilt = 0;
			
			var newTilt = this.panTilt.rotation.x + tilt;
			
			this.panTilt.rotation.y += pan;
			this.panTilt.rotation.x = newTilt >= this.tiltMax ? this.tiltMax : (newTilt <= this.tiltMin ? this.tiltMin : newTilt);
			this.panTilt.updateMatrix();
			this.update();
		},
		
		/**
		 * Rotate the Camera in place so that it looks in a new direction. Note
		 * that this has no effect if the Camera is not in fixed-eye mode.
		 * 
		 * @param {number} pan amount to pan (in radians)
		 * @param {number} tilt amount to tilt (in radians)
		 */
		rotate : function(pan,tilt) {
			if (tilt == null) tilt = 0;
			
			var ll = this.lookLimits,
				newPan = this.cam.rotation.y + pan,
				newTilt = this.cam.rotation.x + tilt;
			
			if (ll.panMin != null && newPan < ll.panMin) {
				this.cam.rotation.y = ll.panMin;
			} else if (ll.panMax != null && newPan > ll.panMax) {
				this.cam.rotation.y = ll.panMax;
			} else {
				this.cam.rotation.y = newPan;
			}

			if (ll.tiltMin != null && newTilt < ll.tiltMin) {
				this.cam.rotation.x = ll.tiltMin;
			} else if (ll.tiltMax != null && newTilt > ll.tiltMax) {
				this.cam.rotation.x = ll.tiltMax;
			} else {
				this.cam.rotation.x = newTilt;
			}
			
            this.cam.updateMatrix();
			this.update();
		},

		/**
		 * Set the limits on the Camera pan and tilt in fixed eye mode.
		 * 
		 * @param {number} panMin minimum pan angle (in radians)
		 * @param {number} panMax maximum pan angle (in radians)
		 * @param {number} tiltMin minimum tilt angle (in radians)
		 * @param {number} tiltMax maximum tilt angle (in radians)
		 */
		setLookAroundLimits : function(panMin, panMax, tiltMin, tiltMax) {
			this.lookLimits.panMax = panMax;
			this.lookLimits.panMin = panMin;
			this.lookLimits.tiltMax = tiltMax;
			this.lookLimits.tiltMin = tiltMin;
			return this;
		},
		
		/**
		 * Set the function used to ease the Camera in and out of moves.
		 *
		 * @param {function|Object} easeFunc Either the function which will be
		 *     used for easing on all 3 axes, or a simple object containing x,
		 *     y, or z fields specifying a different function for each axis.
		 * @return {hemi.Camera} This Camera, for chaining
		 */
		setEasing : function(easeFunc) {
			if (typeof(easeFunc) == 'function') {
				this.easeFunc = [easeFunc,easeFunc,easeFunc];
			} else {
				this.easeFunc = [
					easeFunc.x || this.easeFunc[0],
					easeFunc.y || this.easeFunc[1],
					easeFunc.z || this.easeFunc[2]
				];
			}
			return this;
		},
		
		/**
		 * Set the eye and target of the Camera. 
		 *
		 * @param {Vector3} eye XYZ position of camera eye
		 * @param {Vector3} target XYZ position of camera target
		 */
		setEyeTarget : function(eye,target) {
			var offset = [eye.x - target.x, eye.y - target.y, eye.z -target.z],
				rtp = hemi.utils.cartesianToSpherical(offset);

			this.distance = rtp[0];

			this.panTilt.position = target;
            this.panTilt.rotation.y = rtp[2];
            this.panTilt.rotation.x = rtp[1] - hemi.HALF_PI;
            this.panTilt.updateMatrix();

			this.cam.rotation.y = 0;
			this.cam.rotation.x = 0;
			this.cam.position.z = this.distance;
            this.cam.updateMatrix();

			var camPos = new THREE.Vector3(0, 0, this.distance);
			hemi.utils.pointZAt(this.cam, camPos, hemi.utils.pointAsLocal(this.cam,target));
			this.cam.rotation.y += Math.PI;
			this.cam.updateMatrix();

            this.updateWorldMatrices();
		},
		
		/**
		 * Set the color of the Camera's light source.
		 * 
		 * @param {number[3]} rgb rgb value of the color
		 */
		setLight : function(rgb) {
			this.light.color.value = [rgb[0],rgb[1],rgb[2],1];
			return this;
		},
		
		/**
		 * Set the Camera view to render with an orthographic projection.
		 *
		 * @param {number} axis Enum for xy, xz, or yz plane to look at
		 */
		setOrthographic : function(axis) {
			this.mode.projection = axis;
		},
		
		/**
		 * Set the Camera view to render with a perspective projection.
		 */
		setPerspective : function() {
			this.mode.projection = 0;
		},
		
		/**
		 * Set the zooming limits in fixed-eye mode.
		 *
		 * @param {number} min zoom-in limit (in radians)
		 * @param {number} max zoom-out limit (in radians)
		 */
		setZoomLimits : function(min,max) {
			this.fov.min = min;
			this.fov.max = max;
			if (this.fov.current > this.fov.max) {
				this.fov.current = this.fov.max;
			}
			if (this.fov.current < this.fov.min) {
				this.fov.current = this.fov.min;
			}
		},
		
		/**
		 * Move the Camera towards or away from its current target point by the
		 * given distance.
		 * 
		 * @param {number} distance the distance to move the Camera
		 */
		truck : function(distance) {
			this.panTilt.translateZ(-distance);
            this.panTilt.updateMatrix();
            this.update();
		},
		
		/**
		 * Set up the Camera to interpolate between the two given time values.
		 * 
		 * @param {number} current current time
		 * @param {number} end end time
		 */
		interpolateView : function(current,end) {
			var eye = new THREE.Vector3(), target = new THREE.Vector3(),
				last = this.vd.last,
				cur = this.vd.current,
				upProj = false;
			
			if (this.state.curve) {
				var t = this.easeFunc[0](current,0,1,end);
				eye = this.state.curve.eye.interpolate(t);
				target = this.state.curve.target.interpolate(t);
			} else {
			    eye.x = this.easeFunc[0](current, last.eye.x, cur.eye.x - last.eye.x, end);
                eye.y = this.easeFunc[1](current, last.eye.y, cur.eye.y - last.eye.y, end);
                eye.z = this.easeFunc[2](current, last.eye.z, cur.eye.z - last.eye.z, end);
				target.x = this.easeFunc[0](current, last.target.x, cur.target.x - last.target.x, end);
                target.y = this.easeFunc[1](current, last.target.y, cur.target.y - last.target.y, end);
                target.z = this.easeFunc[2](current, last.target.z ,cur.target.z - last.target.z,end);
			}
			if (cur.fov !== last.fov) {
				this.fov.current = this.easeFunc[0](current,last.fov,cur.fov-last.fov,end);
				this.threeCamera.fov = this.fov.current * hemi.RAD_TO_DEG;
				upProj = true;
			}
			if (cur.np !== last.np) {
				this.threeCamera.near = this.easeFunc[0](current,last.np,cur.np-last.np,end);
				upProj = true;
			}
			if (cur.fp !== last.fp) {
				this.threeCamera.far = this.easeFunc[0](current,last.fp,cur.fp-last.fp,end);
				upProj = true;
			}	
			if (upProj) {
				this.threeCamera.updateProjectionMatrix();
			}
			
			this.setEyeTarget(eye,target);
		},
		
		/**
		 * Update the Camera.
		 */
		update : function(delta) {
			var time = this.state.time;
			
			if (this.state.moving) {
				this.interpolateView(time.current,time.end);
				
				if (delta != undefined) {
					
					if (time.current >= time.end) {
						this.state.moving = false;
						this.state.curve = null;
						
						if (this.state.vp !== null) {
							this.send(hemi.msg.stop, { viewpoint:this.state.vp });
							this.state.vp = null;
						} else {
							this.send(hemi.msg.stop, { viewdata:this.vd.current });
						}
					}
					
					time.current += delta;
					
					if (time.current >= time.end) {
						time.current = time.end;
					}				
				}
			}
			
            //force an update of the transforms so we can get the correct world matricies
            this.updateWorldMatrices();
            var camPosition = this.getEye();
            var targetPosition = this.getTarget();
            this.threeCamera.position = camPosition;
            this.threeCamera.updateMatrix();
            this.threeCamera.updateMatrixWorld(true);
            this.threeCamera.lookAt(targetPosition);
            if (this.mode.fixedLight) {
				this.light.position = this.threeCamera.position;
                this.light.rotation = this.threeCamera.rotation;
                this.light.scale = this.threeCamera.scale;
                this.light.updateMatrix();
			}
		},

        updateWorldMatrices : function() {
            this.panTilt.updateMatrixWorld(true);
        }
	};

	hemi.makeCitizen(hemi.CameraBase, 'hemi.Camera', {
		cleanup: function() {
			hemi.removeRenderListener(this);
			this.disableControl();
			this.threeCamera = null;
		},
		msgs: [hemi.msg.start, hemi.msg.stop],
		toOctane: function() {
			var curView = hemi.createViewData(this),
				oct = [
					{
						name: this.mode.control ? 'enableControl' : 'disableControl',
						arg: []
					}, {
						name: 'mode',
						val: this.mode
					}, {
						name: 'moveToView',
						arg: [curView, 0]
					}
				];

			return oct;
		}
	});
	
	/**
	 * @class A CameraCurve contains an "eye" Curve and a "target" Curve that
	 * allow a Camera to follow a smooth path through several waypoints.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {hemi.curve.Curve} eye Curve for camera eye to follow
	 * @param {hemi.curve.Curve} target Curve for camera target to follow
	 */
	hemi.CameraCurve = function(eye, target) {
			this.eye = eye;
			this.target = target;
		};

    hemi.CameraCurve.prototype = {
        constructor : hemi.CameraCurve,
		/**
		 * Send a cleanup Message and remove all references in the CameraCurve.
		 */
		cleanup: function() {
			this._super();
			this.eye = null;
			this.target = null;
		},

		/**
		 * Get the Octane structure for this CameraCurve.
	     *
	     * @return {Object} the Octane structure representing this CameraCurve
		 */
		toOctane: function() {
			var octane = this._super();

			octane.props.push({
				name: 'eye',
				oct: this.eye._toOctane()
			});
			octane.props.push({
				name: 'target',
				oct: this.target._toOctane()
			});

			return octane;
		}
	};

	hemi.ViewData = function(config) {
		var cfg = config || {};
		this.eye = cfg.eye || new THREE.Vector3(0,0,-1);
		this.target = cfg.target || new THREE.Vector3(0,0,0);
		this.fov = cfg.fov || hemi.viewDefaults.FOV;
		this.np = cfg.np || hemi.viewDefaults.NP;
		this.fp = cfg.fp ||hemi.viewDefaults.FP;
	};

	/**
	 * @class A Viewpoint describes everything needed for a view - eye, target,
	 * field of view, near plane, and far plane.
	 * @extends hemi.world.Citizen
	 */
	hemi.ViewpointBase = function(config) {
        var cfg = config || {};
        this.name = cfg.name || '';
        this.eye = cfg.eye || new THREE.Vector3(0,0,-1);
        this.target = cfg.target || new THREE.Vector3(0,0,0);
        this.fov = cfg.fov || hemi.viewDefaults.FOV;
        this.np = cfg.np || hemi.viewDefaults.NP;
        this.fp = cfg.fp ||hemi.viewDefaults.FP;
    };

    hemi.ViewpointBase.prototype = {
		/**
		 * Get the data contained within the Viewpoint.
		 *
		 * @return {hemi.ViewData} the ViewData for the Viewpoint
		 */
		getData: function() {
			return new hemi.ViewData(this);
		},

		/**
		 * Set the data for the Viewpoint.
		 *
		 * @param {hemi.ViewData} viewData data to set for the Viewpoint
		 */
		setData: function(viewData) {
			this.eye = viewData.eye;
			this.target = viewData.target;
			this.fov = viewData.fov;
			this.np = viewData.np;
			this.fp = viewData.fp;
		}
	};

	hemi.makeCitizen(hemi.ViewpointBase, 'hemi.Viewpoint', {
		toOctane: ['eye', 'target', 'fov', 'np', 'fp']
	});

	/**
	 * Create a new ViewData with the given Camera's current viewing parameters.
	 *
	 * @param {hemi.Camera} camera the Camera to create the Viewpoint from
	 * @return {hemi.ViewData} the newly created ViewData
	 */
	hemi.createViewData = function(camera) {
		return new hemi.ViewData({
			eye: camera.getEye(),
			target: camera.getTarget(),
			fov: camera.fov.current,
			np: camera.threeCamera.near,
			fp: camera.threeCamera.far
		});
	};

	/**
	 * Create a new Viewpoint with the given name and the given Camera's current
	 * viewing parameters.
	 *
	 * @param {string} name the name of the new Viewpoint
	 * @param {hemi.Camera} camera the Camera to create the Viewpoint from
	 * @return {hemi.Viewpoint} the newly created Viewpoint
	 */
	hemi.createViewpoint = function(name, camera) {
		var viewpoint = new hemi.Viewpoint({name: name});
		viewpoint.setData(this.createViewData(camera));
		return viewpoint;
	};

	/**
	 * Create a new Viewpoint with the given name and the given viewing
	 * parameters.
	 *
	 * @param {string} name the name of the new Viewpoint
	 * @param {Vector3} eye the coordinates of the eye
	 * @param {Vector3} target the coordinates of the target
	 * @param {number} fov angle of the field-of-view
	 * @return {hemi.Viewpoint} the newly created Viewpoint
	 */
	hemi.createCustomViewpoint = function(name, eye, target, fov, np, fp) {
		var viewPoint = new hemi.Viewpoint({
			name: name,
			eye: eye,
			target: target,
			fov: fov,
			np: np,
			fp: fp
		});

		return viewPoint;
	};

	return hemi;

})(hemi || {});
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

	var getObject3DsRecursive = function(name, obj3d, returnObjs) {
			for (var i = 0; i < obj3d.children.length; ++i) {
				var child = obj3d.children[i];

				if (child.name === name) {
					returnObjs.push(child);
				}

				getObject3DsRecursive(name, child, returnObjs);
			}
		};
	    
	hemi.ModelBase = function(scene) {
		this.scene = scene;
		this.fileName = null;
		this.root = null;
		this.animations = [];
		this.geometries = [];
		this.materials = [];
	};

	hemi.ModelBase.prototype = {
		getObject3Ds: function(name) {
			var obj3ds = [];
			getObject3DsRecursive(name, this.root, obj3ds);
			return obj3ds;
		},

		load: function() {
			var that = this;

			hemi.loadCollada(this.fileName, function (collada) {
				var animHandler = THREE.AnimationHandler,
					animations = collada.animations,
					toConvert = {};

				for (var i = 0, il = animations.length; i < il; ++i) {
					var node = animations[i].node;
					toConvert[node.id] = node;
				}

				if (that.root === null) {
					that.root = convertObject3Ds.call(that, collada.scene, toConvert);
				} else {
					that.root._init(collada.scene, toConvert);
				}

				that.scene.add(that.root);

				for ( var i = 0, il = collada.animations.length; i < il; i++ ) {
					var anim = animations[i];
					//Add to the THREE Animation handler to get the benefits of it's
					animHandler.add(anim);

					var kfAnim = new THREE.KeyFrameAnimation(toConvert[anim.node.id], anim.name);
					kfAnim.timeScale = 1;
					that.animations.push(kfAnim);
				}

				that.send(hemi.msg.load, {
					root: collada.scene
				});
			});
		},

		setFileName: function(fileName, callback) {
			this.fileName = fileName;
			this.load(callback);
		}
	};

	// Private functions for Model
	var convertObject3Ds = function(obj, toConvert) {
			var children = obj.children,
				newObj;

			if (obj.geometry) {
				newObj = new hemi.Mesh();
				newObj.geometry = obj.geometry;
				newObj.material = obj.material;
				newObj.boundRadius = obj.boundRadius;

				if (newObj.geometry.morphTargets.length) {
					newObj.morphTargetBase = obj.morphTargetBase;
					newObj.morphTargetForcedOrder = obj.morphTargetForcedOrder;
					newObj.morphTargetInfluences = obj.morphTargetInfluences;
					newObj.morphTargetDictionary = obj.morphTargetDictionary;
				}
				if (this.materials.indexOf(obj.material) === -1) {
					this.materials.push(obj.material);
				}
				if (this.geometries.indexOf(obj.geometry) === -1) {
					this.geometries.push(obj.geometry);
				}
			} else {
				newObj = new hemi.Transform();
			}

			newObj.name = obj.name;
			newObj.visible = obj.visible;
			newObj.position = obj.position;
			newObj.rotation = obj.rotation;
			newObj.quaternion = obj.quaternion;
			newObj.scale = obj.scale;
			newObj.useQuaternion = obj.useQuaternion;
			newObj.matrix = obj.matrix;
			newObj.matrixWorld = obj.matrixWorld;

			if (toConvert[obj.id] !== undefined) {
				toConvert[obj.id] = newObj;
			}

			for (var i = 0; i < children.length; ++i) {
				var newChild = convertObject3Ds.call(this, children[i], toConvert);
				newObj.add(newChild);
			}

			return newObj;
		};

	hemi.makeCitizen(hemi.ModelBase, 'hemi.Model', {
		cleanup: function() {
			this.root.cleanup();
			this.scene = null;
			this.root = null;
			this.animations = [];
			this.geometries = [];
			this.materials = [];
		},
		msgs: [hemi.msg.load],
		toOctane: ['fileName', 'root', 'scene', 'load']
	});

	return hemi;
})(hemi || {});
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
})(hemi || {});/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
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
		this.scene = new hemi.Scene();
		this.picker = new hemi.Picker(this.scene, this.camera);
		this.renderer = null;
		this.projector = new THREE.Projector();

		this.useCameraLight(true);
		this.scene.add(this.camera.threeCamera);
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
			this.bgColor = hex;
			this.bgAlpha = opt_alpha == null ? 1 : opt_alpha;
			this.renderer.setClearColorHex(this.bgColor, this.bgAlpha);
		},

		setCamera: function(camera) {
			this.scene.remove(this.camera.threeCamera);
			this.scene.remove(this.camera.light);
			this.scene.add(camera.threeCamera);
			this.scene.add(camera.light);
			this.camera.cleanup();
			this.picker.camera = camera;
			this.camera = camera;
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

		setScene: function(scene) {
			this.scene.remove(this.camera.threeCamera);
			this.scene.remove(this.camera.light);
			scene.add(this.camera.threeCamera);
			scene.add(this.camera.light);
			this.scene.cleanup();
			this.picker.scene = scene;
			this.scene = scene;
		},

		useCameraLight: function(useLight) {
			if (useLight) {
				this.scene.add(this.camera.light);
			} else {
				this.scene.remove(this.camera.light);
			}
		},

		clientPositionToRay: function(clientX, clientY) {
			var dom = this.renderer.domElement;
			var x = (clientX / dom.clientWidth) * 2 - 1;
			var y = -(clientY / dom.clientHeight) * 2 + 1;
			var projVector = new THREE.Vector3(x, y, 0.5);

			this.projector.unprojectVector(projVector, this.camera.threeCamera);
			return new THREE.Ray(this.camera.threeCamera.position, projVector.subSelf(this.camera.threeCamera.position).normalize());
		},

		getWidth: function() {
			return this.renderer.domElement.clientWidth;
		},

		getHeight: function() {
			return this.renderer.domElement.clientHeight;
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
					name: 'setScene',
					arg: [hemi.dispatch.ID_ARG + this.scene._getId()]
				}, {
					name: 'setCamera',
					arg: [hemi.dispatch.ID_ARG + this.camera._getId()]
				}
			];
		}
	});

	return hemi;
})(hemi || {});
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Loop class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Loop contains a start time and stop time as well as the number of iterations to
	 * perform for the Loop.
	 */
	var Loop = function() {
		/*
		 * The current iteration.
		 * @type number
		 */
		this._current = 0;

		/**
		 * The number of times the Loop repeats.
		 * @type number
		 * @default -1 (infinite)
		 */
		this.iterations = -1;

		/**
		 * The name of the Loop.
		 * @type string
		 * @default ''
		 */
		this.name = '';

		/**
		 * The time in an Animation that the Loop begins at.
		 * @type number
		 * @default 0
		 */
		this.startTime = 0;

		/**
		 * The time in an Animation that the Loop ends at.
		 * @type number
		 * @default 0
		 */
		this.stopTime = 0;
	};

	Loop.prototype._octane = ['iteration', 'name', 'startTime', 'stopTime'];

	hemi.Loop = Loop;
	hemi.makeOctanable(hemi.Loop, 'hemi.Loop', hemi.Loop.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// AnimationGroup class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class An AnimationGroup contains a group of animations to animate together as well as Loops
	 * for repeating sections of the AnimationGroup.
	 * 
	 * @param {number} opt_beginTime optional time to start animating
	 * @param {number} opt_endTime optional time to stop animating
	 * @param {hemi.Model} opt_model optional Model to grab KeyFrameAnimations from
	 */
	var AnimationGroup = function(opt_beginTime, opt_endTime, opt_model) {
		/*
		 * The current animation time.
		 * @type number
		 */
		this._currentTime = opt_beginTime ? opt_beginTime : 0;

		/*
		 * Flag indicating if the AnimationGroup is currently playing.
		 * @type boolean
		 */
		this._isAnimating = false;
	
		/**
		 * The animations to play.
		 * @type THREE.KeyFrameAnimation[]
		 */
		this.animations = opt_model ? opt_model.animations : [];

		/**
		 * The time the AnimationGroup begins at.
		 * @type number
		 * @default 0
		 */
		this.beginTime = opt_beginTime ? opt_beginTime : 0;

		/**
		 * The time the AnimationGroup ends at.
		 * @type number
		 * @default 0
		 */
		this.endTime = opt_endTime ? opt_endTime : 0;

		/**
		 * Any loops in the AnimationGroup.
		 * @type hemi.Loop[]
		 */
		this.loops = [];
	};

	/*
	 * Remove all references in the AnimationGroup.
	 */
	AnimationGroup.prototype._clean = function() {
		if (this._isAnimating) {
			this.stop();
		}

		this.animations = [];
		this.loops = [];
	};

	/*
	 * Array of Hemi Messages that AnimationGroup is known to send.
	 * @type string[]
	 */
	AnimationGroup.prototype._msgSent = [hemi.msg.animate, hemi.msg.start, hemi.msg.stop];

	/*
	 * Octane properties for AnimationGroup.
	 * @type string[]
	 */
	AnimationGroup.prototype._octane = ['beginTime', 'endTime', 'loops', 'reset'];
	// TODO: how to get animations in octane?

	/**
	 * Add the given Loop to the AnimationGroup.
	 *
	 * @param {hemi.Loop} loop the Loop to add
	 */
	AnimationGroup.prototype.addLoop = function(loop){
		if (this.loops.indexOf(loop) === -1) {
			this.loops.push(loop);
		}
	};

	/**
	 * Update the AnimationGroup's current time with the amount of elapsed time in the render event.
	 * Update the AnimationGroup's animations with the current animation time.
	 * 
	 * @param {Object} event event containing information about the render
	 */
	AnimationGroup.prototype.onRender = function(event){
		var previous = this.currentTime,
			delta = event.elapsedTime;

		this.currentTime += delta;
		checkLoops.call(this);

		this.send(hemi.msg.animate,
			{
				previous: previous,
				time: this.currentTime
			});

		if (this.currentTime >= this.endTime) {
			delta = this.endTime - previous;
			this.stop();
			this.reset();
		}

		for (var i = 0, il = this.animations.length; i < il; ++i) {
			this.animations[i].update(delta);
		}
	};

	/**
	 * Remove the given Loop from the AnimationGroup.
	 * 
	 * @param {hemi.Loop} loop the Loop to remove
	 * @return {hemi[Loop} the removed Loop or null
	 */
	AnimationGroup.prototype.removeLoop = function(loop) {
		var ndx = this.loops.indexOf(loop),
			found = null;

		if (ndx !== -1) {
			found = this.loops.splice(ndx, 1)[0];
		}

		return found;
	};

	/**
	 * Reset the AnimationGroup and its Loops to their initial states.
	 */
	AnimationGroup.prototype.reset = function() {
		this._currentTime = this.beginTime;

		for (var i = 0, il = this.loops.length; i < il; ++i) {
			this.loops[i]._current = 0;
		}
	};

	/**
	 * If the AnimationGroup is not currently animating, start it.
	 */
	AnimationGroup.prototype.start = function() {
		if (!this._isAnimating) {
			for (var i = 0, il = this.animations.length; i < il; ++i) {
				this.animations[i].play(false, this._currentTime);
			}

			this._isAnimating = true;
			hemi.addRenderListener(this);
			this.send(hemi.msg.start, {});
		}
	};

	/**
	 * If the AnimationGroup is currently running, stop it.
	 */
	AnimationGroup.prototype.stop = function() {
		if (this._isAnimating) {
			for (var i = 0, il = this.animations.length; i < il; ++i) {
				this.animations[i].stop();
			}

			hemi.removeRenderListener(this);
			this._isAnimating = false;
			this.send(hemi.msg.stop, {});
		}
	};

// Private functions for AnimationGroup

	/**
	 * Check if the current time of the AnimationGroup needs to be reset by any of its Loops. If a
	 * Loop resets the current time, increment that Loop's iteration counter.
	 */
	var checkLoops = function() {
			for (var i = 0, il = this.loops.length; i < il; ++i) {
				var loop = this.loops[i];
				
				if (loop._current !== loop.iterations && this.currentTime >= loop.stopTime) {
					this.currentTime = loop.startTime;
					loop._current++;
				}
			}
		};

	hemi.makeCitizen(AnimationGroup, 'hemi.AnimationGroup', {
		cleanup: AnimationGroup.prototype._clean,
		toOctane: AnimationGroup.prototype._octane
	});

	return hemi;
})(hemi || {});
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

/**
 * @fileoverview Motion describes classes for automatically translating
 * and rotating objects in the scene.
 */

var hemi = (function(hemi) {

    hemi = hemi || {};

    /**
     * @class A Rotator makes automated rotation easier by allowing simple
     * calls such as setVel to begin the automated spinning of a Transform.
     * @extends hemi.world.Citizen
     *
     * @param {THREE.Object3d} opt_tran optional transform that will be spinning
     * @param {Object} opt_config optional configuration for the Rotator
     */
    hemi.RotatorBase = function(opt_tran, opt_config) {
        var cfg = opt_config || {};

        this.accel = cfg.accel || new THREE.Vector3();
        this.angle = cfg.angle || new THREE.Vector3();
        this.vel = cfg.vel || new THREE.Vector3();

        this.time = 0;
        this.stopTime = 0;
        this.steadyRotate = false;
        this.mustComplete = false;
        this.startAngle = this.angle.clone();
        this.stopAngle = this.angle.clone();
        this.toLoad = {};
        this.transformObjs = [];

        if (opt_tran != null) {
            this.addTransform(opt_tran);
        }

        this.enable();
    };

    hemi.RotatorBase.prototype = {
        /**
         * Add a Transform to the list of Transforms that will be spinning. A
         * child Transform is created to allow the Rotator to spin about an
         * arbitray axis.
         *
         * @param {THREE.Object3D} transform the Transform to add
         */
        addTransform : function(transform) {
            this.transformObjs.push(transform);
            applyRotator.call(this, [transform]);
        },

        /**
         * Clear properties like acceleration, velocity, etc.
         */
        clear: function() {
            this.accel = new THREE.Vector3(0,0,0);
            this.angle =  new THREE.Vector3(0,0,0);
            this.vel =  new THREE.Vector3(0,0,0);
        },

        /**
         * Clear the list of spinning Transforms.
         */
        clearTransforms: function() {
            while (this.transformObjs.length > 0) {
                removeRotateTransforms.call(this, this.transformObjs[0]);
            }
        },

        /**
         * Disable mouse interaction for the Rotator.
         */
        disable: function() {
            if (this.enabled) {
                hemi.removeRenderListener(this);
                this.enabled = false;
            }
        },

        /**
         * Enable mouse interaction for the Rotator.
         */
        enable: function() {
            this.enabled = true;
            shouldRender.call(this);
        },

        /**
         * Get the Transforms that the Rotator currently contains.
         *
         * @return {THREE.Object3D[]} array of Transforms
         */
        getTransforms: function() {
            return this.transformObjs.slice();
        },

        /**
         * Make the Rotator rotate the specified amount in the specified amount
         * of time.
         *
         * @param {THREE.Vecto3} theta XYZ amounts to rotate (in radians)
         * @param {number} time number of seconds for the rotation to take
         * @param {boolean} opt_mustComplete optional flag indicating that no
         *     other rotations can be started until this one finishes
         */
        rotate: function(theta,time,opt_mustComplete) {
            if (!this.enabled || this.mustComplete) return false;
            this.time = 0;
            this.stopTime = time || 0.001;
            this.steadyRotate = true;
            this.startAngle = this.angle.clone();
            this.mustComplete = opt_mustComplete || false;
            this.stopAngle.add(this.angle, theta);
            hemi.addRenderListener(this);
            this.send(hemi.msg.start,{});
            return true;
        },

        /**
         * Render event listener - Perform Newtonian calculations on the
         * rotating object, starting with the angular velocity.
         *
         * @param {o3d.Event} event message describing the render event
         */
        onRender: function(event) {
            if (this.transformObjs.length > 0) {
                var t = event.elapsedTime;
                if (this.steadyRotate) {
                    this.time += t;
                    if (this.time >= this.stopTime) {
                        this.time = this.stopTime;
                        this.steadyRotate = this.mustComplete = false;
                        hemi.removeRenderListener(this);
                        this.send(hemi.msg.stop,{});
                    }
                    var t1 = this.time/this.stopTime;
                    var newAngle = hemi.utils.lerp(
                        [this.startAngle.x, this.startAngle.y, this.startAngle.z],
                        [this.stopAngle.x, this.stopAngle.y, this.stopAngle.z],
                        t1);
                    this.angle.x = newAngle[0];
					this.angle.y = newAngle[1];
					this.angle.z = newAngle[2];
                } else {
                    this.vel.addSelf(this.accel.clone().multiplyScalar(t));
                    this.angle.addSelf(this.vel.clone().multiplyScalar(t));
                }

                applyRotator.call(this);
            }
        },

		removeTransforms : function(tranObj) {
			var ndx = this.transformObjs.indexOf(tranObj);

			if (ndx > -1) {
				this.transformObjs.splice(ndx, 1);
			}
		},

        /**
         * Set the angular acceleration.
         *
         * @param {THREE.Vector3} accel XYZ angular acceleration (in radians)
         */
        setAccel: function(accel) {
            this.accel = accel.clone();
            shouldRender.call(this);
        },

        /**
         * Set the current rotation angle.
         *
         * @param {THREE.Vector3} theta XYZ rotation angle (in radians)
         */
        setAngle: function(theta) {
            this.angle = theta.clone();
            applyRotator.call(this);
        },
		
		/**
		 * Set the origin of the Rotator transform.
		 * 
		 * @param {number[3]} origin amount to shift the origin by
		 */
		setOrigin: function(origin) {
			var originVec = new THREE.Vector3().set(-origin[0], -origin[1], -origin[2]),
				tranMat = new THREE.Matrix4().setTranslation(-origin[0], -origin[1], -origin[2]);

			for (var i = 0, il = this.transformObjs.length; i < il; ++i) {
				var transform = this.transformObjs[i],
					geometry = transform.geometry,
					scene = transform.parent,
					world = transform.matrixWorld,
					delta = new THREE.Vector3().multiply(originVec, transform.scale),
					dx = delta.x,
					dy = delta.y,
					dz = delta.z;

				while (scene.parent != null) {
					scene = scene.parent;
				}

				// Re-center geometry around given origin
				hemi.utils.shiftGeometry(transform, tranMat, scene);

				// Offset local position so geometry's world position doesn't change
				delta.x = dx * world.n11 + dy * world.n12 + dz * world.n13;
				delta.y = dx * world.n21 + dy * world.n22 + dz * world.n23;
				delta.z = dx * world.n31 + dy * world.n32 + dz * world.n33;
				transform.position.subSelf(delta);
				transform.updateMatrix();
				transform.updateMatrixWorld();
			}
		},

        /**
         * Set the angular velocity.
         *
         * @param {THREE.Vector3} vel XYZ angular velocity (in radians)
         */
        setVel: function(vel) {
            this.vel = vel.clone();
            shouldRender.call(this);
        },

        /**
         * Get the Octane structure for the Rotator.
         *
         * @return {Object} the Octane structure representing the Rotator
         */
        toOctane: function() {
            var octane = this._super(),
                valNames = ['accel', 'angle', 'vel'];

            for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
                var name = valNames[ndx];

                octane.props.push({
                    name: name,
                    val: this[name]
                });
            }

            octane.props.push({
                name: 'setOrigin',
                arg: [this.origin]
            });

            // Save the local matrices of the transforms so we can restore them
            var tranOct = {};

            for (var i = 0, il = this.transformObjs.length; i < il; i++) {
                var tranObj = this.transformObjs[i],
                    origTran = tranObj.offTran,
                    rotTran = tranObj.rotTran;

                // Note: this will break if the Rotator has more than one
                // transform with the same name
                tranOct[origTran.name] = [
                    tranObj.parent.localMatrix,
                    rotTran.localMatrix,
                    origTran.localMatrix
                ];
            }

            octane.props.push({
                name: 'toLoad',
                val: tranOct
            });

            return octane;
        }
    };

    hemi.makeCitizen(hemi.RotatorBase, 'hemi.Rotator', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});
	/**
	 * @class A Translator provides easy setting of linear velocity and
	 * acceleration of shapes and transforms in the 3d scene.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {THREE.Object3D} opt_tran optional Transform that will be moving
	 * @param {Object} opt_config optional configuration for the Translator
	 */
	hemi.TranslatorBase = function(opt_tran, opt_config) {
		var cfg = opt_config || {};

		this.pos = cfg.pos || new THREE.Vector3();
		this.vel = cfg.vel || new THREE.Vector3();
		this.accel = cfg.accel || new THREE.Vector3();

		this.time = 0;
		this.stopTime = 0;
		this.mustComplete = false;
		this.steadyMove = false;
		this.startPos = this.pos.clone();
		this.stopPos = this.pos.clone();
		this.toLoad = {};
		this.transformObjs = [];

		if (opt_tran != null) {
			this.addTransform(opt_tran);
		}

		this.enable();
	};


	hemi.TranslatorBase.prototype = {
		/**
		 * Add the Transform to the list of Transforms that will be moving.
		 *
		 * @param {THREE.Object3D} transform the Transform to add
		 */
		addTransform: function(transform) {
			this.transformObjs.push(transform);
			applyTranslator.call(this, [transform]);
		},

		/**
		 * Send a cleanup Message and remove all references in the Translator.
		 */
		cleanup: function() {
			this.disable();
			this.clearTransforms();
		},

		/**
		 * Clear properties like acceleration, velocity, etc.
		 */
		clear: function() {
			this.pos = new THREE.Vector3();
			this.vel = new THREE.Vector3();
			this.accel = new THREE.Vector3();
		},

		/**
		 * Clear the list of translating Transforms.
		 */
		clearTransforms: function() {
			while (this.transformObjs.length > 0) {
				this.removeTransform(this.transformObjs[0]);
			}
		},

		/**
		 * Disable mouse interaction for the Translator. 
		 */
		disable: function() {
			if (this.enabled) {
				hemi.removeRenderListener(this);
				this.enabled = false;
			}
		},

		/**
		 * Enable mouse interaction for the Translator. 
		 */
		enable: function() {
			this.enabled = true;
			shouldRender.call(this);
		},

		/**
		 * Get the Transforms that the Translator currently contains.
		 * 
		 * @return {THREE.Object3D[]} array of Transforms
		 */
		getTransforms: function() {
		    return this.transformObjs.slice();
		},

		/**
		 * Make the Translator translate the specified amount in the specified
		 * amount of time.
		 * 
		 * @param {THREE.Vector3} delta XYZ amount to translate
		 * @param {number} time number of seconds for the translation to take
		 * @param {boolean} opt_mustComplete optional flag indicating that no
		 *     other translations can be started until this one finishes
		 */
		move : function(delta,time,opt_mustComplete) {
			if (!this.enabled || this.mustComplete) return false;
			this.time = 0;
			this.stopTime = time || 0.001;
			this.steadyMove = true;
			this.startPos = this.pos.clone();
			this.mustComplete = opt_mustComplete || false;
			this.stopPos.add(this.pos, delta);
			hemi.addRenderListener(this);
			this.send(hemi.msg.start,{});
			return true;
		},

		/**
		 * Render event listener - calculate the position of the Translator,
		 * based on the acceleration and velocity.
		 * 
		 * @param {o3d.Event} event message describing render event
		 */
		onRender : function(event) {
			if (this.transformObjs.length > 0) {
				var t = event.elapsedTime;
				if (this.steadyMove) {
					this.time += t;
					if (this.time >= this.stopTime) {
						this.time = this.stopTime;
						this.steadyMove = this.mustComplete = false;
						hemi.removeRenderListener(this);
						this.send(hemi.msg.stop,{});
					}
					var t1 = this.time/this.stopTime;
					var newPos = hemi.utils.lerp(
						[this.startPos.x, this.startPos.y, this.startPos.z],
						[this.stopPos.x, this.stopPos.y, this.stopPos.z],
						t1);
					this.pos.x = newPos[0];
					this.pos.y = newPos[1];
					this.pos.z = newPos[2];
				} else {
					this.vel.addSelf(this.accel.clone().multiplyScalar(t));
					this.pos.addSelf(this.vel.clone().multiplyScalar(t));
				}

				applyTranslator.call(this);
			}
		},

		removeTransforms : function(tranObj) {
			var ndx = this.transformObjs.indexOf(tranObj);

			if (ndx > -1) {
				this.transformObjs.splice(ndx, 1);
			}
		},

		/**
		 * Set the acceleration.
		 * 
		 * @param {THREE.Vector3} a XYZ acceleration vector
		 */
		setAccel: function(a) {
			this.accel = a.clone();
			shouldRender.call(this);
		},

		/**
		 * Set the position.
		 * 
		 * @param {THREE.Vector3} x XYZ position
		 */
		setPos: function(x) {
			this.pos = x.clone();
			applyTranslator.call(this);
		},

		/**
		 * Set the velocity.
		 * @param {THREE.Vector3} v XYZ velocity vector
		 */
		setVel: function(v) {
			this.vel = v.clone();
			shouldRender.call(this);
		}
	};

	hemi.makeCitizen(hemi.TranslatorBase, 'hemi.Translator', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});

	///////////////////////////////////////////////////////////////////////////
	// Private functions
	///////////////////////////////////////////////////////////////////////////
	shouldRender = function() {
		if (!this.enabled ||  (this.accel.isZero() && this.vel.isZero())) {
			hemi.removeRenderListener(this);
		} else {
			hemi.addRenderListener(this);
		}
	};

	applyTranslator = function(opt_objs) {
		var objs = this.transformObjs;

		if (opt_objs) {
			objs = opt_objs;
		}

		for (var i = 0, il = objs.length; i < il; i++) {
			var transform = objs[i];

			transform.position = this.pos.clone();
			transform.updateMatrix();
			transform.updateMatrixWorld();
		}
	};

	
	applyRotator = function(opt_objs) {
		var objs = this.transformObjs;

		if (opt_objs) {
			objs = opt_objs;
		}

		for (var i = 0, il = objs.length; i < il; i++) {
			var transform = objs[i];

			if (transform.useQuaternion) {
				transform.quaternion.setFromEuler(new THREE.Vector3(
				 this.angle.x * hemi.RAD_TO_DEG, this.angle.y * hemi.RAD_TO_DEG, this.angle.z * hemi.RAD_TO_DEG));
			} else {
				transform.rotation.copy(this.angle);
			}

			transform.updateMatrix();
			transform.updateMatrixWorld();
		}
	};

	return hemi;
})(hemi || {});/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
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

	hemi.base = hemi.base || {};

		/**
		 * Get a function that sets each particle's acceleration by applying a
		 * factor to that particle's velocity. Valid options are:
		 * - factor : number[3] a factor to apply to each particle's XYZ velocity
		 *
		 * @param {Object} options customization options for the particle parameters
		 * @return {function(number, hemi.core.particles.ParticleSpec): void} an
		 *	   instance of the ParticleFunctionId.Acceleration function
		 */
	var getAccelerationFunction = function(options) {
			var acc = function (index, parameters) {
				parameters.acceleration = [
					acc.factor[0] * parameters.velocity[0],
					acc.factor[1] * parameters.velocity[1],
					acc.factor[2] * parameters.velocity[2]
				];
			};

			acc.factor = options.factor === undefined ? [0, 0, 0] : options.factor;
			return acc;
		},

		/**
		 * Get a function that sets each particle's velocity and acceleration to
		 * create a windblown puff effect. Valid options are:
		 * - wind : number[3] an XYZ acceleration to apply to each particle
		 * - size : number a factor to determine the size of the puff
		 * 
		 * @param {Object} options customization options for the particle parameters
		 * @return {function(number, hemi.core.particles.ParticleSpec): void} an
		 *	   instance of the ParticleFunctionId.Puff function
		 */
		getPuffFunction = function(options) {
			var puff = function (index, parameters) {
				var angle = Math.random() * 2 * Math.PI,
					speed = 0.8 * puff.size,
					drag = -0.003 * puff.size;
				// Calculate velocity
				parameters.velocity = hemi.core.math.matrix4.transformPoint(
					hemi.core.math.matrix4.rotationY(7 * angle),
					[speed,speed,speed]);
				parameters.velocity = hemi.core.math.matrix4.transformPoint(
					hemi.core.math.matrix4.rotationX(angle),
					parameters.velocity);
				// Calculate acceleration
				parameters.acceleration = hemi.core.math.mulVectorVector(
					parameters.velocity,
					[drag,drag,drag]);
				parameters.acceleration = hemi.core.math.addVector(
					parameters.acceleration,
					puff.wind);
			};

			puff.wind = options.wind === undefined ? [0, 0, 0] : options.wind;
			puff.size = options.size === undefined ? 1 : options.size;
			return puff;
		},

		defaultParticleSystem = new hemi.particles.System();

	// The default particle system updates using render time.
	hemi.addRenderListener({
		onRender: function(event) {
			defaultParticleSystem.update(event.elapsedTime);
		}
	});

	/**
	 * A set of names of predefined per-particle parameter setting functions.
	 * <ul><pre>
	 * <li>hemi.ParticleFunctionIds.Acceleration
	 * <li>hemi.ParticleFunctionIds.Puff
	 * </ul></pre>
	 */
	hemi.ParticleFunctionIds = {
		Acceleration : 'Acceleration',
		Puff: 'Puff'
	};

	/**
	 * @class A ParticleFunction specifies a predefined per-particle parameter
	 * setting function and any properties it might require.
	 * @example
	 * Each function must be of the form:
	 * 
	 * function(number, hemi.core.particles.ParticleSpec): void
	 * 
	 * The number is the index of the particle being created. The ParticleSpec
	 * is a set of parameters for that particular particle.
	 */
	hemi.ParticleFunction = function() {
		/**
		 * The name of the predefined parameter setting function.
		 * @type hemi.ParticleFunctionIds
		 */
		this.name = null;

		/**
		 * A set of options to customize values that the function uses to
		 * calculate the particle parameters.
		 * @type Object
		 */
		this.options = {};
	};

	hemi.makeOctanable(hemi.ParticleFunction, 'hemi.ParticleFunction', ['name', 'options']);

	/**
	 * @class A ParticleEmitter constantly generates particles.
	 */
	hemi.base.ParticleEmitter = function(client) {
		this._newSystem = false;
		this._system = null;

		/**
		 * The blending state to use for drawing particles.
		 * @type number
		 * @default THREE.AdditiveBlending
		 */
		this.blending = THREE.AdditiveBlending;

		this.client = client;

		/**
		 * An array of colors for each particle to transition through. Each
		 * color value is in the form RGBA.
		 * @type number[]
		 */
		this.colorRamp = [];

		/**
		 * A set of parameters for the ParticleEmitter.
		 * @type hemi.particles.Spec
		 */
		this.params = {};

		/**
		 * Optional specs that identify a particle updating function to use and
		 * properties to set for it.
		 * @type hemi.ParticleFunctionIds
		 */
		this.particleFunction = null;

		/* The actual emitter for the ParticleEmitter */
		this.particles = null;

		/* The containing Transform for the Effect */
		this.transform = null;
	};

	hemi.base.ParticleEmitter.prototype._clean = function() {
		var emitters = this._system.emitters,
			ndx = emitters.indexOf(this.particles);

		emitters.splice(ndx, 1);
		this.transform.parent.remove(this.transform);
		this.transform = null;
		this.particles = null;
	};

	hemi.base.ParticleEmitter.prototype._msgs = [hemi.msg.visible];

	hemi.base.ParticleEmitter.prototype._octane = ['_newSystem', 'blending',
		'client', 'colorRamp', 'params', 'particleFunction', 'setup'];

	/**
	 * Set the ParticleEmitter to not be visible.
	 */
	hemi.base.ParticleEmitter.prototype.hide = function() {
		if (this.particles === null) {
			this.setup();
		}

		if (this.transform.visible) {
			this.transform.visible = false;
			this.send(hemi.msg.visible, {
				visible: false
			});
		}
	};

	/**
	 * Set the particles up for the ParticleEmitter.
	 */
	hemi.base.ParticleEmitter.prototype.setup = function() {
		// Create a deep copy of the parameters since the particle emitter
		// will mutate them as it fires.
		var clonedParams = hemi.utils.clone(this.params),
			paramSetter = null;

		// It's okay if paramSetter stays null.
		if (this.particleFunction !== null) {
			paramSetter = hemi.getParticleFunction(this.particleFunction);
		}

		this._system = this._newSystem ? new hemi.particles.System() : defaultParticleSystem;
		this.particles = this._system.createEmitter(this.client.camera.threeCamera);
		this.particles.setBlending(this.blending);
		this.particles.setColorRamp(this.colorRamp);
		this.particles.setParameters(clonedParams, paramSetter);

		this.transform = new THREE.Mesh(this.particles.shape, this.particles.material);
		this.transform.doubleSided = true; // turn off face culling
		this.client.scene.add(this.transform);
	};

	/**
	 * Set the ParticleEmitter to be visible.
	 */
	hemi.base.ParticleEmitter.prototype.show = function() {
		if (this.particles === null) {
			this.setup();
		}

		if (!this.transform.visible) {
			this.transform.visible = true;
			this.send(hemi.msg.visible,{
				visible: true
			});
		}
	};

	hemi.makeCitizen(hemi.base.ParticleEmitter, 'hemi.ParticleEmitter', {
		cleanup: hemi.base.ParticleEmitter.prototype._clean,
		msgs: hemi.base.ParticleEmitter.prototype._msgs,
		toOctane: hemi.base.ParticleEmitter.prototype._octane
	});

	/**
	 * @class A ParticlesBurst generates one set of particles at a time. It can
	 * be used for a smoke puff, explosion, firework, water drip, etc.
	 * @extends hemi.base.ParticleEmitter
	 */
	hemi.base.ParticleBurst = function(client) {
		hemi.base.ParticleEmitter.call(this, client);

		/* The OneShot particle effect */
		this.oneShot = null;
	};

	hemi.base.ParticleBurst.prototype = new hemi.base.ParticleEmitter();
	hemi.base.ParticleBurst.constructor = hemi.base.ParticleBurst;

	hemi.base.ParticleBurst.prototype._clean = function() {
		hemi.base.ParticleEmitter.prototype._clean.call(this);

		this.oneShot = null;
	};

	hemi.base.ParticleBurst.prototype._msgs = hemi.base.ParticleEmitter.prototype._msgs.concat(
		[hemi.msg.burst]);

	/**
	 * Set the particles up for the ParticleBurst.
	 */
	hemi.base.ParticleBurst.prototype.setup = function() {
		// Create a deep copy of the parameters since the particle emitter
		// will mutate them as it fires.
		var clonedParams = hemi.utils.clone(this.params),
			paramSetter = null;

		// It's okay if paramSetter stays null.
		if (this.particleFunction !== null) {
			paramSetter = hemi.getParticleFunction(this.particleFunction);
		}

		this._system = this._newSystem ? new hemi.particles.System() : defaultParticleSystem;
		this.particles = this._newSystem.createEmitter(this.client.camera.threeCamera);
		this.particles.setBlending(this.blending);
		this.particles.setColorRamp(this.colorRamp);
		this.particles.setParameters(clonedParams, paramSetter);

		this.transform = new THREE.Object3D();
		this.client.scene.add(this.transform);

		this.oneShot = this.particles.createOneShot(this.transform);
	};

	/**
	 * Generate the particles for the ParticleBurst.
	 */
	hemi.base.ParticleBurst.prototype.trigger = function() {
		if (this.oneShot === null) {
			this.setup();
		}

		this.oneShot.trigger(this.params.position);
		this.send(hemi.msg.burst, {
			position: this.params.position
		});
	};

	hemi.makeCitizen(hemi.base.ParticleBurst, 'hemi.ParticleBurst', {
		cleanup: hemi.base.ParticleBurst.prototype._clean,
		msgs: hemi.base.ParticleBurst.prototype._msgs,
		toOctane: hemi.base.ParticleBurst.prototype._octane
	});

	/**
	 * @class A ParticleTrail is a particle effect that can be started and
	 * stopped like an animation. It can be used for effects like exhaust.
	 * @extends hemi.base.ParticleEmitter
	 */
	hemi.base.ParticleTrail = function(client) {
		hemi.base.ParticleEmitter.call(this, client);

		/* A flag that indicates if the ParticleTrail is currently animating */
		this.isAnimating = false;
		/* The number of seconds between particle births */
		this.fireInterval = 1;
		this.count = 0;
	};

	hemi.base.ParticleTrail.prototype = new hemi.base.ParticleEmitter();
	hemi.base.ParticleTrail.constructor = hemi.base.ParticleTrail;

	hemi.base.ParticleTrail.prototype._msgs = hemi.base.ParticleEmitter.prototype._msgs.concat(
		[hemi.msg.start, hemi.msg.stop]);

	hemi.base.ParticleTrail.prototype._octane = hemi.base.ParticleEmitter.prototype._octane.unshift(
		'fireInterval');

	/**
	 * Render event handling function that allows the ParticleTrail to animate.
	 * 
	 * @param {o3d.Event} event the render event
	 */
	hemi.base.ParticleTrail.prototype.onRender = function(event) {
		this.count += event.elapsedTime;

		if (this.count >= this.fireInterval) {
			this.count = 0;
			this.particles.birthParticles(this.params.position);
		}
	};

	/**
	 * Set the particle emitter up for the ParticleTrail.
	 */
	hemi.base.ParticleTrail.prototype.setup = function() {
		// Create a deep copy of the parameters since the particle emitter
		// will mutate them as it fires.
		var clonedParams = hemi.utils.clone(this.params),
			paramSetter = null,

		// Calculate the maximum number of particles for the stream
			particlesPerFire = this.params.numParticles || 1,
			maxLife = this.params.lifeTime || 1 + this.params.lifeTimeRange || 0,
			maxFires = (maxLife / this.fireInterval) + 1,
			maxParticles = parseInt(maxFires * particlesPerFire, 10);

		// It's okay if paramSetter stays undefined.
		if (this.particleFunction !== null) {
			paramSetter = hemi.getParticleFunction(this.particleFunction);
		}

		this._system = this._newSystem ? new hemi.particles.System() : defaultParticleSystem;
		this.particles = this._newSystem.createTrail(
			this.client.camera.threeCamera,
			maxParticles,
			clonedParams,
			null,
			paramSetter);
		this.particles.setBlending(this.blending);
		this.particles.setColorRamp(this.colorRamp);
	};

	/**
	 * Start animating the ParticleTrail. It will generate particles based upon
	 * its fireInterval property.
	 */
	hemi.base.ParticleTrail.prototype.start = function() {
		if (this.particles === null) {
			this.setup();
		}

		if (!this.isAnimating) {
			this.isAnimating = true;
			hemi.view.addRenderListener(this);
			this.send(hemi.msg.start, { });
		}
	};

	/**
	 * Stop animating the ParticleTrail.
	 */
	hemi.base.ParticleTrail.prototype.stop = function() {
		if (this.particles === null) {
			this.setup();
		}

		if (this.isAnimating) {
			hemi.view.removeRenderListener(this);
			this.isAnimating = false;
			this.count = 0;
			this.send(hemi.msg.stop, { });
		}
	};

	hemi.makeCitizen(hemi.base.ParticleTrail, 'hemi.ParticleTrail', {
		cleanup: hemi.base.ParticleTrail.prototype._clean,
		msgs: hemi.base.ParticleTrail.prototype._msgs,
		toOctane: hemi.base.ParticleTrail.prototype._octane
	});

	/**
	 * Create a ParticleEmitter effect that constantly streams particles.
	 * 
	 * @param {hemi.Client} client the Client to render the effect
	 * @param {number[]} colorRamp array of color values in the form RGBA
	 * @param {hemi.particles.Spec} params parameters for the ParticleEmitter
	 * @param {number} opt_blending optional blending to use to draw particles
	 * @param {hemi.ParticleFunction} opt_function optional specs that identify
	 *	   a particle updating function to use and properties to set for it
	 * @return {hemi.ParticleEmitter} the newly created ParticleEmitter
	 */
	hemi.createParticleEmitter = function(client, colorRamp, params, opt_blending, opt_function) {
		var emitter = new hemi.ParticleEmitter(client);
		emitter.colorRamp = colorRamp;
		emitter.params = params;

		if (opt_blending != null) emitter.blending = blending;
		if (opt_function)  emitter.particleFunction = opt_function;

		emitter.setup();
		return emitter;
	};

	/**
	 * Create a ParticleBurst effect that fires particles one shot at a time.
	 * 
	 * @param {hemi.Client} client the Client to render the effect
	 * @param {number[]} colorRamp array of color values in the form RGBA
	 * @param {hemi.particles.Spec} params parameters for the ParticleEmitter
	 * @param {number} opt_blending optional blending to use to draw particles
	 * @param {hemi.ParticleFunction} opt_function optional specs that identify
	 *	   a particle updating function to use and properties to set for it
	 * @return {hemi.ParticleBurst} the newly created ParticleBurst
	 */
	hemi.createParticleBurst = function(client, colorRamp, params, opt_blending, opt_function) {
		var burst = new hemi.ParticleBurst(client);
		burst.colorRamp = colorRamp;
		burst.params = params;

		if (opt_blending != null) burst.blending = blending;
		if (opt_function)  burst.particleFunction = opt_function;

		burst.setup();
		return burst;
	};

	/**
	 * Create a ParticleTrail effect that fires particles at the specified
	 * interval.
	 * 
	 * @param {hemi.Client} client the Client to render the effect
	 * @param {number[]} colorRamp array of color values in the form RGBA
	 * @param {hemi.particles.Spec} params parameters for the ParticleEmitter
	 * @param {number} fireInterval seconds to wait between firing particles
	 * @param {number} opt_blending optional blending to use to draw particles
	 * @param {hemi.ParticleFunction} opt_function optional specs that identify
	 *	   a particle updating function to use and properties to set for it
	 * @return {hemi.ParticleTrail} the newly created ParticleTrail
	 */
	hemi.createParticleTrail = function(client, colorRamp, params, fireInterval, opt_blending, opt_function) {
		var trail = new hemi.ParticleTrail(client);
		trail.colorRamp = colorRamp;
		trail.params = params;
		trail.fireInterval = fireInterval;

		if (opt_blending != null) trail.blending = blending;
		if (opt_function)  trail.particleFunction = opt_function;

		trail.setup();
		return trail;
	};

	/**
	 * Get the predefined per-particle parameter setting function for the given
	 * specs.
	 *
	 * @param {hemi.ParticleFunction} funcSpecs specs that identify the
	 *	   particle function to get and properties to set for it
	 * @return {function(number, hemi.particles.Spec): void} an instance of the
	 *	   predefined function with the appropriate properties set or null if
	 *	   the function name is not recognized
	 */
	hemi.getParticleFunction = function(funcSpecs) {
		var particleFunc;

		switch(funcSpecs.name) {
			case hemi.ParticleFunctionIds.Acceleration:
				particleFunc = getAccelerationFunction(funcSpecs.options);
				break;
			case hemi.ParticleFunctionIds.Puff:
				particleFunc = getPuffFunction(funcSpecs.options);
				break;
			default:
				particleFunc = null;
				break;
		}

		return particleFunc;
	};

	return hemi;
})(hemi || {});
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
		/*
		 * Get the CSS RGBA string for the given color array in 0-1 format.
		 * @param {number[4]} col color array
		 * @return {string} the equivalent RGBA string
		 */
	var getRgba = function(col) {
			return 'rgba(' + Math.round(col[0]*255) + ',' + Math.round(col[1]*255) + ',' +
				Math.round(col[2]*255) + ',' + col[3] + ')';
		},
		/**
		 * Set the painting properties for the given 2D canvas context.
		 * 
		 * @param {Object} context the 2D canvas context
		 * @param {Object} options the options for painting
		 */
		setPaintProperties = function(context, options) {
			var font = options.textStyle == null ? '' : options.textStyle + ' ';

			if (options.textSize != null) {
				font += options.textSize + 'px ';
			} else {
				font += '12px ';
			}
			if (options.textTypeface != null) {
				font += '"' + options.textTypeface + '"';
			} else {
				font += 'helvetica';
			}

			context.font = font;

			if (options.textAlign != null) {
				context.textAlign = options.textAlign;
			}
			if (options.color != null) {
				context.fillStyle = getRgba(options.color);
			}
			if (options.outline != null) {
				context.strokeStyle = getRgba(options.outline);
				// If there is an outline, cancel the shadow.
				context.shadowColor = 'rgba(0,0,0,0)';
			} else if (options.shadow != null) {
				var shad = options.shadow;
				context.shadowBlur = shad.radius;
				context.shadowColor = getRgba(shad.color);
				context.shadowOffsetX = shad.offsetX;
				context.shadowOffsetY = shad.offsetY;
			} else {
				context.shadowColor = 'rgba(0,0,0,0)';
			}
		};

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudTheme class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudTheme contains configuration options for displaying HUD elements like pages and
	 * text.
	 */
	var HudTheme = function() {
		/**
		 * Configuration options for an image foreground overlay.
		 * @type Object
		 */
		this.image = {
			/**
			 * Options for a blur shadow effect on the image. Set radius to 0 to cancel.
			 * @type Object
			 */
			shadow: {
				radius: 0,
				offsetY: 0,
				offsetX: 0,
				color: [0, 0, 0, 1]
			}
		};

		/**
		 * Configuration options for a rectangular background overlay.
		 * @type Object
		 */
		this.page = {
			/**
			 * The color and opacity of the rectangular overlay in RGBA format.
			 * @type number[4]
			 * @default [0, 0, 0, 0.45]
			 */
			color: [0, 0, 0, 0.45],

			/**
			 * The amount of curving to apply to the corners of the page. Range is from 0.0 to 1.0
			 * where 0 is a plain rectangle and 1 is an oval.
			 * @type number
			 * @default 0
			 */
			curve: 0,

			/**
			 * Options for a blur shadow effect on the page. This is mutually exclusive to outline.
			 * Set radius to 0 to cancel.
			 * @type Object
			 */
			shadow: {
				radius: 0,
				offsetY: 0,
				offsetX: 0,
				color: [0, 0, 0, 0]
			},

			/**
			 * Optional outline for the page in RGBA format. This is mutually exclusive to shadow.
			 * Set to null to cancel.
			 * @type number[4]
			 */
			outline: null
		};

		/**
		 * Configuration options for a textual foreground overlay.
		 * @type Object
		 */
		this.text = {
			/**
			 * The font size of the text.
			 * @type number
			 * @default 12
			 */
			textSize: 12,

			/**
			 * The name of the font to use to paint the text.
			 * @type string
			 * @default 'helvetica'
			 */
			textTypeface: 'helvetica',

			/**
			 * The horizontal alignment of the text.
			 * @type string
			 * @default 'center'
			 */
			textAlign: 'center',

			/**
			 * Additional styling for the text (normal, bold, italics)
			 * @type string
			 * @default 'bold'
			 */
			textStyle: 'bold',

			/**
			 * Flag to indicate if the HudManager should perform strict text wrapping.
			 * @type boolean
			 * @default true
			 */
			strictWrapping: true,

			/**
			 * Number of pixels to place between lines of text.
			 * @type number
			 * @default 5
			 */
			lineMargin: 5,

			/**
			 * The color and opacity of the text in RGBA format.
			 * @type number[4]
			 * @default [1, 1, 0.6, 1]
			 */
			color: [1, 1, 0.6, 1],

			/**
			 * Options for a blur shadow effect on the text. This is mutually exclusive to outline.
			 * Set radius to 0 to cancel.
			 * @type Object
			 */
			shadow: {
				radius: 0.5,
				offsetY: 1,
				offsetX: 1,
				color: [0, 0, 0, 1]
			},

			/**
			 * Optional outline for the text in RGBA format. This is mutually exclusive to shadow.
			 * Set to null to cancel.
			 * @type number[4]
			 */
			outline: null
		};

		/**
		 * Configuration options for a video foreground overlay.
		 * @type Object
		 */
		this.video = {
			/**
			 * Options for a blur shadow effect on the video. Set radius to 0 to cancel.
			 * @type Object
			 */
			shadow: {
				radius: 0,
				offsetY: 0,
				offsetX: 0,
				color: [0, 0, 0, 1]
			}
		};
	};

	/*
	 * Octane properties for the HudTheme.
	 */
	HudTheme.prototype._octane = ['image', 'page', 'text', 'load'];

	/**
	 * Set the HudTheme as the current theme for HUD displays.
	 */
	HudTheme.prototype.load = function() {
		hemi.setHudTheme(this);
	};

	hemi.HudTheme = HudTheme;
	hemi.makeOctanable(hemi.HudTheme, 'hemi.HudTheme', hemi.HudTheme.prototype._octane);

	/*
	 * The current HUD theme being used for default properties.
	 */
	var currentTheme = new hemi.HudTheme();
	currentTheme.name = 'Default';

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudElement class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * @class A HudElement contains the basics of any element to be drawn on the canvas.
	 */
	var HudElement = function() {
		/*
		 * The y-value of the lower boundary of the HudElement. This value should be calculated at
		 * draw time rather than set directly.
		 * @type number 
		 */
		this._bottom = 0;

		/*
		 * The x-value of the left boundary of the HudElement. This value should be calculated at
		 * draw time rather than set directly.
		 * @type number 
		 */
		this._left = 0;

		/*
		 * The x-value of the right boundary of the HudElement. This value should be calculated at
		 * draw time rather than set directly.
		 * @type number 
		 */
		this._right = 0;

		/*
		 * The y-value of the upper boundary of the HudElement. This value should be calculated at
		 * draw time rather than set directly.
		 * @type number 
		 */
		this._top = 0;

		/**
		 * Unique display options for the HudElement. All other display options will be derived from
		 * the current theme.
		 * @type {Object}
		 */
		this.config = {};

		/**
		 * The handler function for mouse down events that occur within the bounds of the
		 * HudElement.
		 * @type function(o3d.Event): void
		 */
		this.mouseDown = null;

		/**
		 * The handler function for mouse up events that occur within the bounds of the HudElement.
		 * @type function(o3d.Event): void
		 */
		this.mouseUp = null;

		/**
		 * The handler function for mouse move events. It takes the Event and a boolean indicating
		 * if the Event occurred within the bounds of the HudElement.
		 * @type function(o3d.Event, boolean): void
		 */
		this.mouseMove = null;

		/**
		 * Allows the element to be drawn or not.
		 * @type boolean
		 */
		this.visible = true;
	};

	/*
	 * Check if the given Event occurred within the bounds of the HudElement.
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of the HudElement, otherwise
	 *     false
	 */
	HudElement.prototype._checkEvent = function(event) {
		return event.x <= this._right &&
			event.x >= this._left &&
			event.y <= this._bottom &&
			event.y >= this._top;
	};

	/*
	 * Octane properties for the HudElement.
	 */
	HudElement.prototype._octane = ['_bottom', '_left', '_right', '_top', 'config'];

	/**
	 * Remove all references in the HudElement.
	 */
	HudElement.prototype.cleanup = function() {
		this.mouseDown = null;
		this.mouseUp = null;
		this.mouseMove = null;
		this.config = {};
	};

	/**
	 * If the given Event occurred within the bounds of this HudElement, call the HudElement's mouse
	 * down handler function (if one was set).
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of this HudElement, otherwise
	 *     false
	 */
	HudElement.prototype.onMouseDown = function(event) {
		var intersected = this._checkEvent(event);

		if (intersected && this.mouseDown) {
			this.mouseDown(event);
		}

		return intersected;
	};

	/**
	 * If the HudElement's mouse move handler function is set, pass it the given Event and if it
	 * occurred within the bounds of this HudElement.
	 * 
	 * @param {Object} event the event that occurred
	 */
	HudElement.prototype.onMouseMove = function(event) {
		if (this.mouseMove) {
			var intersected = this._checkEvent(event);
			this.mouseMove(event, intersected);
		}
	};

	/**
	 * If the given Event occurred within the bounds of this HudElement, call the HudElement's mouse
	 * up handler function (if one was set).
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of this HudElement, otherwise
	 *     false
	 */
	HudElement.prototype.onMouseUp = function(event) {
		var intersected = this._checkEvent(event);

		if (intersected && this.mouseUp) {
			this.mouseUp(event);
		}

		return intersected;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudText class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudText contains formated text and display options for a single area of text on the
	 * HUD.
	 * @extends HudElement
	 */
	var HudText = function() {
		HudElement.call(this);

		/*
		 * The original text before it is wrapped to fit into the given width. It should typically
		 * not be set directly.
		 * @type string[]
		 */
		this._text = [];

		/*
		 * The maximum width that the text should span before being wrapped. It should typically not
		 * be set directly.
		 * @type number
		 */
		this._width = 0;

		/*
		 * The height of the formatted text. This property is calculated whenever the text, config,
		 * or width are set. It should typically not be set directly.
		 * @type number
		 */
		this._wrappedHeight = 0;

		/*
		 * The formatted text that is actually drawn on screen. This property is created whenever
		 * the text, config, or width are set. It should typically not be set directly.
		 * @type string[]
		 */
		this._wrappedText = [];

		/*
		 * The width of the formatted text. This property is calculated whenever the text, config,
		 * or width are set. It should typically not be set directly.
		 * @type number
		 */
		this._wrappedWidth = 0;

		/**
		 * The x-coordinate of the HudText. The actual on screen location will depend on the
		 * horizontal alignment of the text.
		 * @type number
		 * @default 0
		 */
		this.x = 0;

		/**
		 * The y-coordinate of the top of the HudText.
		 * @type number
		 * @default 0
		 */
		this.y = 0;
	};

	HudText.prototype = new HudElement();
	HudText.constructor = HudText;

	/*
	 * Octane properties for the HudText.
	 */
	HudText.prototype._octane = HudElement.prototype._octane.concat([
		'_text', '_width', 'x', 'y', 'wrapText']);

	/**
	 * Calculate the bounds of the formatted text.
	 */
	HudText.prototype.calculateBounds = function() {
		var align;

		if (this.config.textAlign != null) {
			align = this.config.textAlign.toLowerCase();
		} else {
			align = currentTheme.text.textAlign.toLowerCase();
		}

		this._top = this.y;
		this._bottom = this._top + this._wrappedHeight;

		switch (align) {
			case 'left':
				this._left = this.x;
				this._right = this._left + this._wrappedWidth;
				break;
			case 'right':
				this._right = this.x;
				this._left = this._right - this._wrappedWidth;
				break;
			default: // center
				var offset = this._wrappedWidth / 2;
				this._left = this.x - offset;
				this._right = this.x + offset;
				break;
		}
	};

	/**
	 * Draw the formatted text.
	 */
	HudText.prototype.draw = function() {
		hemi.hudManager.createTextOverlay(this, this.config);
	};

	/**
	 * Set unique display options for the HudText and perform text wrapping for the new options.
	 * 
	 * @param {Object} config configuration options
	 */
	HudText.prototype.setConfig = function(config) {
		this.config = config;
		this.wrapText();
	};

	/**
	 * Set the text to display for this HudText. Perform text wrapping for the new text.
	 * 
	 * @param {string} text a string or array of strings to display
	 */
	HudText.prototype.setText = function(text) {
		this._text = hemi.utils.isArray(text) ? text : [text];
		this.wrapText();
	};

	/**
	 * Set the desired width for the HudText. Perform text wrapping for the new width.
	 * 
	 * @param {number} width desired width for the HudText
	 */
	HudText.prototype.setWidth = function(width) {
		this._width = width;
		this.wrapText();
	};

	/**
	 * Perform text wrapping on the HudText's text. This sets the wrapped text, width, and height
	 * properties.
	 */
	HudText.prototype.wrapText = function() {
		if (this._width <= 0 || this._text.length === 0) {
			return;
		}

		var width = 0,
			height = 0,
			wrappedText = [];

		for (var i = 0, il = this._text.length; i < il; ++i) {
			var textObj = hemi.hudManager.doTextWrapping(this._text[i], this._width, this.config);

			if (textObj.width > width) {
				width = textObj.width;
			}

			height += textObj.height;
			wrappedText = wrappedText.concat(textObj.text);
		}

		this._wrappedWidth = width;
		this._wrappedHeight = height;
		this._wrappedText = wrappedText;
	};

	hemi.HudText = HudText;
	hemi.makeOctanable(hemi.HudText, 'hemi.HudText', hemi.HudText.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudImage class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudImage contains a texture and display options for a single image on the HUD.
	 * @extends HudElement
	 */
	var HudImage = function() {
		HudElement.call(this);

		/*
		 * The height of the image. This property is calculated when the image URL is loaded. It
		 * should typically not be set directly.
		 * @type number
		 */
		this._height = 0;

		/*
		 * The loaded image data.
		 * @type Image
		 */
		this._image = null;

		/*
		 * The width of the image. This property is calculated when the image URL is loaded. It
		 * should typically not be set directly.
		 * @type number
		 */
		this._width = 0;

		/**
		 * The x-coordinate of the source image to pull image data from.
		 * @type number
		 * @default 0
		 */
		this.srcX = 0;

		/**
		 * The y-coordinate of the source image to pull image data from.
		 * @type number
		 * @default 0
		 */
		this.srcY = 0;

		/**
		 * The URL of the image file.
		 * @type string
		 */
		this.url = null;

		/**
		 * The x-coordinate of the left side of the HudImage.
		 * @type number
		 * @default 0
		 */
		this.x = 0;

		/**
		 * The y-coordinate of the top of the HudImage.
		 * @type number
		 * @default 0
		 */
		this.y = 0;
	};

	HudImage.prototype = new HudElement();
	HudImage.constructor = HudImage;

	/*
	 * Octane properties for the HudImage.
	 */
	HudImage.prototype._octane = HudElement.prototype._octane.concat([
		'srcX', 'srcY', 'url', 'x', 'y', 'loadImage']);

	/**
	 * Calculate the bounds of the image.
	 */
	HudImage.prototype.calculateBounds = function() {
		this._top = this.y;
		this._bottom = this._top + this._height;
		this._left = this.x;
		this._right = this._left + this._width;
	};

	/**
	 * Remove all references in the HudImage.
	 */
	HudImage.prototype.cleanup = function() {
		HudElement.prototype.cleanup.call(this);
		this._image = null;
	};

	/**
	 * Draw the image texture.
	 */
	HudImage.prototype.draw = function() {
		hemi.hudManager.createImageOverlay(this, this.config);
	};

	/**
	 * Load the image from the image url into a texture for the HudManager to paint. This sets the
	 * texture, height, and width properties.
	 */
	HudImage.prototype.loadImage = function() {
		var that = this;

		hemi.loadImage(this.url, function(image) {
				that._image = image;
				that._height = image.height;
				that._width = image.width;
			});
	};

	/**
	 * Set the URL of the image file to load and begin loading it.
	 * 
	 * @param {string} url the URL of the image file
	 */
	HudImage.prototype.setUrl = function(url) {
		this.url = url;
		this.loadImage();
	};

	hemi.HudImage = HudImage;
	hemi.makeOctanable(hemi.HudImage, 'hemi.HudImage', hemi.HudImage.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudButton class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudButton uses different images based on if the button is enabled or if a mouse is
	 * hovering over it, etc.
	 * @extends HudElement
	 */
	var HudButton = function() {
		HudElement.call(this);

		/**
		 * The HudImage to use for the HudButton when it is disabled.
		 * @type hemi.HudImage
		 */
		this.disabledImg = null;

		/**
		 * Flag indicating if the HudButton is enabled.
		 * @type boolean
		 * @default true
		 */
		this.enabled = true;

		/**
		 * The HudImage to use for the HudButton when it is enabled.
		 * @type hemi.HudImage
		 */
		this.enabledImg = null;

		/**
		 * Flag indicating if the mouse cursor is hovering over the HudButton.
		 * @type boolean
		 * @default false
		 */
		this.hovering = false;

		/**
		 * The HudImage to use for the HudButton when it is enabled and the mouse cursor is
		 * hovering.
		 * @type hemi.HudImage
		 */
		this.hoverImg = null;

		/**
		 * Flag indicating if the HudButton is selected.
		 * @type boolean
		 * @default false
		 */
		this.selected = false;

		/**
		 * The HudImage to use for the HudButton when it is selected.
		 * @type hemi.HudImage
		 */
		this.selectedImg = null;

		/**
		 * The x-coordinate of the left side of the HudButton.
		 * @type number
		 * @default 0
		 */
		this.x = 0;

		/**
		 * The y-coordinate of the top of the HudButton.
		 * @type number
		 * @default 0
		 */
		this.y = 0;

		var that = this;

		/**
		 * The built-in mouse move handler for a HudButton. If the mouse move occurred within the
		 * button's bounds, set it's hovering flag and redraw the button.
		 * 
		 * @param {Object} event the mouse move event
		 * @param {boolean} intersected true if the event occurred within the HudButton's bounds
		 */
		this.mouseMove = function(event, intersected) {
			if (!that.enabled || that.selected)
				return;
			if (intersected) {
				if (!that.hovering) {
					that.hovering = true;
					that.draw();
				}
			} else if (that.hovering) {
				that.hovering = false;
				that.draw();
			}
		};
	};

	HudButton.prototype = new HudElement();
	HudButton.constructor = HudButton;

	/*
	 * Octane properties for the HudButton.
	 */
	HudButton.prototype._octane = HudElement.prototype._octane.concat([
		'disabledImg', 'enabledImg', 'hoverImg', 'selectedImg', 'x', 'y']);

	/**
	 * Calculate the bounds of the button.
	 */
	HudButton.prototype.calculateBounds = function() {
		var img = this.getImage();
		this._top = this.y;
		this._bottom = this._top + img._height;
		this._left = this.x;
		this._right = this._left + img._width;
	};

	/**
	 * Remove all references in the HudButton.
	 */
	HudButton.prototype.cleanup = function() {
		HudElement.prototype.cleanup.call(this);
		this.mouseMove = null;

		if (this.enabledImg) {
			this.enabledImg.cleanup();
			this.enabledImg = null;
		}
		if (this.disabledImg) {
			this.disabledImg.cleanup();
			this.disabledImg = null;
		}
		if (this.selectedImg) {
			this.selectedImg.cleanup();
			this.selectedImg = null;
		}
		if (this.hoverImg) {
			this.hoverImg.cleanup();
			this.hoverImg = null;
		}
	};

	/**
	 * Set the HudButton's image based on its flags and then draw it.
	 */
	HudButton.prototype.draw = function() {		
		var img = this.getImage();
		img.x = this.x;
		img.y = this.y;
		img.draw();
	};

	/**
	 * Get the image that represents the HudButton in its current state.
	 * 
	 * @return {hemi.HudImage} the image to draw for the HudButton
	 */
	HudButton.prototype.getImage = function() {
		var img = this.enabledImg;

		if (!this.enabled) {
			if (this.disabledImg) {
				img = this.disabledImg;
			}
		} else if (this.selected) {
			if (this.selectedImg) {
				img = this.selectedImg;
			}
		} else if (this.hovering) {
			if (this.hoverImg) {
				img = this.hoverImg;
			}
		}

		return img;
	};

	/**
	 * Set whether the HudButton is selected or not and then draw it.
	 * 
	 * @param {boolean} selected if the button is selected
	 */
	HudButton.prototype.select = function(isSelected) {
		this.selected = isSelected;
		this.draw();
	};

	/**
	 * Set the source x and y coordinates for the HudButton's images.
	 * 
	 * @param {Object} coords structure with optional coordinates for different images
	 */
	HudButton.prototype.setSrcCoords = function(coords) {
		var disabledCoords = coords.disabled,
			enabledCoords = coords.enabled,
			hoverCoords = coords.hover,
			selectedCoords = coords.selected;

		if (enabledCoords != null) {
			if (this.enabledImg === null) {
				this.enabledImg = new hemi.HudImage();
			}

			this.enabledImg.srcX = enabledCoords[0];
			this.enabledImg.srcY = enabledCoords[1];
		}
		if (disabledCoords != null) {
			if (this.disabledImg === null) {
				this.disabledImg = new hemi.HudImage();
			}

			this.disabledImg.srcX = disabledCoords[0];
			this.disabledImg.srcY = disabledCoords[1];
		}
		if (hoverCoords != null) {
			if (this.hoverImg === null) {
				this.hoverImg = new hemi.HudImage();
			}

			this.hoverImg.srcX = hoverCoords[0];
			this.hoverImg.srcY = hoverCoords[1];
		}
		if (selectedCoords != null) {
			if (this.selectedImg === null) {
				this.selectedImg = new hemi.HudImage();
			}

			this.selectedImg.srcX = selectedCoords[0];
			this.selectedImg.srcY = selectedCoords[1];
		}
	};

	/**
	 * Set the image urls for the HudButton's images.
	 * 
	 * @param {Object} urls structure with optional urls for different images
	 */
	HudButton.prototype.setUrls = function(urls) {
		var disabledUrl = urls.disabled,
			enabledUrl = urls.enabled,
			hoverUrl = urls.hover,
			selectedUrl = urls.selected;
		
		if (disabledUrl != null) {
			this.disabledImg = new hemi.HudImage();
			this.disabledImg.setUrl(disabledUrl);
		}
		if (enabledUrl != null) {
			this.enabledImg =  new hemi.HudImage();
			this.enabledImg.setUrl(enabledUrl);
		}
		if (hoverUrl != null) {
			this.hoverImg = new hemi.HudImage();
			this.hoverImg.setUrl(hoverUrl);
		}
		if (selectedUrl != null) {
			this.selectedImg = new hemi.HudImage();
			this.selectedImg.setUrl(selectedUrl);
		}
	};

	hemi.HudButton = HudButton;
	hemi.makeOctanable(hemi.HudButton, 'hemi.HudButton', hemi.HudButton.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudVideo class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudVideo contains video data and display options for a single video on the HUD.
	 * @extends hemi.HudElement
	 */
	var HudVideo = function() {
		HudElement.call(this);

		/*
		 * The height of the video. Call setHeight to change.
		 * @type number
		 */
		this._height = 0;

		/*
		 * The URLs of video files to try to load.
		 * @type string[]
		 */
		this._urls = [];

		/*
		 * The video DOM element.
		 */
		this._video = document.createElement('video');

		/*
		 * The width of the video. Call setWidth to change.
		 * @type number
		 */
		this._width = 0;

		/**
		 * The x-coordinate of the left side of the HudVideo.
		 * @type number
		 * @default 0
		 */
		this.x = 0;

		/**
		 * The y-coordinate of the top of the HudVideo.
		 * @type number
		 * @default 0
		 */
		this.y = 0;

		var vid = this._video,
			that = this;
		
		this._video.onloadeddata = function() {
			if (that._height === 0) {
				that._height = vid.videoHeight;
			} else {
				vid.setAttribute('height', '' + that._height);
			}
			if (that._width === 0) {
				that._width = vid.videoWidth;
			} else {
				vid.setAttribute('width', '' + that._width);
			}
		};
	};

	HudVideo.prototype = new HudElement();
	HudVideo.constructor = HudVideo;

	/*
	 * Get the Octane properties for the HudVideo.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	HudVideo.prototype._octane = function() {
		var octane = HudElement.protothype._octane.concat(['x', 'y']);

		for (var i = 0, il = this._urls.length; i < il; ++i) {
			var urlObj = this._urls[i];

			octane.push({
				name: 'addUrl',
				arg: [urlObj.url, urlObj.type]
			});
		}

		return octane;
	};

	/**
	 * Add the given URL as a source for the video file to load.
	 * 
	 * @param {string} url the URL of the video file
	 * @param {string} type the type of the video file (ogv, mp4, etc)
	 */
	HudVideo.prototype.addUrl = function(url, type) {
		var src = document.createElement('source'),
			loadUrl = hemi.getLoadPath(url);
		
		src.setAttribute('src', loadUrl);
		src.setAttribute('type', 'video/' + type);
		this._video.appendChild(src);
		this._urls.push({
			url: url,
			type: type,
			node: src
		});
	};

	/**
	 * Calculate the bounds of the video.
	 */
	HudVideo.prototype.calculateBounds = function() {
		this._top = this.y;
		this._bottom = this._top + this._height;
		this._left = this.x;
		this._right = this._left + this._width;
	};

	/**
	 * Remove all references in the HudElement.
	 */
	HudVideo.prototype.cleanup = function() {
		HudElement.prototype.cleanup.call(this);
		this._video = null;
		this._urls = [];
	};

	/**
	 * Draw the video's current image.
	 */
	HudVideo.prototype.draw = function() {
		hemi.hudManager.createVideoOverlay(this, this.config);
	};

	/**
	 * Remove the given URL as a source for the video file to load.
	 * 
	 * @param {string} url the URL to remove
	 */
	HudVideo.prototype.removeUrl = function(url) {
		for (var i = 0, il = this._urls.length; i < il; ++i) {
			var urlObj = this._urls[i];

			if (urlObj.url === url) {
				this._video.removeChild(urlObj.node);
				this._urls.splice(i, 1);
				break;
			}
		}
	};

	/**
	 * Set the height for the video to be displayed at.
	 * 
	 * @param {number} height the height to set for the video
	 */
	HudVideo.prototype.setHeight = function(height) {
		this._height = height;
		if (this._video !== null) {
			this._video.setAttribute('height', '' + height);
		}
	};

	/**
	 * Set the width for the video to be displayed at.
	 * 
	 * @param {number} width the width to set for the video
	 */
	HudVideo.prototype.setWidth = function(width) {
		this._width = width;
		if (this._video !== null) {
			this._video.setAttribute('width', '' + width);
		}
	};

	hemi.HudVideo = HudVideo;
	hemi.makeOctanable(hemi.HudVideo, 'hemi.HudVideo', hemi.HudVideo.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudPage class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudPage contains other HudElements and display options for  drawing a single page on
	 * the HUD.
	 * @extends hemi.HudElement
	 */
	var HudPage = function() {
		HudElement.call(this);

		/**
		 * Flag indicating if the HudPage should automatically set its size to contain all of its
		 * elements.
		 * @type boolean
		 * @default true
		 */
		this.auto = true;

		/**
		 * Flag indicating if a background rectangle should be drawn for the HudPage.
		 * @type boolean
		 * @default true
		 */
		this.drawBackground = true;

		/**
		 * The number of pixels to add as padding around the bounds of the HudPage's elements when
		 * drawing the background rectangle.
		 * @type number
		 * @default 5
		 */
		this.margin = 5;

		this.elements = [];
	};

	HudPage.prototype = new HudElement();
	HudPage.constructor = HudPage;

	/*
	 * Octane properties for the HudPage.
	 */
	HudPage.prototype._octane = HudElement.prototype._octane.concat([
		'auto', 'drawBackground', 'elements', 'margin']);

	/**
	 * Add the given HudElement to the HudPage for displaying.
	 * 
	 * @param {hemi.HudElement} element element to add
	 */
	HudPage.prototype.add = function(element) {
		if (this.elements.indexOf(element) === -1) {
			this.elements.push(element);
		}
	};

	/**
	 * Calculate the bounds of the HudElements of the HudPage.
	 */
	HudPage.prototype.calculateBounds = function() {
		var ndx, len = this.elements.length;

		if (len === 0) {
			this._top = 0;
			this._bottom = 0;
			this._left = 0;
			this._right = 0;
			return;
		}

		for (ndx = 0; ndx < len; ndx++) {
			this.elements[ndx].calculateBounds();
		}

		if (this.auto) {
			var element = this.elements[0];
			this._top = element._top;
			this._bottom = element._bottom;
			this._left = element._left;
			this._right = element._right;

			for (ndx = 1; ndx < len; ndx++) {
				element = this.elements[ndx];

				if (element._top < this._top) {
					this._top = element._top;
				}
				if (element._bottom > this._bottom) {
					this._bottom = element._bottom;
				}
				if (element._left < this._left) {
					this._left = element._left;
				}
				if (element._right > this._right) {
					this._right = element._right;
				}
			}

			this._top -= this.margin;
			this._bottom += this.margin;
			this._left -= this.margin;
			this._right += this.margin;
		}
	};

	/**
	 * Remove all references in the HudPage.
	 */
	HudPage.prototype.cleanup = function() {
		HudElement.prototype.cleanup.call(this);

		for (var i = 0, il = this.elements.length; i < il; ++i) {
			this.elements[i].cleanup();
		}

		this.elements = [];
	};

	/**
	 * Remove all HudElements from the HudPage.
	 */
	HudPage.prototype.clear = function() {
		this.elements = [];
	};

	/**
	 * Draw the background (if any) and HudElements of the HudPage.
	 */
	HudPage.prototype.draw = function() {
		this.calculateBounds();

		if (this.drawBackground) {				
			hemi.hudManager.createRectangleOverlay(this, this.config);
		}

		for (var i = 0, il = this.elements.length; i < il; ++i) {
			if (this.elements[i].visible)
				this.elements[i].draw();
		}
	};

	/**
	 * Check if the given event occurred within the bounds of any of the HudElements of the HudPage.
	 * If it did, pass the Event to that HudElement. If not, call the HudPage's mouse down handler
	 * function (if one was set).
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of the HudPage, otherwise
	 *     false
	 */
	HudPage.prototype.onMouseDown = function(event) {
		if (!this.visible)
			return false;

		var intersected = this._checkEvent(event);

		if (intersected || !this.auto) {
			var caught = false;

			for (var i = 0, il = this.elements.length; i < il && !caught; ++i) {
				if (this.elements[i].visible)
					caught = this.elements[i].onMouseDown(event);
			}

			if (intersected && !caught && this.mouseDown) {
				this.mouseDown(event);
			}
		}

		return intersected;
	};

	/**
	 * Pass the given Event to all of the HudPage's HudElements. If the HudPage's mouse move handler
	 * function is set, pass it the Event and if it occurred within the bounds of the HudPage.
	 * 
	 * @param {Object} event the event that occurred
	 */
	HudPage.prototype.onMouseMove = function(event) {
		if (!this.visible)
			return;

		for (var i = 0, il = this.elements.length; i < il; ++i) {
			if (this.elements[i].visible)
				this.elements[i].onMouseMove(event);
		}

		if (this.mouseMove) {
			var intersected = this._checkEvent(event);
			this.mouseMove(event, intersected);
		}
	};

	/**
	 * Check if the given event occurred within the bounds of any of the HudElements of the HudPage.
	 * If it did, pass the Event to that HudElement. If not, call the HudPage's mouse up handler
	 * function (if one was set).
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of the HudPage, otherwise
	 *     false
	 */
	HudPage.prototype.onMouseUp = function(event) {
		var intersected = this._checkEvent(event);

		if (intersected || !this.auto) {
			var caught = false;
			var len = this.elements.length;

			for (var i = 0, il = this.elements.length; i < il && !caught; ++i) {
				caught = this.elements[i].onMouseUp(event);
			}

			if (intersected && !caught && this.mouseUp) {
				this.mouseUp(event);
			}
		}

		return intersected;
	};

	/**
	 * Remove the specified HudElement from the HudPage.
	 * 
	 * @param {hemi.HudElement} element element to remove
	 * @return {hemi.HudElement} the removed element or null
	 */
	HudPage.prototype.remove = function(element) {
		var ndx = this.elements.indexOf(element),
			found = null;

		if (ndx !== -1) {
			found = this.elements.splice(ndx, 1)[0];
		}

		return found;
	};

	/**
	 * Manually set the size of the HudPage. This will prevent it from  autosizing itself to fit all
	 * of the HudElements added to it.
	 * 
	 * @param {number} top the y coordinate of the top
	 * @param {number} bottom the y coordinate of the bottom
	 * @param {number} left the x coordinate of the left
	 * @param {number} right the x coordinate of the right
	 */
	HudPage.prototype.setSize = function(top, bottom, left, right) {
		this._top = top;
		this._bottom = bottom;
		this._left = left;
		this._right = right;
		this.auto = false;
	};

	hemi.HudPage = HudPage;
	hemi.makeOctanable(hemi.HudPage, 'hemi.HudPage', hemi.HudPage.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudDisplay class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudDisplay contains one or more HudPages to display sequentially.
	 * 
	 * @param {hemi.Client} opt_client optional client for the HudDisplay to draw to
	 */
	var HudDisplay = function(opt_client) {
		/*
		 * Flag indicating if HudDisplay is visible. This should not be set directly.
		 * @type boolean
		 * @default false
		 */
		this._visible = false;
		this.client = opt_client;
		this.currentPage = 0;
		this.pages = [];
	};

	/*
	 * Remove all references in the HudDisplay.
	 */
	HudDisplay.prototype._clean = function() {
		for (var i = 0, il = this.pages.length; i < il; ++i) {
			this.pages[i].cleanup();
		}

		this.pages = [];
	};

	/*
	 * Array of Hemi Messages that the Citizen is known to send.
	 * @type string[]
	 */
	HudDisplay.prototype._msgSent = [hemi.msg.visible];

	/*
	 * Octane properties for the HudDisplay.
	 */
	HudDisplay.prototype._octane = ['client', 'pages'];

	/**
	 * Add the given HudPage to the HudDisplay.
	 * 
	 * @param {hemi.HudPage} page page to add
	 */
	HudDisplay.prototype.add = function(page) {
		if (this.pages.indexOf(page) === -1) {
			this.pages.push(page);
		}
	};

	/**
	 * Remove all HudPages from the HudDisplay.
	 */
	HudDisplay.prototype.clear = function() {
		if (this._visible) {
			this.hide();
		}

		this.pages = [];
	};

	/**
	 * Get the currently displayed HudPage.
	 * 
	 * @return {hemi.HudPage} currently displayed page
	 */
	HudDisplay.prototype.getCurrentPage = function() {
		return this.currentPage < this.pages.length ? this.pages[this.currentPage] : null;
	};

	/**
	 * Get the number of HudPages in the HudDisplay.
	 * 
	 * @return {number} the number of HudPages
	 */
	HudDisplay.prototype.getNumberOfPages = function() {
		return this.pages.length;
	};

	/**
	 * Hide the HudDisplay and unregister its key and mouse handlers.
	 */
	HudDisplay.prototype.hide = function() {
		if (this._visible) {
			hemi.input.removeMouseMoveListener(this);
			hemi.input.removeMouseUpListener(this);
			hemi.input.removeMouseDownListener(this);
			hemi.hudManager.clearDisplay();
			this._visible = false;
			this.currentPage = 0;

			this.send(hemi.msg.visible,
				{
					page: 0
				});
		}
	};

	/**
	 * Pass the given mouse down Event to the currently displayed HudPage (if there is one).
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of a HudPage, otherwise false
	 */
	HudDisplay.prototype.onMouseDown = function(event) {
		var page = this.getCurrentPage(),
			intersected = false;

		if (page) {
			intersected = page.onMouseDown(event);
		}

		return intersected;
	};

	/**
	 * Pass the given mouse move Event to the currently displayed HudPage (if there is one).
	 * 
	 * @param {Object} event the event that occurred
	 */
	HudDisplay.prototype.onMouseMove = function(event) {
		var page = this.getCurrentPage();

		if (page) {
			page.onMouseMove(event);
		}
	};

	/**
	 * Pass the given mouse up Event to the currently displayed HudPage (if there is one).
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of a HudPage, otherwise false
	 */
	HudDisplay.prototype.onMouseUp = function(event) {
		var page = this.getCurrentPage(),
			intersected = false;

		if (page) {
			intersected = page.onMouseUp(event);
		}

		return intersected;
	};

	/**
	 * Display the next HudPage in the HudDisplay.
	 */
	HudDisplay.prototype.nextPage = function() {
		var numPages = this.pages.length;
		this.currentPage++;
		
		if (this.currentPage >= numPages) {
			this.currentPage = numPages - 1;
		} else {
			this.showPage();
		}
	};

	/**
	 * Display the previous HudPage in the HudDisplay.
	 */
	HudDisplay.prototype.previousPage = function() {
		this.currentPage--;
		
		if (this.currentPage < 0) {
			this.currentPage = 0;
		} else {
			this.showPage();
		}
	};

	/**
	 * Remove the specified HudPage from the HudDisplay.
	 * 
	 * @param {hemi.HudPage} page page to remove
	 * @return {hemi.HudPage} the removed page or null
	 */
	HudDisplay.prototype.remove = function(page) {
		var ndx = this.pages.indexOf(page),
			found = null;

		if (ndx !== -1) {
			if (this._visible && ndx === this.currentPage) {
				if (ndx !== 0) {
					this.previousPage();
				} else if (this.pages.length > 1) {
					this.nextPage();
				} else  {
					this.hide();
				}
			}

			found = this.pages.splice(ndx, 1)[0];
		}

		return found;
	};

	/**
	 * Show the first HudPage of the HudDisplay and bind the mouse handlers for interaction.
	 */
	HudDisplay.prototype.show = function() {
		if (!this._visible) {
			this._visible = true;
			this.showPage();
			hemi.input.addMouseDownListener(this);
			hemi.input.addMouseUpListener(this);
			hemi.input.addMouseMoveListener(this);
		}
	};

	/**
	 * Show the current page of the HudDisplay.
	 */
	HudDisplay.prototype.showPage = function() {
		if (!this.client) return;

		hemi.hudManager.setClient(this.client);
		hemi.hudManager.clearDisplay();
		var page = this.getCurrentPage();
		page.draw();

		this.send(hemi.msg.visible,
			{
				page: this.currentPage + 1
			});
	};

	hemi.makeCitizen(HudDisplay, 'hemi.HudDisplay', {
		cleanup: HudDisplay.prototype._clean,
		toOctane: HudDisplay.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudManager class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudManager creates the appropriate view components for  rendering a HUD.
	 */
	var HudManager = function(clients) {
		/*
		 * 2D canvas contexts for the Clients the HudManager is managing.
		 */
		this._contexts = {};

		/*
		 * Videos that are currently playing on a HUD.
		 */
		this._videos = [];

		/**
		 * The current 2D canvas context that the HudManager is drawing to.
		 */
		this.currentContext = null;

		hemi.addRenderListener(this);
	};

	/**
	 * Set up a 2D canvas for the given Client and add it to the list of Clients that the HudManager
	 * draws to.
	 * 
	 * @param {hemi.Client} client the Client to start managing
	 */
	HudManager.prototype.addClient = function(client) {
		var canvas = client.renderer.domElement,
			container = canvas.parentNode,
			hudCan = document.createElement('canvas'),
			style = hudCan.style;

		style.left = canvas.offsetLeft + 'px';
		style.position = 'absolute';
		style.top = canvas.offsetTop + 'px';
		style.zIndex = '10';

		hudCan.height = canvas.height;
		hudCan.width = canvas.width;
		// Since the HUD canvas obscures the WebGL canvas, pass mouse events through to Hemi.
		hudCan.addEventListener('DOMMouseScroll', hemi.input.scroll, true);
		hudCan.addEventListener('mousewheel', hemi.input.scroll, true);
		hudCan.addEventListener('mousedown', hemi.input.mouseDown, true);
		hudCan.addEventListener('mousemove', hemi.input.mouseMove, true);
		hudCan.addEventListener('mouseup', hemi.input.mouseUp, true);
		container.appendChild(hudCan);

		var context = hudCan.getContext('2d');
		// In our coordinate system, y indicates the top of the first line of text, so set the
		// canvas baseline to match.
		context.textBaseline = 'top';
		this._contexts[client._getId()] = context;
		this.currentContext = context;
	};

	/**
	 * Clear the current overlays from the HUD.
	 */
	HudManager.prototype.clearDisplay = function() {
		var context = this.currentContext,
			canvas = context.canvas,
			vids = this._videos;

		this._videos = [];

		for (var i = 0, il = vids.length; i < il; ++i) {
			vids[i].video.pause();
		}

		context.clearRect(0, 0, canvas.width, canvas.height);
		context.beginPath();
	};

	/**
	 * Create a rectangular overlay from the given HudElement.
	 *
	 * @param {hemi.HudElement} element element with a bounding box to display
	 * @param {Object} boxConfig unique configuration options for the rectangular overlay
	 */
	HudManager.prototype.createRectangleOverlay = function(element, boxConfig) {
		var config = hemi.utils.join({}, currentTheme.page, boxConfig),
			context = this.currentContext;

		context.save();
		setPaintProperties(context, config);

		if (config.curve > 0) {
			var curve = config.curve <= 1 ? config.curve / 2.0 : 0.5;
			this.drawRoundRect(element, curve, true);

			if (config.outline != null) {
				this.drawRoundRect(element, curve, false);
			}
		} else {
			var x = element._left,
				y = element._top,
				width = element._right - x,
				height = element._bottom - y;

			context.fillRect(x, y, width, height);

			if (config.outline != null) {
				context.strokeRect(x, y, width, height);
			}
		}

		context.restore();
	};

	/**
	 * Create a text overlay.
	 *
	 * @param {hemi.HudText} text the HudText to display
	 * @param {Object} textConfig unique configuration options for the text overlay
	 */
	HudManager.prototype.createTextOverlay = function(text, textConfig) {
		var config = hemi.utils.join({}, currentTheme.text, textConfig),
			lineHeight = config.textSize + config.lineMargin,
			context = this.currentContext,
			textLines = text._wrappedText,
			x = text.x,
			y = text.y;

		context.save();
		setPaintProperties(context, config);

		for (var i = 0, il = textLines.length; i < il; ++i) {
			var line = textLines[i];
			context.fillText(line, x, y);

			if (config.outline != null) {
				context.strokeText(line, x, y);
			}

			y += lineHeight;
		}

		context.restore();
	};

	/**
	 * Create an image overlay.
	 *
	 * @param {hemi.HudImage} image the HudImage to display
	 * @param {Object} imgConfig unique configuration options for the image overlay
	 */
	HudManager.prototype.createImageOverlay = function(image, imgConfig) {
		var config = hemi.utils.join({}, currentTheme.image, imgConfig),
			context = this.currentContext,
			imageData = image._image;

		context.save();
		setPaintProperties(context, config);

		if (image._width !== imageData.width || image._height !== imageData.height ||
				image.srcX !== 0 || image.srcY !== 0) {
			context.drawImage(imageData, image.srcX, image.srcY, image._width, image._height,
				image.x, image.y, image._width, image._height);
		} else {
			context.drawImage(imageData, image.x, image.y);
		}

		context.restore();
	};

	/**
	 * Create a video overlay.
	 *
	 * @param {hemi.HudVideo} video the HudVideo to display
	 * @param {Object} vidConfig unique configuration options for the video overlay
	 */
	HudManager.prototype.createVideoOverlay = function(video, vidConfig) {
		var config = hemi.utils.join({}, currentTheme.video, vidConfig),
			videoData = video._video;

		this._videos.push({
			video: videoData,
			config: config,
			context: this.currentContext,
			x: video.x,
			y: video.y,
			width: video._width || videoData.videoWidth,
			height: video._height || videoData.videoHeight
		});
		videoData.play();
	};

	/**
	 * Calculate text wrapping and format the given string.
	 * 
	 * @param {string} text the text to display
	 * @param {number} width the maximum line width before wrapping
	 * @param {Object} textOptions unique configuration options for the text overlay
	 * @return {Object} wrapped text object
	 */
	HudManager.prototype.doTextWrapping = function(text, width, textOptions) {
		var config = hemi.utils.join({}, currentTheme.text, textOptions),
			context = this.currentContext,
			wrappedText;

		context.save();
		setPaintProperties(context, config);

		if (config.strictWrapping) {
			wrappedText = hemi.utils.wrapTextStrict(text, width, context);
		} else {
			var metric = context.measureText(text),
				charWidth = metric.width / text.length;
			wrappedText = hemi.utils.wrapText(text, width, charWidth);
		}

		var height = wrappedText.length * (config.textSize + config.lineMargin),
			longestWidth = 0;

		for (var i = 0, il = wrappedText.length; i < il; ++i) {
			var metric = context.measureText(wrappedText[i]);

			if (longestWidth < metric.width) {
				longestWidth = metric.width;
			}
		}

		context.restore();

		return {
			text: wrappedText,
			height: height,
			width: longestWidth
		};
	};

	/**
	 * Draw a rectangular overlay that has rounded corners from the given HudElement.
	 *
	 * @param {hemi.HudElement} element element with a bounding box to create the rectangle from
	 * @param {number} curveFactor amount of curving on the corners (between 0 and 0.5)
	 * @param {boolean} fill flag indicating whether to fill or stroke
	 */
	HudManager.prototype.drawRoundRect = function(element, curveFactor, fill) {
		var context = this.currentContext,
			lt = element._left,
			rt = element._right,
			tp = element._top,
			bm = element._bottom,
			wide = rt - lt,
			high = bm - tp,
			inc = high > wide ? wide * curveFactor : high * curveFactor,
			// Positions on a clock in radians :)
			hour12 = 270 * hemi.DEG_TO_RAD,
			hour3 = 0,
			hour6 = 90 * hemi.DEG_TO_RAD,
			hour9 = 180 * hemi.DEG_TO_RAD;

		context.beginPath();
		context.moveTo(lt, tp + inc);
		context.lineTo(lt, bm - inc);
		context.arc(lt + inc, bm - inc, inc, hour9, hour6, true);
		context.lineTo(rt - inc, bm);
		context.arc(rt - inc, bm - inc, inc, hour6, hour3, true);
		context.lineTo(rt, tp + inc);
		context.arc(rt - inc, tp + inc, inc, hour3, hour12, true);
		context.lineTo(lt + inc, tp);
		context.arc(lt + inc, tp + inc, inc, hour12, hour9, true);
		context.closePath();

		if (fill) {
			context.fill();
		} else {
			context.stroke();
		}
	};

	/**
	 * Copy the current image from any video elements onto the canvas on each render.
	 * 
	 * @param {Object} renderEvent event containing render info
	 */
	HudManager.prototype.onRender = function(renderEvent) {
		var vids = this._videos;
		
		for (var i = 0, il = vids.length; i < il; ++i) {
			var vid = vids[i],
				context = vid.context;

			context.save();
			setPaintProperties(context, vid.config);
			context.drawImage(vid.video, vid.x, vid.y, vid.width, vid.height);
			context.restore();
		}
	};

	/**
	 * Set the current client for the HudManager to draw to.
	 * 
	 * @param {hemi.Client} client the client to draw to
	 */
	HudManager.prototype.setClient = function(client) {
		this.currentContext = this._contexts[client._getId()];
	};

	/**
	 * Set the current theme for HUD displays.
	 * 
	 * @param {hemi.HudTheme} theme display options for HUD elements
	 */
	hemi.setHudTheme = function(theme) {
		currentTheme = theme;
	};

	/**
	 * The HUD manager responsible for drawing all HUD displays, elements, etc.
	 */
	hemi.hudManager = new HudManager();

	return hemi;
})(hemi || {});
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
	/**
	 * @namespace A module for defining draggable objects.
	 */
	hemi = hemi|| {};

	hemi.Plane = {
		XY : 'xy',
		XZ : 'xz',
		YZ : 'yz'
	};
	
	hemi.Axis = {
		X : 'x',
		Y : 'y',
		Z : 'z'
	};

	var ManipulatorBase = function(client) {
		this.client = client;
		this.transformObjs = [];
		this.local = false;
		this.enabled = false;
		this.msgHandler = null;
		this.activeTransform = null;
	};

	/**
	 * Add a Transform to the list of Manipulator Transforms.
	 *
	 * @param {THREE.Object3D} transform the transform to add
	 */
	ManipulatorBase.prototype.addTransform = function(transform) {
		this.transformObjs.push(transform);
	};

	/**
	 * Clear the list of Manipulator Transforms.
	 */
	ManipulatorBase.prototype.clearTransforms = function() {
		this.transformObjs.length = 0;
	};

	/**
	 * Check if a given Transform is contained within the children of the
	 * Transforms acted upon by this Manipulator.
	 *
	 * @param {THREE.Object3D} transform transform to check against
	 * @return {boolean} true if the Transform is found
	 */
	ManipulatorBase.prototype.containsTransform = function(transform) {
		for (var i = 0; i < this.transformObjs.length; i++) {
			var children = [];
			hemi.utils.getChildren(this.transformObjs[i], children);
			for (var j = 0; j < children.length; j++) {
				if (transform.id === children[j].id) {
					return true;
				}
			}
		}
		return false;
	};

	/**
	 * Disable mouse interaction for the Manipulator. 
	 */
	ManipulatorBase.prototype.disable = function() {
		if (this.enabled) {
			hemi.unsubscribe(this.msgHandler, hemi.msg.pick);
			hemi.input.removeMouseMoveListener(this);
			hemi.input.removeMouseUpListener(this);
			this.enabled = false;
		}
	};

	/**
	 * Enable mouse interaction for the Manipulator. 
	*/
	ManipulatorBase.prototype.enable = function() {
		if (!this.enabled) {
			this.msgHandler = hemi.subscribe(
				hemi.msg.pick,
				this,
				'onPick',
				[hemi.dispatch.MSG_ARG + 'data.pickedMesh', 
				 hemi.dispatch.MSG_ARG + 'data.mouseEvent']);
			hemi.input.addMouseMoveListener(this);
			hemi.input.addMouseUpListener(this);
			this.enabled = true;
		}
	};

	/**
	 * Get the Transforms that the Manipulator currently contains.
	 * 
	 * @return {THREE.Object3D[]} array of Transforms
	 */
	ManipulatorBase.prototype.getTransforms = function() {
		return this.transformObjs.slice(0);
	};

	/**
	 * Remove Transforms 
	 * 
	 * @param {THREE.Object3D} tranObj The transform to remove
	*/
	ManipulatorBase.prototype.removeTransforms = function(tranObj) {
		var ndx = this.transformObjs.indexOf(tranObj);

		if (ndx > -1) {
			this.transformObjs.splice(ndx, 1);
		}
	};

	/**
	 * Set the Draggable to operate in the local space of the transform it
	 * is translating.
	 */
	ManipulatorBase.prototype.setToLocal = function() {
		this.local = true;
	};
	
	/**
	 * Set the Draggable to operate in world space.
	 */
	ManipulatorBase.prototype.setToWorld = function() {
		this.local = false;
	};
		
	//common funcs
	/**
	 * @class A Draggable allows a 3d object to be dragged around the scene
	 * with the mouse, constrained to a defined 2d plane.
	 * @extends hemi.Citizen
	 * 
	 * @param {hemi.client} client the client that this draggable exists in
	 * @param {number[3][3]} opt_plane Array of 3 xyz points defining a plane
	 * @param {number[4]} opt_limits An array containing 
	 *	   [min on u, max on u, min on v, max on v]
	 * @param {number[2]} opt_startUV Draggable's starting uv coordinate, if
	 *		not [0,0]
	 */
	var Draggable = function(client, opt_plane, opt_limits, opt_startUV) {
		ManipulatorBase.call(this, client);
		this.dragUV = null;
		this.plane = null;
		this.umin = null;
		this.umax = null;
		this.uv = opt_startUV == null ? [0,0] : opt_startUV;
		this.vmin = null;
		this.vmax = null;
		
		if (opt_plane != null) {
			this.setPlane(opt_plane);
		}
		if (opt_limits != null) {
			this.setLimits(opt_limits);
		}
		
		this.enable();
	};

	Draggable.prototype = new ManipulatorBase();
	Draggable.constructor = Draggable;

	/**
	 * Get the Octane structure for the Draggable.
     *
     * @return {Object} the Octane structure representing the Draggable
	 */
	Draggable.prototype.toOctane = function(){
		var octane = this._super(),
			valNames = ['local', 'plane', 'umin', 'umax', 'vmin', 'vmax'];
		
		for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
			var name = valNames[ndx];
			
			octane.props.push({
				name: name,
				val: this[name]
			});
		}
		
		return octane;
	};

	/**
	 * Add the given UV delta to the current UV coordinates and clamp the
	 * results.
	 *
	 * @param {number[2]} delta the uv change to add before clamping
	 * @return {number[2]} the actual change in uv after clamping
	 */
	Draggable.prototype.clamp = function(delta) {
		var u = this.uv[0] + delta[0],
			v = this.uv[1] + delta[1];
		
		if (this.umin != null && u < this.umin) {
			u = this.umin;
		}
		if (this.umax != null && u > this.umax) {
			u = this.umax;
		}
		if (this.vmin != null && v < this.vmin) {
			v = this.vmin;
		}
		if (this.vmax != null && v > this.vmax) {
			v = this.vmax;
		}
		
		delta = [u - this.uv[0], v - this.uv[1]];
		this.uv = [u, v];
		
		return delta;
	};
		
	/**
	 * Remove any previously set limits from the draggable.
	 */
	Draggable.prototype.clearLimits = function() {
		this.umin = null;
		this.umax = null;
		this.vmin = null;
		this.vmax = null;
	};
	
	/**
	 * Get the two dimensional plane that the Draggable will translate its
	 * active Transform along.
	 * 
	 * @return {THREE.Vector3[3]} the current drag plane defined as 3 XYZ points
	 */
	Draggable.prototype.getPlane = function() {
		if (this.activeTransform === null) {
			return null;
		}
		
		var plane;
		
		if (this.local) {
			var u = hemi.utils;
			plane = [u.pointAsWorld(this.activeTransform, this.plane[0]),
					 u.pointAsWorld(this.activeTransform, this.plane[1]),
					 u.pointAsWorld(this.activeTransform, this.plane[2])];
		} else {
			var translation = this.activeTransform.matrixWorld.getPosition();
			
			plane = [new THREE.Vector3().add(this.plane[0], translation),
					 new THREE.Vector3().add(this.plane[1], translation),
					 new THREE.Vector3().add(this.plane[2], translation)];
		}
		
		return plane;
	};
		
	/**
	 * Convert the given screen coordinates into UV coordinates on the
	 * current dragging plane.
	 * 
	 * @param {number} x x screen coordinate
	 * @param {number} y y screen coordinate
	 * @return {number[2]} equivalent UV coordinates
	 */
	Draggable.prototype.getUV = function(x,y) {
		var ray = this.client.clientPositionToRay(x, y),
			plane = this.getPlane(),
			tuv = hemi.utils.intersect(ray, plane);
		
		return [tuv[1], tuv[2]];
	};

	/**
	 * Mouse movement event listener, calculates mouse point intersection 
	 * with this Draggable's plane, and then translates the dragging object 
	 * accordingly.
	 *
	 * @param {Event} event message describing how the mouse has moved
	 */
	Draggable.prototype.onMouseMove = function(event) {
		if (this.dragUV === null) {
			return;
		}
		
		var uv = this.getUV(event.x, event.y),
			delta = [uv[0] - this.dragUV[0], uv[1] - this.dragUV[1]],
			plane = this.getPlane();
		
		delta = this.clamp(delta);
		
		var localDelta = hemi.utils.uvToXYZ(delta, plane),
			xyzOrigin = hemi.utils.uvToXYZ([0, 0], plane),
			xyzDelta = new THREE.Vector3().sub(localDelta, xyzOrigin);
		
		for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
			var tran = this.transformObjs[ndx];
			hemi.utils.worldTranslate(xyzDelta, tran);
		}
		
		this.send(hemi.msg.drag, { drag: xyzDelta });
	};

	/**
	 * Mouse-up event listener, stops dragging.
	 *
	 * @param {o3d.Event} event message describing the mouse behavior
	 */
	Draggable.prototype.onMouseUp = function(event) {
		this.activeTransform = null;
		this.dragUV = null;
	};

	/**
	 * Pick event listener; checks in-scene intersections, and allows 
	 * dragging.
	 *
	 * @param {THREE.Object3D} pickedMesh pick event information that
	 *		contains information on the shape and transformation picked.
	 * @param {o3d.Event} mouseEvent message describing mouse behavior
	 */
	Draggable.prototype.onPick = function(pickedMesh, mouseEvent) {
		for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
			if (this.transformObjs[ndx].id == pickedMesh.id) {
				this.activeTransform = pickedMesh;
				this.dragUV = this.getUV(mouseEvent.x, mouseEvent.y);
				break;
			}
		}
	};

	/**
	 * Set the relative uv limits in which this Draggable can move.
	 *
	 * @param {number[2][2]} coords min and max uv points on the current
	 *     plane
	 */
	Draggable.prototype.setLimits = function(coords) {
		this.umin = coords[0][0];
		this.umax = coords[1][0];
		this.vmin = coords[0][1];
		this.vmax = coords[1][1];
	};

	/**
	 * Set the 2d plane on which this Draggable is bound.
	 *
	 * @param {Vector3[3]} plane array of three XYZ coordinates defining a
	 *     plane
	 */
	Draggable.prototype.setPlane = function(plane) {
		switch (plane) {
			case (hemi.Plane.XY):
				this.plane = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0)];
				break;
			case (hemi.Plane.XZ):
				this.plane = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,1)];
				break;
			case (hemi.Plane.YZ):
				this.plane = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,1), new THREE.Vector3(0,1,0)];
				break;
			default:
				this.plane = plane;
		}
	};

	hemi.makeCitizen(Draggable, 'hemi.Draggable', {
		cleanup: function() {
			this.disable();
			this.clearTransforms();
			this.msgHandler = null;
		},
		msgs: [hemi.msg.drag],
		toOctane: []
	});


	/**
	 * @class A Turnable allows a Transform to be turned about an axis by the
	 *     user clicking and dragging with the mouse.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {hemi.Axis} opt_axis axis to rotate about
	 * @param {number[2]} opt_limits minimum and maximum angle limits (in radians)
	 * @param {number} opt_startAngle starting angle (in radians, default is 0)
	 */
	var Turnable = function(client, opt_axis, opt_limits, opt_startAngle) {	
		ManipulatorBase.call(this, client);
		this.angle = opt_startAngle == null ? 0 : opt_startAngle;
		this.axis = null;
		this.dragAngle = null;
		this.min = null;
		this.max = null;
		this.msgHandler = null;
		this.plane = null;
		
		if (opt_axis != null) {
			this.setAxis(opt_axis);
		}
		if (opt_limits != null) {
			this.setLimits(opt_limits);
		}
		
		this.enable();
	};

	Turnable.prototype = new ManipulatorBase();
	Turnable.constructor = Turnable;

	/**
	 * Send a cleanup Message and remove all references in the Turnable.
	 */
	Turnable.prototype.cleanup = function() {
		this.disable();
		this._super();
		this.clearTransforms();
		this.msgHandler = null;
	};
		
	/**
	 * Get the Octane structure for the Turnable.
     *
     * @return {Object} the Octane structure representing the Turnable
	 */
	Turnable.prototype.toOctane = function(){
		var octane = this._super(),
			valNames = ['min', 'max'];
		
		for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
			var name = valNames[ndx];
			
			octane.props.push({
				name: name,
				val: this[name]
			});
		}
		
		octane.props.push({
			name: 'setAxis',
			arg: [this.axis]
		});
		
		return octane;
	};
		
	/**
	 * Remove any previously set limits from the Turnable.
	 */
	Turnable.prototype.clearLimits = function() {
		this.min = null;
		this.max = null;
	};
		
	/**
	 * Get the relative angle of a mouse click's interception with the
	 * active plane to the origin of that plane.
	 * 
	 * @param {number} x screen x-position of the mouse click event
	 * @param {number} y screen y-position of the mouse click event
	 * @return {number} relative angle of mouse click position on the
	 *     Turnable's current active plane
	 */
	Turnable.prototype.getAngle = function(x,y) {
		var plane;
		
		if (this.local) {
			var u = hemi.utils;
			plane = [u.pointAsWorld(this.activeTransform, this.plane[0]),
					 u.pointAsWorld(this.activeTransform, this.plane[1]),
					 u.pointAsWorld(this.activeTransform, this.plane[2])];
		} else {
			var translation = this.activeTransform.matrixWorld.getPosition();
			
			plane = [new THREE.Vector3().add(this.plane[0], translation),
					 new THREE.Vector3().add(this.plane[1], translation),
					 new THREE.Vector3().add(this.plane[2], translation)];
		}
		var ray = this.client.clientPositionToRay(x, y),
		tuv = hemi.utils.intersect(ray, plane);
		return Math.atan2(tuv[2],tuv[1]);
	};
		
	/**
	 * On mouse move, if the shape has been clicked and is being dragged, 
	 * calculate intersection points with the active plane and turn the
	 * Transform to match.
	 * 
	 * @param {Event} event message describing the mouse position, etc.
	 */
	Turnable.prototype.onMouseMove = function(event) {
		if (this.dragAngle === null) {
			return;
		}
		
		var delta = this.getAngle(event.x,event.y) - this.dragAngle,
			axis;
		
		if (this.max != null && this.angle + delta >= this.max) {
			delta = this.max - this.angle;
		}
		if (this.min != null && this.angle + delta <= this.min) {
			delta = this.min - this.angle;
		}
		
		this.angle += delta;
		
		if (!this.local) {
			this.dragAngle += delta;
		}
		
		switch(this.axis) {
			case hemi.Axis.X:
				axis = new THREE.Vector3(-1,0,0);
				break;
			case hemi.Axis.Y:
				axis = new THREE.Vector3(0,-1,0);
				break;
			case hemi.Axis.Z:
				axis = new THREE.Vector3(0,0,1);
				break;
		}
		
		for (var i = 0; i < this.transformObjs.length; i++) {
			var tran = this.transformObjs[i];
			
			if (this.local) {
				hemi.utils.axisRotate(axis, delta, tran);
			} else {
				hemi.utils.worldRotate(axis, delta, tran);
			}
		}
	};
		
	/**
	 * On mouse up, deactivate turning.
	 * 
	 * @param {o3d.Event} event message describing mouse position, etc.
	 */
	Turnable.prototype.onMouseUp = function(event) {
		this.dragAngle = null;
	};
		
	/**
	 * On a pick message, if it applies to this Turnable, set turning to
	 * true and calculate the relative angle.
	 * 
	 * @param {THREE.Object3D} pickedMesh information about the pick event
	 * @param {oEvent} event message describing mouse position, etc.
	 */
	Turnable.prototype.onPick = function(pickedMesh, event) {
		for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
			if (this.transformObjs[ndx].id == pickedMesh.id) {
				this.activeTransform = pickedMesh;
				this.dragAngle = this.getAngle(event.x,event.y);
				break;
			}
		}
	};

		
	/**
	 * Set the axis to which this Turnable is bound.
	 * 
	 * @param {hemi.Axis} axis axis to rotate about - x, y, or z
	 */
	Turnable.prototype.setAxis = function(axis) {
		this.axis = axis;
		
		switch(axis) {
			case hemi.Axis.X:
				this.plane = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,1), new THREE.Vector3(0,1,0)];
				break;
			case hemi.Axis.Y:
				this.plane = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,1)];
				break;
			case hemi.Axis.Z:
				this.plane = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0)];
				break;
		}
	};
		
	/**
	 * Set the limits to which this Turnable can rotate.
	 * 
	 * @param {number[2]} limits minimum and maximum angle limits (in radians)
	 */
	Turnable.prototype.setLimits = function(limits) {
		if (limits[0] != null) {
			this.min = limits[0];
		} else {
			this.min = null;
		}
		
		if (limits[1] != null) {
			this.max = limits[1];
		} else {
			this.max = null;
		}
	};

	hemi.makeCitizen(Turnable, 'hemi.Turnable', {
		cleanup: function() {
			this.disable();
			this.clearTransforms();
			this.msgHandler = null;
		},
		msgs: [],
		toOctane: []
	});


	var Scalable = function(client, axis) {
		ManipulatorBase.call(this, client);
		this.axis = null;
		this.dragAxis = null;
		this.dragOrigin = null;
		this.scale = null;
		
		this.setAxis(axis);
		this.enable();
	};

	Scalable.prototype = new ManipulatorBase();
	Scalable.constructor = Scalable;
		
	Scalable.prototype.getScale = function(x, y) {
		var offset = new THREE.Vector2(x - this.dragOrigin.x, y - this.dragOrigin.y),
		scale = Math.abs(this.dragAxis.dot(offset));
		return scale;
	};

	Scalable.prototype.onMouseMove = function(event) {
		if (this.dragAxis === null) {
			return;
		}
		
		var scale = this.getScale(event.x, event.y),
			f = scale/this.scale,
			axis = new THREE.Vector3(
				this.axis.x ? f : 1,
				this.axis.y ? f : 1,
				this.axis.z ? f : 1
			);
		
		for (var i = 0; i < this.transformObjs.length; i++) {
			var tran = this.transformObjs[i];
			
			if (this.local) {
				tran.scale.multiplySelf(axis);
				tran.updateMatrix();
			} else {
				hemi.utils.worldScale(axis, tran);
			}
		}
		
		this.scale = scale;
		
		this.send(hemi.msg.scale, { scale: scale });
	};
		
	Scalable.prototype.onMouseUp = function() {
		this.dragAxis = null;
		this.dragOrigin = null;
		this.scale = null;
	};

	Scalable.prototype.onPick = function(pickedMesh, event) {
		for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
			if (this.transformObjs[ndx].id == pickedMesh.id) {
				this.activeTransform = pickedMesh;
				var axis2d = this.xyPoint(this.axis);
				this.dragOrigin = this.xyPoint(new THREE.Vector3(0,0,0));
				this.dragAxis = new THREE.Vector2(axis2d.x - this.dragOrigin.x, axis2d.y - this.dragOrigin.y).normalize();
				this.scale = this.getScale(event.x, event.y);
				break;
			}
		}
	};

	Scalable.prototype.setAxis = function(axis) {
		switch(axis) {
			case hemi.Axis.X:
				this.axis = new THREE.Vector3(1,0,0);
				break;
			case hemi.Axis.Y:
				this.axis = new THREE.Vector3(0,1,0);
				break;
			case hemi.Axis.Z:
				this.axis = new THREE.Vector3(0,0,1);
				break;
			default:
				this.axis = new THREE.Vector3(0,0,0);
		}
	};


	Scalable.prototype.xyPoint = function(plane) {
		if (this.activeTransform === null) {
			return null;
		}
		
		var point;
		
		if (this.local) {
			point = hemi.utils.pointAsWorld(this.activeTransform, plane);
		} else {
			point = new THREE.Vector3().add(plane, this.activeTransform.position);
		}
		
		return hemi.utils.worldToScreenFloat(this.client, point);
	};

	hemi.makeCitizen(Scalable, 'hemi.Scalable', {
		cleanup: function() {
			this.disable();
			this.clearTransforms();
			this.msgHandler = null;
		},
		msgs: [hemi.msg.scale],
		toOctane: []
	});
	
	return hemi;
})(hemi || {});/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
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

/**
 * @fileoverview This describes the objects needed to build the hemi particle
 *		effects: Bezier curves, particles which can follow those curves, and
 *		systems to manage particles and emitters. 
 */

var hemi = (function(hemi) {
	/**
	 * @namespace A module for curves and particle systems.
	 */
	hemi.curve = hemi.curve || {};
	
	var dbBoxMat =  new THREE.MeshPhongMaterial({
			color: 0x000088,
			wireframe: true,
			wireframeLinewidth: 1
		}),	
		dbgBoxTransforms = {},
		dbgLineMat = null,
		dbgLineTransforms = [];
	
////////////////////////////////////////////////////////////////////////////////
//                              	Constants	                              //
////////////////////////////////////////////////////////////////////////////////  

	/**
	 * Enum for different curve types, described below.
	 * <ul><pre>
	 * <li>hemi.curve.CurveType.Linear
	 * <li>hemi.curve.CurveType.Bezier
	 * <li>hemi.curve.CurveType.CubicHermite
	 * <li>hemi.curve.CurveType.LinearNorm
	 * <li>hemi.curve.CurveType.Cardinal
	 * <li>hemi.curve.CurveType.Custom
	 * </ul></pre>
	 */
	hemi.curve.CurveType = {
		Linear : 0,
		Bezier : 1,
		CubicHermite : 2,
		LinearNorm : 3,
		Cardinal : 4,
		Custom : 5
	};
	
	/**
	 * Predefined values for common shapes.
	 * <ul><pre>
	 * <li>hemi.curve.ShapeType.CUBE
	 * <li>hemi.curve.ShapeType.SPHERE
	 * <li>hemi.curve.ShapeType.ARROW
	 * </ul></pre>
	 */
	hemi.curve.ShapeType = {
		CUBE : 'cube',
		SPHERE : 'sphere',
		ARROW : 'arrow'
	};
	
////////////////////////////////////////////////////////////////////////////////
//                             Global Methods                                 //
////////////////////////////////////////////////////////////////////////////////  
	
	/**
	 * Create a curve particle system with the given configuration.
	 * 
	 * @param {hemi.Client} the client to create the system in
	 * @param {Object} cfg configuration options:
	 *     aim: flag to indicate particles should orient with curve
	 *     boxes: array of bounding boxes for particle curves to pass through
	 *     colors: array of values for particle color ramp (use this or colorKeys)
	 *     colorKeys: array of time keys and values for particle color ramp
	 *     fast: flag to indicate GPU-driven particle system should be used
	 *     life: lifetime of particle system (in seconds)
	 *     particleCount: number of particles to allocate for system
	 *     particleShape: enumerator for type of shape to use for particles
	 *     particleSize: size of the particles
	 *     scales: array of values for particle scale ramp (use this or scaleKeys)
	 *     scaleKeys: array of time keys and values for particle size ramp
	 *     tension: tension parameter for the curve (typically from -1 to 1)
	 *     // JS particle system only
	 *     parent: transform to parent the particle system under
	 *     // GPU particle system only
	 *     trail: flag to indicate system should have trailing start and stop
	 * @return {Object} the created particle system
	 */
	hemi.createCurveSystem = function(client, cfg) {
		var system;
		
		if (cfg.fast) {
			if (cfg.trail) {
				system = new hemi.GpuParticleTrail(client, cfg);
			} else {
				system = new hemi.GpuParticleCurveSystem(client, cfg);
			}
		} else {
			system = new hemi.ParticleCurveSystem(client, cfg);
		}
		
		return system;
	};
	
////////////////////////////////////////////////////////////////////////////////
//                              	Classes	                                  //
////////////////////////////////////////////////////////////////////////////////  
	
	/**
	 * @class A Box is defined by a minimum XYZ point and a maximum XYZ point.
	 * 
	 * @param {THREE.Vector3} opt_min minimum XYZ point
	 * @param {THREE.Vector3} opt_max maximum XYZ point
	 */
	hemi.curve.Box = function(opt_min, opt_max) {
		/**
		 * The minimum XYZ point
		 * @type THREE.Vector3
		 */
		this.min = opt_min || new THREE.Vector3();
		
		/**
		 * The maximum XYZ point
		 * @type THREE.Vector3
		 */
		this.max = opt_max || new THREE.Vector3();
	};
	
	/**
	 * @class A ColorKey contains a time key and a color value.
	 * 
	 * @param {number} key time value between 0 and 1
	 * @param {number[4]} color RGBA color value
	 */
	hemi.curve.ColorKey = function(key, color) {
		/**
		 * The time when the ColorKey is 100% of the Curve's color value.
		 * @type number
		 */
		this.key = key;
		
		/**
		 * The color value for Curve particles.
		 * @type number[4]
		 */
		this.value = color;
	};
	
	/**
	 * @class A ScaleKey contains a time key and a scale value.
	 * 
	 * @param {number} key time value between 0 and 1
	 * @param {THREE.Vector3} scale XYZ scale value
	 */
	hemi.curve.ScaleKey = function(key, scale) {
		/**
		 * The time when the ScaleKey is 100% of the Curve's scale value.
		 * @type number
		 */
		this.key = key;
		
		/**
		 * The scale value for Curve particles.
		 * @type THREE.Vector3
		 */
		this.value = scale;
	};

	/**
	 * @class A Curve is used to represent and calculate different curves
	 * including: linear, bezier, cardinal, and cubic hermite.
	 * 
	 * @param {THREE.Vector3[]} points List of xyz waypoints 
	 * @param {hemi.curve.CurveType} opt_type Curve type
	 * @param {Object} opt_config Configuration object specific to this curve
	 */
	var Curve = function(points, opt_type, opt_config) {
		this.count = 0;
		this.tension = 0;
		this.type = opt_type;
		this.weights = [];
		this.xpts = [];
		this.xtans = [];
		this.ypts = [];
		this.ytans = [];
		this.zpts = [];
		this.ztans = [];
		
		if (points) {
			opt_config = opt_config || {};
			opt_config.points = points;
			this.loadConfig(opt_config);
		}
	}

//	/**
//	 * Get the Octane structure for the Curve.
//     *
//     * @return {Object} the Octane structure representing the Curve
//	 */
//	Curve.prototype.toOctane = function() {
//		var names = ['count', 'tension', 'weights', 'xpts', 'xtans', 'ypts',
//				'ytans', 'zpts', 'ztans'],
//			octane = {
//				type: 'hemi.curve.Curve',
//				props: []
//			};
//		
//		for (var ndx = 0, len = names.length; ndx < len; ndx++) {
//			var name = names[ndx];
//			
//			octane.props.push({
//				name: name,
//				val: this[name]
//			});
//		}
//		
//		octane.props.push({
//			name: 'setType',
//			arg: [this.type]
//		});
//		
//		return octane;
//	};
	
	/**
	 * Load the given configuration options into the Curve.
	 * 
	 * @param {Object} cfg configuration options for the Curve
	 */
	Curve.prototype.loadConfig = function(cfg) {
		var points = cfg.points,
			type = cfg.type || this.type || hemi.curve.CurveType.Linear;
		
		this.setType(type);
		
		if (points) {
			this.count = points.length;
			
			for (var i = 0; i < this.count; i++) {
				this.xpts[i] = points[i].x;
				this.ypts[i] = points[i].y;
				this.zpts[i] = points[i].z;
				this.xtans[i] = 0;
				this.ytans[i] = 0;
				this.ztans[i] = 0;
				this.weights[i] = 1;
			}
		}
		
		if (cfg.weights) {
			for (var i = 0; i < this.count; i++) {
				this.weights[i] = (cfg.weights[i] != null) ? cfg.weights[i] : 1;
			}
		}
		
		if (cfg.tangents) {
			for (var i = 0; i < this.count; i++) {
				if(cfg.tangents[i]) {
					this.xtans[i] = cfg.tangents[i][0] || 0;
					this.ytans[i] = cfg.tangents[i][1] || 0;
					this.ztans[i] = cfg.tangents[i][2] || 0;
				}	
			}
		}
		
		if(cfg.tension) {
			this.tension = cfg.tension;
		}
		
		this.setTangents();
	};
	
	/**
	 * Base interpolation function for this curve. Usually overwritten.
	 *
	 * @param {number} t time, usually between 0 and 1
	 * @return {THREE.Vector3} the position interpolated from the time input
	 */
	Curve.prototype.interpolate = function(t) {
		return new THREE.Vector3(t,t,t);
	};

	/**
	 * The linear interpolation moves on a straight line between waypoints.
	 *
	 * @param {number} t time, usually between 0 and 1
	 * @return {THREE.Vector3} the position linearly interpolated from the time
	 *     input
	 */
	Curve.prototype.linear = function(t) {
		var n = this.count - 1;
		var ndx = Math.floor(t*n);
		if (ndx >= n) ndx = n-1;
		var tt = (t-ndx/n)/((ndx+1)/n-ndx/n);
		var x = (1-tt)*this.xpts[ndx] + tt*this.xpts[ndx+1];
		var y = (1-tt)*this.ypts[ndx] + tt*this.ypts[ndx+1];
		var z = (1-tt)*this.zpts[ndx] + tt*this.zpts[ndx+1];
		return new THREE.Vector3(x,y,z);
	};

	/**
	 * The bezier interpolation starts at the first waypoint, and ends at
	 * the last waypoint, and 'bends' toward the intermediate points. These
	 * points can be weighted for more bending.
	 *
	 * @param {number} t time, usually between 0 and 1
	 * @return {THREE.Vector3} the position interpolated from the time input by
	 *     a bezier function.
	 */
	Curve.prototype.bezier = function(t) {
		var x = 0;
		var y = 0;
		var z = 0;
		var w = 0;
		var n = this.count;
		for(var i = 0; i < n; i++) {
			var fac = this.weights[i]*
			          hemi.utils.choose(n-1,i)*
				      Math.pow(t,i)*
					  Math.pow((1-t),(n-1-i));
			x += fac*this.xpts[i];
			y += fac*this.ypts[i];
			z += fac*this.zpts[i];
			w += fac; 
		}
		return new THREE.Vector3(x/w,y/w,z/w);
	};

	/**
	 * The cubic hermite function interpolates along a line that runs
	 * through the Curve's waypoints at a predefined tangent slope through
	 * each one.
	 *
	 * @param {number} t time, usually between 0 and 1
	 * @return {THREE.Vector3} the position interpolated from the time input by
	 *     the cubic hermite function.
	 */
	Curve.prototype.cubicHermite = function(t) {
		var n = this.count - 1;
		var ndx = Math.floor(t*n);
		if (ndx >= n) ndx = n-1;
		var tt = (t-ndx/n)/((ndx+1)/n-ndx/n);
		var x = hemi.utils.cubicHermite(tt,this.xpts[ndx],this.xtans[ndx],this.xpts[ndx+1],this.xtans[ndx+1]);
		var y = hemi.utils.cubicHermite(tt,this.ypts[ndx],this.ytans[ndx],this.ypts[ndx+1],this.ytans[ndx+1]);
		var z = hemi.utils.cubicHermite(tt,this.zpts[ndx],this.ztans[ndx],this.zpts[ndx+1],this.ztans[ndx+1]);
		return new THREE.Vector3(x,y,z);
	};
	
	/**
	 * The normalized linear interpolation moves on a straight line between
	 * waypoints at a constant velocity.
	 *
	 * @param {number} t time, usually between 0 and 1
	 * @return {THREE.Vector3} the position linearly interpolated from the time
	 *     input, normalized to keep the velocity constant
	 */
	Curve.prototype.linearNorm = function(t) {
		var d = 0;
		var dpts = [];
		dpts[0] = 0;
		for(var i = 1; i < this.count; i++) {
			d += hemi.core.math.distance([this.xpts[i-1],this.ypts[i-1],this.zpts[i-1]],
										 [this.xpts[i],this.ypts[i],this.zpts[i]]);
			dpts[i] = d;
		}
		var tt = t*d;
		var ndx = 0;
		for(var i = 0; i < this.count; i++) {
			if(dpts[i] < tt) ndx = i; 
		}
		var lt = (tt - dpts[ndx])/(dpts[ndx+1] - dpts[ndx]);
		var x = (1-lt)*this.xpts[ndx] + lt*this.xpts[ndx+1];
		var y = (1-lt)*this.ypts[ndx] + lt*this.ypts[ndx+1];
		var z = (1-lt)*this.zpts[ndx] + lt*this.zpts[ndx+1];			
		return new THREE.Vector3(x,y,z);
	};
	
	/**
	 * Calculate the tangents for a cardinal curve, which is a cubic hermite
	 * curve where the tangents are defined by a single 'tension' factor.
	 */
	Curve.prototype.setTangents = function() {
		if (this.type == hemi.curve.CurveType.Cardinal) {
			var xpts = hemi.utils.clone(this.xpts),
				ypts = hemi.utils.clone(this.ypts),
				zpts = hemi.utils.clone(this.zpts);
			
			// Copy the first and last points in order to calculate tangents
			xpts.unshift(xpts[0]);
			xpts.push(xpts[xpts.length - 1]);
			ypts.unshift(ypts[0]);
			ypts.push(ypts[ypts.length - 1]);
			zpts.unshift(zpts[0]);
			zpts.push(zpts[zpts.length - 1]);
			
			for (var i = 0; i < this.count; i++) {
				this.xtans[i] = (1-this.tension)*(xpts[i+2]-xpts[i])/2;
				this.ytans[i] = (1-this.tension)*(ypts[i+2]-ypts[i])/2;
				this.ztans[i] = (1-this.tension)*(zpts[i+2]-zpts[i])/2;
			}
		}
	};
	
	/**
	 * Set the type of interpolation for the Curve.
	 * 
	 * @param {hemi.curve.CurveType} type interpolation type
	 */
	Curve.prototype.setType = function(type) {
		this.type = type;
		
		switch (type) {
			case hemi.curve.CurveType.Linear:
				this.interpolate = this.linear;
				break;
			case hemi.curve.CurveType.Bezier:
				this.interpolate = this.bezier;
				break;
			case hemi.curve.CurveType.CubicHermite:
			case hemi.curve.CurveType.Cardinal:
				this.interpolate = this.cubicHermite;
				break;
			case hemi.curve.CurveType.LinearNorm:
				this.interpolate = this.linearNorm;
				break;
			case hemi.curve.CurveType.Custom:
			default:
				break;
		}
	};
	
	/**
	 * Get the XYZ position of the last waypoint of the Curve.
	 * 
	 * @return {THREE.Vector3} the position of the last waypoint
	 */
	Curve.prototype.getEnd = function() {
		var end = this.count - 1;
		return new THREE.Vector3(this.xpts[end],this.ypts[end],this.zpts[end]);
	};
	
	/**
	 * Get the XYZ position of the first waypoint of the Curve.
	 * 
	 * @return {THREE.Vector3} the position of the first waypoint
	 */
	Curve.prototype.getStart = function() {
		return new THREE.Vector3(this.xpts[0],this.ypts[0],this.zpts[0]);
	};
	
	/**
	 * Draw the Curve using primitive shapes.
	 * 
	 * @param {number} samples the number of samples to use to draw
	 * @param {Object} config configuration for how the Curve should look
	 */
	Curve.prototype.draw = function(samples, config) {
		var points = [];
		for (var i = 0; i < samples+2; i++) {
			points[i] = this.interpolate(i/(samples+1));
		}
		drawCurve(points,config);
	};
	
	/**
	 * @class A Particle allows a Transform to move along a set of points.
	 * 
	 * @param {o3d.Transform} trans the transform to move along the curve
	 * @param {THREE.Vector3[]} points the array of points to travel through
	 * @param {hemi.curve.ColorKey[]} colorKeys array of key-values for the 
	 *		color of the default material
	 * @param {hemi.curve.ScaleKey[]} scaleKeys array of key-values for the 
	 *		scale of the transform
	 * @param {boolean} rotate flag indicating if the Transform should rotate as
	 *      it travels through the points
	 */
	var Particle = function(trans, points, colorKeys, scaleKeys, rotate) {
		this.transform = new THREE.Object3D();
		trans.add(this.transform);
		this.transform.matrixAutoUpdate = false;
		
		this.frame = 1;
		this.lastFrame = points.length - 2;
		this.destroyed = false;
		this.material = new THREE.MeshPhongMaterial({
			color: 0x000000,
			transparent: true
		});
		
		this.lt = [];
		this.matrices = [];
		this.setColors(colorKeys);
		
		for (var i = this.frame; i <= this.lastFrame; i++) {
			var L = new THREE.Matrix4(),
				p = points[i];
			
			L.setTranslation(p.x, p.y, p.z);
			
			if (rotate) {
				hemi.utils.pointYAt(L, points[i-1], points[i+1]);
			}
			
			this.lt[i] = L;
		}
		this.setScales(scaleKeys);
		this.ready = true;
		this.active = false;
	};
	
	/**
	 * Start this particle along the curve.
	 *
	 * @param {number} loops the number of loops to do
	 */
	Particle.prototype.run = function(loops) {
		this.loops = loops;
		this.ready = false;
		this.active = true;
	};

	/**
	 * Add a shape to the particle Transform.
	 *
	 * @param {THREE.Geometry} shape the shape to add
	 */
	Particle.prototype.addShape = function(shape) {
		this.transform.add(new THREE.Mesh(shape, this.material));
	};
	
	/**
	 * Remove all shapes from the particle transform.
	 */
	Particle.prototype.removeShapes = function() {
		for (var i = this.transform.children.length - 1; i >=0; i--) {
			this.transform.remove(this.transform.children[i]);
		}
	};
	
	/**
	 * Set the color gradient of this Particle.
	 * 
	 * @param {hemi.curve.ColorKey[]} colorKeys array of color key pairs
	 */
	Particle.prototype.setColors = function(colorKeys) {
		this.colors = [];
		if(colorKeys) {
			this.colorKeys = [];
			for (var i = 0; i < colorKeys.length; i++) {
				var p = {};
				var c = colorKeys[i];
				p.key = c.key;
				if (c.range) {
					p.value = [];
					if (typeof c.range == 'number') {
						var offset = (Math.random()-0.5)*2*c.range;
						for (var j = 0; j < c.value.length; j++) {
							p.value[j] = c.value[j] + offset;
						}
					} else {
						for (var j = 0; j < c.value.length; j++) {
							p.value[j] = c.value[j] + (Math.random()-0.5)*2*c.range[j];
						}
					}
				} else {
					p.value = c.value;
				}
				this.colorKeys[i] = p;
			}
		} else {
			this.colorKeys = [
				{key: 0, value: [0,0,0,1]},
				{key: 1, value: [0,0,0,1]}
				];
		}
		for (var i = 1; i <= this.lastFrame; i++) {		
			var time = (i-1)/(this.lastFrame-2);				
			this.colors[i] = this.lerpValue(time, this.colorKeys);			
		}
		return this;
	};
	
	/**
	 * Set the scale gradient of this particle.
	 * 
	 * @param {hemi.curve.ScaleKey[]} scaleKeys array of scale key pairs
	 */
	Particle.prototype.setScales = function(scaleKeys) {
		this.scales = [];
		if(scaleKeys) {
			var sKeys = [];
			for (var i = 0; i < scaleKeys.length; i++) {
				var p = {};
				var c = scaleKeys[i];
				p.key = c.key;
				if (c.range) {
					p.value = [];
					if (typeof c.range == 'number') {
						var offset = (Math.random()-0.5)*2*c.range;
						p.value = new THREE.Vector3(c.value.x + offset, c.value.y + offset, 
							c.value.z + offset);
					} else {
						p.value = new THREE.Vector3(c.value.x + (Math.random()-0.5)*2*c.range.x, 
							c.value.y + (Math.random()-0.5)*2*c.range.y, 
							c.value.z + (Math.random()-0.5)*2*c.rang.z);
					}
				} else {
					p.value = c.value;
				}
				sKeys[i] = p;
			}
		} else {
			sKeys = [
				{key: 0, value: new THREE.Vector3(1, 1, 1)},
				{key: 1, value: new THREE.Vector3(1, 1, 1)}
			];
		}
		for (var i = 1; i <= this.lastFrame; i++) {
			var time = (i-1)/(this.lastFrame-2),
				scale = this.scales[i] = this.lerpValue(time, sKeys);
			this.matrices[i] = new THREE.Matrix4().copy(this.lt[i]).scale(scale);
		}
		return this;
	};

	/**
	 * Translate the Particle transform in local space.
	 *
	 * @param {number} x x translation
	 * @param {number} y y translation
	 * @param {number} z z translation
	 */
	Particle.prototype.translate = function(x, y, z) {
		this.transform.translateX(x);
		this.transform.translateY(y);
		this.transform.translateZ(z);
	};
	
	/**
	 * Given a set of key-values, return the interpolated value
	 *
	 * @param {number} time time, from 0 to 1
	 * @param {Object[]} keySet array of key-value pairs
	 * @return {Object} the interpolated value as either an array of numbers or a THREE.Vector3
	 * 		depending on the array of key-value pairs passed in
	 */
	Particle.prototype.lerpValue = function(time, keySet) {
		var ndx = keySet.length - 2;
		while(keySet[ndx].key > time) {
			ndx--;
		}
		var a = keySet[ndx],
			b = keySet[ndx+1],
			t = (time - a.key)/(b.key - a.key),
			i = (1 - t),
			r = [],
			aLength = a.value.length;
		
		if (a.value instanceof THREE.Vector3) {		
			r = new THREE.Vector3(i * a.value.x + t * b.value.x,
				i * a.value.y + t * b.value.y,
				i * a.value.z + t * b.value.z);
		}
		else {
			for (var i = 0; i < aLength; ++i) {
				r[i] = (1 - t) * a.value[i] + t * b.value[i];
			}
		}
			
		return r;
	};
	
	/**
	 * Update the particle (called on each render).
	 */
	Particle.prototype.update = function() {
		if (!this.active) return;
		
		var f = this.frame,
			c = this.colors[f];
		this.material.color.setRGB(c[0], c[1], c[2]);
		this.material.opacity = c[3];
		this.transform.matrixWorldNeedsUpdate = true;
		this.transform.matrix = this.matrices[f];
		this.frame++;
		this.transform.visible = true;
		for (var i = 0, il = this.transform.children.length; i < il; i++) {
			this.transform.children[i].visible = true;
		}
		
		if (this.frame >= this.lastFrame) {
			this.frame = 1;
			this.loops--;
			if (this.loops === 0) this.reset();
		}
	};
	
	/**
	 * Destroy this particle and all references to it.
	 */
	Particle.prototype.destroy = function() {
		if(this.destroyed) return;
		
		var t = this.transform,
			p = t.parent;
			
		for(var i = (t.children.length-1); i >= 0; i--) {
			t.remove(t.children[i]);
		}
		
		if (p) {
			p.remove(t);
		}
		
		this.transform = null;
		this.curve = null;
		this.destroyed = true;
	};
	
	/**
	 * Reset this particle.
	 */
	Particle.prototype.reset = function() {
		this.transform.visible = false;
		for (var i = 0, il = this.transform.children.length; i < il; i++) {
			this.transform.children[i].visible = false;
		}
		this.loops = this.totalLoops;
		this.destroyed = false;
		this.active = false;
		this.ready = true;
	};
	
	/**
	 * @class A ParticleCurveSystem manages a set of Particle objects, and fires
	 * them at the appropriate intervals.
	 * 
	 * @param {Object} config configuration object describing this system
	 */
	var ParticleCurveSystem = function(client, config) {
		this.transform = new THREE.Object3D();
		config.parent ? config.parent.add(this.transform) : client.scene.add(this.transform);
		
		this.active = false;
		this.pLife = config.life || 5;
		this.boxes = config.boxes;
		this.maxParticles = config.particleCount || 25;
		this.maxRate = Math.ceil(this.maxParticles / this.pLife);
		this.particles = [];
		this.pRate = this.maxRate;
		this.pTimer = 0.0;
		this.pTimerMax = 1.0 / this.pRate;
		this.pIndex = 0;
			
		this.shapeMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			transparent: true
		});
		
		var type = config.particleShape || hemi.curve.ShapeType.CUBE,
			size = config.particleSize || 1;
		this.shapes = [];
		this.size = size;
		
		switch (type) {
			case (hemi.curve.ShapeType.ARROW):
				var halfSize = size / 2,
					thirdSize = size / 3;
				this.shapes.push(new THREE.ArrowGeometry(size, 
					size, halfSize, halfSize, size));
				break;
			case (hemi.curve.ShapeType.CUBE):
				this.shapes.push(new THREE.CubeGeometry(size, size, size));
				break;
			case (hemi.curve.ShapeType.SPHERE):
				this.shapes.push(new THREE.SphereGeometry(size, 12, 12));
				break;
		}
		
		hemi.addRenderListener(this);
		
		this.boxesOn = false;
		
		this.points = [];
		this.frames = config.frames || this.pLife*hemi.getFPS();
		
		for(var j = 0; j < this.maxParticles; j++) {
			var curve = this.newCurve(config.tension || 0);
			this.points[j] = [];
			for(var i=0; i < this.frames; i++) {
				this.points[j][i] = curve.interpolate((i)/this.frames);
			}
		}
		
		var colorKeys = null,
			scaleKeys = null;
		
		if (config.colorKeys) {
			colorKeys = config.colorKeys;
		} else if (config.colors) {
			var len = config.colors.length,
				step = len === 1 ? 1 : 1 / (len - 1);
			
			colorKeys = [];
			
			for (var i = 0; i < len; i++) {
				colorKeys.push({
					key: i * step,
					value: config.colors[i]
				});
			}
		}
		if (config.scaleKeys) {
			scaleKeys = config.scaleKeys;
		} else if (config.scales) {
			var len = config.scales.length,
				step = len === 1 ? 1 : 1 / (len - 1);
			
			scaleKeys = [];
			
			for (var i = 0; i < len; i++) {
				scaleKeys.push({
					key: i * step,
					value: config.scales[i]
				});
			}
		}
		
		for (i = 0; i < this.maxParticles; i++) {
			this.particles[i] = new Particle(
				this.transform,
				this.points[i],
				colorKeys,
				scaleKeys,
				config.aim);
			for (var j = 0; j < this.shapes.length; j++) {
				this.particles[i].addShape(this.shapes[j]);
			}
		}
	};
		
	/**
	 * Start the system.
	 */
	ParticleCurveSystem.prototype.start = function() {
		this.active = true;
	};
	
	/**
	 * Stop the system.
	 *
	 * @param {boolean} opt_hard If true, remove all particles immediately.
	 *     Otherwise, stop emitting but let existing particles finish.
	 */
	ParticleCurveSystem.prototype.stop = function(opt_hard) {
		this.active = false;
		if(opt_hard) {
			// Destroy All Particles
			for(var i = 0; i < this.maxParticles; i++) {
				if(this.particles[i] != null) {
					this.particles[i].reset();
				}
			}
		}
	};
	
	/**
	 * Update all existing particles on each render and emit new ones if
	 * needed.
	 *
	 * @param {o3d.RenderEvent} event event object describing details of the
	 *     render loop
	 */
	ParticleCurveSystem.prototype.onRender = function(event) {
		for(var i = 0; i < this.maxParticles; i++) {
			if(this.particles[i] != null) {
				this.particles[i].update(event);
			}
		}
		if(!this.active) return;
		this.pTimer += event.elapsedTime;
		if(this.pTimer >= this.pTimerMax) {
			this.pTimer = 0;
			var p = this.particles[this.pIndex];
			if (p.ready) p.run(1);
			this.pIndex++;
			if(this.pIndex >= this.maxParticles) this.pIndex = 0;
		}
	};
	
	/**
	 * Generate a new curve running through the system's bounding boxes.
	 * 
	 * @param {number} tension tension parameter for the Curve
	 * @return {hemi.curve.Curve} the randomly generated Curve
	 */
	ParticleCurveSystem.prototype.newCurve = function(tension) {
		var points = [];
		var num = this.boxes.length;
		for (var i = 0; i < num; i++) {
			var min = this.boxes[i].min;
			var max = this.boxes[i].max;
			points[i+1] = randomPoint(min,max);
		}
		points[0] = points[1].clone();
		points[num+1] = points[num].clone();
		var curve = new hemi.Curve(points,
			hemi.curve.CurveType.Cardinal, {tension: tension});
		return curve;
	};
	
	/**
	 * Remove all shapes from all particles in the system.
	 */
	ParticleCurveSystem.prototype.removeShapes = function() {
		for (var i = 0; i < this.maxParticles; i++) {
			this.particles[i].removeShapes();
		}
		this.shapes = [];
	};
	
	/**
	 * Add a shape which will be added to the Transform of every particle.
	 *
	 * @param {number|o3d.Shape} shape either an enum for standard shapes,
	 *     or a custom	predefined shape to add
	 */
	ParticleCurveSystem.prototype.addShape = function(shape) {
		var pack = hemi.curve.pack;
		var startndx = this.shapes.length;
		if (typeof shape == 'string') {
			var size = this.size;
			
			switch (shape) {
				case (hemi.curve.ShapeType.ARROW):
					var halfSize = size / 2,
						thirdSize = size / 3;
					this.shapes.push(new THREE.ArrowGeometry(size, 
						size, halfSize, halfSize, size));
					break;
				case (hemi.curve.ShapeType.CUBE):
					this.shapes.push(new THREE.CubeGeometry(size, size, size));
					break;
				case (hemi.curve.ShapeType.SPHERE):
					this.shapes.push(new THREE.SphereGeometry(size, 24, 12));
					break;
			}
		} else {
			this.shapes.push(shape);
		}
		for (var i = 0; i < this.maxParticles; i++) {
			for (var j = startndx; j < this.shapes.length; j++) {
				this.particles[i].addShape(this.shapes[j]);
			}
		}
	};
	
	/**
	 * Change the rate at which particles are emitted.
	 *
	 * @param {number} delta the delta by which to change the rate
	 * @return {number} the new rate
	 */
	ParticleCurveSystem.prototype.changeRate = function(delta) {
		return this.setRate(this.pRate + delta);
	};
	
	/**
	 * Set the emit rate of the system.
	 *
	 * @param {number} rate the rate at which to emit particles
	 * @return {number} the new rate - may be different because of bounds
	 */
	ParticleCurveSystem.prototype.setRate = function(rate) {
		var newRate = hemi.utils.clamp(rate, 0, this.maxRate);
		
		if (newRate === 0) {
			this.pTimerMax = 0;
			this.stop();
		} else {
			if (this.pRate === 0 && newRate > 0) {
				this.start();
			}
			this.pTimerMax = 1.0 / newRate;
		}
		
		this.pRate = newRate;
		return newRate;
	};
	
	/**
	 * Set the color gradient for this particle system.
	 * 
	 * @param {hemi.curve.ColorKey[]} colorKeys array of color key pairs
	 * @return {hemi.curve.ParticleCurveSystem} this system, for chaining
	 */
	ParticleCurveSystem.prototype.setColors = function(colorKeys) {
		for (var i = 0; i < this.maxParticles; i++) {
			this.particles[i].setColors(colorKeys);
		}
		return this;
	};

	/**
	 * Set the scale gradient for this particle system.
	 * 
	 * @param {hemi.curve.ScaleKey[]} scaleKeys array of scale key pairs
	 * @return {hemi.curve.ParticleCurveSystem} this system, for chaining
	 */		
	ParticleCurveSystem.prototype.setScales = function(scaleKeys) {
		for (var i = 0; i < this.maxParticles; i++) {
			this.particles[i].setScales(scaleKeys);
		}
		return this;
	};
	
	/**
	 * Render the bounding boxes which the particle system's curves run
	 * through (helpful for debugging).
	 */
	ParticleCurveSystem.prototype.showBoxes = function() {
		showBoxes.call(this);
	};

	/**
	 * Hide the particle system's bounding boxes from view.
	 */
	ParticleCurveSystem.prototype.hideBoxes = function() {
		hideBoxes.call(this);
	};
	
	/**
	 * Translate the entire particle system by the given amounts
	 * 
	 * @param {number} x amount to translate in the X direction
	 * @param {number} y amount to translate in the Y direction
	 * @param {number} z amount to translate in the Z direction
	 */
	ParticleCurveSystem.prototype.translate= function(x, y, z) {
		this.transform.position.addSelf(new THREE.Vector(x, y, z));
		this.transform.updateMatrix();
	};
	
	// START GPU PARTICLE SYSTEM
	
	
////////////////////////////////////////////////////////////////////////////////
//                               Shader Chunks                                //
////////////////////////////////////////////////////////////////////////////////   
	
	var shaderChunks = {
		vert: {
			header: 
				'uniform float sysTime; \n' +
				'uniform float ptcMaxTime; \n' +
				'uniform float ptcDec; \n' +
				'uniform float numPtcs; \n' +
				'uniform float tension; \n' +
				'uniform mat4 viewIT; \n' +
				'uniform vec3 minXYZ[NUM_BOXES]; \n' +
				'uniform vec3 maxXYZ[NUM_BOXES]; \n' +
				'attribute vec4 idOffset; \n' +
				'varying vec4 ptcColor; \n',
				
			headerColors:
				'uniform vec4 ptcColors[NUM_COLORS]; \n' +
				'uniform float ptcColorKeys[NUM_COLORS]; \n',
	
			headerScales:
				'uniform vec3 ptcScales[NUM_SCALES]; \n' +
				'uniform float ptcScaleKeys[NUM_SCALES]; \n',
	
			support:
				'float rand(vec2 co) { \n' +
				'  return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453); \n' +
				'} \n' +
				'vec3 randXYZ(vec2 co, vec3 min, vec3 max) { \n' +
				'  float rX = rand(vec2(co.x, co.x)); \n' +
				'  float rY = rand(vec2(co.y, co.y)); \n' +
				'  float rZ = rand(co); \n' +
				'  return vec3(mix(max.x, min.x, rX), \n' +
				'              mix(max.y, min.y, rY), \n' +
				'              mix(max.z, min.z, rZ)); \n' +
				'} \n' +
				'vec3 ptcInterp(float t, vec3 p0, vec3 p1, vec3 m0, vec3 m1) { \n' +
				'  float t2 = pow(t, 2.0); \n' +
				'  float t3 = pow(t, 3.0); \n' +
				'  return (2.0*t3 - 3.0*t2 + 1.0)*p0 + (t3 -2.0*t2 + t)*m0 + \n' +
				'   (-2.0*t3 + 3.0*t2)*p1 + (t3-t2)*m1; \n' +
				'} \n',
			
			// Unfortunately we have to do this in the vertex shader since the pixel
			// shader complains about non-constant indexing.
			supportColors:
				'void setPtcClr(float ptcTime) { \n' +
				'  if (ptcTime > 1.0) { \n' +
				'    ptcColor = vec4(0.0); \n' +
				'  } else { \n' +
				'    int ndx; \n' +
				'    float key; \n' +
				'    for (int i = 0; i < NUM_COLORS-1; i++) { \n' +
				'      if (ptcColorKeys[i] < ptcTime) { \n' +
				'        ndx = i; \n' +
				'        key = ptcColorKeys[i]; \n' +
				'      } \n' +
				'    } \n' +
				'    float t = (ptcTime - key)/(ptcColorKeys[ndx+1] - key); \n' +
				'    ptcColor = mix(ptcColors[ndx], ptcColors[ndx+1], t); \n' +
		//		'    ptcColor = vec4(t, 0.0, 0.0, 1.0); \n ' + //vec4(1.0, 0.0, 0.5, 1.0); \n' +
				'  } \n' +
				'} \n',
			
			supportNoColors:
				'void setPtcClr(float ptcTime) { \n' +
				'  if (ptcTime > 1.0) { \n' +
				'    ptcColor = vec4(0.0); \n' +
				'  } else { \n' +
				'    ptcColor = vec4(1.0); \n' +
				'  } \n' +
				'} \n',
			
			supportAim:
				'mat4 getRotMat(float t, vec3 p0, vec3 p1, vec3 m0, vec3 m1) { \n' +
				'  float tM = max(0.0,t-0.02); \n' +
				'  float tP = min(1.0,t+0.02); \n' +
				'  vec3 posM = ptcInterp(tM, p0, p1, m0, m1); \n' +
				'  vec3 posP = ptcInterp(tP, p0, p1, m0, m1); \n' +
				'  vec3 dPos = posP-posM; \n' +
				'  float dxz = sqrt(pow(dPos.x,2.0)+pow(dPos.z,2.0)); \n' +
				'  float dxyz = length(dPos); \n' +
				'  float cx = dPos.y/dxyz; \n' +
				'  float cy = dPos.z/dxz; \n' +
				'  float sx = dxz/dxyz; \n' +
				'  float sy = dPos.x/dxz; \n' +
				'  return mat4(cy,0.0,-1.0*sy,0.0, \n' +
				'   sx*sy,cx,sx*cy,0.0, \n' +
				'   cx*sy,-1.0*sx,cx*cy,0.0, \n' +
				'   0.0,0.0,0.0,1.0); \n' +
				'} \n',
			
			supportScale:
				'vec3 getScale(float ptcTime) { \n' +
				'  if (ptcTime > 1.0) { \n' +
				'    return vec3(1.0); \n' +
				'  } else { \n' +
				'    int ndx; \n' +
				'    float key; \n' +
				'    for (int i = 0; i < NUM_SCALES-1; i++) { \n' +
				'      if (ptcScaleKeys[i] < ptcTime) { \n' +
				'        ndx = i; \n' +
				'        key = ptcScaleKeys[i]; \n' +
				'      } \n' +
				'    } \n' +
				'    float t = (ptcTime - key)/(ptcScaleKeys[ndx+1] - key); \n' +
				'    return mix(ptcScales[ndx], ptcScales[ndx+1], t); \n' +
				'  } \n' +
				'} \n',
			
			bodySetup:
				'  float id = idOffset[0]; \n' +
				'  float offset = idOffset[1]; \n' +
				'  vec2 seed = vec2(id, numPtcs-id); \n' +
				'  float ptcTime = sysTime + offset; \n' +
				'  if (ptcTime > ptcMaxTime) { \n' +
				'    ptcTime -= ptcDec; \n' +
				'  } \n' +
				'  setPtcClr(ptcTime); \n' +
				'  if (ptcTime > 1.0) { \n' +
				'    ptcTime = 0.0; \n' +
				'  } \n' +
				'  float boxT = float(NUM_BOXES-1)*ptcTime; \n' +
				'  int ndx = int(floor(boxT)); \n' +
				'  float t = fract(boxT); \n' +
				'  vec3 p0 = randXYZ(seed,minXYZ[ndx],maxXYZ[ndx]); \n' +
				'  vec3 p1 = randXYZ(seed,minXYZ[ndx+1],maxXYZ[ndx+1]); \n' +
				'  vec3 m0; \n' +
				'  vec3 m1; \n' +
				'  if (ndx == 0) { \n' +
				'    m0 = vec3(0,0,0); \n' +
				'  } else { \n' +
				'    vec3 pm1 = randXYZ(seed,minXYZ[ndx-1],maxXYZ[ndx-1]); \n' +
				'    m0 = (p1-pm1)*tension; \n' +
				'  } \n' +
				'  if (ndx == NUM_BOXES-2) { \n' +
				'    m1 = vec3(0,0,0); \n' +
				'  } else { \n' +
				'    vec3 p2 = randXYZ(seed,minXYZ[ndx+2],maxXYZ[ndx+2]); \n' +
				'    m1 = (p2-p0)*tension; \n' +
				'  } \n' +
				'  vec3 pos = ptcInterp(t, p0, p1, m0, m1); \n' +
				'  mat4 tMat = mat4(1.0,0.0,0.0,0.0, \n' +
				'   0.0,1.0,0.0,0.0, \n' +
				'   0.0,0.0,1.0,0.0, \n' +
				'   pos.x,pos.y,pos.z,1.0); \n' +
				'  mat4 tMatIT = mat4(1.0,0.0,0.0,-1.0*pos.x, \n' +
				'   0.0,1.0,0.0,-1.0*pos.y, \n' +
				'   0.0,0.0,1.0,-1.0*pos.z, \n' +
				'   0.0,0.0,0.0,1.0); \n',
			
			bodyAim:
				'  mat4 rMat = getRotMat(t, p0, p1, m0, m1); \n',
			
			bodyNoAim:
				'  mat4 rMat = mat4(1.0); \n',
			
			bodyScale:
				'  vec3 scale = getScale(ptcTime); \n' +
				'  mat4 sMat = mat4(scale.x,0.0,0.0,0.0, \n' +
				'   0.0,scale.y,0.0,0.0, \n' +
				'   0.0,0.0,scale.z,0.0, \n' +
				'   0.0,0.0,0.0,1.0); \n',
			
			bodyNoScale:
				'  mat4 sMat = mat4(1.0); \n',
			
			bodyEnd:
				'  mat4 ptcWorld = tMat*rMat*sMat; \n' +
				'  mat4 ptcWorldViewIT = viewIT*tMatIT*rMat*sMat; \n' +
				'  mat3 ptcNorm = mat3(ptcWorldViewIT[0].xyz, ptcWorldViewIT[1].xyz, ptcWorldViewIT[2].xyz); \n' +
				'  mat4 ptcWorldView = viewMatrix * ptcWorld; \n'
		},
		frag: {
			header:
				'varying vec4 ptcColor; \n',
			
			bodySetup:
				'  if (ptcColor.a == 0.0) {\n' +
				'    discard;\n' +
				'  }\n',
			
			globNoColors:
				'gl_FragColor.a *= ptcColor.a; \n'
		}
	};
	
////////////////////////////////////////////////////////////////////////////////
//                           Gpu Particle Systems                             //
////////////////////////////////////////////////////////////////////////////////   
	
	/**
	 * @class A particle system that is GPU driven.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {Object} opt_cfg optional configuration object for the system
	 */
	var GpuParticleCurveSystem = function(client, opt_cfg) {
		this.active = false;
		this.aim = false;
		this.boxes = [];
		this.colors = [];
		this.decParam = null;
		this.life = 0;
		this.material = null;
		this.materialSrc = null;
		this.maxTimeParam = null;
		this.particles = 0;
		this.ptcShape = 0;
		this.scales = [];
		this.size = 0;
		this.tension = 0;
		this.texNdx = -1;
		this.timeParam = null;
		this.viewITParam = null;
		this.transform = null;
		this.client = client;
		this.shaderMaterial = new THREE.ShaderMaterial();
		
		if (opt_cfg) {
			this.loadConfig(opt_cfg);
		}
	};
		
	/**
	 * Hide the particle system's bounding boxes from view.
	 */
	GpuParticleCurveSystem.prototype.hideBoxes = function() {
		hideBoxes.call(this);
	};
	
	/**
	 * Load the given configuration object and set up the GpuParticleCurveSystem.
	 * 
	 * @param {Object} cfg configuration object
	 */
	GpuParticleCurveSystem.prototype.loadConfig = function(cfg) {
		this.aim = cfg.aim == null ? false : cfg.aim;
		this.boxes = cfg.boxes ? hemi.utils.clone(cfg.boxes) : [];
		this.life = cfg.life || 5;
		this.particles = cfg.particleCount || 1;
		this.size = cfg.particleSize || 1;
		this.tension = cfg.tension || 0;
		
		if (cfg.colorKeys) {
			this.setColorKeys(cfg.colorKeys);
		} else if (cfg.colors) {
			this.setColors(cfg.colors);
		} else {
			this.colors = [];
		}
		
		if (cfg.scaleKeys) {
			this.setScaleKeys(cfg.scaleKeys);
		} else if (cfg.scales) {
			this.setScales(cfg.scales);
		} else {
			this.scales = [];
		}
		
		this.setMaterial(cfg.material || newMaterial());
		this.setParticleShape(cfg.particleShape || hemi.curve.ShapeType.CUBE);
	};
	
	/**
	 * Update the particles on each render.
	 * 
	 * @param {o3d.RenderEvent} e the render event
	 */
	GpuParticleCurveSystem.prototype.onRender = function(e) {
		var delta = e.elapsedTime / this.life,
			newTime = this.timeParam.value + delta;
		
		while (newTime > 1.0) {
			--newTime;
		}
		
		// refresh uniforms
		this.timeParam.value = newTime;
		this.viewITParam.value.copy(this.client.camera.threeCamera.matrixWorld).transpose();
	};
	
	/**
	 * Pause the particle system.
	 */
	GpuParticleCurveSystem.prototype.pause = function() {
		if (this.active) {
			hemi.removeRenderListener(this);
			this.active = false;
		}
	},
	
	/**
	 * Resume the particle system.
	 */
	GpuParticleCurveSystem.prototype.play = function() {
		if (!this.active) {
			if (this.maxTimeParam.value === 1.0) {
				hemi.addRenderListener(this);
				this.active = true;
			} else {
				this.start();
			}
		}
	};
	
	/**
	 * Set whether or not particles should orient themselves along the curve
	 * they are following.
	 * 
	 * @param {boolean} aim flag indicating if particles should aim
	 */
	GpuParticleCurveSystem.prototype.setAim = function(aim) {
		if (this.aim !== aim) {
			this.aim = aim;
			this.setupShaders()
		}
	};
	
	/**
	 * Set the bounding boxes that define waypoints for the particle
	 * system's curves.
	 * 
	 * @param {hemi.curve.Box[]} boxes array of boxes defining volumetric
	 *     waypoints for the particle system
	 */
	GpuParticleCurveSystem.prototype.setBoxes = function(boxes) {
		var oldLength = this.boxes.length;
		this.boxes = hemi.utils.clone(boxes);
		
		if (this.boxes.length === oldLength) {
			setupBounds(this.material, this.boxes);
		} else {
			this.setupShaders()
		}
	};
	
	/**
	 * Set the color ramp for the particles as they travel along the curve.
	 * 
	 * @param {number[4][]} colors array of RGBA color values
	 */
	GpuParticleCurveSystem.prototype.setColors = function(colors) {
		var len = colors.length,
			step = len === 1 ? 1 : 1 / (len - 1),
			colorKeys = [];
		
		for (var i = 0; i < len; i++) {
			colorKeys.push({
				key: i * step,
				value: colors[i]
			});
		}
		
		this.setColorKeys(colorKeys);
	};
	
	/**
	 * Set the color ramp for the particles as they travel along the curve,
	 * specifying the interpolation times for each color.
	 * 
	 * @param {hemi.curve.ColorKey[]} colorKeys array of color keys, sorted
	 *     into ascending key order
	 */
	GpuParticleCurveSystem.prototype.setColorKeys = function(colorKeys) {
		var len = colorKeys.length;
		
		if (len === 1) {
			// We need at least two to interpolate
			var clr = colorKeys[0].value;
			this.colors = [{
				key: 0,
				value: clr
			}, {
				key: 1,
				value: clr
			}];
		} else if (len > 1) {
			// Just make sure the keys run from 0 to 1
			colorKeys[0].key = 0;
			colorKeys[colorKeys.length - 1].key = 1;
			this.colors = colorKeys;
		} else {
			this.colors = [];
		}
		
		this.setupShaders()
	};
	
	/**
	 * Set the lifetime of the particle system.
	 * 
	 * @param {number} life the lifetime of the system in seconds
	 */
	GpuParticleCurveSystem.prototype.setLife = function(life) {
		if (life > 0) {
			this.life = life;
		}
	};
	
	/**
	 * Set the material to use for the particles. Note that the material's
	 * shader will be modified for the particle system.
	 * 
	 * @param {o3d.Material} material the material to use for particles
	 */
	GpuParticleCurveSystem.prototype.setMaterial = function(material) {
		this.material = material;
		
		if (!material.program) {
			var scene = this.client.scene;
			this.client.renderer.initMaterial(material, scene.lights, 
				scene.fog, this.transform);
		}
		
		var shads = hemi.utils.getShaders(this.client, material);
		
		this.materialSrc = {
			frag: shads.fragSrc,
			vert: shads.vertSrc
		};
			
		this.setupShaders();
	};
	
	/**
	 * Set the total number of particles for the system to create.
	 *  
	 * @param {number} numPtcs number of particles
	 */
	GpuParticleCurveSystem.prototype.setParticleCount = function(numPtcs) {
		this.particles = numPtcs;
		
		if (this.ptcShape) {
			// Recreate the custom vertex buffers
			this.setParticleShape(this.ptcShape);
		}
	};
	
	/**
	 * Set the size of each individual particle. For example, this would be
	 * the radius if the particles are spheres.
	 * 
	 * @param {number} size size of the particles
	 */
	GpuParticleCurveSystem.prototype.setParticleSize = function(size) {
		this.size = size;
		
		if (this.ptcShape) {
			// Recreate the custom vertex buffers
			this.setParticleShape(this.ptcShape);
		}
	};
	
	/**
	 * Set the shape of the particles to one of the predefined shapes. This
	 * may take some time as a new vertex buffer gets created.
	 * 
	 * @param {hemi.curve.ShapeType} type the type of shape to use
	 */
	GpuParticleCurveSystem.prototype.setParticleShape = function(type) {			
		this.ptcShape = type;
		
		if (this.transform) {
			this.transform.parent ? this.client.scene.remove(this.transform) : null;
			this.transform = null;
		}
		
		this.material = this.material || newMaterial();
		this.particles = this.particles || 1;
		
		var size = this.size,
			mat = this.material;
		
		switch (type) {
			case (hemi.curve.ShapeType.ARROW):
				var halfSize = size / 2,
					thirdSize = size / 3;
				this.transform = new THREE.Mesh(new THREE.ArrowGeometry(
					size, size, halfSize, halfSize, size),
					mat);
				break;
			case (hemi.curve.ShapeType.CUBE):
				this.transform = new THREE.Mesh(
					new THREE.CubeGeometry(size, size, size), mat);
				break;
			case (hemi.curve.ShapeType.SPHERE):
				this.transform = new THREE.Mesh(
					new THREE.SphereGeometry(size, 12, 12), mat);
				break;
		}
		
		this.client.scene.add(this.transform);
		var retVal = modifyGeometry(this.transform.geometry, this.particles);
		this.idArray = retVal.ids;
		this.offsetArray = retVal.offsets;
		this.idOffsets = retVal.idOffsets;
		
		this.setupShaders();
	};
	
	/**
	 * Set the scale ramp for the particles as they travel along the curve.
	 * 
	 * @param {THREE.Vector3[]} scales array of XYZ scale values
	 */
	GpuParticleCurveSystem.prototype.setScales = function(scales) {
		var len = scales.length,
			step = len === 1 ? 1 : 1 / (len - 1),
			scaleKeys = [];
		
		for (var i = 0; i < len; i++) {
			scaleKeys.push({
				key: i * step,
				value: scales[i]
			});
		}
		
		this.setScaleKeys(scaleKeys);
	};
	
	/**
	 * Set the scale ramp for the particles as they travel along the curve,
	 * specifying the interpolation times for each scale.
	 * 
	 * @param {hemi.curve.ScaleKey[]} scaleKeys array of scale keys, sorted
	 *     into ascending key order
	 */
	GpuParticleCurveSystem.prototype.setScaleKeys = function(scaleKeys) {
		var len = scaleKeys.length;
		
		if (len === 1) {
			// We need at least two to interpolate
			var scl = scaleKeys[0].value;
			this.scales = [{
				key: 0,
				value: scl
			}, {
				key: 1,
				value: scl
			}];
		} else if (len > 1) {
			// Just make sure the keys run from 0 to 1
			scaleKeys[0].key = 0;
			scaleKeys[len - 1].key = 1;
			this.scales = scaleKeys;
		} else {
			this.scales = [];
		}
		
		this.setupShaders()
	};
	
	/**
	 * Set the tension parameter for the curve. This controls how round or
	 * straight the curve sections are.
	 * 
	 * @param {number} tension tension value (typically from -1 to 1)
	 */
	GpuParticleCurveSystem.prototype.setTension = function(tension) {
		this.tension = tension;
		
		if (this.material) {
			this.material.getParam('tension').value = (1 - this.tension) / 2;
		}
	};
	
	/**
	 * Modify the particle material's shaders so that the particle system
	 * can be rendered using its current configuration. At a minimum, the
	 * material, custom texture index, and curve boxes need to be defined.
	 */
	GpuParticleCurveSystem.prototype.setupShaders = function() {
		if (!this.material || !this.materialSrc || this.boxes.length < 2 || !this.transform) {
			return;
		}
		
		var gl = this.client.renderer.context,
			chunksVert = shaderChunks.vert,
			chunksFrag = shaderChunks.frag,
			material = this.material,
			oldProgram = this.material.program,
			program = material.program = oldProgram.isCurveGen ? oldProgram : gl.createProgram(),
			fragSrc = this.materialSrc.frag,
			vertSrc = this.materialSrc.vert,
			numBoxes = this.boxes.length,
			numColors = this.colors.length,
			numScales = this.scales.length,
			texNdx = this.texNdx,
			addColors = numColors > 1,
			addScale = numScales > 1,
			shads = hemi.utils.getShaders(this.client, material),
			fragShd = shads.fragShd,
			vertShd = shads.vertShd,
			dec = 1.0,
			maxTime = 3.0,
			time = 1.1,
			uniforms = ['sysTime', 'ptcMaxTime', 'ptcDec', 'numPtcs',
				'tension', 'ptcScales', 'ptcScaleKeys', 'minXYZ', 'maxXYZ',
				'ptcColors', 'ptcColorKeys', 'viewIT'];
		
		// Remove any previously existing uniforms that we created
		for (var i = 0, il = uniforms.length; i < il; i++) {
			var name = uniforms[i],
				param = material.uniforms[name];
			
			if (param) {
				if (name === 'ptcDec') {
					dec = param.value;
				} else if (name === 'ptcMaxTime') {
					maxTime = param.value;
				} else if (name === 'sysTime') {
					time = param.value;
				}
				
				delete material.uniforms[name];
				delete program.uniforms[name];
			}
		}
		
		// modify the vertex shader
		if (vertSrc.search('ptcInterp') < 0) {
			var vertHdr = chunksVert.header.replace(/NUM_BOXES/g, numBoxes),
				vertSprt = chunksVert.support,
				vertPreBody = chunksVert.bodySetup.replace(/NUM_BOXES/g, numBoxes);
							
			if (addColors) {
				vertHdr += chunksVert.headerColors.replace(/NUM_COLORS/g, numColors);
				vertSprt += chunksVert.supportColors.replace(/NUM_COLORS/g, numColors);
			} else {
				vertSprt += chunksVert.supportNoColors;
			}
			
			if (this.aim) {
				vertSprt += chunksVert.supportAim;
				vertPreBody += chunksVert.bodyAim;
			} else {
				vertPreBody += chunksVert.bodyNoAim;
			}
			
			if (addScale) {
				vertHdr += chunksVert.headerScales.replace(/NUM_SCALES/g, numScales);
				vertSprt += chunksVert.supportScale.replace(/NUM_SCALES/g, numScales);
				vertPreBody += chunksVert.bodyScale;
			} else {
				vertPreBody += chunksVert.bodyNoScale;
			}
			
			vertPreBody += chunksVert.bodyEnd;
			var parsedVert = hemi.utils.parseSrc(vertSrc),
				vertBody = parsedVert.body.replace(/modelViewMatrix/g, 'ptcWorldView')
					.replace(/objectMatrix/g, 'ptcWorld')
					.replace(/normalMatrix/g, 'ptcNorm');
							
			parsedVert.postSprt = vertHdr + vertSprt;
			parsedVert.preBody = vertPreBody;
			parsedVert.body = vertBody;
			vertSrc = material.vertexShader = hemi.utils.buildSrc(parsedVert);
			
			var vShader = gl.createShader(gl.VERTEX_SHADER);
			gl.shaderSource(vShader, vertSrc);
			gl.compileShader(vShader);
			gl.detachShader(program, vertShd);
			gl.attachShader(program, vShader);
		}
		
		// modify the fragment shader
		if (fragSrc.search('ptcColor') < 0) {
			var parsedFrag = hemi.utils.parseSrc(fragSrc, 'gl_FragColor'),
				fragGlob = parsedFrag.glob;
			
			parsedFrag.postSprt = chunksFrag.header;
			parsedFrag.preBody = chunksFrag.bodySetup;
			
			if (addColors) {
				if (parsedFrag.body.indexOf('diffuse') !== -1) {
					parsedFrag.body = parsedFrag.body.replace(/diffuse/g, 'ptcColor.rgb');
				} else {
					parsedFrag.body = parsedFrag.body.replace(/emissive/g, 'ptcColor.rgb');
				}
			}
			parsedFrag.body = parsedFrag.body.replace(/opacity/g, '(opacity * ptcColor.a)');
			
			fragSrc = material.fragmentShader = hemi.utils.buildSrc(parsedFrag);
			
			var fShader = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(fShader, fragSrc);
			gl.compileShader(fShader);
			gl.detachShader(program, fragShd);
			gl.attachShader(program, fShader);
		}
		
		// add the attributes and uniforms to the material
		var attributes = {
				idOffset: { type: 'v2', value: this.idOffsets, needsUpdate: true },
			},
			uniforms = {
				sysTime: { type: 'f', value: time },
				ptcMaxTime: { type: 'f', value: maxTime },
				ptcDec: { type: 'f', value: dec },
				numPtcs: { type: 'f', value: this.particles },
				tension: { type: 'f', value: (1 - this.tension) / 2 },
				minXYZ: { type: 'v3v', value: [] },
				maxXYZ: { type: 'v3v', value: [] },
				viewIT: { type: 'm4', value: new THREE.Matrix4() }
			};

		if (addColors) {
			uniforms.ptcColors = {
				type: 'v4v', value: []
			};
			uniforms.ptcColorKeys = {
				type: 'fv1', value: []
			};
		}
		if (addScale) {
			uniforms.ptcScales = {
				type: 'v3v', value: []
			};
			uniforms.ptcScaleKeys = {
				type: 'fv1', value: []
			};
		}
			
		material.uniforms = THREE.UniformsUtils.merge([material.uniforms, uniforms]);
		material.attributes = THREE.UniformsUtils.merge([material.attributes, attributes]);

		material.uniformsList = [];
		
		gl.linkProgram(program);
		
		if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {

			console.error( "Could not initialise shader\n" + "VALIDATE_STATUS: " 
				+ gl.getProgramParameter( program, gl.VALIDATE_STATUS ) 
				+ ", gl error [" + gl.getError() + "]" );

		}

		program.uniforms = {};
		program.attributes = {};
		program.isCurveGen = true;

		for (u in material.uniforms) {
			material.uniformsList.push([material.uniforms[u], u]);
		}
		
		// update the program to point to the uniforms and attributes
		for (var u in oldProgram.uniforms) {
			var loc = program.uniforms[u] = gl.getUniformLocation(program, u);
		}
		for (var u in uniforms) {
			program.uniforms[u] = gl.getUniformLocation(program, u);
		}
		for (var a in oldProgram.attributes) {
			var loc = program.attributes[a] = gl.getAttribLocation(program, a);
			gl.enableVertexAttribArray(loc);
		}
		for (var a in attributes) {
			var loc = program.attributes[a] = gl.getAttribLocation(program, a);
			gl.enableVertexAttribArray(loc);
		}
		
		// setup params
		this.decParam = material.uniforms.ptcDec;
		this.maxTimeParam = material.uniforms.ptcMaxTime;
		this.timeParam = material.uniforms.sysTime;
		this.viewITParam = material.uniforms.viewIT;
		
		setupBounds(material, this.boxes);
		
		var needsZ = false;
		
		for (var i = 0; i < numColors && !needsZ; i++) {
			needsZ = this.colors[i].value[3] < 1;
		}
		
		material.transparent = needsZ;
		
		if (addColors) {
			setupColors(material, this.colors);
		}
		if (addScale) {
			setupScales(material, this.scales);
		}
			
		// force rebuild of buffers
		this.transform.dynamic = true;
		this.transform.__webglInit = this.transform.__webglActive = false;
		delete this.transform.geometry.geometryGroups;
		delete this.transform.geometry.geometryGroupsList;
		this.client.scene.__objectsAdded.push(this.transform);
	};
	
	/**
	 * Render the bounding boxes which the particle system's curves run
	 * through (helpful for debugging).
	 */
	GpuParticleCurveSystem.prototype.showBoxes = function() {
		showBoxes.call(this);
	};
	
	/**
	 * Start the particle system.
	 */
	GpuParticleCurveSystem.prototype.start = function() {
		if (!this.active) {
			this.active = true;
			this.timeParam.value = 1.0;
			this.maxTimeParam.value = 1.0;
			hemi.addRenderListener(this);
		}
	};
	
	/**
	 * Stop the particle system.
	 */
	GpuParticleCurveSystem.prototype.stop = function() {
		if (this.active) {
			this.active = false;
			this.timeParam.value = 1.1;
			this.maxTimeParam.value = 3.0;
			hemi.removeRenderListener(this);
		}
	};
	
	/**
	 * Get the Octane structure for the GpuParticleCurveSystem.
     *
     * @return {Object} the Octane structure representing the
     *     GpuParticleCurveSystem
	 */
//	toOctane: function(){
//		var octane = this._super();
//		
//		octane.props.push({
//			name: 'loadConfig',
//			arg: [{
//				aim: this.aim,
//				boxes: this.boxes,
//				colorKeys: this.colors,
//				life: this.life,
//				particleCount: this.particles,
//				particleShape: this.ptcShape,
//				particleSize: this.size,
//				scaleKeys: this.scales,
//				tension: this.tension
//			}]
//		});
//		
//		return octane;
//	},
	
	/**
	 * Translate the entire particle system by the given amounts
	 * @param {number} x amount to translate in the X direction
	 * @param {number} y amount to translate in the Y direction
	 * @param {number} z amount to translate in the Z direction
	 */
	GpuParticleCurveSystem.prototype.translate = function(x, y, z) {
		for (var i = 0, il = this.boxes.length; i < il; i++) {
			var box = this.boxes[i],
				min = box.min,
				max = box.max;
			
			min[0] += x;
			max[0] += x;
			min[1] += y;
			max[1] += y;
			min[2] += z;
			max[2] += z;
		}
		setupBounds(this.material, this.boxes);
	};
	
	/**
	 * @class A GPU driven particle system that has trailing starts and stops.
	 * @extends hemi.curve.GpuParticleCurveSystem
	 * 
	 * @param {Object} opt_cfg the configuration object for the system
	 */
	var GpuParticleTrail = function(client, opt_cfg) {
		GpuParticleCurveSystem.call(this, client, opt_cfg);
		
		this.endTime = 1.0;
		this.starting = false;
		this.stopping = false;
	};
	
	GpuParticleTrail.prototype = new GpuParticleCurveSystem();
	GpuParticleTrail.prototype.constructor = GpuParticleTrail;
	
	/**
	 * Update the particles on each render.
	 * 
	 * @param {o3d.RenderEvent} e the render event
	 */
	GpuParticleTrail.prototype.onRender = function(e) {
		var delta = e.elapsedTime / this.life,
			newTime = this.timeParam.value + delta;
		
		if (newTime > this.endTime) {
			if (this.stopping) {
				this.active = false;
				this.stopping = false;
				this.maxTimeParam.value = 3.0;
				hemi.removeRenderListener(this);
				newTime = 1.1;
			} else {
				if (this.starting) {
					this.starting = false;
					this.endTime = 1.0;
					this.decParam.value = 1.0;
					this.maxTimeParam.value = 1.0;
				}
				
				while (--newTime > this.endTime) {}
			}
		}
		
		if (this.stopping) {
			this.maxTimeParam.value += delta;
		}
		
		this.timeParam.value = newTime;
		this.viewITParam.value.copy(this.client.camera.threeCamera.matrixWorld).transpose();
	};
	
	/**
	 * Resume the particle system.
	 */
	GpuParticleTrail.prototype.play = function() {
		if (!this.active) {
			if (this.starting || this.stopping || this.maxTimeParam.value === 1.0) {
				hemi.addRenderListener(this);
				this.active = true;
			} else {
				this.start();
			}
		}
	};
	
	/**
	 * Start the particle system.
	 */
	GpuParticleTrail.prototype.start = function() {
		if (this.stopping) {
			hemi.removeRenderListener(this);
			this.active = false;
			this.stopping = false;
		}
		if (!this.active) {
			this.active = true;
			this.starting = true;
			this.stopping = false;
			this.endTime = 2.0;
			this.decParam.value = 2.0;
			this.maxTimeParam.value = 2.0;
			this.timeParam.value = 1.0;
			hemi.addRenderListener(this);
		}
	};
	
	/**
	 * Stop the particle system.
	 * 
	 * @param {boolean} opt_hard optional flag to indicate a hard stop (all
	 *     particles disappear at once)
	 */
	GpuParticleTrail.prototype.stop = function(opt_hard) {
		if (this.active) {
			if (opt_hard) {
				this.endTime = -1.0;
			} else if (!this.stopping) {
				this.endTime = this.timeParam.value + 1.0;
			}
			
			this.starting = false;
			this.stopping = true;
		}
	};
	
////////////////////////////////////////////////////////////////////////////////
//                             Hemi Citizenship                               //
////////////////////////////////////////////////////////////////////////////////   

	hemi.makeCitizen(Curve, 'hemi.Curve', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});
	
	hemi.makeCitizen(ParticleCurveSystem, 'hemi.ParticleCurveSystem', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});
	
	hemi.makeCitizen(GpuParticleCurveSystem, 'hemi.GpuParticleCurveSystem', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});

	hemi.makeCitizen(GpuParticleTrail, 'hemi.GpuParticleTrail', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});
	
////////////////////////////////////////////////////////////////////////////////
//                              Private Methods                               //
////////////////////////////////////////////////////////////////////////////////   
	
				
	/**
	 * Render the bounding boxes which the curves run through, mostly for
	 * debugging purposes. 
	 * 
	 */
	function showBoxes() {		
		var trans = dbgBoxTransforms[this.transform.clientId] || [];
		
		for (var i = 0; i < this.boxes.length; i++) {
			var b = this.boxes[i],
				w = b.max.x - b.min.x,
				h = b.max.y - b.min.y,
				d = b.max.z - b.min.z,
				x = b.min.x + w/2,
				y = b.min.y + h/2,
				z = b.min.z + d/2,
				box = new THREE.CubeGeometry(w, h, d),
				mesh = new THREE.Mesh(box, dbBoxMat);
			
			mesh.position.addSelf(new THREE.Vector3(x, y, z));
			this.transform.add(mesh);
			trans.push(mesh);
		}
		
		dbgBoxTransforms[this.transform.clientId] = trans;
	};
	
	/**
	 * Remove the bounding boxes from view. If a parent transform is given, only
	 * the bounding boxes under it will be removed. Otherwise all boxes will be
	 * removed.
	 */
	function hideBoxes() {
		for (var id in dbgBoxTransforms) {
			var trans = dbgBoxTransforms[id] || [];
			
			for (var i = 0; i < trans.length; i++) {
				var tran = trans[i];
				
				this.transform.remove(tran);
			}
			
			delete dbgBoxTransforms[id];
		}
	};
	
////////////////////////////////////////////////////////////////////////////////
//                              Utility Methods                               //
////////////////////////////////////////////////////////////////////////////////

	/**
	 * Render a 3D representation of a curve.
	 *
	 * @param {THREE.Vector3[]} points array of points (not waypoints)
	 * @param {Object} config configuration describing how the curve should look
	 */
	function drawCurve(points, config) {
//		if (!this.dbgLineMat) {
//			this.dbgLineMat = this.newMaterial('phong', false);
//			this.dbgLineMat.getParam('lightWorldPos').bind(hemi.world.camera.light.position);
//		}
//		
//		var eShow = (config.edges == null) ? true : config.edges,
//			eSize = config.edgeSize || 1,
//			eColor = config.edgeColor || [0.5,0,0,1],
//			jShow = (config.joints == null) ? true : config.joints,
//			jSize = config.jointSize || 1,
//			jColor = config.jointColor,
//			crvTransform = this.pack.createObject('Transform');
//		
//		for (var i = 0; i < points.length; i++) {
//			if(jShow) {
//				var transform = this.pack.createObject('Transform'),
//					joint = hemi.core.primitives.createSphere(this.pack,
//						this.dbgLineMat, jSize, 20, 20);
//				
//				transform.parent = crvTransform;
//				transform.addShape(joint);
//				transform.translate(points[i]);
//				
//				if (jColor) {
//					var param = transform.createParam('diffuse', 'o3d.ParamFloat4');
//					param.value = jColor;
//				}
//			}
//			if (eShow && i < (points.length - 1)) {
//				var edgeTran = this.drawLine(points[i], points[i+1], eSize, eColor);
//				edgeTran.parent = crvTransform;
//			}
//		}
//		
//		crvTransform.parent = hemi.core.client.root;
//		this.dbgLineTransforms.push(crvTransform);
	};
	
	/**
	 * Draw a line connecting two points.
	 *
	 * @param {number[]} p0 The first point
	 * @param {number[]} p1 The second point
	 * @param {number} opt_size Thickness of the line
	 * @param {number[]} opt_color Color of the line
	 * @return {o3d.Transform} the Transform containing the line shape
	 */
	function drawLine(p0, p1, opt_size, opt_color) {
//		if (!this.dbgLineMat) {
//			this.dbgLineMat = this.newMaterial('phong', false);
//			this.dbgLineMat.getParam('lightWorldPos').bind(hemi.world.camera.light.position);
//		}
//		
//		var size = opt_size || 1,
//			dist = hemi.core.math.distance(p0,p1),
//			midpoint = [ (p0[0]+p1[0])/2, (p0[1]+p1[1])/2, (p0[2]+p1[2])/2 ],
//			line = hemi.core.primitives.createCylinder(this.pack,
//				this.dbgLineMat, size, dist, 3, 1),
//			transform = this.pack.createObject('Transform');
//		
//		transform.addShape(line);
//		transform.translate(midpoint);
//		transform = hemi.utils.pointYAt(transform,midpoint,p0);
//		
//		if (opt_color) {
//			var param = transform.createParam('diffuse', 'o3d.ParamFloat4');
//			param.value = opt_color;
//		}
//		
//		return transform;
	};
	
	/**
	 * Remove the given curve line Transform, its shapes, and its children.
	 * 
	 * @param {o3d.Transform} opt_trans optional Transform to clean up
	 */
	function hideCurves(opt_trans) {
//		if (opt_trans) {
//			var children = opt_trans.children,
//				shapes = opt_trans.shapes;
//			
//			for (var i = 0; i < children.length; i++) {
//				this.hideCurves(children[i]);
//			}
//			for (var i = 0; i < shapes.length; i++) {
//				var shape = shapes[i];
//				opt_trans.removeShape(shape);
//				this.pack.removeObject(shape);
//			}
//			
//			opt_trans.parent = null;
//			this.pack.removeObject(opt_trans);
//		} else {
//			for (var i = 0; i < this.dbgLineTransforms.length; i++) {
//				this.hideCurves(this.dbgLineTransforms[i]);
//			}
//			
//			this.dbgLineTransforms = [];
//		}
	};  
	
	/*
	 * Take the existing vertex buffer in the given primitive and copy the data
	 * once for each of the desired number of particles. 
	 * 
	 * @param {THREE.Geometry} geometry the geoemtry to modify
	 * @param {number} numParticles the number of particles to create vertex
	 *     data for
	 */
	function modifyGeometry(geometry, numParticles) {
		var verts = geometry.vertices,
			faces = geometry.faces
			faceVertexUvs = geometry.faceVertexUvs,
			numVerts = verts.length,
			numFaces = faces.length,
			ids = [],
			offsets = [],
			idOffsets = [];
				
		for (var j = 0; j < numVerts; j++) {
			ids.push(0);
			offsets.push(0);
			idOffsets.push(new THREE.Vector2());
		}
		
		for (var i = 1; i < numParticles; i++) {
			var vertOffset = i * numVerts,
				timeOffset = i / numParticles,
				newVerts = [],
				newFaces = [];
				
			for (var j = 0; j < numVerts; j++) {
				ids.push(i);
				offsets.push(timeOffset);
				idOffsets.push(new THREE.Vector2(i, timeOffset));
				var vert = verts[j].position,
					newVert = new THREE.Vector3(vert.x, vert.y, vert.z);
				newVerts.push(new THREE.Vertex(newVert));
			}
			
			for (var j = 0; j < numFaces; j++) {
				var face = faces[j],
					newFace = null;
				
				if (face instanceof THREE.Face3) {
					newFace = new THREE.Face3(face.a + vertOffset,
						face.b + vertOffset,
						face.c + vertOffset,
						null, null, face.material);
				}
				else {
					newFace = new THREE.Face4(face.a + vertOffset,
						face.b + vertOffset,
						face.c + vertOffset,
						face.d + vertOffset,
						null, null, face.material);
				}
				newFaces.push(newFace);
			}
			
			// dupe the vertices
			geometry.vertices = geometry.vertices.concat(newVerts);
		
			// dupe the faces	
			geometry.faces = geometry.faces.concat(newFaces);
			
			// dupe the uvs
			geometry.faceVertexUvs = geometry.faceVertexUvs.concat(faceVertexUvs);
		}

		geometry.computeCentroids();
		geometry.computeFaceNormals();
		
		return {
			ids: ids,
			offsets: offsets,
			idOffsets: idOffsets
		}
	};
	
	/**
	 * Create a new material for a hemi particle curve to use.
	 * 
	 * @param {string} opt_type optional shader type to use (defaults to phong)
	 * @param {boolean} opt_trans optional flag indicating if material should
	 *     support transparency (defaults to true)
	 * @return {THREE.Material} the created material
	 */
	function newMaterial(opt_type, opt_trans) {
		var params = {
				color: 0xff0000,
				opacity: 1,
				transparent: opt_trans == null ? true : opt_trans
			},
			mat;
		
		switch (opt_type) {
			case 'lambert':
				mat = new THREE.MeshLambertMaterial(params);
				break;
			default:
				mat = new THREE.MeshPhongMaterial(params);
				break;
		}
		
		return mat;
	};
	
	/**
	 * Generate a random point within a bounding box
	 *
	 * @param {THREE.Vector3} min Minimum point of the bounding box
	 * @param {THREE.Vector3} max Maximum point of the bounding box
	 * @return {THREE.Vector3} Randomly generated point
	 */
	function randomPoint(min, max) {
		var xi = Math.random();
		var yi = Math.random();
		var zi = Math.random();
		var x = xi*min.x + (1-xi)*max.x;
		var y = yi*min.y + (1-yi)*max.y;
		var z = zi*min.z + (1-zi)*max.z;
		return new THREE.Vector3(x, y, z);
	};
	
	/*
	 * Set the parameters for the given Material so that it supports a curve
	 * through the given bounding boxes.
	 * 
	 * @param {o3d.Material} material material to set parameters for
	 * @param {hemi.curve.Box[]} boxes array of min and max XYZ coordinates
	 */
	function setupBounds(material, boxes) {
		var minParam = material.uniforms.minXYZ,
			maxParam = material.uniforms.maxXYZ;
			
		minParam._array = new Float32Array(3 * boxes.length);
		maxParam._array = new Float32Array(3 * boxes.length);
				
		for (var i = 0, il = boxes.length; i < il; ++i) {
			var box = boxes[i];
						
			minParam.value[i] = box.min;
			maxParam.value[i] = box.max;
		}
	};
	
	/*
	 * Set the parameters for the given Material so that it adds a color ramp to
	 * the particles using it.
	 * 
	 * @param {o3d.Material} material material to set parameters for
	 * @param {Object[]} colors array of RGBA color values and keys
	 */
	function setupColors(material, colors) {
		var clrParam = material.uniforms.ptcColors,
			keyParam = material.uniforms.ptcColorKeys;
		
		clrParam._array = new Float32Array(4 * colors.length);
		
		for (var i = 0, il = colors.length; i < il; ++i) {
			var obj = colors[i],
				offset = i * 4;
			
			clrParam.value[i] = new THREE.Vector4(obj.value[0], obj.value[1], 
				obj.value[2], obj.value[3]);
			keyParam.value[i] = obj.key;
		}
	};
	
	/*
	 * Set the parameters for the given Material so that it adds a scale ramp to
	 * the particles using it.
	 * 
	 * @param {o3d.Material} material material to set parameters for
	 * @param {Object[]} scales array of XYZ scale values and keys
	 */
	function setupScales(material, scales) {
		var sclParam = material.uniforms.ptcScales,
			keyParam = material.uniforms.ptcScaleKeys;
		
		sclParam._array = new Float32Array(3 * scales.length);
		
		for (var i = 0, il = scales.length; i < il; ++i) {
			var obj = scales[i];
			
			sclParam.value[i] = obj.value;
			keyParam.value[i] = obj.key;
		}
	};
	
	return hemi;
})(hemi || {});
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

/**
 * @fileoverview The Sprite class allows for the easy creation of 2d animated sprites
 *		and billboards in the 3d world.
 */

(function() {
	/**
	 * @class A Sprite can display a 2d image on a plane with several options.
	 * The image can be made to always face the camera, and it can scale to
	 * stay the same size in the viewer. It can also cycle through a series of
	 * frames to create an animation effect, for a number of cycles or
	 * indefinitely.
	 * 
	 * @param {number} width the width of the sprite
	 * @param {number} height the height of the sprite
	 * @param {string} opt_source the location of a source image to start with (not implemented)
	 */
	var Sprite = function(client, parameters) {
		// before super(), set up all the maps and then assign the first in the series as the map
		var maps = parameters.maps, 
			i, il, map, count = 0;
			
		this.maps = [];
		
		for (i = 0, il = maps.length; i < il; i++) {
			map = maps[i];
			this.maps.push((parameters.map instanceof THREE.Texture) ? map : 
				THREE.ImageUtils.loadTexture(hemi.loadPath + map, null, function() {
					count++;
					if (count >= il && parameters.callback) {
						parameters.callback();
					}
				}));
		}
		
		parameters.map = this.maps[0];
		
		THREE.Sprite.call(this, parameters);
		
		this.cycle = 0;
		this.maxCycles = 0;
		this.clock = 0;
		this.period = 1;
		this.running = false;
		this.client = client;
		
		client.scene.add(this);
	};

	Sprite.prototype = new THREE.Sprite({ map: new THREE.Texture(new Image()) });
	Sprite.prototype.constructor = Sprite;
	Sprite.prototype.supr = THREE.Sprite.prototype;
	
	
	/**
	 * Add an image to be used as a frame in the animation, or as a
	 * standalone image.
	 *
	 * @param {string} path the path to the image source
	 */
	Sprite.prototype.addFrame = function(path, opt_callback) {
		this.maps.push(THREE.ImageUtils.loadTexture(hemi.loadPath + path, null, opt_callback));
	};

	/**
	 * Function to call on every render cycle. Scale or rotate the Sprite if
	 * needed, and update the frame if needed.
	 *
	 *	@param {o3d.RenderEvent} e Message describing this render loop
	 */
	Sprite.prototype.onRender = function(e) {
		if (!this.running) {
			return;
		}
		this.clock += e.elapsedTime;
		if (this.clock >= this.period) {
			this.cycle++;
			if (this.cycle == this.maxCycles) {
				this.stop();
			} else {
				this.setFrame(this.cycle);
				this.clock %= this.period;
			}
		}
	};

	/**
	 * Start the Sprite animating, for a set number of cycles, or pass in -1
	 * for infinite looping.
	 *
	 * @param {number} opt_cycles Number of cycles, defaults to one loop
	 *     through the frames
	 */
	Sprite.prototype.run = function(opt_cycles) {
		this.cycle = 0;
		this.maxCycles = opt_cycles || this.samplers.length;
		this.clock = 0;
		this.setFrame(0);
		this.running = true;
		hemi.addRenderListener(this);
	};

	/**
	 * Set the Sprite to display one of it's frames.
	 *
	 * @param {number} index Index of desired frame
	 */
	Sprite.prototype.setFrame = function(index) {
		// set the map to the frame at the given index
		if (this.maps.length > 0) {
			var ndx = index % this.maps.length;
			this.map = this.maps[ndx];
		}
	};

	/**
	 * Set the period of time, in seconds, that each frame of the Sprite's
	 * animation will display.
	 *
	 * @param {number} period Period, in seconds
	 */
	Sprite.prototype.setPeriod = function(period) {
		this.period = period;
	};

	/**
	 * Stop the animating frames.
	 */
	Sprite.prototype.stop = function() {
		this.running = false;
	};


////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			Hemi Citizenship		                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  

	hemi.makeCitizen(Sprite, 'hemi.Sprite', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});
})();/* 
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

(function (hemi) {

	/**
	 * @namespace A module for easily creating primitives in Kuda.
	 */
	hemi.shape = hemi.shape || {};

////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			  Constants				                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  

	hemi.shape.BOX = 'box';
	hemi.shape.CUBE = 'cube';
	hemi.shape.SPHERE = 'sphere';
	hemi.shape.CYLINDER = 'cylinder';
	hemi.shape.CONE = 'cone';
	hemi.shape.PLANE = 'plane';
	hemi.shape.ARROW = 'arrow';
	hemi.shape.TETRA = 'tetra';
	hemi.shape.OCTA = 'octa';
	hemi.shape.PYRAMID = 'pyramid';
	hemi.shape.CUSTOM = 'custom';
	hemi.shape.SHAPE_ROOT = "ShapeRoot";

	/**
	 * @class A TransformUpdate allows changes to the Transform in a Shape to be
	 * persisted through Octane.
	 */
	hemi.shape.TransformUpdate = function () {
		/**
		 * The updated position, rotation, and scale of the Transform.
		 * @type number[4][4]
		 */
		this.localMatrix = null;
		/**
		 * A flag indicating if the Transform is visible.
		 * @type boolean
		 */
		this.visible = null;
		/**
		 * A flag indicating if the Transform is able to be picked.
		 * @type boolean
		 */
		this.pickable = null;
	};

	hemi.shape.TransformUpdate.prototype = {
		/**
		 * Apply the changes in the TransformUpdate to the given Transform.
		 * 
		 * @param {THREE.Mesh} transform the Transform to update
		 */
		apply: function(transform) {
			if (this.localMatrix != null) {
				transform.localMatrix = this.localMatrix;
			}
			
			if (this.pickable != null) {
				hemi.picking.setPickable(transform, this.pickable, true);
			}
			
			if (this.visible != null) {
				transform.visible = this.visible;
			}
		},

		/**
		 * Check if the TransformUpdate has been modified.
		 * 
		 * @return {boolean} true if the Transform has been changed
		 */
		isModified: function() {
			return this.localMatrix != null || this.pickable != null || this.visible != null;
		},
		
		/**
		 * Reset the TransformUpdate to its unmodified state.
		 */
		reset: function() {
			this.localMatrix = this.pickable = this.visible = null;
		},

		/**
		 * Get the Octane structure for the TransformUpdate.
		 *
		 * @return {Object} the Octane structure representing the TransformUpdate
		 */
		toOctane: function() {
			var octane = {
					type: 'hemi.shape.TransformUpdate',
					props: []
				},
				valNames = ['localMatrix', 'visible', 'pickable'];
			
			for (var i = 0, il = valNames.length; i < il; i++) {
				var name = valNames[i];
				octane.props.push({
					name: name,
					val: this[name]
				});
			};

			return octane;
		}
	};
	

////////////////////////////////////////////////////////////////////////////////////////////////////
//                              		 Shape Prototype			                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  
	
	/**
	 * @class A Shape is a wrapper class around basic geometric shapes such as
	 * cubes and spheres that allows them to interact with the World in complex
	 * ways.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {Object} opt_config optional configuration for the Shape
	 */
	var Shape = function(client, opt_config) {
		this.color = null;
		this.dim = {};
		this.shapeType = null;
		this.transform = null;
		this.client = client;
		
		if (opt_config != null) {
			this.loadConfig(opt_config);
		}
		if (this.color && this.shapeType) {
			this.create();
		}
	};
		
        /**
         * Overwrites hemi.world.Citizen.citizenType.
         * @string
         */
	Shape.prototype.citizenType = 'hemi.shape.Shape';
	
	/**
	 * Send a cleanup Message and remove all references in the Shape.
	 */
	Shape.prototype.cleanup = function() {
		this._super();
		
		if (this.transform !== null) {
			rootTransform.remove(this.transform);
		}
		
		this.color = null;
		this.dim = {};
		this.shapeType = null;
		this.transform = null;
		this.tranUp = null;
	};
	
	/**
	 * Get the Octane structure for the Shape.
     *
     * @return {Object} the Octane structure representing the Shape
	 */
//	Shape.prototype.toOctane = function(){
//		var octane = this._super(),
//			valNames = ['color', 'dim', 'shapeType'];
//		
//		for (var i = 0, il = valNames.length; i < il; i++) {
//			var name = valNames[i];
//			octane.props.push({
//				name: name,
//				val: this[name]
//			});
//		};
//		
//		if (this.tranUp.isModified()) {
//			octane.props.push({
//				name: 'tranUp',
//				oct: this.tranUp.toOctane()
//			});
//		}
//		
//		octane.props.push({
//			name: 'create',
//			arg: []
//		});
//		
//		return octane;
//	};
	
	/**
	 * Change the existing Shape to a new type of Shape using the given
	 * configuration.
	 * 
	 * @param {Object} cfg configuration options for the Shape
	 */
	Shape.prototype.change = function(cfg) {
		this.loadConfig(cfg);
		
		var config = hemi.utils.join({
					shape: this.shapeType,
					color: this.color
				},
				this.dim),
			newTran = hemi.shape.create(config),
			oldTran = this.transform;
		
		this.loadConfig(config);
		oldTran.geometry = newTran.geometry;
		
		this.transform.material.color = this.color;
		
		rootTransform.remove(newTran);
	};
	
	/**
	 * Create the actual shape and transform for the Shape.
	 */
	Shape.prototype.create = function() {
		var config = hemi.utils.join({
				shape: this.shapeType,
				color: this.color
			},
			this.dim);
		
		if (this.transform !== null) {
			rootTransform.remove(this.transform);
		}
		
		this.transform = hemi.shape.create(config);
		this.setName(this.name);
		this.ownerId = this.getId();
	};
	
	/**
	 * Load the given configuration object.
	 * 
	 * @param {Object} config configuration options for the Shape
	 */
	Shape.prototype.loadConfig = function(config) {
		this.dim = {};
		
		for (t in config) {
			if (t === 'color') {
				this.color = config[t];
			} else if (t === 'type') {
				this.shapeType = config[t];
			} else {
				this.dim[t] = config[t];
			}
		}
	};
	
	/**
	 * Overwrites Citizen.setId() so that the internal transform gets the
	 * new id as well.
	 * 
	 * @param {number} id the new id
	 */
	Shape.prototype.setId = function(id) {
		this._super(id);
		
		if (this.ownerId) {
			this.ownerId = id;
		}
	};
	
	/**
	 * Sets the transform and shape names as well as the overall name for
	 * this shape.
	 * 
	 * @param {string} name the new name
	 */
	Shape.prototype.setName = function(name) {
		this.name = name;
		this.transform.name = this.name + ' Transform';
		this.transform.geometry.name = this.name + ' Shape';
	};
	
	/**
	 * Get the transform for the Shape.
	 * 
	 * @return {THREE.Mesh} the transform for the Shape
	 */
	Shape.prototype.getTransform = function() {
		return this.transform;
	};
	
	/**
	 * Rotate the Transforms in the Shape.
	 * 
	 * @param {Object} config configuration options
	 */
	Shape.prototype.rotate = function(config) {
		var axis = config.axis.toLowerCase(),
			rad = config.rad;
		
		switch(axis) {
			case 'x':
				this.transform.rotateX(rad);
				break;
			case 'y':
				this.transform.rotateY(rad);
				break;
			case 'z':
				this.transform.rotateZ(rad);
				break;
		}
	};
	
	/**
	 * Scale the Transforms in the Shape.
	 * 
	 * @param {Object} config configuration options
	 */
	Shape.prototype.scale = function(config) {
		this.transform.scale(config.x, config.y, config.z);
	};

	/**
	 * Set the pickable flag for the Transforms in the Shape.
	 *
	 * @param {Object} config configuration options
	 */
	Shape.prototype.setPickable = function(config) {
		hemi.picking.setPickable(this.transform, config.pick, true);
	};

	/**
	 * Set the Shape Transform's matrix to the new matrix.
	 * 
	 * @param {number[4][4]} matrix the new local matrix
	 */
	Shape.prototype.setMatrix = function(matrix) {			
		this.transform.matrix = matrix;
	};
	
	/**
	 * Set the visible flag for the Transforms in the Shape.
	 *
	 * @param {Object} config configuration options
	 */
	Shape.prototype.setVisible = function(config) {
		this.transform.visible = config.vis;
	};
	
	/**
	 * Translate the Shape by the given amounts.
	 * 
	 * @param {number} x amount to translate on the x axis
	 * @param {number} y amount to translate on the y axis
	 * @param {number} z amount to translate on the z axis
	 */
	Shape.prototype.translate = function(x, y, z) {
		if (this.transform !== null) {
			this.transform.translate(x, y, z);
		}
	};


////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			Hemi Citizenship		                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  

	hemi.makeCitizen(Shape, 'hemi.Shape', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});


////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			Private Variables		                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  

	var rootTransform = new THREE.Object3D(),
		clients = {};
	
	// TODO: add to clients' scenes
	

////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			  Global Methods		                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  
	
	/**
	 * Initialize a local root transform and pack.
	 */
	hemi.shape.init = function() {
		hemi.shape.root = hemi.core.mainPack.createObject('Transform');
		hemi.shape.root.name = hemi.shape.SHAPE_ROOT;
		hemi.shape.root.parent = hemi.picking.pickRoot;
		hemi.shape.pack = hemi.core.mainPack;
		hemi.shape.material = hemi.core.material.createBasicMaterial(
			hemi.shape.pack,
			hemi.view.viewInfo,
			[0,0,0,1],
			false);
		hemi.shape.transMaterial = hemi.core.material.createBasicMaterial(
			hemi.shape.pack,
			hemi.view.viewInfo,
			[0,0,0,1],
			true);
		
		hemi.world.addCamCallback(function(camera) {
			var pos = camera.light.position,
				param = hemi.shape.material.getParam('lightWorldPos');
			
			if (param) {
				param.bind(pos);
			}
			
			param = hemi.shape.transMaterial.getParam('lightWorldPos'); 
			if (param) {
				param.bind(pos);
			}
		});
	};
	
	/**
	 * Create a geometric shape with the given properties. Valid properties:
	 * shape: the type of shape to create
	 * color: the color of the shape to create
	 * mat: the Material to use for the shape (overrides color)
	 * height/h: height of the shape
	 * width/w: width of the shape
	 * depth/d: depth of the shape
	 * size: size of the shape
	 * radius/r: radius of the shape
	 * radiusB/r1: bottom radius of the shape
	 * radiusT/r2: top radius of the shape
	 * tail: length of the tail of the shape
	 * vertices/v: a series of vertices defining the shape
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {Object} shapeInfo properties of the shape to create
	 * @return {THREE.Mesh} the parent Transform of the created geometry
	 */
	hemi.shape.create = function(client, shapeInfo) {
		var transform = null,
			shapeType = shapeInfo.shape,
			color = null,
			material;
			
		checkClient(client);
		
		if (shapeInfo.mat != null) {
			material = shapeInfo.mat;
		} else {
			color = shapeInfo.color;
			material = new THREE.MeshPhongMaterial({
				color: color,
				opacity: shapeInfo.opacity,
				transparent: shapeInfo.opacity < 1
			});
		}
		
		switch (shapeType.toLowerCase()) {
			case hemi.shape.BOX:
				transform = hemi.shape.createBox(
					client,
					shapeInfo.height != null ? shapeInfo.height :
						shapeInfo.h != null ? shapeInfo.h : 1,
					shapeInfo.width != null ? shapeInfo.width :
						shapeInfo.w != null ? shapeInfo.w : 1,
					shapeInfo.depth != null ? shapeInfo.depth :
						shapeInfo.d != null ? shapeInfo.d : 1,
					material);
				break;
			case hemi.shape.CUBE:
				transform = hemi.shape.createCube(
					client,
					shapeInfo.size != null ? shapeInfo.size : 1,
					material);
				break;
			case hemi.shape.SPHERE:
				transform = hemi.shape.createSphere(
					client,
					shapeInfo.radius != null ? shapeInfo.radius :
						shapeInfo.r != null ? shapeInfo.r : 1,
					material);
				break;
			case hemi.shape.CYLINDER:
				transform = hemi.shape.createCylinder(
					client,
					shapeInfo.radiusB != null ? shapeInfo.radiusB :
							shapeInfo.r1 != null ? shapeInfo.r1 :
							shapeInfo.radius != null ? shapeInfo.radius :
							shapeInfo.r != null ? shapeInfo.r : 1,
					shapeInfo.radiusT != null ? shapeInfo.radiusT :
							shapeInfo.r2 != null ? shapeInfo.r2 :
							shapeInfo.radius != null ? shapeInfo.radius :
							shapeInfo.r != null ? shapeInfo.r : 1,
					shapeInfo.height != null ? shapeInfo.height : 
						shapeInfo.h != null ? shapeInfo.h : 1,
					material);
				break;
			case hemi.shape.CONE:
				transform = hemi.shape.createCone(
					client,
					shapeInfo.radius != null ? shapeInfo.radius :
							shapeInfo.r != null ? shapeInfo.r : 1,
					shapeInfo.height != null ? shapeInfo.height : 
						shapeInfo.h != null ? shapeInfo.h : 1,
					material);
				break;
			case hemi.shape.PLANE:
				transform = hemi.shape.createPlane(
					client,
					shapeInfo.height != null ? shapeInfo.height :
						shapeInfo.h != null ? shapeInfo.h : 1,
					shapeInfo.width != null ? shapeInfo.width :
						shapeInfo.w != null ? shapeInfo.w : 1,
					material);
				break;
			case hemi.shape.ARROW:
				transform = hemi.shape.createArrow(
					client,
					shapeInfo.size != null ? shapeInfo.size : 1,
					shapeInfo.tail != null ? shapeInfo.tail : 1,
					material);
				break;
			case hemi.shape.TETRA:
				transform = hemi.shape.createTetra(
					client,
					shapeInfo.size != null ? shapeInfo.size : 1,
					material);
				break;
			case hemi.shape.OCTA:
				transform = hemi.shape.createOcta(
					client,
					shapeInfo.size != null ? shapeInfo.size : 1,
					material);
				break;
			case hemi.shape.PYRAMID:
				transform = hemi.shape.createPyramid(
					client,
					shapeInfo.height != null ? shapeInfo.height :
						shapeInfo.h != null ? shapeInfo.h : 1,
					shapeInfo.width != null ? shapeInfo.width :
						shapeInfo.w != null ? shapeInfo.w : 1,
					shapeInfo.depth != null ? shapeInfo.depth :
						shapeInfo.d != null ? shapeInfo.d : 1,
					material);
				break;
			case hemi.shape.CUSTOM:
				transform = hemi.shape.createCustom(
					client,
					shapeInfo.vertices != null ? shapeInfo.vertices :
						shapeInfo.v != null ? shapeInfo.v : [],
					shapeInfo.faces != null ? shapeInfo.faces :
						shapeInfo.f != null ? shapeInfo.f : [],
					shapeInfo.faceVertexUvs != null ? shapeInfo.faceVertexUvs :
						shapeInfo.uvs != null ? shapeInfo.uvs : [],
					material);
				break;
		}
		
		return transform;
	};
	
	/**
	 * Create a box.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} h height of box (along y-axis)
	 * @param {number} w width of box (along x-axis)
	 * @param {number} d depth of box (along z-axis)
	 * @param {THREE.Material} material material to use on box
	 * 
	 * @return {THREE.Mesh} the Transform containing the created box
	 */
	hemi.shape.createBox = function(client, h, w, d, material) {
		var transform = new THREE.Mesh(new THREE.CubeGeometry(w, h, d), 
			material);
			
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create a cube.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} size dimensions of cube
	 * @param {THREE.Material} material material to use on cube
	 * 
	 * @return {THREE.Mesh} the Transform containing the created cube
	 */
	hemi.shape.createCube = function(client, size, material) {
		var transform = new THREE.Mesh(new THREE.CubeGeometry(size, size, size), 
			material);
		
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create a cylinder.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} r1 Radius at bottom
	 * @param {number} r2 Radius at top
	 * @param {number} h height (along y-axis)
	 * @param {THREE.Material} material material to use on cylinder
	 * 
	 * @return {THREE.Mesh} the Transform containing the created cylinder
	 */
	hemi.shape.createCylinder = function(client, r1, r2, h, material) {
		var transform = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 24), 
			material);
		
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create a cone.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} r radius of the base
	 * @param {number} h height (along y-axis)
	 * @param {THREE.Material} material material to use on cone
	 * 
	 * @return {THREE.Mesh} the Transform containing the created cone
	 */
	hemi.shape.createCone = function(client, r, h, material) {
		var transform = new THREE.Mesh(new THREE.CylinderGeometry(0, r, h, 24), 
			material);
		
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create a plane.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} h height (along y-axis)
	 * @param {number} w width (along x-axis)
	 * @param {THREE.Material} material material to use on plane
	 * 
	 * @return {THREE.Mesh} the Transform containing the created plane
	 */
	hemi.shape.createPlane = function(client, h, w, material) {
		var transform = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);

		checkClient(client);
		rootTransform.add(transform);

		return transform;
	};

	/**
	 * Create a sphere.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} r radius of sphere
	 * @param {THREE.Material} material material to use on sphere
	 * 
	 * @return {THREE.Mesh} the Transform containing the created sphere
	 */
	hemi.shape.createSphere = function(client, r, material) {
		var transform = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12), material);
		
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create an arrow.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} size the scale of the arrow head on each axis
	 * @param {number} tail the length of the arrow tail
	 * @param {THREE.Material} material material to use on arrow
	 * 
	 * @return {THREE.Mesh} the Transform containing the created sphere
	 */
	hemi.shape.createArrow = function(client, size, tail, material) {
		var transform = new THREE.Mesh(new THREE.ArrowGeometry(size, size, tail, 
			size/2, size/2), material);
		
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create a tetrahedron.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} size size of cube in which tetrahedron will be inscribed
	 * @param {THREE.Material} material material to use on tetrahedron
	 * 
	 * @return {THREE.Mesh} the Transform containing the created tetrahedron
	 */
	hemi.shape.createTetra = function(client, size, material) {
		var halfSize = size / 2,
			v = [new THREE.Vertex(new THREE.Vector3(halfSize, halfSize, halfSize)),
				 new THREE.Vertex(new THREE.Vector3(-halfSize, -halfSize, halfSize)),
				 new THREE.Vertex(new THREE.Vector3(-halfSize, halfSize, -halfSize)),
				 new THREE.Vertex(new THREE.Vector3(halfSize, -halfSize, -halfSize))],
			f = [new THREE.Face3(0, 2, 1),
				 new THREE.Face3(0, 1, 3),
				 new THREE.Face3(0, 3, 2),
				 new THREE.Face3(1, 2, 3)],
			uvs = [[new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)]];
		
		return hemi.shape.createCustom(client, v, f, uvs, material);
	};
	
	/**
	 * Create a stellated octahedron.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} size size of cube on which octahedron will be inscribed
	 * @param {THREE.Material} material material to use on octahedron
	 * 
	 * @return {THREE.Mesh} the Transform containing the created octahedron
	 */
	hemi.shape.createOcta = function(client, size, material) {
		var transform = new THREE.Mesh(new THREE.OctahedronGeometry(size/2, 0), material);
		
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create a pyramid.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} h height of pyramid (along z-axis)
	 * @param {number} w width of pyramid (along x-axis)
	 * @param {number} d depth of pyramid (along y-axis)
	 * @param {THREE.Material} material material to use on pyramid
	 * 
	 * @return {THREE.Mesh} the Transform containing the created pyramid
	 */
	hemi.shape.createPyramid = function(client, h, w, d, material) {
		var halfH = h / 2,
			halfW = w / 2,
			halfD = d / 2,
			v = [new THREE.Vertex(new THREE.Vector3(halfW, -halfH, halfD)),
		 		 new THREE.Vertex(new THREE.Vector3(-halfW, -halfH, halfD)),
		 		 new THREE.Vertex(new THREE.Vector3(-halfW, -halfH, -halfD)),
				 new THREE.Vertex(new THREE.Vector3(halfW, -halfH, -halfD)),
				 new THREE.Vertex(new THREE.Vector3(0, halfH, 0))];
			f = [new THREE.Face3(0, 1, 2),
				 new THREE.Face3(0, 2, 3),
				 new THREE.Face3(1, 0, 4),
				 new THREE.Face3(2, 1, 4),
				 new THREE.Face3(3, 2, 4),
				 new THREE.Face3(0, 3, 4)],
			uvs = [[new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)]];
		
		return hemi.shape.createCustom(client, v, f, uvs, material);
	};
	
	/**
	 * Create a custom shape from a list of vertices.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {THREE.Vertex[]} verts list of vertices. 
	 * @param {THREE.Face3[]} faces list of faces. The normal is determined by 
	 * 	   right-hand rule (i.e. polygon will be visible from side from which 
	 *     vertices are listed in counter-clockwise order).
	 * @param {THREE.UV[3][]} faceUvs list of face vertex uvs. 
	 * @param {THREE.Material} material material to apply to custom shape.
	 * 
	 * @return {THREE.Mesh} the Transform containing the created custom shape
	 */
	hemi.shape.createCustom = function(client, verts, faces, faceUvs, material) {
		var transform, i, il, face, normal,
			geo = new THREE.Geometry();
			
		checkClient(client);
		geo.vertices = verts;	
		geo.faces = faces;
		geo.faceVertexUvs[0] = faceUvs;

		for (i = 0, il = faces.length; i < il; i++) {
			face = faces[i];
			normal = hemi.utils.computeNormal(verts[face.a], verts[face.b], verts[face.c]);
			face.normal.copy(normal);
			face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		}
		
		geo.computeCentroids();
		geo.mergeVertices();
		
		transform = new THREE.Mesh(geo, material);
		rootTransform.add(transform);
		
		return transform;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			Private Methods			                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  
	
	/*
	 * Checks if the client's scene has rootTransform added to it and if not, adds it.
	 *   
	 * @param {hemi.Client} client the client to check for rootTransform
	 */
	function checkClient(client) {	
		if (!clients[client]) {
			client.scene.add(rootTransform);
			clients[client] = true;
		}
	}
	
})(hemi);/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
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

	hemi.fx = hemi.fx || {};
	
	var clientData = [];
	
	function findData(client) {
		var retVal = null;
		for (var i = 0, il = clientData.length; i < il && retVal == null; i++) {
			if (clientData[i].client === client) {
				retVal = clientData[i];
			}
		}
		return retVal;
	};

	/*
	 * The following three functions are exact duplicates of the functions
	 * in WebGLRenderer. Until those functions are exposed, we have to 
	 * duplicate them here. 
	 * 
	 */
	
	function addToFixedArray(where, what) {
		where.list[ where.count ] = what;
		where.count += 1;
	};

	function unrollImmediateBufferMaterial(globject) {
		var object = globject.object,
			material = object.material;

		if (material.transparent) {
			globject.transparent = material;
			globject.opaque = null;
		} else {
			globject.opaque = material;
			globject.transparent = null;
		}
	};

	function unrollBufferMaterial(globject) {
		var object = globject.object,
			buffer = globject.buffer,
			material, materialIndex, meshMaterial;

		meshMaterial = object.material;

		if (meshMaterial instanceof THREE.MeshFaceMaterial) {
			materialIndex = buffer.materialIndex;

			if (materialIndex >= 0) {
				material = object.geometry.materials[materialIndex];

				if (material.transparent) {
					globject.transparent = material;
					globject.opaque = null;
				} else {
					globject.opaque = material;
					globject.transparent = null;
				}
			}
		} else {
			material = meshMaterial;

			if (material) {
				if (material.transparent) {
					globject.transparent = material;
					globject.opaque = null;
				} else {
					globject.opaque = material;
					globject.transparent = null;
				}
			}
		}
	};
	
	hemi.fx.cleanup = function() {
		clientData = [];
	}
	
	/**
	 * Removes the fog for the given client
	 * 
	 * @param {hemi.Client} client the client view to clear fog for
	 */
	hemi.fx.clearFog = function(client) {
		var data = findData(client);
		
		if (data && data.fog) {
			client.scene.fog = undefined;
			client.setBGColor(data.oldBGHex, data.oldBGAlpha);
			
			// now change the materials
			for (var i = 0, il = data.materials.length; i < il; i++) {
				var matData = data.materials[i];
				
				client.renderer.initMaterial(matData.mat, client.scene.lights, client.scene.fog, matData.obj);
			}
		}
	};
	
	/**
	 * Sets the fog for the given client to the following parameters
	 * 
	 * @param {hemi.Client} client the client view to set fog for 
	 * @param {number} color the hex (begins with 0x) color value
	 * @param {number} alpha the alpha value of the color between 0 and 1
	 * @param {number} near the viewing distance where the fog obscuring starts  
	 * @param {number} far the viewing distance where fog opacity obscures the 
	 * 		subject
	 */
	hemi.fx.setFog = function(client, color, alpha, near, far) {
		var data = findData(client),
			objs = client.scene.__webglObjects.concat(
				client.scene.__webglObjectsImmediate),
			mats = [],
			refresh = false;
		
		if (!data) {
			data = {
				client: client
			};
			clientData.push(data);
		}
		
		if (!data.fog) {
			data.fog = new THREE.Fog();
			
			// save the old background color
			data.oldBGHex = client.renderer.getClearColor().getHex();
			data.oldBGAlpha = client.renderer.getClearAlpha();
			refresh = true;
		}
		
		data.fog.color.setHex(color);
		data.fog.near = near;
		data.fog.far = far;
		
		client.scene.fog = data.fog;
		client.setBGColor(color, alpha);
		
		if (refresh) {
			// go through all the materials and update
			// first get the materials
			for (var i = 0, il = objs.length; i < il; i++) {
				var webglObject = objs[i], 
					object = webglObject.object, 
					opaque = webglObject.opaque, 
					transparent = webglObject.transparent;
				
				for (var j = 0, jl = opaque.count; j < jl; j++) {
					mats.push({
						mat: opaque.list[j],
						obj: object
					});
				}
				for (var j = 0, jl = transparent.count; j < jl; j++) {
					mats.push({
						mat: transparent.list[j],
						obj: object
					});
				}
			}
		
			// save the materials for later
			data.materials = mats;
		}
		
		// now change the materials
		for (var i = 0, il = data.materials.length; i < il; i++) {
			var matData = data.materials[i],
				material = matData.mat,
				object = matData.obj,
				fog = client.scene.fog;
			
			if (refresh) {
				client.renderer.initMaterial(material, client.scene.lights, 
					fog, object);
			}
			else {
				var uniforms = material.uniforms;
									
				uniforms.fogColor.value = fog.color;		
				uniforms.fogNear.value = fog.near;
				uniforms.fogFar.value = fog.far;
			}
		}
	};
	
	/**
	 * Sets the opacity for the given material in the given object.
	 * 
	 * @param {hemi.Client} client the client view in which to change opacity
	 * @param {THREE.Object3d} object the object whose material's opacity we're 
	 * 		changing
	 * @param {THREE.Material} material the material to set opacity on
	 * @param {number} opacity the opacity value between 0 and 1
	 */
	hemi.fx.setOpacity = function(client, object, material, opacity) {
		var objs = client.scene.__webglObjects.concat(
				client.scene.__webglObjectsImmediate),
			found = null;
				
		for (var i = 0, il = objs.length; i < il && found == null; i++) {
			var webglObject = objs[i];
			
			if (webglObject.object.parent === object || webglObject.object === object) {
				found = webglObject;
			}
		}
		
		if (found) {
			material.transparent = opacity < 1;
			material.opacity = opacity;
			
			// move the material to the transparent list and out of the opaque list
			found.transparent && (found.transparent.list = []);
			found.opaque && (found.opaque.list = []);
			unrollBufferMaterial(found);
			unrollImmediateBufferMaterial(found);
		}
	};
	
	return hemi;
})(hemi || {});/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
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

	/**
	 * @class A TextureSet can manage Textures that are part of a set as defined by the user. It
	 * will handle loading them and notify the author upon completion.
	 * 
	 * @param {Object} opt_urls optional object map of Texture names to urls to load
	 * @param {function(Object):void} opt_callback function to receive loaded Textures
	 */
	var TextureSet = function(opt_urls, opt_callback) {
		/*
		 * The function to pass the loaded Textures once they are all ready.
		 * @type function(Object):void
		 */
		this._callback = opt_callback || null;
		/**
		 * The total number of loaded and not-yet-loaded Textures in the TextureSet.
		 * @type number
		 * @default 0
		 */
		this.count = 0;
		/*
		 * The number of loaded/ready Textures in the TextureSet.
		 * @type number
		 */
		this.loaded = 0;
		/**
		 * An object that maps a given name for a Texture to its instance for easy access.
		 * @type Object
		 */
		this.textures = {};

		if (opt_urls) {
			for (var name in opt_urls) {
				this.addTexture(name, opt_urls[name]);
			}
		}
	};

	/**
	 * Add the given Texture to the TextureSet.
	 *
	 * @param {string} name the name of the Texture
	 * @param {THREE.Texture} texture the Texture
	 */
	TextureSet.prototype.addLoadedTexture = function(name, texture) {
		this.count++;
		this.loaded++;
		this.textures[name] = texture;
	};

	/**
	 * Load a Texture from the given file url into the TextureSet.
	 *
	 * @param {string} name the name for the texture
	 * @param {string} url the url of the image
	 */
	TextureSet.prototype.addTexture = function(name, url) {
		var that = this;
		this.count++;

		hemi.loadTexture(url, function(texture) {
				that.textures[name] = texture;
				that.loaded++;

				if (that.loaded === that.count && that._callback) {
					that._callback(that.textures);
				}
			});
	};

	/**
	 * Get the Texture with the given name in the TextureSet.
	 *
	 * @param {string} name the name the Texture was given when added
	 * @return {THREE.Texture} the Texture
	 */
	TextureSet.prototype.getTexture = function(name) {
		return this.textures[name];
	};

	hemi.TextureSet = TextureSet;

	return hemi;
})(hemi || {});
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
	/*
	 * Utility to handle the Timer naturally finishing its countdown.
	 */
	var handleTimeout = function(timer) {
			timer.reset();
			timer.send(hemi.msg.stop, {
				time: timer.startTime
			});
		};

	/**
	 * @class A Timer is a simple countdown timer that can be used to script
	 * behavior and sequence events.
	 * @extends hemi.world.Citizen
	 */
	hemi.TimerBase = function() {
		/*
		 * The epoch time that this Timer was last started (or resumed)
		 * @type number
		 */
		this._started = null;
		/*
		 * The elapsed time (not including any currently running JS timer)
		 * @type number
		 */
		this._time = 0;
		/*
		 * The id of the current JS timer
		 * @type number
		 */
		this._timeId = null;
		/**
		 * The time the timer will start counting down from (milliseconds).
		 * @type number
		 * @default 1000
		 */
		this.startTime = 1000;
	};

	hemi.TimerBase.prototype = {
		/**
		 * Pause the Timer if it is currently running.
		 */
		pause: function() {
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
				this._timeId = null;
				
				var stopped = (new Date()).getTime();
				this._time += (stopped - this._started);
			}
		},
		
		/**
		 * Reset the Timer so it is ready to count down again.
		 */
		reset: function() {
			this._started = null;
			this._time = 0;
			this._timeId = null;
		},
		
		/**
		 * Resume the Timer's count down if it is currently paused.
		 */
		resume: function() {
			if (this._timeId === null && this._started !== null) {
				this._timeId = setTimeout(handleTimeout,
					this.startTime - this._time, this);
				this._started = (new Date()).getTime();
			}
		},
		
		/**
		 * Start the Timer's count down. If it is currently running, restart the
		 * Timer from its initial count down value.
		 */
		start: function() {
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
			}
			
			this._time = 0;
			this.send(hemi.msg.start, {
				time: this.startTime
			});
			this._timeId = setTimeout(handleTimeout, this.startTime, this);
			this._started = (new Date()).getTime();
		},
		
		/**
		 * Stop the Timer if it is currently running or paused. This resets any
		 * currently elapsed time on the Timer.
		 */
		stop: function() {
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
				var stopped = (new Date()).getTime();
				this._time += (stopped - this._started);
			}
			
			if (this._started !== null) {
				var elapsed = this._time;
				this.reset();
				this.send(hemi.msg.stop, {
					time: elapsed
				});
			}
		}
	};

	hemi.makeCitizen(hemi.TimerBase, 'hemi.Timer', {
		cleanup: function() {
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
				this._timeId = null;
				this._started = null;
			}
		},
		msgs: [hemi.msg.start, hemi.msg.stop],
		toOctane: ['startTime']
	});
	
	return hemi;
})(hemi || {});
