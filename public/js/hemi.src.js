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

 var hemi = hemi || {};

/**
 * @fileoverview This file contains various functions and classes for rendering gpu based particles.
 */
(function() {
	/**
	 * @namespace A Module with various GPU particle functions and classes.
	 * Note: GPU particles have the issue that they are not sorted per particle but rather per
	 * emitter.
	 */
	hemi.particles = hemi.particles || {};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Particle shader code
////////////////////////////////////////////////////////////////////////////////////////////////////

	var SHADERS = {
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// System class
////////////////////////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Spec class
////////////////////////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Emitter class
////////////////////////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////////////////////////
// OneShot class
////////////////////////////////////////////////////////////////////////////////////////////////////

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
		this._transform = new THREE.Mesh(emitter.shape, emitter.material);
		this._transform.doubleSided = true; // turn off face culling
		this._transform.visible = false;

		if (opt_parent) {
			opt_parent.add(this._transform);
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Trail class
////////////////////////////////////////////////////////////////////////////////////////////////////

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

	/*
	 * Allocates particles.
	 * 
	 * @param {number} numParticles Number of particles to allocate.
	 */
	function allocateParticles(numParticles) {
		for (var i = 0; i < numParticles; ++i) {
			for (var j = 0; j < 4; ++j) {
				this.shape.vertices.push(new THREE.Vertex());
			}

			var index = i * 4;
			this.shape.faces.push(new THREE.Face3(index, index + 1, index + 2));
			this.shape.faces.push(new THREE.Face3(index, index + 2, index + 3));
		}
	}

	/*
	 * Creates particles.
	 *  
	 * @param {number} firstParticleIndex Index of first particle to create.
	 * @param {number} numParticles The number of particles to create.
	 * @param {hemi.particles.Spec} parameters The parameters for the emitter.
	 * @param {function(number, hemi.particles.Spec): void} opt_paramSetter A function that is
	 *     called for each particle to allow it's parameters to be adjusted per particle. The number
	 *     is the index of the particle being created, in other words, if numParticles is 20 this
	 *     value will be 0 to 19. The ParticleSpec is a spec for this particular particle. You can
	 *     set any per particle value before returning.
	 */
	function createParticles(firstParticleIndex, numParticles, parameters, opt_paramSetter) {
		var attributes = this.material.attributes,
			uniforms = this.material.uniforms,
			uvLifeTimeFrameStart = attributes.uvLifeTimeFrameStart,
			positionStartTime = attributes.positionStartTime,
			velocityStartSize = attributes.velocityStartSize,
			accelerationEndSize = attributes.accelerationEndSize,
			spinStartSpinSpeed = attributes.spinStartSpinSpeed,
			orientation = attributes.orientation,
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
	}

	function setupMaterial(parameters) {
		this.validateParameters(parameters);

		var shader = SHADERS[parameters.billboard ? 'particle2d' : 'particle3d'];

		this.material.attributes = THREE.UniformsUtils.clone(shader.attributes);
		this.material.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
		this.material.vertexShader = shader.vertexShader;
		this.material.fragmentShader = shader.fragmentShader;
		this._timeParam = this.material.uniforms.time;
	}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	function convertToPixels(values) {
		var pixels = new Uint8Array(values.length),
			pixel;

		for (var i = 0; i < values.length; ++i) {
			pixel = values[i] * 256.0;
			pixels[i] = pixel > 255 ? 255 : pixel < 0 ? 0 : pixel;
		}

		return pixels;
	}

})();
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

/**
 * Create the requestAnimationFrame function if needed. Each browser implements it as a different
 * name currently. Default to a timeout if not supported. Credit to
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
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
 * @version 2.0.0-beta
 */
 var hemi = hemi || {};

(function() {

		/*
		 * The function to pass errors thrown using hemi.error. Default is to throw a new Error.
		 * @type function(string):void
		 */
	var errCallback = null,
		/*
		 * The current frames per second that are enforced by Hemi.
		 * @type number
		 * @default 60
		 */
		fps = 60,
		/*
		 * Cached inverse of the frames per second.
		 * @type number
		 */
		hz = 1 / fps,
		/*
		 * Cached inverse of the frames per millisecond. (Internal time is in milliseconds)
		 * @type number
		 */
		hzMS = hz * 1000,
		/*
		 * The time of the last render in milliseconds.
		 * @type {number}
		 */
		lastRenderTime = 0,
		/*
		 * Array of render listener objects that all have an onRender function.
		 * @type Object[]
		 */
		renderListeners = [],
		/*
		 * The index of the render listener currently running onRender().
		 * @type number
		 */
		renderNdx = -1;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Conversion factor for degrees to radians.
	 * @type number
	 * @default Math.PI / 180
	 */
	hemi.DEG_TO_RAD = Math.PI / 180;

	/**
	 * Half of Pi
	 * @type number
	 * @default Math.PI / 2
	 */
	hemi.HALF_PI = Math.PI / 2;

	/**
	 * Conversion factor for radians to degrees.
	 * @type number
	 * @default 180 / Math.PI
	 */
	hemi.RAD_TO_DEG = 180 / Math.PI;

	/**
	 * The version of Hemi released: TBD
	 * @constant
	 */
	hemi.version = '2.0.0-beta';

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The list of Clients being rendered on the current webpage.
	 */
	hemi.clients = [];

	/**
	 * Add the given render listener to hemi. A listener must implement the onRender function.
	 * 
	 * @param {Object} listener the render listener to add
	 */
	hemi.addRenderListener = function(listener) {
		if (renderListeners.indexOf(listener) === -1) {
			renderListeners.push(listener);
		}
	};

	/**
	 * Pass the given error message to the registered error handler or throw an Error if no handler
	 * is registered.
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
	 * Get the Client that is rendering the given Transform.
	 * 
	 * @param {hemi.Transform} transform the Transform to get the Client for
	 * @return {hemi.Client} the Client rendering the Transform, or null
	 */
	hemi.getClient = function(transform) {
		var scene = transform.parent;

		while (scene.parent !== undefined) {
			scene = scene.parent;
		}

		for (var i = 0, il = hemi.clients.length; i < il; ++i) {
			var client = hemi.clients[i];

			if (scene === client.scene) {
				return client;
			}
		}

		return null;
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
	 * Get the time that the specified animation frame occurs at.
	 *
	 * @param {number} frame frame number to get the time for
	 * @return {number} time that the frame occurs at in seconds
	 */
	hemi.getTimeOfFrame = function(frame) {
		return frame * hz;
	};

	/**
	 * Initialize hemi features. This does not need to be called if hemi.makeClients() is called,
	 * but it can be used on its own if you don't want to use hemi's client system.
	 */
	hemi.init = function() {
		hemi.console.setEnabled(true);
		window.addEventListener('resize', resize, false);
		lastRenderTime = new Date().getTime();
		render(true);
	};

	/**
	 * Search the webpage for any divs with an ID starting with "kuda" and create a Client and
	 * canvas within each div that will be rendered to using WebGL.
	 */
	hemi.makeClients = function() {
		var elements = document.getElementsByTagName('div'),
			numClients = hemi.clients.length;
		
		for (var i = 0, il = elements.length; i < il; ++i) {
			var element = elements[i];

			if (element.id && element.id.match(/^kuda/)) {
				var renderer = getRenderer(element);

				if (renderer) {
					var client = i < numClients ? hemi.clients[i] : new hemi.Client(true);

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

			if (ndx <= renderNdx) {
				// Adjust so that the next render listener will not get skipped.
				renderNdx--;
			}
		}

		return retVal;
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
	 * Set the current frames-per-second that will be enforced for rendering.
	 * 
	 * @param {number} newFps frames-per-second to enforce
	 */
	hemi.setFPS = function(newFps) {
		fps = newFps;
		hz = 1/fps;
		hzMS = hz * 1000;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Get the supported renderer for the browser (WebGL or canvas) If WebGL is not supported,
	 * display a warning message.
	 * 
	 * @param {Object} element DOM element to add warning message to if necessary
	 * @return {THREE.WebGLRenderer} the supported renderer or null
	 */
	function getRenderer(element) {
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
	}

	/*
	 * The render function to be executed on each animation frame. Calls onRender for each render
	 * listener and then for each Client.
	 * 
	 * @param {boolean} update flag to force Clients to render
	 */
	function render(update) {
		requestAnimationFrame(render);

		var renderTime = new Date().getTime(),
			event = {
				elapsedTime: hz
			};

		while (renderTime - lastRenderTime > hzMS) {
			update = true;
			lastRenderTime += hzMS;

			for (renderNdx = 0; renderNdx < renderListeners.length; ++renderNdx) {
				renderListeners[renderNdx].onRender(event);
			}
		}

		renderNdx = -1;

		if (update) {
			for (var i = 0, il = hemi.clients.length; i < il; ++i) {
				hemi.clients[i].onRender(event);
			}
		}
	}

	/*
	 * Window resize handler function.
	 */
	function resize() {
		for (var i = 0; i < hemi.clients.length; ++i) {
			hemi.clients[i]._resize();
		}
	}

})();
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

	/**
	 * @namespace A module to provide various utilities for Hemi.
	 */
	hemi.utils = hemi.utils || {};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Hashtable class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Here we extend Hashtable to allow it to be queried for Object attributes that are not the
	 * Hash key.
	 */
	hemi.utils.Hashtable = Hashtable;

	/**
	 * Search the Hashtable for values with attributes that match the given set of attributes. The
	 * attributes may be single values or arrays of values which are alternatives.
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

		// Copy the property names out of the attributes object just once since this is less
		// efficient than a simple array.
		for (var x in attributes) {
			if (hemi.utils.isArray(attributes[x])) {
				arrProps.push(x);
			} else {
				props.push(x);
			}
		}

		var pLen = props.length,
			aLen = arrProps.length;

		for (var i = 0, il = values.length; i < il; ++i) {
			value = values[i];
			match = true;
			// First test the single value properties.
			for (pN = 0; match && pN < pLen; ++pN) {
				propName = props[pN];
				match = value[propName] === attributes[propName];
			}
			// Next test the array of value properties.
			for (pN = 0; match && pN < aLen; ++pN) {
				match = false;
				propName = arrProps[pN];
				propVal = value[propName];
				propArr = attributes[propName];
				aL = propArr.length;
				// Search through the array until we find a match for the
				// Hashtable value's property.
				for (aN = 0; !match && aN < aL; ++aN) {
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

})();
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Create a copy of the given Object (or array).
	 * 
	 * @param {Object} src an Object (or array) to clone
	 * @param {boolean} opt_deep optional flag to indicate if deep copying should be performed
	 *     (default is deep copying)
	 * @return {Object} the created Object (or array)
	 */
	hemi.utils.clone = function(src, opt_deep) {
		var dest = hemi.utils.isArray(src) ? [] : {};
		opt_deep = opt_deep === undefined ? true : opt_deep;

		hemi.utils.join(dest, src, opt_deep);
		return dest;
	};

	/**
	 * Compare the two given arrays of numbers. The arrays should be the same length.
	 * 
	 * @param {number[]} a the first array
	 * @param {number[]} b the second array
	 * @return {boolean} true if the arrays are equal
	 */
	hemi.utils.compareArrays = function(a, b) {
		var eq = a.length === b.length;

		for (var i = 0, il = a.length; eq && i < il; ++i) {
			if (hemi.utils.isArray(a[i])) { 
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
	 * @param {function(string, string):void)} callback function to pass the data retrieved from the
	 *     URL as well as the status text of the request
	 * @param {boolean} opt_overrideMimeType optional flag indicating the XHR's mime type should be
	 *     forced to "text/xml"
	 */
	hemi.utils.get = function(url, callback, opt_overrideMimeType) {
		var xhr = new window.XMLHttpRequest();

		if (opt_overrideMimeType) {
			xhr.overrideMimeType("text/xml");
		}

		xhr.onreadystatechange = function() {
			if (this.readyState === 4) {
				this.onreadystatechange = hemi.utils.noop;
				var data = null;

				if (this.status === 200 || window.location.href.indexOf('http') === -1) {
					var ct = this.getResponseHeader('content-type');

					if (opt_overrideMimeType || ct && ct.indexOf('xml') >= 0) {
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
	 * Merge all of the properties of the given objects into the first object. If any of the objects
	 * have properties with the same name, the later properties will overwrite earlier ones. The
	 * exception to this is if both properties are objects or arrays and the merge is doing a deep
	 * copy. In that case, the properties will be merged recursively.
	 * 
	 * @param {Object} obj1 the first object which will receive all properties
	 * @param {Object} objN any number of objects to copy properties from
	 * @param {boolean} opt_deep optional flag to indicate if deep copying should be performed
	 *     (default is deep copying)
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

})();
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

		// Static helper vector
	var _vector = new THREE.Vector3();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 
	 * Convert from cartesian to spherical coordinates.
	 *
	 * @param {number[3]} coords XYZ cartesian coordinates
	 * @return {number[3]} array of radius, theta, phi
	 */
	hemi.utils.cartesianToSpherical = function(coords) {
		var x = coords[0],
			y = coords[1],
			z = coords[2],
			r = Math.sqrt(x*x + y*y + z*z),
			theta = Math.acos(y/r),
			phi = Math.atan2(x,z);

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
		return hemi.utils.factorial(n, (n - m) + 1) / hemi.utils.factorial(m);
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
		return val > max ? max : (val < min ? min : val);
	};

	/**
	 * Compute the normal of the three given vertices that form a triangle.
	 * 
	 * @param {THREE.Vertex} a vertex a
	 * @param {THREE.Vertex} b vertex b
	 * @param {THREE.Vertex} c vertex c
	 * @return {THREE.Vector3} the normal vector
	 */
	hemi.utils.computeNormal = function(a, b, c) {
		var cb = new THREE.Vector3().sub(c.position, b.position),
			ab = _vector.sub(a.position, b.position);

		cb.crossSelf(ab);

		if (!cb.isZero()) {
			cb.normalize();
		}

		return cb;
	};

	/**
	 * Calculate the cubic hermite interpolation between two points with associated tangents.
	 *
	 * @param {number} t time (between 0 and 1)
	 * @param {number[3]} p0 the first waypoint
	 * @param {number[3]} m0 the tangent through the first waypoint
	 * @param {number[3]} p1 the second waypoint
	 * @param {number[3]} m1 the tangent through the second waypoint
	 * @return {number[3]} the interpolated point
	 */
	hemi.utils.cubicHermite = function(t,p0,m0,p1,m1) {
		var t2 = t * t,
			t3 = t2 * t,
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
	 * @param {number} opt_stop optional number to stop the factorial at (if it should be stopped
	 *     before 1
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
	 * @return {number[3]} the array [
	 *     t: time value on ray,
	 *     u: u-coordinate on plane,
	 *     v: v-coordinate on plane
	 */
	hemi.utils.intersect = function(ray, plane) {
		var dir = ray.direction,
			orig = ray.origin,
			point0 = plane[0],
			point1 = plane[1],
			point2 = plane[2],
			A = hemi.utils.invertMat3([[dir.x, point1.x - point0.x, point2.x - point0.x],
				[dir.y, point1.y - point0.y, point2.y - point0.y],
				[dir.z, point1.z - point0.z, point2.z - point0.z]]),
			B = [orig.x - point0.x, orig.y - point0.y, orig.z - point0.z],
			t = A[0][0] * B[0] + A[0][1] * B[1] + A[0][2] * B[2],
			u = A[1][0] * B[0] + A[1][1] * B[1] + A[1][2] * B[2],
			v = A[2][0] * B[0] + A[2][1] * B[1] + A[2][2] * B[2];

		return [t,u,v];
	};

	/**
	 * Compute the inverse of a 3-by-3 matrix.
	 * 
	 * @param {number[3][3]} m the matrix to invert
	 * @return {number[3][3]} the inverse of m
	 */
	hemi.utils.invertMat3 = function(m) {
		var t00 = m[1][1] * m[2][2] - m[1][2] * m[2][1],
			t10 = m[0][1] * m[2][2] - m[0][2] * m[2][1],
			t20 = m[0][1] * m[1][2] - m[0][2] * m[1][1],
			d = 1 / (m[0][0] * t00 - m[1][0] * t10 + m[2][0] * t20);

		return [[d * t00, -d * t10, d * t20],
			[-d * (m[1][0] * m[2][2] - m[1][2] * m[2][0]),
			 d * (m[0][0] * m[2][2] - m[0][2] * m[2][0]),
			 -d * (m[0][0] * m[1][2] - m[0][2] * m[1][0])],
			[d * (m[1][0] * m[2][1] - m[1][1] * m[2][0]),
			 -d * (m[0][0] * m[2][1] - m[0][1] * m[2][0]),
			 d * (m[0][0] * m[1][1] - m[0][1] * m[1][0])]];
	};

	/**
	 * Perform linear interpolation on the given values. Values can be numbers or arrays or even
	 * nested arrays (as long as their lengths match).
	 * 
	 * @param {number} start start number (or array of numbers) for interpolation
	 * @param {number} stop stop number (or array of numbers) for interpolation
	 * @param {number} t coefficient for interpolation (usually time)
	 * @return {number} the interpolated number (or array of numbers)
	 */
	hemi.utils.lerp = function(start, stop, t) {
		var ret;

		if (hemi.utils.isArray(start)) {
			ret = [];

			for (var i = 0, il = start.length; i < il; ++i) {
				ret[i] = hemi.utils.lerp(start[i], stop[i], t);
			}
		} else {
			ret = start + (stop - start) * t;
		}

		return ret;
	};

	/**
	 * Perform linear interpolation on the given vectors.
	 * 
	 * @param {THREE.Vector3} start start vector for interpolation
	 * @param {THREE.Vector3} stop stop vector for interpolation
	 * @param {number} t coefficient for interpolation (usually time)
	 * @param {THREE.Vector3} opt_vec optional vector to receive interpolated value
	 * @return {THREE.Vector3} the interpolated vector
	 */
	hemi.utils.lerpVec3 = function(start, stop, t, opt_vec) {
		opt_vec = opt_vec || new THREE.Vector3();

		opt_vec.x = hemi.utils.lerp(start.x, stop.x, t);
		opt_vec.y = hemi.utils.lerp(start.y, stop.y, t);
		opt_vec.z = hemi.utils.lerp(start.z, stop.z, t);

		return opt_vec;
	};

	/**
	 * Convert the given linear interpolated value to an exponential interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @param {number} x the exponent to use
	 * @return {number} the exponential value
	 */
	hemi.utils.linearToExponential = function(val, x) {
		return (Math.pow(x, val) - 1) / (x - 1);
	};

	/**
	 * Convert the given linear interpolated value to an inverse exponential interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @param {number} x the exponent to use
	 * @return {number} the inverse exponential value
	 */
	hemi.utils.linearToExponentialInverse = function(val, x) {
		return 1 - hemi.utils.linearToExponential(1 - val, x);
	};

	/**
	 * Convert the given linear interpolated value to a parabolic interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @return {number} the parabolic value
	 */
	hemi.utils.linearToParabolic = function(val) {
		return val * val;
	};

	/**
	 * Convert the given linear interpolated value to a inverse parabolic interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @return {number} the inverse parabolic value
	 */
	hemi.utils.linearToParabolicInverse = function(val) {
		return 1 - (1 - val) * (1 - val);
	};

	/**
	 * Convert the given linear interpolated value to a sinusoidal interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @return {number} the sinusoidal value
	 */
	hemi.utils.linearToSine = function(val) {
		return (Math.sin(Math.PI * val - hemi.HALF_PI) + 1) / 2;
	};

	/**
	 * A container for all the common penner easing equations:
	 * linear
	 * quadratic 
	 * cubic
	 * quartic
	 * quintic
	 * exponential
	 * sinusoidal
	 * circular
	 */
	hemi.utils.penner = {

		linearTween: function (t, b, c, d) {
			return c*t/d + b;
		},

		easeInQuad: function (t, b, c, d) {
			t /= d;
			return c*t*t + b;
		},

		easeOutQuad: function (t, b, c, d) {
			t /= d;
			return -c * t*(t-2) + b;
		},

		easeInOutQuad: function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t + b;
			t--;
			return -c/2 * (t*(t-2) - 1) + b;
		},

		easeInCubic: function (t, b, c, d) {
			t /= d;
			return c*t*t*t + b;
		},

		easeOutCubic: function (t, b, c, d) {
			t /= d;
			t--;
			return c*(t*t*t + 1) + b;
		},

		easeInOutCubic: function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t*t + b;
			t -= 2;
			return c/2*(t*t*t + 2) + b;
		},

		easeInQuart: function (t, b, c, d) {
			t /= d;
			return c*t*t*t*t + b;
		},
		
		easeOutQuart: function (t, b, c, d) {
			t /= d;
			t--;
			return -c * (t*t*t*t - 1) + b;
		},

		easeInOutQuart: function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t*t*t + b;
			t -= 2;
			return -c/2 * (t*t*t*t - 2) + b;
		},

		easeInQuint: function (t, b, c, d) {
			t /= d;
			return c*t*t*t*t*t + b;
		},
		
		easeOutQuint: function (t, b, c, d) {
			t /= d;
			t--;
			return c*(t*t*t*t*t + 1) + b;
		},

		easeInOutQuint: function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t*t*t*t + b;
			t -= 2;
			return c/2*(t*t*t*t*t + 2) + b;
		},

		easeInSine: function (t, b, c, d) {
			return -c * Math.cos(t/d * hemi.HALF_PI) + c + b;
		},

		easeOutSine: function (t, b, c, d) {
			return c * Math.sin(t/d * hemi.HALF_PI) + b;
		},

		easeInOutSine: function (t, b, c, d) {
			return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
		},

		easeInExpo: function (t, b, c, d) {
			return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
		},

		easeOutExpo: function (t, b, c, d) {
			return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
		},

		easeInOutExpo: function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
			t--;
			return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
		},

		easeInCirc: function (t, b, c, d) {
			t /= d;
			return -c * (Math.sqrt(1 - t*t) - 1) + b;
		},

		easeOutCirc: function (t, b, c, d) {
			t /= d;
			t--;
			return c * Math.sqrt(1 - t*t) + b;
		},

		easeInOutCirc: function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
			t -= 2;
			return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
		}

	};

	/** 
	 * Convert from spherical to cartesian coordinates.
	 *
	 * @param {number[3]} rtp array of radius, theta, phi
	 * @return {number[3]} XYZ cartesian coordinates
	 */
	hemi.utils.sphericalToCartesian = function(rtp) {
		var r = rtp[0],
			t = rtp[1],
			p = rtp[2],
			sinT = Math.sin(t);

		return [r * sinT * Math.cos(p),	// x
				r * sinT * Math.sin(p), // y
				r * Math.cos(t)]; // z
	};

	/**
	 * Convert the given UV coordinates for the given plane into XYZ coordinates in 3D space.
	 * 
	 * @param {number[2]} uv uv coordinates on a plane
	 * @param {THREE.Vector3[3]} plane array of 3 xyz coordinates defining the plane
	 * @return {THREE.Vector3} xyz coordinates of the uv location on the plane
	 */
	hemi.utils.uvToXYZ = function(uv, plane) {
		var point0 = plane[0],
			point1 = plane[1],
			point2 = plane[2],
			uf = new THREE.Vector3().sub(point1, point0).multiplyScalar(uv[0]),
			vf = _vector.sub(point2, point0).multiplyScalar(uv[1]);

		return uf.addSelf(vf).addSelf(point0);
	};

	/**
	 * Convert the given XYZ point in world space to screen coordinates. Note that this function
	 * converts the actual point passed in, not a clone of it.
	 * 
	 * @param {hemi.Client} the Client containing the point
	 * @param {THREE.Vector3} point XYZ point to convert
	 * @return {THREE.Vector2} XY screen position of point
	 */
	hemi.utils.worldToScreen = function(client, point) {
		var camera = client.camera.threeCamera;
		camera.matrixWorldInverse.multiplyVector3(point);

		var viewZ = point.z;
		camera.projectionMatrix.multiplyVector3(point);

		var projX = point.x,
			projY = point.y;

		if (viewZ > 0) {
			projX = -projX;
			projY = -projY;
		}

		point.x = (1 + projX) * 0.5 * client.getWidth();
		point.y = (1 - projY) * 0.5 * client.getHeight();

		return new THREE.Vector2(Math.round(point.x), Math.round(point.y));
	};

	/**
	 * Convert the given XYZ point in world space to screen coordinates. Note that this function
	 * converts the actual point passed in, not a clone of it.
	 * 
	 * @param {hemi.Client} the Client containing the point
	 * @param {THREE.Vector3} point XYZ point to convert
	 * @return {THREE.Vector3} XY screen position of point plus z-distance, where 0.0 = near clip
	 *     and 1.0 = flar clip
	 */
	hemi.utils.worldToScreenFloat = function(client, point) {
		var camera = client.camera.threeCamera;
		camera.matrixWorldInverse.multiplyVector3(point);

		var viewZ = point.z;
		camera.projectionMatrix.multiplyVector3(point);

		var projX = point.x,
			projY = point.y;

		if (viewZ > 0) {
			projX = -projX;
			projY = -projY;
		}

		point.x = (1 + projX) * 0.5 * client.getWidth();
		point.y = (1 - projY) * 0.5 * client.getHeight();

		return point;
	};

})();
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

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
	 * Combine the given strings into one cohesive fragment shader source string.
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
		return combineSrc(src, cfg, 'gl_FragColor');
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
		return combineSrc(src, cfg, 'gl_Position');
	};

	/**
	 * Get the vertex and pixel shaders (as well as their source) for the given Material.
	 * 
	 * @param {hemi.Client} client the Client that is rendering the Material
	 * @param {THREE.Material} material the material to get shaders for
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

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
	function combineSrc(src, cfg, globName) {
		var parsed = hemi.utils.parseSrc(src, globName);
		hemi.utils.join(parsed, cfg);
		return hemi.utils.buildSrc(parsed);
	}

})();
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
		 * A table of characters to break a line on (for text wrapping), weighted by preference.
		 */
	var breakable = {
			' ': 10,
			',': 20,
			';': 30,
			'.': 10,
			'!': 40,
			'?': 40
		};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Capitalize the first letter of the given string.
	 * 
	 * @param {string} str the string to capitalize
	 * @return {string} the capitalized string
	 */
	hemi.utils.capitalize = function(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
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

	/**
	 * Remove any whitespace from the beginning and end of the given string.
	 * 
	 * @param {string} str the string to trim
	 * @return {string} the trimmed string
	 */
	hemi.utils.trim = function(str) {
		return str.replace(/^\s*/, "").replace(/\s*$/, "");
	};

	/**
	 * Perform loose text wrapping on the given text. The returned text will be close to the
	 * specified target width, but may be a little wider.
	 * 
	 * @param {string} text the string to perform text wrapping on
	 * @param {number} targetWidth desired width for text in pixels
	 * @param {number} charWidth average width of a character of the text in pixels
	 * @return {string[]} array of wrapped text
	 */
	hemi.utils.wrapText = function(text, targetWidth, charWidth) {
		text = cleanseText(text);

		var wrapLines = [],
			textLength = text.length,
			cols = parseInt(targetWidth / charWidth, 10),
			rows = Math.ceil(textLength / cols),
			start = cols,
			index = 0,
			last;

		for (var i = 0; i < rows - 1; ++i) {
			last = index;
			index = bestBreak(text, start, 10);
			wrapLines.push(hemi.utils.trim(text.substring(last, index)));
			start = index + cols;
		}

		wrapLines.push(text.substring(index, textLength));
		return wrapLines;
	};

	/**
	 * Perform strict text wrapping on the given text. The returned text is guaranteed to be no
	 * wider than the specified target width, though it may be farther from that width than with
	 * loose text wrapping.
	 * 
	 * @param {string} text the string to perform text wrapping on
	 * @param {number} targetWidth maximum desired width for text in pixels
	 * @param {CanvasRenderingContext2D} canvas object used to measure text's on-screen size
	 * @return {string[]} array of wrapped text
	 */
	hemi.utils.wrapTextStrict = function(text, targetWidth, canvas) {
		text = cleanseText(text);

		var wrapLines = [],
			textLength = text.length,
			metric = canvas.measureText(text),
			charWidth = metric.width / textLength,
			chars = Math.floor(targetWidth / charWidth),
			increment = Math.ceil(chars / 10),
			start = 0,
			end = chars,
			line, width;

		while (end < textLength) {
			line = hemi.utils.trim(text.substring(start, end));
			metric = canvas.measureText(line);
			width = metric.width;

			while (width < targetWidth && end < textLength) {
				end += increment;

				if (end > textLength) {
					end = textLength;
				}

				line = hemi.utils.trim(text.substring(start, end));
				metric = canvas.measureText(line);
				width = metric.width;
			}

			while (width > targetWidth) {
				end--;
				line = hemi.utils.trim(text.substring(start, end));
				metric = canvas.measureText(line);
				width = metric.width;
			}

			var breakNdx = end - 1,
				ch = text.charAt(breakNdx);

			while (breakable[ch] === undefined && breakNdx > start) {
				breakNdx--;
				ch = text.charAt(breakNdx);
			}

			if (breakNdx > start) {
				end = breakNdx + 1;
			}

			line = hemi.utils.trim(text.substring(start, end));
			wrapLines.push(line);
			start = end;
			end += chars;
		}

		if (start !== textLength || wrapLines.length === 0) {
			line = hemi.utils.trim(text.substring(start, textLength));
			wrapLines.push(line);
		}

		return wrapLines;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Calculate the "best" index to break a line of text at, given a certain weighted preference
	 * for characters to break on.
	 * 
	 * @param {string} text string of text to break into two lines
	 * @param {number} start estimated index the user would like to break at
	 * @param {number} radius maximum distance before and after the start index to search for a
	 *     "best" break
	 * @return {number} the calculated break index
	 */
	function bestBreak(text, start, radius) {
		var bestIndex = start,
			bestWeight = 0,
			textLength = text.length,
			beginRadius = start - Math.max(start - radius, 0),
			endRadius = Math.min(start + radius, textLength - 1) - start,
			examWeight, weight;

		for (var i = parseInt(start - beginRadius, 10); i <= start + endRadius; ++i) {
			weight = breakable[text.charAt(i)];

			if (weight === undefined) 
				continue;

			examWeight = weight / Math.abs(start - i);

			if (examWeight > bestWeight) {
				bestIndex = i;
				bestWeight = examWeight;
			}
		}

		return Math.min(bestIndex + 1, textLength - 1);
	}

	/*
	 * Replace any newline characters in the text with spaces.
	 * 
	 * @param {string} text string to clean
	 * @return {string} string with all newline characters replaced
	 */
	function cleanseText(text) {
		return text.replace('\n', ' ');
	}

})();
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

		// Static helper objects
	var _matrix = new THREE.Matrix4(),
		_quaternion = new THREE.Quaternion(),
		_vector = new THREE.Vector3();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Rotate the given Transform about the given axis by the given amount.
	 * 
	 * @param {THREE.Vector3} axis rotation axis defined as an XYZ vector
	 * @param {number} angle amount to rotate by in radians
	 * @param {hemi.Transform} transform the transform to rotate
	*/
	hemi.utils.axisRotate = function(axis, angle, transform) {
		if (transform.useQuaternion) {
			_quaternion.setFromAxisAngle(axis, angle);
			transform.quaternion.multiplySelf(_quaternion);
		} else {
			_vector.copy(axis).multiplyScalar(angle);
			transform.rotation.addSelf(_vector);
		}

		transform.updateMatrix();
		transform.updateMatrixWorld();
	};

	/**
	 * Center the given Mesh's geometry about its local origin and update the Mesh so that the
	 * geometry stays in the same world position.
	 * 
	 * @param {hemi.Mesh} mesh the Mesh to center geometry for
	 */
	hemi.utils.centerGeometry = function(mesh) {
		var delta = THREE.GeometryUtils.center(mesh.geometry);
		delta.multiplySelf(mesh.scale);

		if (mesh.useQuaternion) {
			mesh.quaternion.multiplyVector3(delta);
		} else {
			_matrix.setRotationFromEuler(transform.rotation, transform.eulerOrder);
			delta = transformVector(_matrix, delta);
		}

		mesh.position.subSelf(delta);
		mesh.updateMatrix();
		mesh.updateMatrixWorld();
		// Do some magic since Three.js doesn't currently have a way to flush cached vertices
		updateVertices(mesh);
	};

	/**
	 * Interpret the given point from world space to local space. Note that this function converts
	 * the actual point passed in, not a clone of it.
	 * 
	 * @param {hemi.Transform} transform the Transform whose local space the point will be in
	 * @param {THREE.Vector3} point the point to convert to local space
	 * @return {THREE.Vector3} the given point, now in local space
	 */
	hemi.utils.pointAsLocal = function(transform, point) {
		var inv = new THREE.Matrix4().getInverse(transform.matrixWorld);
	    return inv.multiplyVector3(point);
	};

	/**
	 * Interpret the given point from local space to world space. Note that this function converts
	 * the actual point passed in, not a clone of it.
	 * 
	 * @param {hemi.Transform} transform the Transform whose local space the point is in
	 * @param {THREE.Vector3} point the point to convert to world space
	 * @return {THREE.Vector3} the given point, now in world space
	 */
	hemi.utils.pointAsWorld = function(transform, point) {
		return transform.matrixWorld.multiplyVector3(point);
	};

	/**
	 * Point the y axis of the given Transform toward the given point.
	 *
	 * @param {hemi.Transform} tran the Transform to rotate
	 * @param {THREE.Vector3} eye XYZ point from which to look (may be the origin)
	 * @param {THREE.Vector3} target XYZ point at which to aim the y axis
	 * @return {hemi.Transform} the rotated Transform
	 */
	hemi.utils.pointYAt = function(tran, eye, target) {
		var dx = target.x - eye.x,
			dy = target.y - eye.y,
			dz = target.z - eye.z,
			dxz = Math.sqrt(dx*dx + dz*dz),
			rotY = Math.atan2(dx,dz),
			rotX = Math.atan2(dxz,dy);

		tran.rotation.y += rotY;
		tran.rotation.x += rotX;
		tran.updateMatrix();
		tran.updateMatrixWorld();

		return tran;
	};

	/**
	 * Point the z axis of the given Transform toward the given point.
	 *
	 * @param {hemi.Transform} tran the Transform to rotate
	 * @param {THREE.Vector3} eye XYZ point from which to look (may be the origin)
	 * @param {THREE.Vector3} target XYZ point at which to aim the z axis
	 * @return {hemi.Transform} the rotated Transform
	 */
	hemi.utils.pointZAt = function(tran, eye, target) {
		var delta = _vector.sub(target, eye),
			rotY = Math.atan2(delta.x, delta.z),
			rotX = -Math.asin(delta.y / delta.length());

		tran.rotation.y += rotY;
		tran.rotation.x += rotX;
		tran.updateMatrix();
		tran.updateMatrixWorld();

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
		updateUVs(geometry);
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
		updateUVs(geometry);
	};

	/**
	 * Translate the vertices of the given Mesh's geometry by the given amount and update the Mesh
	 * Mesh so that the geometry stays in the same world position.
	 * 
	 * @param {hemi.Mesh} mesh the Mesh to shift geometry for
	 * @param {THREE.Vector3} delta the XYZ amount to shift the geometry by
	 */
	hemi.utils.translateGeometry = function(mesh, delta) {
		// Shift geometry
		mesh.geometry.applyMatrix(_matrix.setTranslation(delta.x, delta.y, delta.z));
		mesh.geometry.computeBoundingBox();

		// Update mesh transform matrix
		delta.multiplySelf(mesh.scale);

		if (mesh.useQuaternion) {
			mesh.quaternion.multiplyVector3(delta);
		} else {
			_matrix.setRotationFromEuler(transform.rotation, transform.eulerOrder);
			delta = transformVector(_matrix, delta);
		}

		mesh.position.subSelf(delta);
		mesh.updateMatrix();
		mesh.updateMatrixWorld();

		// Do some magic since Three.js doesn't currently have a way to flush cached vertices
		updateVertices(mesh);
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
		updateUVs(geometry);
	};

	/**
	 * Rotate the Transform by the given angle along the given world space axis.
	 *
	 * @param {THREE.Vector3} axis rotation axis defined as an XYZ vector
	 * @param {number} angle amount to rotate by in radians
	 * @param {hemi.Transform} transform the Transform to rotate
	 */
	hemi.utils.worldRotate = function(axis, angle, transform) {
		var invWorld = _matrix.getInverse(transform.parent.matrixWorld),
			localAxis = transformVector(invWorld, axis);

		hemi.utils.axisRotate(localAxis, angle, transform);
	};

	/**
	 * Scale the Transform by the given scale amounts in world space.
	 *
	 * @param {THREE.Vector3} scale scale factors defined as an XYZ vector
	 * @param {hemi.Transform} transform the Transform to scale
	 */
	hemi.utils.worldScale = function(scale, transform) {
		var invMat = THREE.Matrix4.makeInvert3x3(transform.parent.matrixWorld);

		_vector.copy(scale);
		transform.scale.multiplySelf(multiplyMat3(invMat, _vector));
		transform.updateMatrix();
		transform.updateMatrixWorld();
	};

	/**
	 * Translate the Transform by the given world space vector.
	 *
	 * @param {THREE.Vector3} delta XYZ vector to translate by
	 * @param {hemi.Transform} transform the Transform to translate
	 */
	hemi.utils.worldTranslate = function(delta, transform) {
		var invWorld = _matrix.getInverse(transform.parent.matrixWorld),
			localDelta = transformVector(invWorld, delta);

		transform.position.addSelf(localDelta);
		transform.updateMatrix();
		transform.updateMatrixWorld();
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Transform the given vector by the given 3x3 matrix.
	 * 
	 * @param {THREE.Matrix3} m the matrix
	 * @param {THREE.Vector3} v the vector
	 * @return {THREE.Vector3} the transformed vector
	 */
	function multiplyMat3(matrix, vector) {
		var vX = vector.x,
			vY = vector.y,
			vZ = vector.z;

		vector.x = matrix.m[0] * vX + matrix.m[3] * vY + matrix.m[6] * vZ;
		vector.y = matrix.m[1] * vX + matrix.m[4] * vY + matrix.m[7] * vZ;
		vector.z = matrix.m[2] * vX + matrix.m[5] * vY + matrix.m[8] * vZ;

		return vector;
	}

	/*
	 * Transform the given vector by the rotation and scale of the given matrix.
	 * 
	 * @param {THREE.Matrix4} matrix the matrix
	 * @param {THREE.Vector3} vector the vector
	 * @return {THREE.Vector3} the transformed vector
	 */
	function transformVector(matrix, vector) {
		var vX = vector.x,
			vY = vector.y,
			vZ = vector.z;

		return _vector.set(vX * matrix.n11 + vY * matrix.n21 + vZ * matrix.n31,
			vX * matrix.n12 + vY * matrix.n22 + vZ * matrix.n32,
			vX * matrix.n13 + vY * matrix.n23 + vZ * matrix.n33);
	}

	/*
	 * Perform magic to get the WebGLRenderer to update the geometry's UV buffer.
	 * 
	 * @param {THREE.Geometry} geometry geometry to update UVs for
	 */
	function updateUVs(geometry) {
		var groupList = geometry.geometryGroupsList;

		for (var i = 0, il = groupList.length; i < il; ++i) {
			var group = groupList[i],
				verts = group.faces3.length * 3 + group.faces4.length * 4;

			group.__uvArray = new Float32Array(verts * 2);
			group.__inittedArrays = true;
		}

		geometry.__dirtyUvs = true;
	}

	/*
	 * Perform magic to get the WebGLRenderer to update the mesh geometry's vertex buffer.
	 * 
	 * @param {hemi.Mesh} mesh Mesh containing geometry to update vertices for
	 */
	function updateVertices(mesh) {
		if (mesh.__webglInit) {
			var geometry = mesh.geometry,
				scene = mesh.parent;

			while (scene.parent !== undefined) {
				scene = scene.parent;
			}

			geometry.dynamic = true;
			delete geometry.geometryGroupsList[0].__webglVertexBuffer;
			mesh.__webglInit = false;
			scene.__objectsAdded.push(mesh);
		}
	}

})();
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
	/**
	 * @namespace A module for managing the string literals for Message types.
	 * @example
	 * The documentation for each Message type has an example of a typical Message body for that
	 * type (the 'data' property of a Message).
	 */
	hemi.msg = {
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.Model - the Model's animation time changes
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
		 * hemi.ParticleBurst - the ParticleBurst effect is triggered
		 * data = {
		 *     position: (number[3]) the XYZ position the ParticleBurst was triggered at
		 * }
		 */
		burst: 'hemi.burst',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.Citizen - the Citizen is being removed from the World
		 * data = { }
		 */
		cleanup: 'hemi.cleanup',
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
		 * hemi.Audio - the Audio's media content is loaded
		 * data = {
		 *     src: (string) the URL of the audio file loaded
		 * }
		 * @example
		 * hemi.HudImage - the HudImage's image data is loaded
		 * data = { }
		 * @example
		 * hemi.HudVideo - the HudVideo's media content is loaded
		 * data = {
		 *     src: (string) the URL of the video file loaded
		 * }
		 * @example
		 * hemi.Model - the Model's 3D data is loaded
		 * data = { }
		 * @example
		 * hemi.State - the State is set as the "current" State
		 * data = { }
		 */
		load: 'hemi.load',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.Transform - the Transform has been moved
		 * data = {
		 *     delta: (THREE.Vector3) the change in XYZ position caused by the move
		 * }
		 */
		move: 'hemi.move',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi - a shape is picked by a mouse click
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
		 * hemi - a task's progress data has been updated
		 * data = {
		 *     isTotal: (boolean) a flag indicating if percent is for a specific task or a total of
		 *                        all current tasks
		 *     percent: (number) the task's percentage complete, 0-100
		 *     task: (string) an id for the task, ex: url of a file being loaded
		 * }
		 */
		progress: 'hemi.progress',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi - the World's resources are loaded and ready
		 * data = { }
		 */
		ready: 'hemi.ready',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.Transform - the Transform has been resized
		 * data = {
		 *     scale: (number) the new scale
		 * }
		 */
		resize: 'hemi.resize',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.AnimationGroup - the AnimationGroup starts
		 * data = { }
		 * @example
		 * hemi.Audio - the Audio starts playing
		 * data = { }
		 * @example
		 * hemi.ParticleTrail - the ParticleTrail effect starts generating particles
		 * data = { }
		 * @example
		 * hemi.Rotator - the Rotator starts rotating
		 * data = { }
		 * @example
		 * hemi.Translator - the Translator starts translating
		 * data = { }
		 * @example
		 * hemi.Timer - the Timer starts counting down
		 * data = {
		 *     time: (number) the milliseconds the Timer will count down for
		 * }
		 * @example
		 * hemi.Camera - the Camera starts moving to a Viewpoint
		 * data = {
		 *     viewpoint: (hemi.view.Viewpoint) the Viewpoint the Camera is moving to
		 * }
		 */
		start: 'hemi.start',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.AnimationGroup - the AnimationGroup finishes or is stopped
		 * data = { }
		 * @example
		 * hemi.Audio - the Audio finishes playing
		 * data = { }
		 * @example
		 * hemi.ParticleTrail - the ParticleTrail effect stops generating particles
		 * data = { }
		 * @example
		 * hemi.Rotator - the Rotator stops rotating
		 * data = { }
		 * @example
		 * hemi.Translator - the Translator stops translating
		 * data = { }
		 * @example
		 * hemi.Timer - the Timer stops counting down
		 * data = {
		 *     time: (number) the milliseconds the Timer counted down
		 * }
		 * @example
		 * hemi.Camera - the Camera arrives at a Viewpoint
		 * data = {
		 *     viewpoint: (hemi.view.Viewpoint) the Viewpoint the Camera moved to
		 * }
		 */
		stop: 'hemi.stop',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.Audio - the Audio's media content is unloaded
		 * data = { }
		 * @example
		 * hemi.Model - the Model's 3D data is unloaded
		 * data = { }
		 * @example
		 * hemi.State - the State is set to not be the "current" State
		 * data = { }
		 */
		unload: 'hemi.unload',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.ParticleEmitter - the ParticleEmitter is shown or hidden
		 * data = {
		 *     visible: (boolean) a flag indicating if the Emitter is visible
		 * }
		 * @example
		 * hemi.HudDisplay - the HudDisplay shows a page or is hidden
		 * data = {
		 *     page: (number) the page number being shown or 0 if the HudDisplay is hidden
		 * }
		 * @example
		 * hext.tools.BaseTool - the tool is shown or hidden
		 * data = {
		 *     visible: (boolean) a flag indicating if the tool is visible
		 * }
		 */
		visible: 'hemi.visible',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi - the World is being cleaned up and emptied.
		 */
		worldCleanup: 'hemi.worldCleanup'
	};

})();
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
		 * This function is aliased to the proper test function for the console's current priority
		 * level.
		 */
	var testPriority = logTest,
		/*
		 * Flag indicating if the console should display log messages.
		 * @type boolean
		 */
		enabled = false,
		/*
		 * Flag indicating if timestamps should be added to log messages.
		 * @type boolean
		 */
		showTime = true;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @namespace A module for displaying log, warning, and error messages to a console element on a
	 * webpage.
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Log the given message if the console is enabled or ignore the message if the console is
	 * disabled.
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
		enabled = en;
		hemi.console.log = enabled ? logMessage : hemi.utils.noop;
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
	 * Set the current priority level of the console. Log messages at the given priority level or
	 * higher will be displayed. Log messages below the priority level will be ignored.
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Test if the given priority level for a message is high enough to display when the console
	 * is set to ERR priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	function errTest(level) {
		return level === hemi.console.ERR;
	}

	/*
	 * Get a timestamp for the current time.
	 * 
	 * @return {string} the current timestamp
	 */
	function getTime() {
		var currentTime = new Date(),
			hours = currentTime.getHours(),
			minutes = currentTime.getMinutes(),
			seconds = currentTime.getSeconds();

		hours = hours < 10 ? '0' + hours : '' + hours;
		minutes = minutes < 10 ? ':0' + minutes : ':' + minutes;
		seconds = seconds < 10 ? ':0' + seconds : ':' + seconds;

		return hours + minutes + seconds;
	}

	/*
	 * The actual function for logging a message.
	 * 
	 * @param {string} msg the message to log
	 * @param {string} level the priority level of the message
	 */
	function logMessage(msg, level) {
		level = level || hemi.console.LOG;

		if (testPriority(level)) {
			var fullMsg = level + ':\t' + msg;

			if (showTime) {
				fullMsg = getTime() + '\t' + fullMsg;
			}

			output(fullMsg);
		}
	}

	/*
	 * Test if the given priority level for a message is high enough to display when the console
	 * is set to LOG priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	function logTest(level) {
		return level === hemi.console.LOG ||
		       level === hemi.console.WARN ||
		       level === hemi.console.ERR;
	}

	/*
	 * The default method for displaying a log message.
	 * 
	 * @param {string} msg the full log message to display
	 */
	function output(msg) {
		try {
			console.log(msg);
		} catch(e) { }
	}

	/*
	 * Test if the given priority level for a message is high enough to display when the console
	 * is set to WARN priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	function warnTest(level) {
		return level === hemi.console.WARN ||
		       level === hemi.console.ERR;
	}

})();
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

	var colladaLoader = new THREE.ColladaLoader(),
		resetCB = null,
		taskCount = 1;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The relative path from the referencing HTML file to the Kuda directory.
	 * @type string
	 * @default ''
	 */
	hemi.loadPath = '';

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

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
	 * Load the HTML file at the given url and pass it to the given callback
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda directory
	 * @param {function(string):void} callback a function to pass the loaded HTML data
	 */
	hemi.loadHtml = function(url, callback) {
		url = hemi.getLoadPath(url);

		hemi.utils.get(url, function(data, status) {
			if (data === null) {
				hemi.error(status);
			} else {
				callback(data);
			}
		});
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
		createTask(url);
		colladaLoader.load(url, function (collada) {
			if (callback) {
				callback(collada);
			}
			updateTask(url, 100);
			decrementTaskCount();
		}, function(progress) {
			if (progress.loaded !== null && progress.total !== null) {
				updateTask(url, (progress.loaded / progress.total) * 100);
			}
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
			updateTask(url, 100);
			var texture = new THREE.Texture(image);
			texture.needsUpdate = true;
			callback(texture);
		});

		createTask(url);
	};

	/**
	 * Load the texture at the given URL. If an error occurs, an alert is thrown. Otherwise the
	 * given callback is executed and passed the texture. This function return a created (but not
	 * yet loaded) texture synchronously.
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda directory
	 * @param {function(THREE.Texture):void} callback a function to pass the loaded texture
	 * @return {THREE.Texture} the created (but not yet loaded) texture
	 */
	hemi.loadTextureSync = function(url, callback) {
		var img = new Image(),
			texture = new THREE.Texture(img);

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
			texture.needsUpdate = true;
			callback(texture);
			decrementTaskCount();
		};

		img.src = hemi.getLoadPath(url);
		return texture;
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	var progressTable = new Hashtable();

	function decrementTaskCount() {
		if (--taskCount === 0) {
			taskCount = 1;
			hemi.send(hemi.msg.ready, {});

			if (resetCB) {
				resetCB();
				resetCB = null;
			}
		}
	}

	/**
	 * Create a new progress task with the given name. Initialize its
	 * progress to 0.
	 * 
	 * @param {string} name the unique name of the task
	 * @return {boolean} true if the task was created successfully, false if
	 *      another task with the given name already exists
	 */
	var createTask = function(name) {
		if (progressTable.get(name) !== null) {
			return false;
		}
		
		var obj = {
			percent: 0,
		};
		
		progressTable.put(name, obj);
		updateTotal();
		return true;
	};
		/**
	 * Update the progress of the task with the given name to the given percent.
	 * 
	 * @param {string} name name of the task to update
	 * @param {number} percent percent to set the task's progress to (0-100)
	 * @return {boolean} true if the task was found and updated
	 */
	var updateTask = function(name, percent) {
		var task = progressTable.get(name),
			update = task !== null;
		
		if (update) {
			task.percent = percent;
			
			hemi.send(hemi.msg.progress, {
				task: name,
				percent: percent,
				isTotal: false
			});
			
			updateTotal();
		}
		
		return update;
	};
	
	/**
	 * Send an update on the total progress of all loading activities, and clear
	 * the progress table if they are all finished.
	 */
	var updateTotal = function() {
		var total = progressTable.size(),
			values = progressTable.values(),
			percent = 0;
			
		for (var ndx = 0; ndx < total; ndx++) {
			var fileObj = values[ndx];
			
			percent += fileObj.percent / total;
		}
		
		hemi.send(hemi.msg.progress, {
			task: 'Total Progress',
			isTotal: true,
			percent: percent
		});
		
		if (percent >= 99.9) {
			progressTable.clear();
		}
		
		return percent;
	};

})();
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
		 * Storage for the base classes that new Citizen classes were created from.
		 */
	var baseClasses = {},

		/*
		 * All of the Citizens of the World.
		 */
		citizens = new hemi.utils.Hashtable(),

		/*
		 * The next id to assign to a Citizen requesting a world id.
		 */
		nextId = 1;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Shared functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Get the Citizen's id.
	 * 
	 * @return {number} the id
	 */
	function _getId() {
		return this._worldId;
	}

	/*
	 * Set the Citizen's id.
	 * 
	 * @param {number} id the id to set
	 */
	function _setId(id) {
		var oldId = this._worldId;
		this._worldId = id;

		if (oldId !== null) {
			citizens.remove(oldId);
			citizens.put(id, this);
		}
	}

	/*
	 * Send a Message with the given attributes from the Citizen to any registered MessageTargets.
	 * 
	 * @param {string} type type of Message
	 * @param {Object} data container for any and all information relevant to the Message
	 */
	function send(type, data) {
		hemi.dispatch.postMessage(this, type, data);
	}

	/*
	 * Register the given handler to receive Messages of the specified type from the Citizen. This
	 * creates a MessageTarget.
	 * 
	 * @param {string} type type of Message to handle
	 * @param {Object} handler either a function or an object
	 * @param {string} opt_func name of the function to call if handler is an object
	 * @param {string[]} opt_args optional array of names of arguments to pass to the handler.
	 *     Otherwise the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	function subscribe(type, handler, opt_func, opt_args) {
		return hemi.dispatch.registerTarget(this._worldId, type, handler, opt_func, opt_args);
	}

	/*
	 * Register the given handler to receive Messages of all types from the Citizen. This creates a
	 * MessageTarget.
	 * 
	 * @param {Object} handler either a function or an object
	 * @param {string} opt_func name of the function to call if handler is an object
	 * @param {string[]} opt_args optional array of names of arguments to pass to the handler.
	 *     Otherwise the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	function subscribeAll(handler, opt_func, opt_args) {
		return hemi.dispatch.registerTarget(this._worldId, hemi.dispatch.WILDCARD, handler,
			opt_func, opt_args);
	}

	/*
	 * Remove the given MessageTarget for Messages of the specified type for the Citizen.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to remove from the Dispatch
	 * @param {string} opt_type optional message type the MessageTarget was registered for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or null
	 */
	function unsubscribe(target, opt_type) {
		return hemi.dispatch.removeTarget(target, {
			src: this._worldId,
			msg: opt_type
		});
	}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Get the base class that the specified Citizen class was created from. This can be useful if
	 * you want to extend functionality and create a new Citizen class yourself.
	 * 
	 * @param {string} clsName name of the Citizen class
	 * @return {function} the base class constructor or undefined
	 */
	hemi.getBaseClass = function(clsName) {
		return baseClasses[clsName];
	};

	/**
	 * Take the given base class constructor and create a new class from it that has all of the
	 * required functionality of a Citizen.
	 *  
	 * @param {function} clsCon constructor function for the base class
	 * @param {string} clsName name for the new Citizen class
	 * @param {Object} opts options including:
	 *     cleanup - function to execute for cleanup
	 *     toOctane - array of properties for octaning or function to execute
	 * @return {function} the constructor for the new Citizen class
	 */
	hemi.makeCitizen = function(clsCon, clsName, opts) {
		opts = opts || {};
		baseClasses[clsName] = clsCon;

		var cleanFunc = opts.cleanup;

		/*
		 * A Citizen is a uniquely identifiable member of a World that is able to send Messages
		 * through the World's dispatch. The Citizen's id is all that is necessary to retrieve the
		 * Citizen from its World, regardless of its type.
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
		 * Send a cleanup Message and remove the Citizen from the World. Base classes should extend
		 * this so that it removes all references to the Citizen.
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

		if (Citizen.prototype._msgSent) {
			Citizen.prototype._msgSent.push(hemi.msg.cleanup);
		}

        hemi.makeOctanable(Citizen, clsName, opts.toOctane || []);
        createClass(Citizen, clsName);

        return Citizen;
	};

	/**
	 * @namespace A module for managing all elements of a 3D world. The World manages a set of
	 * Citizens and provides look up services for them.
	 */
	hemi.world = hemi.world || {};

	/**
	 * Add the given Citizen to the World and give it a world id if it does not already have one.
	 * 
	 * @param {Citizen} citizen the Citizen to add
	 */
	hemi.world.addCitizen = function(citizen) {
		var id = citizen._getId();

		if (id === null) {
			id = this.getNextId();
			citizen._setId(id);
		}

		var toRemove = citizens.get(id);

		if (toRemove !== null) {
			hemi.console.log('Citizen with id ' + id + ' already exists.', hemi.console.ERR);
			toRemove.cleanup();
		}

		citizens.put(id, citizen);
	};

	/**
	 * Check the next id that will be assigned without incrementing the World's nextId token.
	 * 
	 * @return {number} the next id that will be assigned to a Citizen
	 */
	hemi.world.checkNextId = function() {
		return nextId;
	};

	/**
	 * Perform cleanup on the World and release all resources. This effectively resets the World.
	 */
	hemi.world.cleanup = function() {
		hemi.resetLoadTasks();
		hemi.send(hemi.msg.worldCleanup, {});

		citizens.each(function(key, value) {
			value.cleanup();
		});

		if (citizens.size() > 0) {
			hemi.console.log('World cleanup did not remove all citizens.', hemi.console.ERR);
		}

		nextId = 1;
	};

	/**
	 * Get any AnimationGroups with the given attributes. If no attributes are given, all
	 * AnimationGroups will be returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.AnimationGroup): boolean} opt_filter optional filter function that
	 *     takes a AnimationGroup and returns true if the AnimationGroup should be included in the
	 *     returned array
	 * @return {hemi.AnimationGroup[]} an array of AnimationGroups with matching attributes
	 */
	hemi.world.getAnimationGroups = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.AnimationGroup.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Audio with the given attributes. If no attributes are given, all Audio will be
	 * returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Audio): boolean} opt_filter optional filter function that takes an
	 *     Audio and returns true if the Audio should be included in the returned array
	 * @return {hemi.Audio[]} an array of Audio with matching attributes
	 */
	hemi.world.getAudio = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Audio.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any CameraCurves with the given attributes. If no attributes are given, all CameraCurves
	 * will be returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.CameraCurve): boolean} opt_filter optional filter function that takes a
	 *     CameraCurve and returns true if the CameraCurve should be included in the returned array
	 * @return {hemi.CameraCurve[]} an array of CameraCurves with matching attributes
	 */
	hemi.world.getCamCurves = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.CameraCurve.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get the Citizen with the given id and log an error if exactly one result is not returned.
	 * 
	 * @param {number} id world id of the Citizen to get
	 * @return {Citizen} the found Citizen or null
	 */
	hemi.world.getCitizenById = function(id) {
		var cit = citizens.get(id);

		if (cit === null) {
			hemi.console.log('Tried to get Citizen with id ' + id + ', returned null.', hemi.console.ERR);
		}

		return cit;
	};

	/**
	 * Get any Citizens with the given attributes. If no attributes are given, all Citizens will be
	 * returned. Note that you can give an array of values for an attribute and it will search for
	 * Citizens with attributes that match any one of those values.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(Citizen): boolean} opt_filter optional filter function that takes a Citizen
	 *     and returns true if the Citizen should be included in the returned array
	 * @return {Citizen[]} an array of Citizens with matching attributes
	 */
	hemi.world.getCitizens = function(attributes, opt_filter) {
		var matches = citizens.query(attributes || {});

		if (opt_filter) {
			for (var i = 0, il = matches.length; i < il; ++i) {
				if (!opt_filter(matches[i])) {
					matches.splice(i, 1);
					--i;
					--il;
				}
			}
		}

		return matches;
	};

	/**
	 * Get any HudDisplays with the given attributes. If no attributes are given, all HudDisplays
	 * will be returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.HudDisplay): boolean} opt_filter optional filter function that takes a
	 *     HudDisplay and returns true if the HudDisplay should be included in the returned array
	 * @return {hemi.HudDisplay[]} an array of HudDisplays with matching attributes
	 */
	hemi.world.getHudDisplays = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.HudDisplay.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Meshes with the given attributes. If no attributes are given, all Meshes will be
	 * returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Mesh): boolean} opt_filter optional filter function that takes a Mesh
	 *     and returns true if the Mesh should be included in the returned array
	 * @return {hemi.Mesh[]} an array of Meshes with matching attributes
	 */
	hemi.world.getMeshes = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Mesh.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Models with the given attributes. If no attributes are given, all Models will be
	 * returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Model): boolean} opt_filter optional filter function that takes a Model
	 *     and returns true if the Model should be included in the returned array
	 * @return {hemi.Model[]} an array of Models with matching attributes
	 */
	hemi.world.getModels = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Model.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
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
	 * Get any particle effects with the given attributes. If no attributes are given, all particle
	 * effects will be returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.ParticleEmitter): boolean} opt_filter optional filter function that
	 *     takes a particle effect and returns true if the particle effect should be included in the
	 *     returned array
	 * @return {hemi.ParticleEmitter[]} an array of particle effects with matching attributes
	 */
	hemi.world.getParticleEffects = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.ParticleEmitter.prototype._citizenType;
		var retVal = this.getCitizens(attributes, opt_filter);

		attributes._citizenType = hemi.ParticleBurst.prototype._citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));

		attributes._citizenType = hemi.ParticleTrail.prototype._citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));

		return retVal; 
	};

	/**
	 * Get any Shapes with the given attributes. If no attributes are given, all Shapes will be
	 * returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Shape): boolean} opt_filter optional filter function that takes a Shape
	 *     and returns true if the Shape should be included in the returned array
	 * @return {hemi.Shape[]} an array of Shapes with matching attributes
	 */
	hemi.world.getShapes = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Shape.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any States with the given attributes. If no attributes are given, all States will be
	 * returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.State): boolean} opt_filter optional filter function that takes a State
	 *     and returns true if the State should be included in the returned array
	 * @return {hemi.State[]} an array of States with matching attributes
	 */
	hemi.world.getStates = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.State.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Timers with the given attributes. If no attributes are given, all Timers will be
	 * returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Timer): boolean} opt_filter optional filter function that takes a Timer
	 *     and returns true if the Timer should be included in the returned array
	 * @return {hemi.Timer[]} an array of Timers with matching attributes
	 */
	hemi.world.getTimers = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Timer.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Transforms with the given attributes. If no attributes are given, all Transforms will
	 * be returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Transform): boolean} opt_filter optional filter function that takes a
	 *     Transform and returns true if the Transform should be included in the returned array
	 * @return {hemi.Transform[]} an array of Transforms with matching attributes
	 */
	hemi.world.getTransforms = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Transform.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Viewpoints with the given attributes. If no attributes are given, all Viewpoints will
	 * be returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Viewpoint): boolean} opt_filter optional filter function that takes a
	 *     Viewpoint and returns true if the Viewpoint should be included in the returned array
	 * @return {hemi.Viewpoint[]} an array of Viewpoints with matching attributes
	 */
	hemi.world.getViewpoints = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Viewpoint.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Remove the given Citizen from the World.
	 * 
	 * @param {Citizen} citizen the Citizen to remove
	 * @return {boolean} true if the Citizen was found and removed
	 */
	hemi.world.removeCitizen = function(citizen) {
		var id = citizen._getId(),
			removed = citizens.remove(id);

		if (removed === null) {
			hemi.console.log('Unable to remove Citizen with id ' + id, hemi.console.WARN);
		}

		return removed !== null;
	};

	/**
	 * Set the id for the World to assign to the next Citizen.
	 * 
	 * @param {number} id the next id to assign
	 */
	hemi.world.setNextId = function(id) {
		nextId = id;
	};

	/**
	 * Get the Octane structure for the World.
     * 
	 * @param {function(Citizen): boolean} opt_filter optional filter function that takes a Citizen
	 *     and returns true if the Citizen should be included in the returned Octane
     * @return {Object} the Octane structure representing the World
	 */
	hemi.world.toOctane = function(opt_filter) {
		var octane = {
			version: hemi.version,
			nextId: nextId,
			citizens: []
		};

		citizens.each(function(key, value) {
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Set the given class constructor function to the given namespace. For example:
	 * createClass(myClass, 'my.new.Class');
	 * will make my.new.Class equal myClass
	 * 
	 * @param {function():void} clsCon class constructor function
	 * @param {string} clsName fully qualified class name
	 */
	function createClass(clsCon, clsName) {
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
	}

})();
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
	 * Map of class names to stored class constructor functions.
	 */
	var constructors = {};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Restore the original object from the given Octane.
	 * 
	 * @param {Object} octane the structure containing information for creating the original object
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

			// Set the nextId value to a negative number so that we don't have to worry about
			// overlapping world ids between the constructed Citizens and their actual ids that are
			// restored from Octane.
			hemi.world.setNextId(citizenCount * -2);

			// Do the bare minimum: create Citizens and set their ids
			for (var i = 0; i < citizenCount; ++i) {
				createObject(octane.citizens[i]);
			}

			// Now set the World nextId to its proper value.
			hemi.world.setNextId(octane.nextId);

			// Next set up the message dispatch
			var entryOctane = octane.dispatch.ents,
				entries = [];

			for (var i = 0, il = entryOctane.length; i < il; ++i) {
				var entry = createObject(entryOctane[i]);
				setProperties(entry, entryOctane[i]);
				entries.push(entry);
			}

			hemi.dispatch.loadEntries(entries);
			hemi.dispatch.setNextId(octane.dispatch.nextId);

			// Now set Citizen properties and resolve references to other Citizens
			for (var i = 0; i < citizenCount; ++i) {
				var citOctane = octane.citizens[i];
				setProperties(hemi.world.getCitizenById(citOctane.id), citOctane);
			}
		}

		return created;
	};

	/**
	 * Make the given class Octanable. This both enables it to be serialized and stores its
	 * constructor so it can be deserialized.
	 * 
	 * @param {function():void} clsCon the constructor function for the class
	 * @param {string} clsName the name of the class
	 * @param {Object} octProps either an array of names of properties to be saved to Octane or a
	 *     function that returns an array of Octane properties
	 */
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
	     *     id: the Object's world id (optional)
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

				if (this._worldId !== undefined) {
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Create an object from the given Octane structure and set its id. No other properties will be
	 * set yet.
	 * 
	 * @param {Object} octane the structure containing information for creating an object
	 * @return {Object} the newly created object
	 */
	function createObject(octane) {
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
	}

	/**
	 * Use the given list of property names to parse Octane properties from the given object.
	 * 
	 * @param {Object} obj the object to parse from
	 * @param {string[]} propNames array of property names
	 * @return {Object[]} array of parsed Octane properties
	 */
	function parseProps(obj, propNames) {
		var oct = [];

		for (var i = 0, il = propNames.length; i < il; ++i) {
			var name = propNames[i],
				prop = obj[name],
				entry = {
					name: name	
				};
                
            if (!prop) {
                entry.val = prop;
            } else if (hemi.utils.isFunction(prop)) {
				entry.arg = [];
			} else if (hemi.utils.isArray(prop)) {
				if (prop.length > 0) {
					var p = prop[0];

					if (p._getId && p._worldId) {
						entry.id = [];

						for (var j = 0; j < prop.length; ++j) {
							entry.id[j] = prop[j]._getId();
						}
					} else if (p._toOctane) {
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
	}

	/*
	 * Iterate through the given Octane structure and set properties for the given object.
	 * Properties stored by value will be set directly, by Octane will be recursively created, by id
	 * will be retrieved from the World, and by arg will be set by calling the specified function on
	 * the object.
	 * 
	 * @param {Object} object the object created from the given Octane
	 * @param {Object} octane the structure containing information about the given object
	 */
	function setProperties(object, octane) {
		for (var i = 0, il = octane.props.length; i < il; ++i) {
			var property = octane.props[i],
				name = property.name;

			if (property.oct !== undefined) {
				if (property.oct instanceof Array) {
					value = [];

					for (var j = 0, jl = property.oct.length; j < j; ++j) {
						var child = createObject(property.oct[j]);
						setProperties(child, property.oct[j]);
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

					for (var j = 0, jl = property.id.length; j < jl; ++j) {
						value.push(hemi.world.getCitizenById(property.id[j]));
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
	}

})();
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Audio class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class An Audio contains an audio DOM element that can be played, paused, etc.
	 */
	var Audio = function() {
		/*
		 * Flag indicating if a seek operation is currently happening.
		 * @type boolean
		 * @default false
		 */
		this._seeking = false;

		/*
		 * Flag indicating if the Audio should start playing when the current seek operation
		 * finishes.
		 * @type boolean
		 * @default false
		 */
		this._startPlay = false;

		/*
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

			props.push({
				name: 'addUrl',
				arg: [urlObj.url, urlObj.type]
			});
		}

		return props;
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
	function setLoopProper() {
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

})();
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

		/* All of the MessageSpecs (and MessageTargets) in the Dispatch */
	var msgSpecs = new hemi.utils.Hashtable(),

		/* The next id to assign to a MessageTarget */
		nextId = 0;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @namespace A module for message dispatching and handling. The Dispatch receives Messages and
	 * sends them to MessageTargets that are registered with MessageSpecs.
	 */
	hemi.dispatch = hemi.dispatch || {};

	/**
	 * String literal to indicate that all entries for a field are desired.
	 * @constant
	 */
	hemi.dispatch.WILDCARD = '*';

	/** 
	  * First part of an argument string indicating it is an id for the actual argument desired.
	  * @constant
	  * @example
	  * 'id:12' will execute: hemi.world.getCitizenById(12);
	  */ 
	hemi.dispatch.ID_ARG = 'id:';

	/** 
	  * First part of an argument string indicating it should be used to parse the actual message
	  * structure passed to the handler.
	  * @constant
	  * @example
	  * 'msg:data.shape.name' will parse: message.data.shape.name
	  */ 
	hemi.dispatch.MSG_ARG = 'msg:';

////////////////////////////////////////////////////////////////////////////////////////////////////
// Message class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Message is sent whenever an event occurs.
	 */
	var Message = function() {
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

	hemi.dispatch.Message = Message;

////////////////////////////////////////////////////////////////////////////////////////////////////
// MessageSpec class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A MessageSpec specifies a certain Message type and source and
	 * contains a set of MessageTargets that have registered to receive Messages
	 * with matching specs.
	 */
	var MessageSpec = function() {
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

	/*
	 * Octane properties for MessageSpec.
	 * @type string[]
	 */
	MessageSpec.prototype._octane = function() {
		var targetsOct = [];

		for (var i = 0, il = this.targets.length; i < il; ++i) {
			var oct = this.targets[i]._toOctane();

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
	};

	/**
	 * Register the given MessageTarget with the MessageSpec.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the target to add
	 */
	MessageSpec.prototype.addTarget = function(target) {
		if (this.targets.indexOf(target) !== -1) {
			hemi.console.log('MessageSpec already contains MessageTarget', hemi.console.WARN);
		}

		this.targets.push(target);
	};

	/**
	 * Clean up the MessageSpec so all references in it are removed.
	 */
	MessageSpec.prototype.cleanup = function() {
		for (var i = 0, il = this.targets.length; i < il; ++i) {
			this.targets[i].cleanup();
		}

		this.targets = [];
	};

	/**
	 * Remove the given MessageTarget from the MessageSpec.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the target to remove
	 * @return {hemi.dispatch.MessageTarget} the removed target or null
	 */
	MessageSpec.prototype.removeTarget = function(target) {
		var found = null,
			ndx = this.targets.indexOf(target);

		if (ndx !== -1) {
			found = this.targets.splice(ndx, 1)[0];
		} else {
			hemi.console.log('MessageTarget not found in MessageSpec', hemi.console.WARN);
		}

		return found;
	};

	/**
	 * Get the unique hash key for the MessageSpec.
	 * 
	 * @return {string} the hash key
	 */
	MessageSpec.prototype.getHash = function() {
		return this.msg + this.src;
	};

	hemi.dispatch.MessageSpec = MessageSpec;
	hemi.makeOctanable(hemi.dispatch.MessageSpec, 'hemi.dispatch.MessageSpec',
		hemi.dispatch.MessageSpec.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// MessageTarget class
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * @class A MessageTarget registers with a MessageSpec to receive Messages that match its
	 * attributes.
	 * @example
	 * A MessageTarget with the following values:
	 * handler = myObj;
	 * func = 'myFunction';
	 * args = ['msg:src', 12];
	 * 
	 * will execute:
	 * myObj.myFunction(message.src, 12);
	 */
	var MessageTarget = function() {
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

	/*
	 * Octane properties for MessageSpec.
	 * @type string[]
	 */
	MessageTarget.prototype._octane = function() {
		if (!this.handler._getId) {
			hemi.console.log('Handler object in MessageTarget can not be saved to Octane', hemi.console.WARN);
			return null;
		}

		var names = ['_dispatchId', 'name', 'func', 'args'],
			props = [
				{
					name: 'handler',
					id: this.handler._getId()
				}
			];
		
		for (var i = 0, il = names.length; i < il; ++i) {
			var name = names[i];

			props.push({
				name: name,
				val: this[name]
			});
		}

		return props;
	};

	/**
	 * Clean up the MessageTarget so all references in it are removed.
	 */
	MessageTarget.prototype.cleanup = function() {
		this.handler = null;
	};

	hemi.dispatch.MessageTarget = MessageTarget;
	hemi.makeOctanable(hemi.dispatch.MessageTarget, 'hemi.dispatch.MessageTarget',
		hemi.dispatch.MessageTarget.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

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

		msgSpecs.each(function(key, value) {
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
	 * Check to see what the next id to assign will be without incrementing the Dispatch's nextId
	 * token.
	 * 
	 * @return {number} the next id that will be assigned to a MessageTarget
	 */
	hemi.dispatch.checkNextId = function() {
		return nextId;
	};

	/**
	 * Empty the MessageSpec database of all entries.
	 */
	hemi.dispatch.cleanup = function() {
		msgSpecs.each(function(key, value) {
			value.cleanup();
		});

		msgSpecs.clear();
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
	 * Get any MessageSpecs with the given attributes. If no attributes are given, all MessageSpecs
	 * will be returned. Valid attributes are:
	 * - src
	 * - msg
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be included in the
	 *     search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageSpec[]} an array of MessageSpecs with matching attributes
	 */
	hemi.dispatch.getSpecs = function(attributes, wildcards) {
		var specs;

		if (attributes === undefined) {
			specs = msgSpecs.values();
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

			specs = msgSpecs.query(atts);
		}

		return specs;
	};

	/**
	 * Get the MessageSpec with the given source id and Message type. If wildcards are allowed,
	 * search for wildcard sources and types as well. This is much faster than getSpecs.
	 * 
	 * @param {number} src id of the Message originator to search for
	 * @param {string} type type of Message to search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be included in the
	 *     search results
	 * @return {hemi.dispatch.MessageSpec[]} an array of found MessageSpecs
	 */
	hemi.dispatch.getSpecsFast = function(src, msg, wildcards) {
		var specs = [],
			hash = msg + src,
			spec = msgSpecs.get(hash);

		if (spec !== null) {
			specs.push(spec);
		}

		if (wildcards) {
			var wildSrc = src === hemi.dispatch.WILDCARD;

			if (!wildSrc) {
				hash = msg + hemi.dispatch.WILDCARD;
				spec = msgSpecs.get(hash);
				if (spec !== null) {
					specs.push(spec);
				}
			}
			if (msg !== hemi.dispatch.WILDCARD) {
				hash = hemi.dispatch.WILDCARD + src;
				spec = msgSpecs.get(hash);
				if (spec !== null) {
					specs.push(spec);
				}

				if (!wildSrc) {
					hash = hemi.dispatch.WILDCARD + hemi.dispatch.WILDCARD;
					spec = msgSpecs.get(hash);
					if (spec !== null) {
						specs.push(spec);
					}
				}
			}
		}

		return specs;
	};

	/**
	 * Get any MessageTargets registered with the given attributes. If no attributes are given, all
	 * MessageTargets will be returned. Valid attributes are:
	 * - src
	 * - msg
	 * - dispatchId
	 * - name
	 * - handler
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be included in the
	 *     search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageTarget[]} an array of MessageTargets registered with matching
	 *     attributes
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

		for (var i = 0, il = specs.length; i < il; ++i) {
			var targets = specs[i].targets;

			for (var j = 0, jl = targets.length; j < jl; ++j) {
				var result = targets[j],
					add = true;
				
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
	 * Get the MessageSpec that the given MessageTarget is currently registered with.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to get
	 *     the MessageSpec for
	 * @return {hemi.dispatch.MessageSpec} the found MessageSpec or null
	 */
	hemi.dispatch.getTargetSpec = function(target) {
		var specs = this.getSpecs(),
			dispatchId = target._dispatchId;

		for (var i = 0, il = specs.length; i < il; ++i) {
			var spec = specs[i],
				targets = spec.targets;
			
			for (var j = 0, jl = targets.length; j < jl; ++j) {
				if (targets[j]._dispatchId === dispatchId) {
					return spec;
				}
			}
		}

		return null;
	};

    /**
	 * Load the given MessageSpec entries into the MessageSpec database.
	 * 
	 * @param {hemi.dispatch.MessageSpec[]} entries MessageSpecs to load into the Dispatch
	 */
	hemi.dispatch.loadEntries = function(entries) {
		for (var i = 0, il = entries.length; i < il; ++i) {
			var entry = entries[i];
			msgSpecs.put(entry.getHash(), entry);
		}
	};

	/**
	 * Create a Message from the given attributes and send it to all MessageTargets with matching
	 * source id and message type.
	 * 
	 * @param {hemi.world.Citizen} src the Message originator
	 * @param {string} msg type of Message to send
	 * @param {Object} data container for any and all information relevant to the Message
	 */
	hemi.dispatch.postMessage = function(src, msg, data) {
		var message = new hemi.dispatch.Message(),
			id = src._getId();

		message.src = src;
		message.msg = msg;
		message.data = data;

		var specs = this.getSpecsFast(id, msg, true);

		for (var i = 0, il = specs.length; i < il; ++i) {
			// Make a local copy of the array in case it gets modified while
			// sending the message (such as a MessageHandler unsubscribes itself
			// or another one as part of its handle).
			var targets = specs[i].targets.slice(0);
			
			for (var j = 0, jl = targets.length; j < jl; ++j) {
				var msgTarget = targets[j],
					args, func;
				
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
	 * Setup a MessageTarget with the given attributes and register it to receive Messages.
	 * 
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 * @param {Object} handler either a function that will take the Message as a parameter, or an
	 *     object that will receive it
	 * @param {string} opt_func name of the function to call if handler is an object
	 * @param {string[]} opt_args optional array to specify arguments to pass to opt_func. Otherwise
	 *     the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	hemi.dispatch.registerTarget = function(src, msg, handler, opt_func, opt_args) {
		var spec = createSpec(src, msg),
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
			spec = msgSpecs.remove(specs[i].getHash());
			if (spec) removed.push(spec);
		}

		return removed;
	};

	/**
	 * Remove the given MessageTarget from the dispatch.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to remove
	 * @param {Object} opt_attributes optional structure with MessageSpec attributes to search for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or null
	 */
	hemi.dispatch.removeTarget = function(target, opt_attributes) {
		var specs = this.getSpecs(opt_attributes, false),
			removed = null;

		for (var i = 0, il = specs.length; i < il; ++i) {
			var spec = specs[i];
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
	 * Remove any MessageTargets registered with the given attributes. If no attributes are given,
	 * all MessageTargets will be returned. Valid attributes are:
	 * - src
	 * - msg
	 * - dispatchId
	 * - name
	 * - handler
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be included in the
	 *     search results (only needed if attributes is set)
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

		for (var i = 0, il = specs.length; i < il; ++i) {
			var spec = specs[i],
				targets = spec.targets;

			for (var j = 0, jl = targets.length; j < jl; ++j) {
				var result = targets[j],
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
	 * Set the id for the Dispatch to assign to the next MessageTarget.
	 * 
	 * @param {number} id the next id to assign
	 */
	hemi.dispatch.setNextId = function(id) {
		nextId = id;
	};

	/**
	 * Remove the given MessageTarget from its current MessageSpec and register it with the given
	 * specifications.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to register
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

		spec = createSpec(src, msg);
		spec.addTarget(target);
	};

	/**
	 * Create an array of arguments from the given array of parameter strings. A string starting
	 * with 'id:' indicates the world id for a Citizen to retrieve. A string starting with 'msg:'
	 * indicates a period-delimited string of attributes to parse from within message. Otherwise the
	 * argument is passed through unmodified.
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

		for (var i = 0, il = params.length; i < il; ++i) {
			var param = params[i];

			if (typeof param != 'string') {
				args[i] = param;
			} else if (param.substring(0, 3) === hemi.dispatch.ID_ARG) {
				var id = parseInt(param.substring(3), 10);
				args[i] = hemi.world.getCitizenById(id);
			} else if (param.substring(0, 4) === hemi.dispatch.MSG_ARG) {
				var tokens = param.substring(4).split('.'),
					arg = message;

				for (var j = 0, jl = tokens.length; arg != null && j < jl; ++j) {
					arg = arg[tokens[j]];
				}

				args[i] = arg;
			} else {
				args[i] = param;
			}
		}

		return args;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Wildcard functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	// Anonymous source
	var anon = {
		_getId: function() {
			return hemi.dispatch.WILDCARD;
		}
	};

	/**
	 * Send a Message with the given attributes from an anonymous wildcard source to any registered
	 * MessageTargets.
	 * 
	 * @param {string} type type of Message
	 * @param {Object} data container for any and all information relevant to the Message
	 */
	hemi.send = function(type, data) {
		hemi.dispatch.postMessage(anon, type, data);
	};

	/**
	 * Register the given handler to receive Messages of the specified type from any source. This
	 * creates a MessageTarget.
	 * 
	 * @param {string} type type of Message to handle
	 * @param {Object} handler either a function or an object
	 * @param {string} opt_func name of the function to call if handler is an object
	 * @param {string[]} opt_args optional array of names of arguments to pass to the handler.
	 *     Otherwise the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	hemi.subscribe = function(type, handler, opt_func, opt_args) {
		return hemi.dispatch.registerTarget(hemi.dispatch.WILDCARD, type, handler, opt_func,
			opt_args);
	};

	/**
	 * Remove the given MessageTarget for the specified Message type. Note that this removes a
	 * MessageTarget registered with the wildcard as the source id. It does not remove the
	 * MessageTarget from any Citizens it may be directly registered with.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to remove from the Dispatch
	 * @param {string} opt_type Message type the MessageTarget was registered for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or null
	 */
	hemi.unsubscribe = function(target, opt_type) {
		return hemi.dispatch.removeTarget(target, {
			src: hemi.dispatch.WILDCARD,
			msg: opt_type
		});
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Get the MessageSpec with the given attributes or create one if it does not already exist.
	 * 
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 * @return {hemi.dispatch.MessageSpec} the created/found MessageSpec
	 */
	function createSpec(src, msg) {
		var specs = hemi.dispatch.getSpecsFast(src, msg, false),
			spec;

		if (specs.length === 0) {
			spec = new hemi.dispatch.MessageSpec();
			spec.src = src;
			spec.msg = msg;
			msgSpecs.put(spec.getHash(), spec);
		} else {
			if (specs.length > 1) {
				hemi.console.log('Found ' + specs.length + ' MessageSpecs with the same src and msg.', hemi.console.ERR);
			}

			spec = specs[0];
		}

		return spec;
	}

})();
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

	var mouseDownListeners = [],
		mouseUpListeners = [],
		mouseMoveListeners = [],
		mouseWheelListeners = [],
		keyDownListeners = [],
		keyUpListeners = [],
		keyPressListeners = [];

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @namespace A module for handling all keyboard and mouse input.
	 */
	hemi.input = hemi.input || {};

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
		addListener(mouseDownListeners, listener);
	};

	/**
	 * Register the given listener as a "mouse up" listener.
	 *  
	 * @param {Object} listener an object that implements onMouseUp()
	 */
	hemi.input.addMouseUpListener = function(listener) {
		addListener(mouseUpListeners, listener);
	};

	/**
	 * Register the given listener as a "mouse move" listener.
	 *  
	 * @param {Object} listener an object that implements onMouseMove()
	 */
	hemi.input.addMouseMoveListener = function(listener) {
		addListener(mouseMoveListeners, listener);
	};

	/**
	 * Register the given listener as a "mouse wheel" listener.
	 *  
	 * @param {Object} listener an object that implements onScroll()
	 */
	hemi.input.addMouseWheelListener = function(listener) {
		addListener(mouseWheelListeners, listener);
	};
   
	/**
	 * Register the given listener as a "key down" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyDown()
	 */
    hemi.input.addKeyDownListener = function(listener) {
		addListener(keyDownListeners, listener);
    };

	/**
	 * Register the given listener as a "key up" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyUp()
	 */
    hemi.input.addKeyUpListener = function(listener) {
		addListener(keyUpListeners, listener);
    };

	/**
	 * Register the given listener as a "key press" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyPress()
	 */
    hemi.input.addKeyPressListener = function(listener) {
		addListener(keyPressListeners, listener);
    };

	/**
	 * Remove the given listener from the list of "mouse down" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseDownListener = function(listener) {
		return removeListener(mouseDownListeners, listener);
	};

	/**
	 * Remove the given listener from the list of "mouse up" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseUpListener = function(listener) {
		return removeListener(mouseUpListeners, listener);
	};

	/**
	 * Remove the given listener from the list of "mouse move" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseMoveListener = function(listener) {
		return removeListener(mouseMoveListeners, listener);
	};

	/**
	 * Remove the given listener from the list of "mouse wheel" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseWheelListener = function(listener) {
		return removeListener(mouseWheelListeners, listener);
	};

	/**
	 * Remove the given listener from the list of "key down" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
    hemi.input.removeKeyDownListener = function(listener) {
		return removeListener(keyDownListeners, listener);
    };

	/**
	 * Remove the given listener from the list of "key up" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
    hemi.input.removeKeyUpListener = function(listener) {
		return removeListener(keyUpListeners, listener);
    };

	/**
	 * Remove the given listener from the list of "key press" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
    hemi.input.removeKeyPressListener = function(listener) {
		return removeListener(keyPressListeners, listener);
    };

	/**
	 * Handle the event generated by the user pressing a mouse button down.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "mouse
	 *     down" listeners
	 */
	hemi.input.mouseDown = function(event) {
        var newEvent = getRelativeEvent(event);
		for (var ndx = 0; ndx < mouseDownListeners.length; ndx++) {
			mouseDownListeners[ndx].onMouseDown(newEvent);
		}
	};

	/**
	 * Handle the event generated by the user releasing a pressed mouse button.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "mouse up"
	 *     listeners
	 */
	hemi.input.mouseUp = function(event) {
        var newEvent = getRelativeEvent(event);
		for (var ndx = 0; ndx < mouseUpListeners.length; ndx++) {
			mouseUpListeners[ndx].onMouseUp(newEvent);
		}
	};

	/**
	 * Handle the event generated by the user moving the mouse.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "mouse
	 *     move" listeners
	 */
	hemi.input.mouseMove = function(event) {
        var newEvent = getRelativeEvent(event);
		for (var ndx = 0; ndx < mouseMoveListeners.length; ndx++) {
			mouseMoveListeners[ndx].onMouseMove(newEvent);
		}
	};

	/**
	 * Handle the event generated by the user scrolling a mouse wheel.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "mouse
	 *     wheel" listeners
	 */
	hemi.input.scroll = function(event) {
        var newEvent = getRelativeEvent(event);
        newEvent.deltaY = event.detail ? -event.detail : event.wheelDelta;
        cancelEvent(event);
		for (var ndx = 0; ndx < mouseWheelListeners.length; ndx++) {
			mouseWheelListeners[ndx].onScroll(newEvent);
		}
	};

	/**
	 * Handle the event generated by the user pressing a key down.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "key down"
	 *     listeners
	 */
    hemi.input.keyDown = function(event) {
        for (var ndx = 0; ndx < keyDownListeners.length; ndx++) {
            keyDownListeners[ndx].onKeyDown(event);
        }
    };

	/**
	 * Handle the event generated by the user releasing a pressed key.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "key up"
	 *     listeners
	 */
    hemi.input.keyUp = function(event) {
        for (var ndx = 0; ndx < keyUpListeners.length; ndx++) {
            keyUpListeners[ndx].onKeyUp(event);
        }
    };

	/**
	 * Handle the event generated by the user pressing a key down and releasing it.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "key
	 *     press" listeners
	 */
    hemi.input.keyPress = function(event) {
        for (var ndx = 0; ndx < keyPressListeners.length; ndx++) {
            keyPressListeners[ndx].onKeyPress(event);
        }
    };

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Add the given listener to the given set of listeners.
	 * 
	 * @param {Object[]} listenerSet list to add to
	 * @param {Object} listener object to add
	 */
	function addListener(listenerSet, listener) {
		listenerSet.push(listener);
	}

	/*
	 * Remove the given listener from the given set of listeners.
	 * 
	 * @param {Object[]} listenerSet list to remove from
	 * @param {Object} listener object to remove
	 * @return {Object} the removed listener if successful or null 
	 */
	function removeListener(listenerSet, listener) {
		var ndx = listenerSet.indexOf(listener),
			found = null;

		if (ndx !== -1) {
			found = listenerSet.splice(ndx, 1)[0];
		}

		return found;
	}

	function getRelativeXY(event) {
		var element = event.target ? event.target : event.srcElement,
			xy = {x: 0, y: 0};

		for (var e = element; e; e = e.offsetParent) {
			xy.x += e.offsetLeft;
			xy.y += e.offsetTop;
		}

		xy.x = event.pageX - xy.x;
		xy.y = event.pageY - xy.y;

		return xy;
	}

	function getRelativeEvent(event) {
		var newEvent = hemi.utils.clone(event, false),
			xy = getRelativeXY(newEvent);

		newEvent.x = xy.x;
		newEvent.y = xy.y;

		return newEvent;
	}

	function cancelEvent(event) {
		if (!event) event = window.event;

		event.cancelBubble = true;

		if (event.stopPropagation) event.stopPropagation();
		if (event.preventDefault) event.preventDefault();
	}

})();
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

		// Static helper objects shared by all motions
	var _matrix = new THREE.Matrix4(),
		_vector = new THREE.Vector3();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Contants
////////////////////////////////////////////////////////////////////////////////////////////////////

	hemi.MotionType = {
		ROTATE: 'rotate',
		SCALE: 'scale',
		TRANSLATE: 'translate'
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Shared functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Test if the Rotator/Scalor/Translator should be a render listener or not.
	 */
	function shouldRender() {
		if (!this.enabled ||  (this.accel.isZero() && this.vel.isZero())) {
			hemi.removeRenderListener(this);
		} else {
			hemi.addRenderListener(this);
		}
	}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Rotator class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Rotator makes automated rotation easier by allowing simple calls such as setVel to
	 * begin the automated spinning of a Transform.
	 *
	 * @param {hemi.Transform} opt_tran optional transform that will be rotating
	 * @param {Object} opt_config optional configuration for the Rotator
	 */
	var Rotator = function(opt_tran, opt_config) {
		var cfg = opt_config || {};

		this._transform = null;
		this.accel = cfg.accel || new THREE.Vector3();
		this.angle = cfg.angle || new THREE.Vector3();
		this.vel = cfg.vel || new THREE.Vector3();

		this.time = 0;
		this.stopTime = 0;
		this.steadyRotate = false;
		this.mustComplete = false;
		this.startAngle = this.angle.clone();
		this.stopAngle = this.angle.clone();

		if (opt_tran !== undefined) {
			this.setTransform(opt_tran);
		}

		this.enable();
	};

	/*
	 * Remove all references in the Rotator.
	 */
	Rotator.prototype._clean = function() {
		//TODO
	};

	/*
	 * Array of Hemi Messages that Rotator is known to send.
	 * @type string[]
	 */
	Rotator.prototype._msgSent = [hemi.msg.start, hemi.msg.stop];

	/*
	 * Octane properties for Rotator.
	 * @type string[]
	 */
	Rotator.prototype._octane = ['accel', 'angle', 'vel'];

	/**
	 * Clear properties like acceleration, velocity, etc.
	 */
	Rotator.prototype.clear = function() {
		this.accel.set(0, 0, 0);
		this.angle.set(0, 0, 0);
		this.vel.set(0, 0, 0);
	};

	/**
	 * Disable animation for the Rotator.
	 */
	Rotator.prototype.disable = function() {
		if (this.enabled) {
			hemi.removeRenderListener(this);
			this.enabled = false;
		}
	};

	/**
	 * Enable animation for the Rotator.
	 */
	Rotator.prototype.enable = function() {
		this.enabled = true;
		shouldRender.call(this);
	};

	/**
	 * Perform Newtonian calculations on the rotating object, starting with the angular velocity.
	 *
	 * @param {Object} event the render event
	 */
	Rotator.prototype.onRender = function(event) {
		if (!this._transform) return;

		var t = event.elapsedTime;

		if (this.steadyRotate) {
			this.time += t;

			if (this.time >= this.stopTime) {
				hemi.removeRenderListener(this);
				this.time = this.stopTime;
				this.angle.copy(this.stopAngle);
				this.steadyRotate = this.mustComplete = false;
				this._transform.send(hemi.msg.stop, {});
			} else {
				hemi.utils.lerpVec3(this.startAngle, this.stopAngle, this.time / this.stopTime,
					this.angle);
			}
		} else {
			this.vel.addSelf(_vector.copy(this.accel).multiplyScalar(t));
			this.angle.addSelf(_vector.copy(this.vel).multiplyScalar(t));
		}

		applyRotator.call(this);
	};

	/**
	 * Make the Rotator rotate the specified amount in the specified amount of time.
	 *
	 * @param {THREE.Vector3} theta XYZ amounts to rotate (in radians)
	 * @param {number} time number of seconds for the rotation to take
	 * @param {boolean} opt_mustComplete optional flag indicating that no other rotations can be
	 *     started until this one finishes
	 * @return {boolean} true if the Rotator will start turning, false if it will not
	 */
	Rotator.prototype.turn = function(theta, time, opt_mustComplete) {
		if (!this.enabled || this.mustComplete) return false;

		this.mustComplete = opt_mustComplete || false;
		this.time = 0;
		this.stopTime = time || 0.001;
		this.steadyRotate = true;
		this.startAngle.copy(this.angle);
		this.stopAngle.add(this.angle, theta);
		hemi.addRenderListener(this);
		this._transform.send(hemi.msg.start, {});
		return true;
	};

	/**
	 * Set the angular acceleration.
	 *
	 * @param {THREE.Vector3} acceleration XYZ angular acceleration (in radians)
	 */
	Rotator.prototype.setAcceleration = function(acceleration) {
		this.accel.copy(acceleration);
		shouldRender.call(this);
	};

	/**
	 * Set the current rotation angle.
	 *
	 * @param {THREE.Vector3} theta XYZ rotation angle (in radians)
	 */
	Rotator.prototype.setAngle = function(theta) {
		this.angle.copy(theta);
		applyRotator.call(this);
	};

	/**
	 * Set the given Transform for the Rotator to control rotating.
	 *
	 * @param {hemi.Transform} transform the Transform to rotate
	 */
	Rotator.prototype.setTransform = function(transform) {
		this._transform = transform;

		if (transform.useQuaternion) {
			_matrix.setRotationFromQuaternion(transform.quaternion);
			transform.rotation.setRotationFromMatrix(_matrix);
			transform.useQuaternion = false;
		}

		this.angle.copy(transform.rotation);
	};

	/**
	 * Set the angular velocity.
	 *
	 * @param {THREE.Vector3} velocity XYZ angular velocity (in radians)
	 */
	Rotator.prototype.setVelocity = function(velocity) {
		this.vel.copy(velocity);
		shouldRender.call(this);
	};

// Private functions

	/*
	 * Apply the Rotator's calculated angle to its Transform's rotation.
	 */
	function applyRotator() {
		if (this._transform.useQuaternion) {
			this._transform.useQuaternion = false;
		}

		this._transform.rotation.copy(this.angle);
		this._transform.updateMatrix();
		this._transform.updateMatrixWorld();
	}

	hemi.makeCitizen(Rotator, 'hemi.Rotator', {
		cleanup: Rotator.prototype._clean,
		toOctane: Rotator.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Translator class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Translator provides easy setting of linear velocity and acceleration of Transforms.
	 * 
	 * @param {hemi.Transform} opt_tran optional Transform that will be moving
	 * @param {Object} opt_config optional configuration for the Translator
	 */
	var Translator = function(opt_tran, opt_config) {
		var cfg = opt_config || {};

		this._transform = null;
		this.pos = cfg.pos || new THREE.Vector3();
		this.vel = cfg.vel || new THREE.Vector3();
		this.accel = cfg.accel || new THREE.Vector3();

		this.time = 0;
		this.stopTime = 0;
		this.mustComplete = false;
		this.steadyMove = false;
		this.startPos = this.pos.clone();
		this.stopPos = this.pos.clone();

		if (opt_tran !== undefined) {
			this.setTransform(opt_tran);
		}

		this.enable();
	};

	/*
	 * Remove all references in the Translator.
	 */
	Translator.prototype._clean = function() {
		this.disable();
		this.clearTransforms();
	};

	/*
	 * Array of Hemi Messages that Translator is known to send.
	 * @type string[]
	 */
	Translator.prototype._msgSent = [hemi.msg.start, hemi.msg.stop];

	/*
	 * Octane properties for Translator.
	 * @type string[]
	 */
	Translator.prototype._octane = ['accel', 'pos', 'vel'];

	/**
	 * Clear properties like acceleration, velocity, etc.
	 */
	Translator.prototype.clear = function() {
		this.pos.set(0, 0, 0);
		this.vel.set(0, 0, 0);
		this.accel.set(0, 0, 0);
	};

	/**
	 * Disable animation for the Translator. 
	 */
	Translator.prototype.disable = function() {
		if (this.enabled) {
			hemi.removeRenderListener(this);
			this.enabled = false;
		}
	};

	/**
	 * Enable animation for the Translator. 
	 */
	Translator.prototype.enable = function() {
		this.enabled = true;
		shouldRender.call(this);
	};

	/**
	 * Make the Translator translate the specified amount in the specified amount of time.
	 * 
	 * @param {THREE.Vector3} delta XYZ amount to translate
	 * @param {number} time number of seconds for the translation to take
	 * @param {boolean} opt_mustComplete optional flag indicating that no other translations can be
	 *     started until this one finishes
	 * @return {boolean} true if the Translator will start moving, false if it will not
	 */
	Translator.prototype.move = function(delta, time, opt_mustComplete) {
		if (!this.enabled || this.mustComplete) return false;

		this.mustComplete = opt_mustComplete || false;
		this.time = 0;
		this.stopTime = time || 0.001;
		this.steadyMove = true;
		this.startPos.copy(this.pos);
		this.stopPos.add(this.pos, delta);
		hemi.addRenderListener(this);
		this._transform.send(hemi.msg.start,{});
		return true;
	};

	/**
	 * Calculate the position of the Translator based on the acceleration and velocity.
	 * 
	 * @param {Object} event the render event
	 */
	Translator.prototype.onRender = function(event) {
		if (!this._transform) return;

		var t = event.elapsedTime;

		if (this.steadyMove) {
			this.time += t;

			if (this.time >= this.stopTime) {
				hemi.removeRenderListener(this);
				this.time = this.stopTime;
				this.pos.copy(this.stopPos);
				this.steadyMove = this.mustComplete = false;
				this._transform.send(hemi.msg.stop,{});
			} else {
				hemi.utils.lerpVec3(this.startPos, this.stopPos, this.time / this.stopTime,
					this.pos);
			}
		} else {
			this.vel.addSelf(_vector.copy(this.accel).multiplyScalar(t));
			this.pos.addSelf(_vector.copy(this.vel).multiplyScalar(t));
		}

		applyTranslator.call(this);
	};

	/**
	 * Set the acceleration.
	 * 
	 * @param {THREE.Vector3} acceleration XYZ acceleration vector
	 */
	Translator.prototype.setAcceleration = function(acceleration) {
		this.accel.copy(acceleration);
		shouldRender.call(this);
	};

	/**
	 * Set the position.
	 * 
	 * @param {THREE.Vector3} position XYZ position
	 */
	Translator.prototype.setPosition = function(position) {
		this.pos.copy(position);
		applyTranslator.call(this);
	};

	/**
	 * Set the given Transform for the Translator to control translating.
	 *
	 * @param {hemi.Transform} transform the Transform to translate
	 */
	Translator.prototype.setTransform = function(transform) {
		this._transform = transform;
		this.pos.copy(transform.position);
	};

	/**
	 * Set the velocity.
	 * 
	 * @param {THREE.Vector3} velocity XYZ velocity vector
	 */
	Translator.prototype.setVelocity = function(velocity) {
		this.vel.copy(velocity);
		shouldRender.call(this);
	};

// Private functions

	/*
	 * Apply the Translator's calculated position to its Transform's position.
	 */
	function applyTranslator() {
		this._transform.position.copy(this.pos);
		this._transform.updateMatrix();
		this._transform.updateMatrixWorld();
	}

	hemi.makeCitizen(Translator, 'hemi.Translator', {
		cleanup: Translator.prototype._clean,
		toOctane: Translator.prototype._octane
	});

})();
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

		// Containers for motions and manips to allow them to be reused and save some memory
		// allocation costs.
	var movables = [],
		motions = [],
		resizables = [],
		turnables = [];

	motions[hemi.MotionType.ROTATE] = {
		create: function() { return new hemi.Rotator(); },
		storage: []
	};
	motions[hemi.MotionType.SCALE] = {
		create: function() { return new hemi.Scalor(); },
		storage: []
	};
	motions[hemi.MotionType.TRANSLATE] = {
		create: function() { return new hemi.Translator(); },
		storage: []
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Transform class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Transform performs hierarchical matrix transformations.
	 */
	var Transform = function() {
		THREE.Object3D.call(this);

		/*
		 * The Manipulator that allows the user to control the Transform through mouse interaction.
		 * @type Manipulator
		 */
		this._manip = null;

		/*
		 * A container of any Motions that are currently animating the Transform.
		 * @type Object
		 */
		this._motions = {};

		/**
		 * Flag indicating if the Transform should be pickable by mouse clicks.
		 * @type boolean
		 * @default true
		 */
		this.pickable = true;
		// this.opacity?
	};

	Transform.prototype = new THREE.Object3D();
	Transform.constructor = Transform;

	/*
	 * Remove all references in the Transform.
	 */
	Transform.prototype._clean = function() {
		this.cancelInteraction();
		this.cancelMotion(hemi.MotionType.ROTATE);
		this.cancelMotion(hemi.MotionType.SCALE);
		this.cancelMotion(hemi.MotionType.TRANSLATE);
		this.parent.remove(this);
		
		var children = [].concat(this.children);

		for (var i = 0, il = children.length; i < il; ++i) {
			children[i].cleanup();
		}
	};

	/**
	 * Use the given Object3D to initialize properties.
	 * 
	 * @param {THREE.Object3D} obj Object3D to use to initialize properties
	 * @param {Object} toConvert look-up structure to get the Transform equivalent of an Object3D
	 *     for animations
	 */
	Transform.prototype._init = function(obj, toConvert) {
		var children = this.children;
		// This is important since THREE.KeyFrameAnimation relies on updating a shared reference to
		// the matrix.
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
	};

	/*
	 * Array of Hemi Messages that Transform is known to send.
	 * @type string[]
	 */
	Transform.prototype._msgSent = [hemi.msg.move, hemi.msg.resize, hemi.msg.start, hemi.msg.stop];

	/*
	 * Octane properties for Transform.
	 * @type string[]
	 */
	Transform.prototype._octane = ['name', 'children', 'pickable', 'visible', 'position',
			'rotation', 'quaternion', 'scale', 'useQuaternion'];

	/**
	 * Add the given motion type to the Transform with the given velocity and/or acceleration.
	 * 
	 * @param {hemi.MotionType} type the type of motion to add
	 * @param {THREE.Vector3} opt_velocity optional XYZ velocity to set for the motion
	 * @param {THREE.Vector3} opt_acceleration optional XYZ acceleration to set for the motion
	 */
	Transform.prototype.addMotion = function(type, opt_velocity, opt_acceleration) {
		var motion = this._motions[type];

		if (!motion) {
			motion = getMotion(type);
			motion.setTransform(this);
			this._motions[type] = motion;
		}

		if (motion) {
			if (opt_acceleration !== undefined) {
				motion.setAcceleration(opt_acceleration);
			}
			if (opt_velocity !== undefined) {
				motion.setVelocity(opt_velocity);
			}
		}
	};

	/**
	 * Cancel the current interaction that is enabled for the Transform (movable, resizable or
	 * turnable).
	 */
	Transform.prototype.cancelInteraction = function() {
		if (this._manip) {

			if (this._manip instanceof hemi.Movable) {
				removeMovable(this._manip);
			} else if (this._manip instanceof hemi.Resizable) {
				removeResizable(this._manip);
			} else if (this._manip instanceof hemi.Turnable) {
				removeTurnable(this._manip);
			} else {
				console.log('Unrecognized manip type: ' + this._manip);
			}

			this._manip = null;
		}
	};

	/**
	 * Cancel any motion of the given type that is currently enabled for the Transform.
	 * 
	 * @param {hemi.MotionType} type the type of motion to cancel
	 */
	Transform.prototype.cancelMotion = function(type) {
		var motion = this._motions[type];

		if (motion) {
			removeMotion(motion, type);
			this._motions[type] = undefined;
		}
	};

	/**
	 * Get all of the child Transforms that are under the Transform.
	 *
	 * @param {hemi.Transform[]} opt_arr optional array to place Transforms in
	 * @return {hemi.Transform[]} array of all child/grandchild Transforms
	 */
	Transform.prototype.getAllChildren = function(opt_arr) {
		opt_arr = opt_arr || [];

		for (var i = 0, il = this.children.length; i < il; ++i) {
			var child = this.children[i];
			opt_arr.push(child);
			child.getAllChildren(opt_arr);
		}

		return opt_arr;
	};

	/**
	 * Set all of the Transform's properties to their identity values.
	 */
	Transform.prototype.identity = function() {
		this.position.set(0, 0, 0);
		this.quaternion.set(0, 0, 0, 1);
		this.rotation.set(0, 0, 0);
		this.scale.set(1, 1, 1);
		this.matrix.identity();
		this.updateMatrixWorld();
	};

	/**
	 * Allow the Transform to be moved (translated) through mouse interaction along the given plane.
	 * 
	 * @param {hemi.Plane} plane the 2D plane to enable movement along
	 * @param {number[4]} opt_limits optional array of movement limits within the plane:
	 *     [min on u, max on u, min on v, max on v]
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make movable
	 *     as one group with the Transform
	 */
	Transform.prototype.makeMovable = function(plane, opt_limits, opt_transforms) {
		if (this._manip) {
			removeMovable(this._manip);
		}

		this._manip = getMovable(plane, opt_limits);
		opt_transforms = opt_transforms || [];
		opt_transforms.unshift(this);

		for (var i = 0, il = opt_transforms.length; i < il; ++i) {
			this._manip.addTransform(opt_transforms[i]);
		}
	};

	/**
	 * Allow the Transform to be resized (scaled) through mouse interaction along the given axis.
	 * 
	 * @param {hemi.Axis} axis the axis to enable resizing along
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make resizable
	 *     as one group with the Transform
	 */
	Transform.prototype.makeResizable = function(axis, opt_transforms) {
		if (this._manip) {
			removeResizable(this._manip);
		}

		this._manip = getResizable(axis);
		opt_transforms = opt_transforms || [];
		opt_transforms.unshift(this);

		for (var i = 0, il = opt_transforms.length; i < il; ++i) {
			this._manip.addTransform(opt_transforms[i]);
		}
	};

	/**
	 * Allow the Transform to be turned (rotated) through mouse interaction about the given axis.
	 * 
	 * @param {hemi.Axis} axis the axis to enable turning about
	 * @param {number[2]} opt_limits optional minimum and maximum angle limits (in radians)
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make turnable
	 *     as one group with the Transform
	 */
	Transform.prototype.makeTurnable = function(axis, opt_limits, opt_transforms) {
		if (this._manip) {
			removeTurnable(this._manip);
		}

		this._manip = getTurnable(axis, opt_limits);
		opt_transforms = opt_transforms || [];
		opt_transforms.unshift(this);

		for (var i = 0, il = opt_transforms.length; i < il; ++i) {
			this._manip.addTransform(opt_transforms[i]);
		}
	};

	/**
	 * Animate the Transform moving by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} delta XYZ amount to move the Transform by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this move cannot be interrupted by
	 *     a different move before it finishes
	 * @return {boolean} true if the Transform will start moving, false if it will not
	 */
	Transform.prototype.move = function(delta, time, opt_mustComplete) {
		var type = hemi.MotionType.TRANSLATE,
			motion = this._motions[type];

		if (!motion) {
			motion = getMotion(type);
			motion.setTransform(this);
			this._motions[type] = motion;
		}

		return motion.move(delta, time, opt_mustComplete);
	};

	/**
	 * Animate the Transform resizing by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} scale XYZ amount to scale the Transform by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this resize cannot be interrupted
	 *     by a different resize before it finishes
	 * @return {boolean} true if the Transform will start resizing, false if it will not
	 */
	Transform.prototype.resize = function(scale, time, opt_mustComplete) {
		var type = hemi.MotionType.SCALE,
			motion = this._motions[type];

		if (!motion) {
			motion = getMotion(type);
			motion.setTransform(this);
			this._motions[type] = motion;
		}

		return motion.resize(scale, time, opt_mustComplete);
	};

	/**
	 * Animate the Transform turning by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} delta XYZ amount to turn the Transform by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this turn cannot be interrupted by
	 *     a different turn before it finishes
	 * @return {boolean} true if the Transform will start turning, false if it will not
	 */
	Transform.prototype.turn = function(theta, time, opt_mustComplete) {
		var type = hemi.MotionType.ROTATE,
			motion = this._motions[type];

		if (!motion) {
			motion = getMotion(type);
			motion.setTransform(this);
			this._motions[type] = motion;
		}

		return motion.turn(theta, time, opt_mustComplete);
	};

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

		/*
		 * The Manipulator that allows the user to control the Mesh through mouse interaction.
		 * @type Manipulator
		 */
		this._manip = null;

		/*
		 * A container of any Motions that are currently animating the Mesh.
		 * @type Object
		 */
		this._motions = {};

		/**
		 * Flag indicating if the Mesh should be pickable by mouse clicks.
		 * @type boolean
		 * @default true
		 */
		this.pickable = true;
		// this.opacity?
	};

	Mesh.prototype = new THREE.Mesh();
	Mesh.constructor = Mesh;

	/*
	 * Remove all references in the Mesh.
	 */
	Mesh.prototype._clean = Transform.prototype._clean;

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

		Transform.prototype._init.call(this, obj, toConvert);
	};

	/*
	 * Array of Hemi Messages that Mesh is known to send.
	 * @type string[]
	 */
	Mesh.prototype._msgSent = Transform.prototype._msgSent;

	/*
	 * Octane properties for Mesh.
	 * @type string[]
	 */
	Mesh.prototype._octane = Transform.prototype._octane;

	/**
	 * Add the given motion type to the Mesh with the given velocity and/or acceleration.
	 * 
	 * @param {hemi.MotionType} type the type of motion to add
	 * @param {THREE.Vector3} opt_velocity optional XYZ velocity to set for the motion
	 * @param {THREE.Vector3} opt_acceleration optional XYZ acceleration to set for the motion
	 */
	Mesh.prototype.addMotion = Transform.prototype.addMotion;

	/**
	 * Cancel the current interaction that is enabled for the Mesh (movable, resizable or turnable).
	 */
	Mesh.prototype.cancelInteraction = Transform.prototype.cancelInteraction;

	/**
	 * Cancel any motion of the given type that is currently enabled for the Mesh.
	 * 
	 * @param {hemi.MotionType} type the type of motion to cancel
	 */
	Mesh.prototype.cancelMotion = Transform.prototype.cancelMotion;

	/**
	 * Get all of the child Transforms that are under the Mesh.
	 *
	 * @param {hemi.Transform[]} opt_arr optional array to place Transforms in
	 * @return {hemi.Transform[]} array of all child/grandchild Transforms
	 */
	Mesh.prototype.getAllChildren = Transform.prototype.getAllChildren;

	/**
	 * Set all of the Transform's properties to their identity values.
	 */
	Mesh.prototype.identity = Transform.prototype.identity;

	/**
	 * Allow the Mesh to be moved (translated) through mouse interaction along the given plane.
	 * 
	 * @param {hemi.Plane} plane the 2D plane to enable movement along
	 * @param {number[4]} opt_limits optional array of movement limits within the plane:
	 *     [min on u, max on u, min on v, max on v]
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make movable
	 *     as one group with the Mesh
	 */
	Mesh.prototype.makeMovable = Transform.prototype.makeMovable;

	/**
	 * Allow the Mesh to be resized (scaled) through mouse interaction along the given axis.
	 * 
	 * @param {hemi.Axis} axis the axis to enable resizing along
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make resizable
	 *     as one group with the Mesh
	 */
	Mesh.prototype.makeResizable = Transform.prototype.makeResizable;

	/**
	 * Allow the Mesh to be turned (rotated) through mouse interaction about the given axis.
	 * 
	 * @param {hemi.Axis} axis the axis to enable turning about
	 * @param {number[2]} opt_limits optional minimum and maximum angle limits (in radians)
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make turnable
	 *     as one group with the Mesh
	 */
	Mesh.prototype.makeTurnable = Transform.prototype.makeTurnable;

	/**
	 * Animate the Mesh moving by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} delta XYZ amount to move the Mesh by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this move cannot be interrupted by
	 *     a different move before it finishes
	 * @return {boolean} true if the Mesh will start moving, false if it will not
	 */
	Mesh.prototype.move = Transform.prototype.move;

	/**
	 * Animate the Mesh resizing by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} scale XYZ amount to scale the Mesh by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this resize cannot be interrupted
	 *     by a different resize before it finishes
	 * @return {boolean} true if the Mesh will start resizing, false if it will not
	 */
	Mesh.prototype.resize = Transform.prototype.resize;

	/**
	 * Animate the Mesh turning by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} delta XYZ amount to turn the Mesh by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this turn cannot be interrupted by
	 *     a different turn before it finishes
	 * @return {boolean} true if the Mesh will start turning, false if it will not
	 */
	Mesh.prototype.turn = Transform.prototype.turn;

	hemi.makeCitizen(Mesh, 'hemi.Mesh', {
		cleanup: Mesh.prototype._clean,
		toOctane: Mesh.prototype._octane
	});

// No extra functionality, but these are useful as Citizens/Octanable.

	hemi.makeCitizen(THREE.Scene, 'hemi.Scene');
	hemi.makeOctanable(THREE.Vector3, 'THREE.Vector3', ['x', 'y', 'z']);
	hemi.makeOctanable(THREE.Quaternion, 'THREE.Quaternion', ['x', 'y', 'z', 'w']);

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Get a motion object of the given type. This may be a newly constructed one or a cached one
	 * that was no longer being used.
	 * 
	 * @param {hemi.MotionType} type the type of motion to get
	 * @return {Motion} the newly constructed or cached motion object
	 */
	function getMotion(type) {
		var obj = motions[type],
			motion;

		if (obj) {
			motion = obj.storage.length > 0 ? obj.storage.pop() : obj.create();
		} else {
			console.log('Unrecognized motion type: ' + type);
		}

		return motion;
	}

	/*
	 * Get a Movable of the given type. This may be a newly constructed one or a cached one that was
	 * no longer being used.
	 * 
	 * @param {hemi.Plane} plane the 2D plane to enable movement along
	 * @param {number[4]} opt_limits optional array of movement limits within the plane:
	 *     [min on u, max on u, min on v, max on v]
	 * @return {hemi.Movable} the newly constructed or cached Movable
	 */
	function getMovable(plane, opt_limits) {
		var movable;

		if (movables.length > 0) {
			movable = movables.pop();
			movable.setPlane(plane);
			movable.enable();
		} else {
			movable = new hemi.Movable(plane);
		}

		if (opt_limits !== undefined) {
			movable.setLimits(opt_limits);
		}

		return movable;
	}

	/*
	 * Get a Resizable of the given type. This may be a newly constructed one or a cached one that
	 * was no longer being used.
	 * 
	 * @param {hemi.Axis} axis the axis to enable resizing along
	 * @return {hemi.Resizable} the newly constructed or cached Resizable
	 */
	function getResizable(axis) {
		var resizable;

		if (resizables.length > 0) {
			resizable = resizables.pop();
			resizable.setAxis(axis);
			resizable.enable();
		} else {
			resizable = new hemi.Resizable(axis);
		}

		return resizable;
	}

	/*
	 * Get a Turnable of the given type. This may be a newly constructed one or a cached one that
	 * was no longer being used.
	 * 
	 * @param {hemi.Axis} axis the axis to enable turning about
	 * @param {number[2]} opt_limits optional minimum and maximum angle limits (in radians)
	 * @return {hemi.Turnable} the newly constructed or cached Turnable
	 */
	function getTurnable(axis, opt_limits) {
		var turnable;

		if (turnables.length > 0) {
			turnable = turnables.pop();
			turnable.setAxis(axis);
			turnable.enable();
		} else {
			turnable = new hemi.Turnable(axis);
		}

		if (opt_limits !== undefined) {
			turnable.setLimits(opt_limits);
		}

		return turnable;
	}

	/*
	 * Clear the given motion object of its attributes and cache it for future use (unless the cache
	 * is full).
	 * 
	 * @param {Motion} motion the motion object to clear and cache
	 * @param {hemi.MotionType} type the type of motion
	 */
	function removeMotion(motion, type) {
		var obj = motions[type];
		motion.clear();

		if (obj) {
			obj.storage.length > 10 ? motion.cleanup() : obj.storage.push(motion);
		} else {
			console.log('Unrecognized motion type: ' + type);
		}
	}

	/*
	 * Clear the given Movable of its attributes and cache it for future use (unless the cache is
	 * full).
	 * 
	 * @param {hemi.Movable} movable the movable to clear and cache
	 */
	function removeMovable(movable) {
		movable.clear();
		movables.length > 10 ? movable.cleanup() : movables.push(movable);
	}

	/*
	 * Clear the given Resizable of its attributes and cache it for future use (unless the cache is
	 * full).
	 * 
	 * @param {hemi.Resizable} resizable the resizable to clear and cache
	 */
	function removeResizable(resizable) {
		resizable.clear();
		resizables.length > 10 ? resizable.cleanup() : resizables.push(resizable);
	}

	/*
	 * Clear the given Turnable of its attributes and cache it for future use (unless the cache is
	 * full).
	 * 
	 * @param {hemi.Turnable} turnable the turnable to clear and cache
	 */
	function removeTurnable(turnable) {
		turnable.clear();
		turnables.length > 10 ? turnable.cleanup() : turnables.push(turnable);
	}

})();
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

		// Default values for Camera control, etc
	var FAR_PLANE = 10000,
		FOV = 0.707107,
		MAX_FOV = Math.PI / 3,
		MAX_TILT = Math.PI / 2.001,
		MIN_FOV = 0.05,
		MIN_TILT = -Math.PI / 2.001,
		MOUSE_DELTA = 0.0015,
		MOUSE_SPEED = 0.005,
		NEAR_PLANE = 1,
		SCROLL_UP = 13/12,
		SCROLL_DOWN = 11/12,
		TRUCK_SPEED = 0.02,
		// Static helper objects shared by all Cameras
		_vector1 = new THREE.Vector3(),
		_vector2 = new THREE.Vector3();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Camera class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Camera controls the point of view and perspective when viewing a  3D scene.
	 */
	var Camera = function() {
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
		this.tiltMax = MAX_TILT;
		this.tiltMin = MIN_TILT;

		this.fov = {
			current: FOV,
			min: MIN_FOV,
			max: MAX_FOV
		};
		this.lookLimits = {
			panMax: null,
			panMin: null,
			tiltMax: null,
			tiltMin: null
		};
		this.mode = {
			scroll: true,
			scan: true,
			fixed: false,
			control: false,
			projection: null
		};	
		this.state = {
			moving: false,
			curve: null,
			time: { current: 0.0, end: 0.0 },
			mouse: false,
			xy: { current: [-1,-1], last: [-1,-1] },
			shift: false,
			update: false,
			vp: null
		};

		this.threeCamera = new THREE.PerspectiveCamera(this.fov.current * hemi.RAD_TO_DEG,
			window.innerWidth / window.innerHeight, NEAR_PLANE, FAR_PLANE);

		/**
		 * A light that moves with the Camera and is always pointing where the Camera is pointing.
		 * @type THREE.PointLight
		 */
		this.light = new THREE.PointLight(0xffffff, 1.35);

		// Use shared reference to guarantee the camera light follows the Camera.
		this.light.position = this.threeCamera.position;
		this.light.rotation = this.threeCamera.rotation;
		this.light.scale = this.threeCamera.scale;

		var tween = hemi.utils.penner.linearTween;
		this.easeFunc = [tween,tween,tween];
		updateCamera.call(this);

		hemi.addRenderListener(this);
	};

	/*
	 * Remove all references in the Camera.
	 */
	Camera.prototype._clean = function() {
		hemi.removeRenderListener(this);
		this.disableControl();
		this.light = null;
		this.threeCamera = null;
	};

	/*
	 * Array of Hemi Messages that Camera is known to send.
	 * @type string[]
	 */
	Camera.prototype._msgSent = [hemi.msg.start, hemi.msg.stop];

	/*
	 * Octane properties for Camera.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Camera.prototype._octane = function() {
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
	};

	/**
	 * Disable control of the Camera through the mouse and keyboard.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.disableControl = function() {
		if (this.mode.control) {
			hemi.input.removeMouseDownListener(this);
			hemi.input.removeMouseUpListener(this);
			hemi.input.removeMouseMoveListener(this);
			hemi.input.removeMouseWheelListener(this);
			hemi.input.removeKeyDownListener(this);
			hemi.input.removeKeyUpListener(this);	
			this.mode.control = false;
			this.state.mouse = false;
		}

		return this;
	};

	/**
	 * Disable the shiftkey scanning.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.disableScan = function() {
		this.mode.scan = false;
		return this;
	};

	/**
	 * Disable the scroll wheel zooming.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.disableZoom = function() {
		this.mode.scroll = false;
		return this;
	};

	/**
	 * Enable control of the Camera through the mouse and keyboard.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.enableControl = function(element) {
		if (!this.mode.control) {
			hemi.input.addMouseDownListener(this);
			hemi.input.addMouseUpListener(this);
			hemi.input.addMouseMoveListener(this);
			hemi.input.addMouseWheelListener(this);
			hemi.input.addKeyDownListener(this);
			hemi.input.addKeyUpListener(this);
			this.mode.control = true;
		}

		return this;
	};

	/**
	 * Enable the shiftkey dragging.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.enableScan = function() {
		this.mode.scan = true;
		return this;
	};

	/**
	 * Enable the camera to zoom with the mouse scroll.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.enableZoom = function() {
		this.mode.scroll = true;
		return this;
	};

	/**
	 * Fix the camera to its current spot, and use mouse movements to look around.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.fixEye = function() {
		this.mode.fixed = true;
		updateCamera.call(this);
		return this;
	};

	/**
	 * Allow the camera to rotate about a fixed target. This is the default mode.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.freeEye = function() {
		this.setEyeTarget(this.getEye(_vector1), this.getTarget(_vector2));
		this.mode.fixed = false;
		updateCamera.call(this);
		return this;
	};

	/**
	 * Get the current position of the Camera eye.
	 * 
	 * @param {THREE.Vector3} opt_vec optional vector to receive eye position
	 * @return {THREE.Vector3} XYZ coordinates of the eye
	 */
	Camera.prototype.getEye = function(opt_vec) {
		var eye;

		if (opt_vec) {
			opt_vec.copy(this.cam.matrixWorld.getPosition());
			eye = opt_vec;
		} else {
			eye = this.cam.matrixWorld.getPosition().clone();
		}

		return eye;
	};

	/**
	 * Get the current position of the Camera target.
	 * 
	 * @param {THREE.Vector3} opt_vec optional vector to receive target position
	 * @return {THREE.Vector3} XYZ coordinates of the target
	 */
	Camera.prototype.getTarget = function(opt_vec) {
		var tgt;

		if (this.mode.fixed) {
			// Create a target vector that is transformed by cam's matrix but adds a negative Z
			// translation of "distance" length
			tgt = opt_vec ? opt_vec.set(0, 0, 1) : new THREE.Vector3(0, 0, 1);
			this.cam.matrixWorld.rotateAxis(tgt).multiplyScalar(-this.distance);
			tgt.addSelf(this.cam.matrixWorld.getPosition());
		} else {
			if (opt_vec) {
				opt_vec.copy(this.panTilt.matrixWorld.getPosition());
				tgt = opt_vec;
			} else {
				tgt = this.panTilt.matrixWorld.getPosition().clone();
			}
		}

		return tgt;
	};

	/**
	 * Move the Camera along the specified curve.
	 *
	 * @param {hemi.CameraCurve} curve curve for the Camera eye and target to follow
	 * @param {number} opt_time the number of seconds for the Camera to take to move alon gthe curve
	 *     (0 is instant)
	 */
	Camera.prototype.moveOnCurve = function(curve, opt_time) {
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
		this.state.time.end = (opt_time === null) ? 1.0 : (opt_time > 0) ? opt_time : 0.001;
		this.state.time.current = 0.0;
		this.send(hemi.msg.start, { viewdata: this.vd.current });
	};

	/**
	 * Move the Camera to the given Viewpoint.
	 *
	 * @param {hemi.Viewpoint} view Viewpoint to move to
	 * @param {number} opt_time the number of seconds for the Camera to take to move to the
	 *     Viewpoint (0 is instant)
	 */
	Camera.prototype.moveToView = function(view, opt_time) {
		var t = (opt_time === undefined) ? 1.0 : opt_time,
			pkg;

		if (view.getData !== undefined) {
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
	};

	/**
	 * Keyboard key-down listener.
	 *
	 * @param {Object} keyEvent key down event
	 */
	Camera.prototype.onKeyDown = function(keyEvent) {
		this.state.shift = (keyEvent.keyCode === 16);
	};

	/**
	 * Keyboard key-up listener.
	 *
	 * @param {Object} keyEvent key up event
	 */
	Camera.prototype.onKeyUp = function(keyEvent) {
		if (keyEvent.keyCode === 16) this.state.shift = false;
	};

	/**
	 * Mouse-down listener - set parameters to reflect that fact.
	 *
	 * @param {Object} mouseEvent mouse down event
	 */
	Camera.prototype.onMouseDown = function(mouseEvent) {
		this.state.mouse = true;
		this.state.xy.current[0] = this.state.xy.last[0] = mouseEvent.x;
		this.state.xy.current[1] = this.state.xy.last[1] = mouseEvent.y;
	};

	/**
	 * Mouse-move listener - move the camera if the mouse is down.
	 *
	 * @param {Object} mouseEvent mouse move event
	 */
	Camera.prototype.onMouseMove = function(mouseEvent) {
		if (this.state.mouse) {
			this.state.xy.last[0] = this.state.xy.current[0];
			this.state.xy.last[1] = this.state.xy.current[1];
			this.state.xy.current[0] = mouseEvent.x;
			this.state.xy.current[1] = mouseEvent.y;

			var xMovement = this.state.xy.current[0] - this.state.xy.last[0],
				yMovement = this.state.xy.current[1] - this.state.xy.last[1];

			if (this.mode.projection) {
				moveOrthographic.call(this, xMovement, yMovement);
			} else {
				movePerspective.call(this, xMovement, yMovement);
			}
		}
	};

	/**
	 * Mouse-up listener.
	 *
	 * @param {Object} mouseEvent mouse up event
	 */
	Camera.prototype.onMouseUp = function(mouseEvent) {
		this.state.mouse = false;
	};

	/**
	 * Render listener - check mouse and camera parameters and decide if the Camera needs to be
	 * updated.
	 *
	 * @param {Object} renderEvent render event
	 */
	Camera.prototype.onRender = function(renderEvent) {
		var state = this.state,
			xy = state.xy;	
		
		if ((state.mouse && (xy.current[0] !== xy.last[0] || xy.current[1] !== xy.last[1])) ||
			state.moving || state.update) {
			updateCamera.call(this, renderEvent.elapsedTime);
		}

		state.update = false;
	};

	/**
	 * Mouse-scroll listener - zoom the camera in or out.
	 *
	 * @param {Object} mouseEvent mouse wheel event
	 */
	Camera.prototype.onScroll = function(mouseEvent) {
		if (!this.mode.scroll) return;

		if (this.state.shift) {
			var dis = this.distance * TRUCK_SPEED,
				dir = (mouseEvent.deltaY > 0) ? 1 : -1;

			this.truck(dis * dir);
		} else {
			if (this.mode.fixed) {
				var breakpoint = (this.fov.max + this.fov.min) / 2;

				if (mouseEvent.deltaY > 0) {
					if (this.fov.current < breakpoint) {
						this.fov.current = this.fov.min + (this.fov.current - this.fov.min) * SCROLL_DOWN;
					} else {
						this.fov.current = this.fov.max - (this.fov.max - this.fov.current) * SCROLL_UP;
					}
				} else {
					if (this.fov.current < breakpoint) {
						this.fov.current = this.fov.min + (this.fov.current - this.fov.min) * SCROLL_UP;
					} else {
						this.fov.current = this.fov.max - (this.fov.max - this.fov.current) * SCROLL_DOWN;
					}
				}

				this.threeCamera.fov = this.fov.current * hemi.RAD_TO_DEG;
				this.threeCamera.updateProjectionMatrix();
				this.state.update = true;
			} else {
				var t = (mouseEvent.deltaY > 0) ? SCROLL_DOWN : SCROLL_UP;
				this.distance = hemi.utils.lerp(0, this.distance, t);

				if (!this.mode.projection) {
					this.cam.position.z = this.distance;
					this.cam.updateMatrix();
				}

				this.state.update = true;
			}
		}
	};

	/**
	 * Orbit the Camera about the target point it is currently looking at.
	 * 
	 * @param {number} pan amount to pan around by (in radians)
	 * @param {number} tilt amount to tilt up and down by (in radians)
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.orbit = function(pan, tilt) {
		if (tilt === undefined) tilt = 0;

		var newTilt = this.panTilt.rotation.x + tilt;

		this.panTilt.rotation.y += pan;
		this.panTilt.rotation.x = hemi.utils.clamp(newTilt, this.tiltMin, this.tiltMax);
		this.panTilt.updateMatrix();
		updateCamera.call(this);
		return this;
	};

	/**
	 * Rotate the Camera in place so that it looks in a new direction. Note that this has no effect
	 * if the Camera is not in fixed-eye mode.
	 * 
	 * @param {number} pan amount to pan (in radians)
	 * @param {number} tilt amount to tilt (in radians)
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.rotate = function(pan, tilt) {
		if (tilt === undefined) tilt = 0;

		var ll = this.lookLimits,
			newPan = this.cam.rotation.y + pan,
			newTilt = this.cam.rotation.x + tilt;

		if (ll.panMin !== null && newPan < ll.panMin) {
			this.cam.rotation.y = ll.panMin;
		} else if (ll.panMax !== null && newPan > ll.panMax) {
			this.cam.rotation.y = ll.panMax;
		} else {
			this.cam.rotation.y = newPan;
		}

		if (ll.tiltMin !== null && newTilt < ll.tiltMin) {
			this.cam.rotation.x = ll.tiltMin;
		} else if (ll.tiltMax !== null && newTilt > ll.tiltMax) {
			this.cam.rotation.x = ll.tiltMax;
		} else {
			this.cam.rotation.x = newTilt;
		}

        this.cam.updateMatrix();
		updateCamera.call(this);
		return this;
	};

	/**
	 * Set the limits on the Camera pan and tilt in fixed eye mode.
	 * 
	 * @param {number} panMin minimum pan angle (in radians)
	 * @param {number} panMax maximum pan angle (in radians)
	 * @param {number} tiltMin minimum tilt angle (in radians)
	 * @param {number} tiltMax maximum tilt angle (in radians)
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.setLookAroundLimits = function(panMin, panMax, tiltMin, tiltMax) {
		this.lookLimits.panMax = panMax;
		this.lookLimits.panMin = panMin;
		this.lookLimits.tiltMax = tiltMax;
		this.lookLimits.tiltMin = tiltMin;
		return this;
	};

	/**
	 * Set the function used to ease the Camera in and out of moves.
	 *
	 * @param {function[]} easeFunc array of three functions which will be used for easing on the X,
	 *     Y, and Z axes
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.setEasing = function(easeFunc) {
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
	};

	/**
	 * Set the eye and target of the Camera. 
	 *
	 * @param {THREE.Vector3} eye XYZ position of camera eye
	 * @param {THREE.Vector3} target XYZ position of camera target
	 */
	Camera.prototype.setEyeTarget = function(eye, target) {
		var offset = [eye.x - target.x, eye.y - target.y, eye.z -target.z],
			rtp = hemi.utils.cartesianToSpherical(offset);

		this.distance = rtp[0];

		this.panTilt.position.copy(target);
        this.panTilt.rotation.y = rtp[2];
        this.panTilt.rotation.x = rtp[1] - hemi.HALF_PI;
        this.panTilt.updateMatrix();

		this.cam.rotation.y = 0;
		this.cam.rotation.x = 0;
		this.cam.position.z = this.distance;
        this.cam.updateMatrix();

		_vector1.set(0, 0, this.distance);
		hemi.utils.pointAsLocal(this.cam, _vector2.copy(target));
		hemi.utils.pointZAt(this.cam, _vector1, _vector2);
		this.cam.rotation.y += Math.PI;
		this.cam.updateMatrix();

        this.updateWorldMatrices();
	};

	/**
	 * Set the color of the Camera's light source.
	 * 
	 * @param {number[3]} rgb rgb value of the color
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.setLightColor = function(rgb) {
		this.light.color.setRGB(rgb[0], rgb[1], rgb[2]);
		return this;
	};

	/**
	 * Set the Camera view to render with an orthographic projection.
	 * 
	 * @param {hemi.Plane} plane the plane to look at orthographically (xy, xz, or yz)
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.setOrthographic = function(plane) {
		this.mode.projection = plane;
		return this;
	};

	/**
	 * Set the Camera view to render with a perspective projection.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.setPerspective = function() {
		this.mode.projection = null;
		return this;
	};

	/**
	 * Set the zooming limits in fixed-eye mode.
	 *
	 * @param {number} min zoom-in limit (in radians)
	 * @param {number} max zoom-out limit (in radians)
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.setZoomLimits = function(min, max) {
		this.fov.min = min;
		this.fov.max = max;

		if (this.fov.current > this.fov.max) {
			this.fov.current = this.fov.max;
		}
		if (this.fov.current < this.fov.min) {
			this.fov.current = this.fov.min;
		}

		return this;
	};

	/**
	 * Move the Camera towards or away from its current target point by the given distance.
	 * 
	 * @param {number} distance the distance to move the Camera
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.truck = function(distance) {
		this.panTilt.translateZ(-distance);
        this.panTilt.updateMatrix();
        updateCamera.call(this);
		return this;
	};

	/**
	 * Recursively update all world matrices of the Camera's transforms.
	 */
    Camera.prototype.updateWorldMatrices = function() {
        this.panTilt.updateMatrixWorld(true);
    };

// Private functions for Camera

	/*
	 * Set up the Camera to interpolate between the two given time values.
	 * 
	 * @param {number} current current time
	 * @param {number} end end time
	 */
	function interpolateView(current, end) {
		var last = this.vd.last,
			cur = this.vd.current,
			upProj = false,
			eye, target;

		if (this.state.curve) {
			var t = this.easeFunc[0](current, 0, 1, end);
			eye = this.state.curve.eye.interpolate(t);
			target = this.state.curve.target.interpolate(t);
		} else {
			eye = _vector1;
			target = _vector2;
			eye.x = this.easeFunc[0](current, last.eye.x, cur.eye.x - last.eye.x, end);
			eye.y = this.easeFunc[1](current, last.eye.y, cur.eye.y - last.eye.y, end);
			eye.z = this.easeFunc[2](current, last.eye.z, cur.eye.z - last.eye.z, end);
			target.x = this.easeFunc[0](current, last.target.x, cur.target.x - last.target.x, end);
			target.y = this.easeFunc[1](current, last.target.y, cur.target.y - last.target.y, end);
			target.z = this.easeFunc[2](current, last.target.z ,cur.target.z - last.target.z,end);
		}
		if (cur.fov !== last.fov) {
			this.fov.current = this.easeFunc[0](current, last.fov, cur.fov - last.fov, end);
			this.threeCamera.fov = this.fov.current * hemi.RAD_TO_DEG;
			upProj = true;
		}
		if (cur.np !== last.np) {
			this.threeCamera.near = this.easeFunc[0](current, last.np, cur.np - last.np, end);
			upProj = true;
		}
		if (cur.fp !== last.fp) {
			this.threeCamera.far = this.easeFunc[0](current, last.fp, cur.fp - last.fp, end);
			upProj = true;
		}
		if (upProj) {
			this.threeCamera.updateProjectionMatrix();
		}

		this.setEyeTarget(eye, target);
	}

	/*
	 * Move the Camera when the Camera is in orthographic viewing mode.
	 *
	 * @param {number} xMovement the mouse movement in pixels along the x-axis
	 * @param {number} yMovement the mouse movement in pixels along the y-axis
	 */
	function moveOrthographic(xMovement, yMovement) {
		var distFactor = 2 * this.distance / hemi.core.client.width,
			xDis = xMovement * distFactor,
			yDis = yMovement * distFactor;

		switch(this.mode.projection) {
			case hemi.Plane.XY:
			case hemi.Plane.YZ:
				this.panTilt.translateX(-xDis);
                this.panTilt.translateY(yDis);
                this.panTilt.updateMatrix();
				break;
			case hemi.Plane.XZ:
			    this.panTilt.translateX(xDis);
                this.panTilt.translateZ(yDis);
                this.panTilt.updateMatrix();
				break;
		}
	}

	/*
	 * Move the Camera when the Camera is in perspective viewing mode.
	 *
	 * @param {number} xMovement the mouse movement in pixels along the x-axis
	 * @param {number} yMovement the mouse movement in pixels along the y-axis
	 */		
	function movePerspective(xMovement, yMovement) {
		if (this.state.shift && this.mode.scan) {
			var deltaX = MOUSE_DELTA * this.distance * xMovement,
				deltaY = MOUSE_DELTA * this.distance * yMovement;

			this.panTilt.translateX(-deltaX);
			this.panTilt.translateY(deltaY);
            this.panTilt.updateMatrix();
			updateCamera.call(this);
		} else {
			if (this.mode.fixed) {
				this.rotate(-xMovement * MOUSE_SPEED, -yMovement * MOUSE_SPEED);
			} else {
				this.orbit(-xMovement * MOUSE_SPEED, -yMovement * MOUSE_SPEED);
			}		
		}
	}

	/*
	 * Update the Camera.
	 * 
	 * @param {number} opt_delta optional time delta to upate for
	 */
	function updateCamera(opt_delta) {
		var time = this.state.time;

		if (this.state.moving) {
			interpolateView.call(this, time.current,time.end);

			if (opt_delta !== undefined) {
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

				time.current += opt_delta;

				if (time.current >= time.end) {
					time.current = time.end;
				}				
			}
		}

		this.updateWorldMatrices();
		this.getEye(this.threeCamera.position);
		this.getTarget(_vector1);

		this.threeCamera.updateMatrix();
		this.threeCamera.updateMatrixWorld(true);
		this.threeCamera.lookAt(_vector1);
		this.light.updateMatrix();
	}

	hemi.makeCitizen(Camera, 'hemi.Camera', {
		cleanup: Camera.prototype._clean,
		toOctane: Camera.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// CameraCurve class
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * @class A CameraCurve contains an "eye" Curve and a "target" Curve that allow a Camera to
	 * follow a smooth path through several waypoints.
	 * 
	 * @param {hemi.Curve} eye Curve for camera eye to follow
	 * @param {hemi.Curve} target Curve for camera target to follow
	 */
	var CameraCurve = function(eye, target) {
		this.eye = eye;
		this.target = target;
	};

	/*
	 * Remove all references in the CameraCurve.
	 */
	CameraCurve.prototype._clean = function() {
		this.eye = null;
		this.target = null;
	};

	/*
	 * Octane properties for CameraCurve.
	 * @type string[]
	 */
	CameraCurve.prototype._octane = ['eye', 'target'];

	hemi.makeCitizen(CameraCurve, 'hemi.CameraCurve', {
		cleanup: CameraCurve.prototype._clean,
		toOctane: CameraCurve.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// ViewData class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A ViewData is a light-weight, non-Citizen form of a Viewpoint.
	 */
	hemi.ViewData = function(config) {
		var cfg = config || {};
		this.eye = cfg.eye || new THREE.Vector3(0, 0, -1);
		this.target = cfg.target || new THREE.Vector3(0, 0, 0);
		this.fov = cfg.fov || FOV;
		this.np = cfg.np || NEAR_PLANE;
		this.fp = cfg.fp || FAR_PLANE;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Viewpoint class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Viewpoint describes everything needed for a view - eye, target, field of view, near
	 * plane, and far plane.
	 */
	var Viewpoint = function(config) {
		var cfg = config || {};
		this.name = cfg.name || '';
		this.eye = cfg.eye || new THREE.Vector3(0, 0, -1);
		this.target = cfg.target || new THREE.Vector3(0, 0, 0);
		this.fov = cfg.fov || FOV;
		this.np = cfg.np || NEAR_PLANE;
		this.fp = cfg.fp || FAR_PLANE;
	};

	/*
	 * Remove all references in the Viewpoint.
	 */
	Viewpoint.prototype._clean = function() {
		this.eye = null;
		this.target = null;
	};

	/*
	 * Octane properties for Viewpoint.
	 * @type string[]
	 */
	Viewpoint.prototype._octane = ['eye', 'target', 'fov', 'np', 'fp'];

	/**
	 * Get the data contained within the Viewpoint.
	 *
	 * @return {hemi.ViewData} the ViewData for the Viewpoint
	 */
	Viewpoint.prototype.getData = function() {
		return new hemi.ViewData(this);
	};

	/**
	 * Set the data for the Viewpoint.
	 *
	 * @param {hemi.ViewData} viewData data to set for the Viewpoint
	 */
	Viewpoint.prototype.setData = function(viewData) {
		this.eye = viewData.eye;
		this.target = viewData.target;
		this.fov = viewData.fov;
		this.np = viewData.np;
		this.fp = viewData.fp;
	};

	hemi.makeCitizen(Viewpoint, 'hemi.Viewpoint', {
		cleanup: Viewpoint.prototype._clean,
		toOctane: Viewpoint.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

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
	 * Create a new Viewpoint with the given name and the given Camera's current viewing parameters.
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

})();
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Model class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Model represents a hierarchical set of transforms, geometry, and animations that
	 * make up a 3D object.
	 * 
	 * @param {hemi.Client} client the Client that will render the Model
	 */
	var Model = function(client) {
		/*
		 * The name of the file to load the Model's assets from.
		 * @type string
		 */
		this._fileName = null;
		/*
		 * Flag indicating if the Model's assets are loaded.
		 * @type boolean
		 * @default false
		 */
		this._loaded = false;

		/**
		 * Array of KeyFrameAnimations that the Model contains.
		 * @type THREE.KeyFrameAnimation[]
		 */
		this.animations = [];
		/**
		 * Flag indicating if the Model should load its assets when its file name is set.
		 * @type boolean
		 * @default true
		 */
		this.autoLoad = true;
		/**
		 * The Client that the Model is being rendered by.
		 * @type hemi.Client
		 */
		this.client = client;
		/**
		 * Array of Geometries that the Model contains.
		 * @type THREE.Geometry[]
		 */
		this.geometries = [];
		/**
		 * Array of Materials that the Model contains.
		 * @type THREE.Material[]
		 */
		this.materials = [];
		/**
		 * The root Transform of the Model
		 * @type hemi.Transform
		 */
		this.root = null;
	};

	/*
	 * Remove all references in the Model.
	 */
	Model.prototype._clean = function() {
		this.unload();
		this.client = null;
	};

	/*
	 * Array of Hemi Messages that Model is known to send.
	 * @type string[]
	 */
	Model.prototype._msgSent = [hemi.msg.load, hemi.msg.unload];

	/*
	 * Octane properties for Model.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Model.prototype._octane = function() {
		var names = ['autoLoad', 'client', 'root'],
			props = [];

		for (var i = 0, il = names.length; i < il; ++i) {
			var name = names[i];

			props.push({
				name: name,
				val: this[name]
			});
		}

		props.push({
			name: 'setFileName',
			arg: [this._fileName]
		});

		return props;
	};

	/**
	 * Get any Transforms with the given name in the Model.
	 * 
	 * @return {hemi.Transform[]} array of matching Transforms
	 */
	Model.prototype.getTransforms = function(name) {
		var trans = [];
		getTransformsRecursive(name, this.root, trans);
		return trans;
	};

	/**
	 * Load the Model's assets from its file.
	 * 
	 * @param {Object} opt_collada optional cached object constructed by the ColladaLoader that can
	 *     be used to construct a new Model without loading and parsing the asset file
	 */
	Model.prototype.load = function(opt_collada) {
		if (this._loaded) this.unload();

		var that = this,
			onCollada = function (collada) {
				var animHandler = THREE.AnimationHandler,
					animations = collada.animations,
					toConvert = {};

				that._loaded = true;

				for (var i = 0, il = animations.length; i < il; ++i) {
					var node = animations[i].node;
					toConvert[node.id] = node;
				}

				if (that.root === null) {
					that.root = convertObject3Ds.call(that, collada.scene, toConvert);
				} else {
					that.root._init(collada.scene, toConvert);
				}

				that.client.scene.add(that.root);

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
			};

		if (opt_collada) {
			onCollada(opt_collada);
		} else {
			hemi.loadCollada(this._fileName, onCollada); 
		}
	};

	/**
	 * Set the given file name as the Model's file to load. If the autoLoad flag is set, load the
	 * Model now.
	 * 
	 * @param {string} the name of the file to load (relative to hemi.loadPath)
	 */
	Model.prototype.setFileName = function(fileName) {
		this._fileName = fileName;

		if (this.autoLoad) this.load();
	};

	/**
	 * Unload all of the Model's loaded transforms, geometries, etc.
	 */
	Model.prototype.unload = function() {
		this.send(hemi.msg.unload, {
			root: this.root
		});

		if (this.root) {
			this.root.cleanup();
			this.root = null;
		}


		this._loaded = false;
		this.animations = [];
		this.geometries = [];
		this.materials = [];
	};

// Private functions for Model

	/*
	 * Convert the loaded THREE.Object3Ds to hemi.Transforms so that they can be Citizens.
	 * 
	 * @param {THREE.Object3D} obj the root Object3D to start converting at
	 * @param {Object} toConvert mapping of Object3D id's to matching Transforms for animations to
	 *     use to connect with the newly created Transforms
	 * @return {hemi.Transform} the converted root Transform
	 */
	function convertObject3Ds(obj, toConvert) {
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
	}

	hemi.makeCitizen(Model, 'hemi.Model', {
		cleanup: Model.prototype._clean,
		toOctane: Model.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Recursive function to search through all Transform children for any Transforms with the given
	 * name.
	 * 
	 * @param {string} name the name to search for
	 * @param {hemi.Transform} transform the transform with children to check
	 * @param {hemi.Transform[]} returnTrans array of matching Transforms that is being populated
	 */
	function getTransformsRecursive(name, transform, returnTrans) {
		for (var i = 0; i < transform.children.length; ++i) {
			var child = transform.children[i];

			if (child.name === name) {
				returnTrans.push(child);
			}

			getTransformsRecursive(name, child, returnTrans);
		}
	}

})();
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
	 * Handle the mouse down event by performing a pick operation. If a 3D object is picked, send
	 * out a message on the dispach.
	 * 
	 * @param {Object} mouseEvent the mouse down event
	 */
	hemi.Picker.prototype.onMouseDown = function(mouseEvent) {
		var x = (mouseEvent.x / this.width) * 2 - 1,
			y = -(mouseEvent.y / this.height) * 2 + 1,
			camPos = this.camera.threeCamera.position;

		_vector.set(x, y, 1);
		_projector.unprojectVector(_vector, this.camera.threeCamera);
		_ray.origin.copy(camPos);
		_ray.direction.copy(_vector.subSelf(camPos).normalize());

		var pickedObjs = _ray.intersectScene(this.scene);

		if (pickedObjs.length > 0) {
			for (var i = 0; i < pickedObjs.length; ++i) {
				var pickedObj = pickedObjs[i];

				if (pickedObj.object.pickable) {
					var worldIntersectionPosition = pickedObj.object.parent.matrixWorld.multiplyVector3(
						pickedObj.point.clone());

					var pickInfo =	{
						mouseEvent: mouseEvent,
						pickedMesh: pickedObj.object,
						worldIntersectionPosition: worldIntersectionPosition
					};

					if (this.pickGrabber != null) {
						this.pickGrabber.onPick(pickInfo);
					} else {
						hemi.send(hemi.msg.pick, pickInfo);
					}
					break;
				}
			}
		}
	};

})();
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
	function checkLoops() {
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

})();
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

	var defaultParticleSystem = new hemi.particles.System();

	// The default particle system updates using render time.
	hemi.addRenderListener({
		onRender: function(event) {
			defaultParticleSystem.update(event.elapsedTime);
		}
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * A set of names of predefined per-particle parameter setting functions.
	 */
	hemi.ParticleFunctionIds = {
		Acceleration : 'Acceleration',
		Puff: 'Puff'
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// ParticleFunction class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A ParticleFunction specifies a predefined per-particle parameter setting function and
	 * any properties it might require.
	 * @example
	 * Each function must be of the form:
	 * 
	 * function(number, hemi.core.particles.ParticleSpec): void
	 * 
	 * The number is the index of the particle being created. The ParticleSpec is a set of
	 * parameters for that particular particle.
	 */
	var ParticleFunction = function() {
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

	hemi.ParticleFunction = ParticleFunction;
	hemi.makeOctanable(hemi.ParticleFunction, 'hemi.ParticleFunction', ['name', 'options']);

////////////////////////////////////////////////////////////////////////////////////////////////////
// ParticleEmitter class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A ParticleEmitter constantly generates particles.
	 */
	var ParticleEmitter = function(client) {
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
		 * An array of colors for each particle to transition through. Each color value is in the
		 * form RGBA.
		 * @type number[]
		 */
		this.colorRamp = [];

		/**
		 * A set of parameters for the ParticleEmitter.
		 * @type hemi.particles.Spec
		 */
		this.params = {};

		/**
		 * Optional specs that identify a particle updating function to use and properties to set
		 * for it.
		 * @type hemi.ParticleFunctionIds
		 */
		this.particleFunction = null;

		/* The actual emitter for the ParticleEmitter */
		this.particles = null;

		/* The containing Transform for the Effect */
		this.transform = null;
	};

	/*
	 * Remove all references in the ParticleEmitter.
	 */
	ParticleEmitter.prototype._clean = function() {
		var emitters = this._system.emitters,
			ndx = emitters.indexOf(this.particles);

		emitters.splice(ndx, 1);
		this.transform.parent.remove(this.transform);
		this.transform = null;
		this.particles = null;
	};

	/*
	 * Array of Hemi Messages that ParticleEmitter is known to send.
	 * @type string[]
	 */
	ParticleEmitter.prototype._msgSent = [hemi.msg.visible];

	/*
	 * Octane properties for ParticleEmitter.
	 * @type string[]
	 */
	ParticleEmitter.prototype._octane = ['_newSystem', 'blending', 'client', 'colorRamp', 'params',
		'particleFunction', 'setup'];

	/**
	 * Set the ParticleEmitter to not be visible.
	 */
	ParticleEmitter.prototype.hide = function() {
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
	ParticleEmitter.prototype.setup = function() {
		// Create a deep copy of the parameters since the particle emitter will mutate them as it
		// fires.
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
	ParticleEmitter.prototype.show = function() {
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

	hemi.makeCitizen(ParticleEmitter, 'hemi.ParticleEmitter', {
		cleanup: ParticleEmitter.prototype._clean,
		toOctane: ParticleEmitter.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// ParticleBurst class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A ParticlesBurst generates one set of particles at a time. It can be used for a smoke
	 * puff, explosion, firework, water drip, etc.
	 * @extends hemi.ParticleEmitter
	 */
	var ParticleBurst = function(client) {
		ParticleEmitter.call(this, client);

		/* The OneShot particle effect */
		this.oneShot = null;
	};

	ParticleBurst.prototype = new ParticleEmitter();
	ParticleBurst.constructor = ParticleBurst;

	/*
	 * Remove all references in the ParticleBurst.
	 */
	ParticleBurst.prototype._clean = function() {
		ParticleEmitter.prototype._clean.call(this);

		this.oneShot = null;
	};

	/*
	 * Array of Hemi Messages that ParticleBurst is known to send.
	 * @type string[]
	 */
	ParticleBurst.prototype._msgSent = ParticleEmitter.prototype._msgSent.concat([hemi.msg.burst]);

	/**
	 * Set the particles up for the ParticleBurst.
	 */
	ParticleBurst.prototype.setup = function() {
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

		this.transform = new THREE.Object3D();
		this.client.scene.add(this.transform);

		this.oneShot = this.particles.createOneShot(this.transform);
	};

	/**
	 * Generate the particles for the ParticleBurst.
	 */
	ParticleBurst.prototype.trigger = function() {
		if (this.oneShot === null) {
			this.setup();
		}

		this.oneShot.trigger(this.params.position);
		this.send(hemi.msg.burst, {
			position: this.params.position
		});
	};

	hemi.makeCitizen(ParticleBurst, 'hemi.ParticleBurst', {
		cleanup: ParticleBurst.prototype._clean,
		toOctane: ParticleBurst.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// ParticleTrail class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A ParticleTrail is a particle effect that can be started and stopped like an
	 * animation. It can be used for effects like exhaust.
	 * @extends hemi.ParticleEmitter
	 */
	var ParticleTrail = function(client) {
		ParticleEmitter.call(this, client);

		/* A flag that indicates if the ParticleTrail is currently animating */
		this.isAnimating = false;
		/* The number of seconds between particle births */
		this.fireInterval = 1;
		this.count = 0;
	};

	ParticleTrail.prototype = new ParticleEmitter();
	ParticleTrail.constructor = ParticleTrail;

	/*
	 * Array of Hemi Messages that ParticleTrail is known to send.
	 * @type string[]
	 */
	ParticleTrail.prototype._msgSent = ParticleEmitter.prototype._msgSent.concat(
		[hemi.msg.start, hemi.msg.stop]);

	/*
	 * Octane properties for ParticleTrail.
	 * @type string[]
	 */
	ParticleTrail.prototype._octane = ParticleEmitter.prototype._octane.unshift('fireInterval');

	/**
	 * Render event handling function that allows the ParticleTrail to animate.
	 * 
	 * @param {o3d.Event} event the render event
	 */
	ParticleTrail.prototype.onRender = function(event) {
		this.count += event.elapsedTime;

		if (this.count >= this.fireInterval) {
			this.count = 0;
			this.particles.birthParticles(this.params.position);
		}
	};

	/**
	 * Set the particle emitter up for the ParticleTrail.
	 */
	ParticleTrail.prototype.setup = function() {
		// Create a deep copy of the parameters since the particle emitter will mutate them as it
		// fires.
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
	 * Start animating the ParticleTrail. It will generate particles based upon its fireInterval
	 * property.
	 */
	ParticleTrail.prototype.start = function() {
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
	ParticleTrail.prototype.stop = function() {
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

	hemi.makeCitizen(ParticleTrail, 'hemi.ParticleTrail', {
		cleanup: ParticleTrail.prototype._clean,
		toOctane: ParticleTrail.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Create a ParticleEmitter effect that constantly streams particles.
	 * 
	 * @param {hemi.Client} client the Client to render the effect
	 * @param {number[]} colorRamp array of color values in the form RGBA
	 * @param {hemi.particles.Spec} params parameters for the ParticleEmitter
	 * @param {number} opt_blending optional blending to use to draw particles
	 * @param {hemi.ParticleFunction} opt_function optional specs that identify a particle updating
	 *	   function to use and properties to set for it
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
	 * @param {hemi.ParticleFunction} opt_function optional specs that identify a particle updating
	 *	   function to use and properties to set for it
	 * @return {hemi.ParticleBurst} the newly created ParticleBurst
	 */
	hemi.createParticleBurst = function(client, colorRamp, params, opt_blending, opt_function) {
		var burst = new hemi.ParticleBurst(client);
		burst.colorRamp = colorRamp;
		burst.params = params;

		if (opt_blending != null) burst.blending = opt_blending;
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
	 * @param {hemi.ParticleFunction} opt_function optional specs that identify a particle updating
	 *	   function to use and properties to set for it
	 * @return {hemi.ParticleTrail} the newly created ParticleTrail
	 */
	hemi.createParticleTrail = function(client, colorRamp, params, fireInterval, opt_blending, opt_function) {
		var trail = new hemi.ParticleTrail(client);
		trail.colorRamp = colorRamp;
		trail.params = params;
		trail.fireInterval = fireInterval;

		if (opt_blending != null) trail.blending = opt_blending;
		if (opt_function)  trail.particleFunction = opt_function;

		trail.setup();
		return trail;
	};

	/**
	 * Get the predefined per-particle parameter setting function for the given specs.
	 *
	 * @param {hemi.ParticleFunction} funcSpecs specs that identify the
	 *	   particle function to get and properties to set for it
	 * @return {function(number, hemi.particles.Spec): void} an instance of the predefined function
	 *	   with the appropriate properties set or null if the function name is not recognized
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Get a function that sets each particle's acceleration by applying a factor to that particle's
	 * velocity. Valid options are:
	 * - factor : number[3] a factor to apply to each particle's XYZ velocity
	 *
	 * @param {Object} options customization options for the particle parameters
	 * @return {function(number, hemi.core.particles.ParticleSpec): void} an instance of the
	 *	   ParticleFunctionId.Acceleration function
	 */
	function getAccelerationFunction(options) {
		var acc = function (index, parameters) {
			parameters.acceleration = [
				acc.factor[0] * parameters.velocity[0],
				acc.factor[1] * parameters.velocity[1],
				acc.factor[2] * parameters.velocity[2]
			];
		};

		acc.factor = options.factor === undefined ? [0, 0, 0] : options.factor;
		return acc;
	}

	/*
	 * Get a function that sets each particle's velocity and acceleration to create a windblown puff
	 * effect. Valid options are:
	 * - wind : number[3] an XYZ acceleration to apply to each particle
	 * - size : number a factor to determine the size of the puff
	 * 
	 * @param {Object} options customization options for the particle parameters
	 * @return {function(number, hemi.core.particles.ParticleSpec): void} an instance of the
	 *	   ParticleFunctionId.Puff function
	 */
	function getPuffFunction(options) {
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
	}

})();
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
	
	/**
	 * @class A State represents a logical grouping of behavior, events, and
	 * interactions. It can be used to determine when various interactions are
	 * valid or if various events should be enabled.
	 */
	var State = function() {
		/**
		 * Flag indicating if the State is currently loaded.
		 * @type boolean
		 * @default false
		 */
		this.isLoaded = false;
		
		/**
		 * The next State to move to after this one.
		 * @type hemi.State
		 */
		this.next = null;
		
		/**
		 * The previous State that occurred before this one.
		 * @type hemi.State
		 */
		this.prev = null;
        
        
	};
		
	/** 
     * Remove all references in the State
     */
     State.prototype._clean = function() {
		if (this.next !== null) {
			this.next.prev = this.prev;
		}
		if (this.prev !== null) {
			this.prev.next = this.next;
		}
		
		this.next = null;
		this.prev = null;
	};
		
	/**
	 * Load the State.
	 */
	State.prototype.load = function() {
		if (!this.isLoaded) {
			this.isLoaded = true;
			
			this.send(hemi.msg.load, {});
		}
	};
	
	/**
	 * Unload the State.
	 */
	State.prototype.unload = function() {
		if (this.isLoaded) {
			this.isLoaded = false;
			
			this.send(hemi.msg.unload, {});
		}
	};
		
	/**
	 * Unload the State and move to the next State (if it has been set).
	 */
	State.prototype.nextState = function() {
		if (this.isLoaded && this.next != null) {
			this.unload();
			this.next.load();
		}
	};
	
	/**
	 * Unload the State and move to the previous State (if it has been set).
	 */
	State.prototype.previousState = function() {
		if (this.isLoaded && this.prev != null) {
			this.unload();
			this.prev.load();
		}
	};
    /**
	 * Octane properties for State.
	 * 
	 * @type String[]
	 */
	State.prototype._octane = ['next', 'prev'];
    
    /**
     * Message types sent by State.
     *
     * @return (Object[]} Array of message types sent.
     */
    State.prototype._msgSent = [hemi.msg.load, hemi.msg.unload];
    
	hemi.makeCitizen(State, 'hemi.State', {
		toOctane: State.prototype._octane,
        cleanup: State.prototype._clean
	});	
})();
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Set the current theme for HUD displays.
	 * 
	 * @param {hemi.HudTheme} theme display options for HUD elements
	 */
	hemi.setHudTheme = function(theme) {
		currentTheme = theme;
	};

	/*
	 * The current HUD theme being used for default properties.
	 */
	var currentTheme = new hemi.HudTheme();
	currentTheme.name = 'Default';

	/**
	 * The HUD manager responsible for drawing all HUD displays, elements, etc.
	 */
	hemi.hudManager = new HudManager();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Get the CSS RGBA string for the given color array in 0-1 format.
	 * @param {number[4]} col color array
	 * @return {string} the equivalent RGBA string
	 */
	function getRgba(col) {
		return 'rgba(' + Math.round(col[0]*255) + ',' + Math.round(col[1]*255) + ',' +
			Math.round(col[2]*255) + ',' + col[3] + ')';
	}

	/*
	 * Set the painting properties for the given 2D canvas context.
	 * 
	 * @param {Object} context the 2D canvas context
	 * @param {Object} options the options for painting
	 */
	function setPaintProperties(context, options) {
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
	}

})();
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

		// Static helper objects shared by all motions
	var _plane = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
		_vector = new THREE.Vector3(),
		_vec2 = new THREE.Vector2(),
		X_AXIS = new THREE.Vector3(1, 0, 0),
		Y_AXIS = new THREE.Vector3(0, 1, 0),
		Z_AXIS = new THREE.Vector3(0, 0, 1),
		XY_PLANE = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0)],
		XZ_PLANE = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,1)],
		YZ_PLANE = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,1), new THREE.Vector3(0,1,0)];

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Manipulator class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Manipulator allows a Transform to be manipulated in some way through mouse
	 * interaction.
	 */
	var Manipulator = function() {
		/*
		 * The Mesh that was picked by the last mouse click and is being used to manipulate.
		 * @type hemi.Mesh
		 */
		this._activeTransform = null;

		/**
		 * The Client that the Manipulator's active Transform is being rendered by.
		 * @type hemi.Client
		 */
		this._client = null;

		/*
		 * Flag indicating if interaction through the Manipulator is enabled.
		 * @type boolean
		 */
		this._enabled = false;

		/*
		 * The message handler for pick messages (stored for unsubscribing).
		 * @type hemi.dispatch.MessageTarget
		 */
		this._msgHandler = null;

		/**
		 * Flag indicating if the Manipulator should operate in the local space of the Transform it
		 * is manipulating (rather than world space).
		 * @type boolean
		 * @default false
		 */
		this.local = false;

		/**
		 * An array of Transforms controlled by the Manipulator.
		 * @type hemi.Transform[]
		 */
		this.transforms = [];
	};

	/**
	 * Remove all references in the Manipulator
	 */
	Manipulator.prototype._clean = function() {
		this.disable();
		this.clearTransforms();
		this._msgHandler = null;
	};

	/**
	 * Add a Transform to the list of Manipulator Transforms.
	 *
	 * @param {hemi.Transform} transform the transform to add
	 */
	Manipulator.prototype.addTransform = function(transform) {
		this.transforms.push(transform);
	};

	/**
	 * Clear the list of Manipulator Transforms.
	 */
	Manipulator.prototype.clearTransforms = function() {
		this.transforms.length = 0;
	};

	/**
	 * Check if a given Transform is contained within the children of the Transforms acted upon by
	 * the Manipulator.
	 *
	 * @param {hemi.Transform} transform transform to check against
	 * @return {boolean} true if the Transform is found
	 */
	Manipulator.prototype.containsTransform = function(transform) {
		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			var children = this.transforms[i].getAllChildren();

			for (var j = 0, jl = children.length; j < jl; ++j) {
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
	Manipulator.prototype.disable = function() {
		if (this._enabled) {
			hemi.unsubscribe(this._msgHandler, hemi.msg.pick);
			hemi.input.removeMouseMoveListener(this);
			hemi.input.removeMouseUpListener(this);
			this._enabled = false;
			this._msgHandler = null;
		}
	};

	/**
	 * Enable mouse interaction for the Manipulator. 
	*/
	Manipulator.prototype.enable = function() {
		if (!this._enabled) {
			this._msgHandler = hemi.subscribe(hemi.msg.pick, this, 'onPick',
				[hemi.dispatch.MSG_ARG + 'data.pickedMesh', 
				 hemi.dispatch.MSG_ARG + 'data.mouseEvent']);

			hemi.input.addMouseMoveListener(this);
			hemi.input.addMouseUpListener(this);
			this._enabled = true;
		}
	};

	/**
	 * Stop manipulating transforms.
	 *
	 * @param {Object} event the mouse up event
	 */
	Manipulator.prototype.onMouseUp = function(event) {
		this._activeTransform = null;
	};

	/**
	 * Remove the given Transform from the Manipulator.
	 * 
	 * @param {hemi.Transform} transform the Transform to remove
	*/
	Manipulator.prototype.removeTransform = function(transform) {
		var ndx = this.transforms.indexOf(transform);

		if (ndx !== -1) {
			this.transforms.splice(ndx, 1);
		}
	};

// Private functions

	/*
	 * Get the two dimensional plane that the Manipulator is operating on.
	 * 
	 * @return {THREE.Vector3[3]} the current move plane defined as 3 XYZ points
	 */
	function getPlane() {
		if (this.local) {
			var u = hemi.utils;
			_plane[0].copy(this.plane[0]);
			_plane[1].copy(this.plane[1]);
			_plane[2].copy(this.plane[2]);

			u.pointAsWorld(this._activeTransform, _plane[0]);
			u.pointAsWorld(this._activeTransform, _plane[1]);
			u.pointAsWorld(this._activeTransform, _plane[2]);
		} else {
			var translation = this._activeTransform.matrixWorld.getPosition();

			_plane[0].add(this.plane[0], translation);
			_plane[1].add(this.plane[1], translation);
			_plane[2].add(this.plane[2], translation);
		}

		return _plane;
	}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Movable class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Movable allows a 3D object to be moveed around the scene with the mouse, constrained
	 * to a defined 2D plane.
	 * @extends Manipulator
	 * 
	 * @param {Vector3[3]} opt_plane an array of 3 XYZ points defining a plane
	 * @param {number[4]} opt_limits an array containing [min on u, max on u, min on v, max on v]
	 */
	var Movable = function(opt_plane, opt_limits) {
		Manipulator.call(this);

		/*
		 * The UV coordinates of the last mouse down that picked one of the Movable's Transforms.
		 * @type number[2]
		 */
		this._pickUV = null;

		/*
		 * The current UV coordinates of the Movable on its plane.
		 * @type number[2]
		 */
		this._uv = [0, 0];

		/**
		 * The 2D plane that the Movable's Transforms will move along.
		 * @type THREE.Vector3[3]
		 */
		this.plane = null;

		/**
		 * The minimum U coordinate for the Movable on its 2D plane.
		 * @type number
		 * @default null
		 */
		this.umin = null;

		/**
		 * The maximum U coordinate for the Movable on its 2D plane.
		 * @type number
		 * @default null
		 */
		this.umax = null;

		/**
		 * The minimum V coordinate for the Movable on its 2D plane.
		 * @type number
		 * @default null
		 */
		this.vmin = null;

		/**
		 * The maximum V coordinate for the Movable on its 2D plane.
		 * @type number
		 * @default null
		 */
		this.vmax = null;

		if (opt_plane !== undefined) {
			this.setPlane(opt_plane);
		}
		if (opt_limits !== undefined) {
			this.setLimits(opt_limits);
		}

		this.enable();
	};

	Movable.prototype = new Manipulator();
	Movable.constructor = Movable;

	/*
	 * Octane properties for Movable.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Movable.prototype._octane = function(){
		var valNames = ['local', 'umin', 'umax', 'vmin', 'vmax'],
			props = [],
			plane = this.plane;

		for (var i = 0, il = valNames.length; i < il; ++i) {
			var name = valNames[i];

			props.push({
				name: name,
				val: this[name]
			});
		}

		if (plane === XY_PLANE) {
			props.push({
				name: 'setPlane',
				arg: [hemi.Plane.XY]
			});
		} else if (plane === XZ_PLANE) {
			props.push({
				name: 'setPlane',
				arg: [hemi.Plane.XZ]
			});
		} else if (plane === YZ_PLANE) {
			props.push({
				name: 'setPlane',
				arg: [hemi.Plane.YZ]
			});
		} else {
			props.push({
				name: 'plane',
				oct: [plane[0]._toOctane(), plane[1]._toOctane(), plane[2]._toOctane()]
			});
		}

		return props;
	};

	/**
	 * Clear all properties for the Movable.
	 */
	Movable.prototype.clear = function() {
		this._activeTransform = null;
		this._client = null;
		this._uv[0] = this._uv[1] = 0;
		this.local = false;
		this.plane = null;

		this.disable();
		this.clearTransforms();
		this.clearLimits();
	};

	/**
	 * Remove any previously set limits from the Movable.
	 */
	Movable.prototype.clearLimits = function() {
		this.umin = null;
		this.umax = null;
		this.vmin = null;
		this.vmax = null;
	};

	/**
	 * Calculate mouse point intersection with the Movable's plane and then translate the moving
	 * Transforms accordingly.
	 *
	 * @param {Object} event the mouse move event
	 */
	Movable.prototype.onMouseMove = function(event) {
		if (this._activeTransform === null) return;

		var plane = getPlane.call(this),
			uv = getUV.call(this, event.x, event.y, plane),
			delta = [uv[0] - this._pickUV[0], uv[1] - this._pickUV[1]];

		clampUV.call(this, delta);

		var localDelta = hemi.utils.uvToXYZ(delta, plane),
			xyzOrigin = hemi.utils.uvToXYZ([0, 0], plane),
			xyzDelta = _vector.sub(localDelta, xyzOrigin);

		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			hemi.utils.worldTranslate(xyzDelta, this.transforms[i]);
		}

		this.transforms[0].send(hemi.msg.move, { delta: xyzDelta });
	};

	/**
	 * Check the picked mesh to see if the Movable should start moving its Transforms.
	 *
	 * @param {hemi.Mesh} pickedMesh the Mesh picked by the mouse click
	 * @param {Object} mouseEvent the mouse down event
	 */
	Movable.prototype.onPick = function(pickedMesh, mouseEvent) {
		var meshId = pickedMesh.id;

		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			if (this.transforms[i].id === meshId) {
				this._activeTransform = pickedMesh;
				this._client = hemi.getClient(pickedMesh);
				this._pickUV = getUV.call(this, mouseEvent.x, mouseEvent.y);
				break;
			}
		}
	};

	/**
	 * Set the relative uv limits in which this Movable can move.
	 *
	 * @param {number[4]} limits an array containing [min on u, max on u, min on v, max on v]
	 */
	Movable.prototype.setLimits = function(limits) {
		this.umin = limits[0];
		this.umax = limits[1];
		this.vmin = limits[2];
		this.vmax = limits[3];
	};

	/**
	 * Set the 2d plane on which this Movable is bound.
	 *
	 * @param {hemi.Plane} plane enum indicating which plane to move along
	 */
	Movable.prototype.setPlane = function(plane) {
		switch (plane) {
			case (hemi.Plane.XY):
				this.plane = XY_PLANE;
				break;
			case (hemi.Plane.XZ):
				this.plane = XZ_PLANE;
				break;
			case (hemi.Plane.YZ):
				this.plane = YZ_PLANE;
				break;
		}
	};

// Private functions

	/*
	 * Add the given UV delta to the current UV coordinates and clamp the results.
	 *
	 * @param {number[2]} delta the uv change to add before clamping
	 */
	function clampUV(delta) {
		var u = this._uv[0] + delta[0],
			v = this._uv[1] + delta[1];

		if (this.umin !== null && u < this.umin) {
			u = this.umin;
		}
		if (this.umax !== null && u > this.umax) {
			u = this.umax;
		}
		if (this.vmin !== null && v < this.vmin) {
			v = this.vmin;
		}
		if (this.vmax !== null && v > this.vmax) {
			v = this.vmax;
		}

		delta[0] = u - this._uv[0];
		delta[1] = v - this._uv[1];
		this._uv[0] = u;
		this._uv[1] = v;
	}

	/*
	 * Convert the given screen coordinates into UV coordinates on the current moving plane.
	 * 
	 * @param {number} x x screen coordinate
	 * @param {number} y y screen coordinate
	 * @return {number[2]} equivalent UV coordinates
	 */
	function getUV(x, y, opt_plane) {
		var ray = this._client.castRay(x, y),
			plane = opt_plane || getPlane.call(this),
			tuv = hemi.utils.intersect(ray, plane);

		return [tuv[1], tuv[2]];
	}

	hemi.makeCitizen(Movable, 'hemi.Movable', {
		cleanup: Movable.prototype._clean,
		toOctane: Movable.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Turnable class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Turnable allows a Transform to be turned about an axis by the user clicking and
	 * dragging with the mouse.
	 * @extends Manipulator
	 * 
	 * @param {hemi.Axis} opt_axis optional axis to rotate about
	 * @param {number[2]} opt_limits optional minimum and maximum angle limits (in radians)
	 */
	var Turnable = function(opt_axis, opt_limits) {	
		Manipulator.call(this);

		/*
		 * The current angle of the Turnable on its axis.
		 * @type number
		 */
		this._angle = 0;

		/*
		 * The angle of the last mouse down that picked one of the Turnable's Transforms.
		 * @type number
		 */
		this._pickAngle = null;

		/**
		 * The axis that the Turnable's Transforms will turn about.
		 * @type THREE.Vector3
		 */
		this.axis = new THREE.Vector3();

		/**
		 * The minimum angle for the Turnable on its axis.
		 * @type number
		 * @default null
		 */
		this.min = null;

		/**
		 * The maximum angle for the Turnable on its axis.
		 * @type number
		 * @default null
		 */
		this.max = null;

		/**
		 * The 2D plane that the Movable's Transforms will move along.
		 * @type THREE.Vector3[3]
		 */
		this.plane = null;

		if (opt_axis !== undefined) {
			this.setAxis(opt_axis);
		}
		if (opt_limits !== undefined) {
			this.setLimits(opt_limits);
		}

		this.enable();
	};

	Turnable.prototype = new Manipulator();
	Turnable.constructor = Turnable;

	/*
	 * Octane properties for Turnable.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Turnable.prototype._octane = function(){
		var valNames = ['local', 'max', 'min'],
			props = [],
			plane = this.plane;

		for (var i = 0, il = valNames.length; i < il; ++i) {
			var name = valNames[i];

			props.push({
				name: name,
				val: this[name]
			});
		}

		if (plane === XY_PLANE) {
			props.push({
				name: 'setAxis',
				arg: [hemi.Axis.Z]
			});
		} else if (plane === XZ_PLANE) {
			props.push({
				name: 'setAxis',
				arg: [hemi.Axis.Y]
			});
		} else if (plane === YZ_PLANE) {
			props.push({
				name: 'setAxis',
				arg: [hemi.Axis.X]
			});
		} else {
			props.push({
				name: 'axis',
				oct: this.axis._toOctane()
			});
			props.push({
				name: 'plane',
				oct: [plane[0]._toOctane(), plane[1]._toOctane(), plane[2]._toOctane()]
			});
		}

		return props;
	};

	/**
	 * Clear all properties for the Turnable.
	 */
	Turnable.prototype.clear = function() {
		this._activeTransform = null;
		this._angle = 0;
		this._client = null;
		this.axis.set(0, 0, 0);
		this.local = false;
		this.plane = null;

		this.disable();
		this.clearTransforms();
		this.clearLimits();
	};

	/**
	 * Remove any previously set limits from the Turnable.
	 */
	Turnable.prototype.clearLimits = function() {
		this.min = null;
		this.max = null;
	};

	/**
	 * Calculate mouse point intersection with the Turnable's plane and then rotate the turning
	 * Transforms accordingly.
	 *
	 * @param {Object} event the mouse move event
	 */
	Turnable.prototype.onMouseMove = function(event) {
		if (this._activeTransform === null) return;

		var delta = getAngle.call(this, event.x, event.y) - this._pickAngle;

		if (this.max !== null && this._angle + delta >= this.max) {
			delta = this.max - this._angle;
		}
		if (this.min !== null && this._angle + delta <= this.min) {
			delta = this.min - this._angle;
		}

		this._angle += delta;

		if (!this.local) {
			this._pickAngle += delta;
		}

		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			var tran = this.transforms[i];

			if (this.local) {
				hemi.utils.axisRotate(this.axis, delta, tran);
			} else {
				hemi.utils.worldRotate(this.axis, delta, tran);
			}
		}
	};

	/**
	 * Check the picked mesh to see if the Turnable should start turning its Transforms.
	 *
	 * @param {hemi.Mesh} pickedMesh the Mesh picked by the mouse click
	 * @param {Object} mouseEvent the mouse down event
	 */
	Turnable.prototype.onPick = function(pickedMesh, event) {
		var meshId = pickedMesh.id;

		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			if (this.transforms[i].id === meshId) {
				this._activeTransform = pickedMesh;
				this._client = hemi.getClient(pickedMesh);
				this._pickAngle = getAngle.call(this, event.x, event.y);
				break;
			}
		}
	};

	/**
	 * Set the axis to which the Turnable is bound.
	 * 
	 * @param {hemi.Axis} axis axis to rotate about
	 */
	Turnable.prototype.setAxis = function(axis) {
		switch(axis) {
			case hemi.Axis.X:
				this.axis.copy(X_AXIS);
				this.axis.x *= -1;
				this.plane = YZ_PLANE;
				break;
			case hemi.Axis.Y:
				this.axis.copy(Y_AXIS);
				this.axis.y *= -1;
				this.plane = XZ_PLANE;
				break;
			case hemi.Axis.Z:
				this.axis.copy(Z_AXIS);
				this.plane = XY_PLANE;
				break;
		}
	};

	/**
	 * Set the limits to which the Turnable can rotate.
	 * 
	 * @param {number[2]} limits minimum and maximum angle limits (in radians)
	 */
	Turnable.prototype.setLimits = function(limits) {
		this.min = limits[0];
		this.max = limits[1];
	};

// Private functions

	/*
	 * Get the relative angle of a mouse click's interception with the active plane to the origin of
	 * that plane.
	 * 
	 * @param {number} x screen x-position of the mouse click event
	 * @param {number} y screen y-position of the mouse click event
	 * @return {number} relative angle of mouse click position on the Turnable's current active
	 *     plane
	 */
	function getAngle(x, y) {
		var plane = getPlane.call(this),
			ray = this._client.castRay(x, y),
			tuv = hemi.utils.intersect(ray, plane);

		return Math.atan2(tuv[2], tuv[1]);
	}

	hemi.makeCitizen(Turnable, 'hemi.Turnable', {
		cleanup: Turnable.prototype._clean,
		toOctane: Turnable.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Resizable class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Resizable allows a Transform to be resized along an axis by the user clicking and
	 * dragging with the mouse.
	 * @extends Manipulator
	 * 
	 * @param {hemi.Axis} opt_axis optional axis to resize along
	 */
	var Resizable = function(opt_axis) {
		Manipulator.call(this);

		/*
		 * The screen XY of the origin point in the local space of the Resizable's Transform.
		 * @type number[2]
		 */
		this._originXY = null;

		/*
		 * The screen XY of the last mouse down that picked one of the Resizable's Transforms.
		 * @type THREE.Vector2
		 */
		this._pickXY = new THREE.Vector2();

		/*
		 * The current scale of the Resizable on its axis.
		 * @type number
		 */
		this._scale = null;

		/**
		 * The axis that the Resizable's Transforms will resize along.
		 * @type THREE.Vector3
		 */
		this.axis = null;

		if (opt_axis !== undefined) {
			this.setAxis(opt_axis);
		}

		this.enable();
	};

	Resizable.prototype = new Manipulator();
	Resizable.constructor = Resizable;

	/**
	 * Clear all properties for the Resizable.
	 */
	Resizable.prototype.clear = function() {
		this._activeTransform = null;
		this._scale = null;
		this._client = null;
		this.axis = null;
		this.local = false;

		this.disable();
		this.clearTransforms();
	};

	/**
	 * Calculate mouse point intersection with the Turnable's plane and then rotate the turning
	 * Transforms accordingly.
	 *
	 * @param {Object} event the mouse move event
	 */
	Resizable.prototype.onMouseMove = function(event) {
		if (this._activeTransform === null) return;

		var scale = getScale.call(this, event.x, event.y),
			f = scale / this._scale,
			axis = _vector.set(
				this.axis.x ? f : 1,
				this.axis.y ? f : 1,
				this.axis.z ? f : 1
			);

		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			var tran = this.transforms[i];

			if (this.local) {
				tran.scale.multiplySelf(axis);
				tran.updateMatrix();
				tran.updateMatrixWorld();
			} else {
				hemi.utils.worldScale(axis, tran);
			}
		}

		this._scale = scale;
		this.transforms[0].send(hemi.msg.resize, { scale: scale });
	};

	/**
	 * Check the picked mesh to see if the Resizable should start resizing its Transforms.
	 *
	 * @param {hemi.Mesh} pickedMesh the Mesh picked by the mouse click
	 * @param {Object} mouseEvent the mouse down event
	 */
	Resizable.prototype.onPick = function(pickedMesh, event) {
		var meshId = pickedMesh.id;

		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			if (this.transforms[i].id === meshId) {
				this._activeTransform = pickedMesh;
				this._client = hemi.getClient(pickedMesh);
				this._originXY = xyPoint.call(this, _vector.set(0,0,0));

				var axis2d = xyPoint.call(this, _vectory.copy(this.axis));
				this._pickXY.set(axis2d[0] - this._originXY[0], axis2d[1] - this._originXY[1]).normalize();
				this._scale = getScale.call(this, event.x, event.y);
				break;
			}
		}
	};

	/**
	 * Set the axis along which the Resizable will resize.
	 * 
	 * @param {hemi.Axis} axis axis to resize along
	 */
	Resizable.prototype.setAxis = function(axis) {
		switch(axis) {
			case hemi.Axis.X:
				this.axis = X_AXIS;
				break;
			case hemi.Axis.Y:
				this.axis = Y_AXIS;
				break;
			case hemi.Axis.Z:
				this.axis = Z_AXIS;
				break;
		}
	};

// Private functions

	/*
	 * Get the relative scale from the given mouse event coordinates.
	 * 
	 * @param {number} x screen x-position of the mouse event
	 * @param {number} y screen y-position of the mouse event
	 * @return {number} relative scale
	 */
	function getScale(x, y) {
		var offset = _vec2.set(x - this._originXY[0], y - this._originXY[1]),
			scale = Math.abs(this._pickXY.dot(offset));

		return scale;
	}

	/*
	 * Convert the given point in the active transform's local space to screen coordinates.
	 * 
	 * @param {THREE.Vector3} point point in local space to convert
	 * @return {number[2]} array of the x and y screen coordinates
	 */
	function xyPoint(point) {
		if (this.local) {
			hemi.utils.pointAsWorld(this._activeTransform, point);
		} else {
			point.addSelf(this._activeTransform.position);
		}

		hemi.utils.worldToScreenFloat(this._client, point);
		return [point.x, point.y];
	}

	hemi.makeCitizen(Resizable, 'hemi.Resizable', {
		cleanup: Resizable.prototype._clean,
		toOctane: []
	});

})();
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

	var dbgBoxMat =  new THREE.MeshPhongMaterial({
			color: 0x000088,
			wireframe: true,
			wireframeLinewidth: 1
		}),	
		dbgBoxTransforms = {},
		dbgLineMat = null,
		dbgLineTransforms = [];

////////////////////////////////////////////////////////////////////////////////////////////////////
// ParticleCurve shader code
////////////////////////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Enum for different curve interpolation types.
	 */
	hemi.CurveType = {
		Linear : 0,
		Bezier : 1,
		CubicHermite : 2,
		LinearNorm : 3,
		Cardinal : 4,
		Custom : 5
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// BoundingBox class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A BoundingBox is defined by a minimum XYZ point and a maximum XYZ point.
	 * 
	 * @param {THREE.Vector3} opt_min minimum XYZ point
	 * @param {THREE.Vector3} opt_max maximum XYZ point
	 */
	hemi.BoundingBox = function(opt_min, opt_max) {
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Curve class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Curve is used to represent and calculate different interpolation curves including
	 * linear, bezier, cardinal, and cubic hermite.
	 * 
	 * @param {THREE.Vector3[]} points array of xyz waypoints 
	 * @param {hemi.CurveType} opt_type optional curve interpolation type
	 * @param {Object} opt_config optional configuration object for the Curve
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
	};

	/*
	 * Octane properties for Curve.
	 * @type string[]
	 */
	Curve.prototype._octane = function() {
		var names = ['count', 'tension', 'weights', 'xpts', 'xtans', 'ypts', 'ytans', 'zpts', 'ztans'],
			props = [];

		for (var i = 0, il = names.length; i < il; ++i) {
			var name = names[i];

			props.push({
				name: name,
				val: this[name]
			});
		}

		props.push({
			name: 'setType',
			arg: [this.type]
		});

		return props;
	};

	/**
	 * Draw the Curve using primitive shapes.
	 * 
	 * @param {number} samples the number of samples to use to draw
	 * @param {Object} config configuration for how the Curve should look
	 */
	Curve.prototype.draw = function(samples, config) {
		var points = [];

		for (var i = 0, il = samples + 2; i < il; ++i) {
			points[i] = this.interpolate(i / (samples + 1));
		}

		drawCurve(points, config);
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
	 * Base interpolation function for this curve. Usually overwritten.
	 *
	 * @param {number} t time (usually between 0 and 1)
	 * @return {THREE.Vector3} the position interpolated from the time input
	 */
	Curve.prototype.interpolate = function(t) {
		return new THREE.Vector3(t,t,t);
	};

	/**
	 * Load the given configuration options into the Curve.
	 * 
	 * @param {Object} cfg configuration options for the Curve
	 */
	Curve.prototype.loadConfig = function(cfg) {
		var points = cfg.points,
			type = cfg.type || this.type || hemi.CurveType.Linear;

		this.setType(type);

		if (points) {
			this.count = points.length;

			for (var i = 0; i < this.count; i++) {
				this.xpts[i] = points[i][0];
				this.ypts[i] = points[i][1];
				this.zpts[i] = points[i][2];
				this.xtans[i] = 0;
				this.ytans[i] = 0;
				this.ztans[i] = 0;
				this.weights[i] = 1;
			}
		}

		if (cfg.weights) {
			for (var i = 0; i < this.count; i++) {
				this.weights[i] = (cfg.weights[i] !== undefined) ? cfg.weights[i] : 1;
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

		if (this.type === hemi.CurveType.Cardinal) {
			setTangents.call(this);
		}
	};

	/**
	 * Set the type of interpolation for the Curve.
	 * 
	 * @param {hemi.CurveType} type interpolation type
	 */
	Curve.prototype.setType = function(type) {
		this.type = type;

		switch (type) {
			case hemi.CurveType.Bezier:
				this.interpolate = interpolateBezier;
				break;
			case hemi.CurveType.CubicHermite:
			case hemi.CurveType.Cardinal:
				this.interpolate = interpolateCubicHermite;
				break;
			case hemi.CurveType.Linear:
				this.interpolate = interpolateLinear;
				break;
			case hemi.CurveType.LinearNorm:
				this.interpolate = interpolateLinearNorm;
				break;
			default:
				break;
		}
	};

// Private functions for Curve

		/*
		 * The bezier interpolation starts at the first waypoint and ends at the last waypoint, and
		 * 'bends' toward the intermediate points. These points can be weighted for more bending.
		 * 
		 * @param {number} time time (usually between 0 and 1)
		 * @return {THREE.Vector3} the position interpolated from the time input
		 */
	var interpolateBezier = function(time) {
			var points = this.count,
				x = 0,
				y = 0,
				z = 0,
				w = 0;

			for (var i = 0; i < points; ++i) {
				var fac = this.weights[i] * hemi.utils.choose(points - 1, i) * Math.pow(time, i) *
					Math.pow((1 - time), (points - 1 - i));

				x += fac * this.xpts[i];
				y += fac * this.ypts[i];
				z += fac * this.zpts[i];
				w += fac;
			}

			return new THREE.Vector3(x/w, y/w, z/w);
		},

		/*
		 * The cubic hermite function interpolates along a line that runs through the Curve's
		 * waypoints at a predefined tangent slope through each one.
		 * 
		 * @param {number} time time (usually between 0 and 1)
		 * @return {THREE.Vector3} the position interpolated from the time input
		 */
		interpolateCubicHermite = function(time) {
			var last = this.count - 1,
				ndx = Math.floor(time * last);

			if (ndx >= last) {
				ndx = last - 1;
			}

			var factor = ndx / last,
				tt = (time - factor) / ((ndx + 1) / last - factor),
				x = hemi.utils.cubicHermite(tt, this.xpts[ndx], this.xtans[ndx], this.xpts[ndx+1], this.xtans[ndx+1]);
				y = hemi.utils.cubicHermite(tt, this.ypts[ndx], this.ytans[ndx], this.ypts[ndx+1], this.ytans[ndx+1]);
				z = hemi.utils.cubicHermite(tt, this.zpts[ndx], this.ztans[ndx], this.zpts[ndx+1], this.ztans[ndx+1]);

			return new THREE.Vector3(x, y, z);
		},

		/*
		 * The linear interpolation moves on a straight line between waypoints.
		 *
		 * @param {number} time time of interpolation (usually between 0 and 1)
		 * @return {THREE.Vector3} the position interpolated from the time input
		 */
		interpolateLinear = function(time) {
			var last = this.count - 1,
				ndx = Math.floor(time * last);

			if (ndx >= last) {
				ndx = last - 1;
			}

			var factor = ndx / last,
				tt = (time - factor) / ((ndx + 1) / last - factor),
				x = (1 - tt) * this.xpts[ndx] + tt * this.xpts[ndx+1];
				y = (1 - tt) * this.ypts[ndx] + tt * this.ypts[ndx+1];
				z = (1 - tt) * this.zpts[ndx] + tt * this.zpts[ndx+1];

			return new THREE.Vector3(x, y, z);
		},

		/*
		 * The normalized linear interpolation moves on a straight line between waypoints at a
		 * constant velocity.
		 *
		 * @param {number} time time (usually between 0 and 1)
		 * @return {THREE.Vector3} the position interpolated from the time input
		 */
		interpolateLinearNorm = function(time) {
			var dist = 0,
				dpts = [0];

			for (var i = 1, il = this.count; i < il; ++i) {
				var xDist = this.xpts[i-1] - this.xpts[i],
					yDist = this.ypts[i-1] - this.ypts[i],
					zDist = this.zpts[i-1] - this.zpts[i];

				dist += Math.sqrt(xDist * xDist + yDist * yDist + zDist * zDist);
				dpts[i] = d;
			}

			var tt = time * dist,
				ndx = 0;

			for (var i = 1, il = this.count; i < il; ++i) {
				if (dpts[i] < tt) {
					ndx = i;
				}
			}

			var lt = (tt - dpts[ndx]) / (dpts[ndx+1] - dpts[ndx]),
				x = (1 - lt) * this.xpts[ndx] + lt * this.xpts[ndx+1],
				y = (1 - lt) * this.ypts[ndx] + lt * this.ypts[ndx+1],
				z = (1 - lt) * this.zpts[ndx] + lt * this.zpts[ndx+1];

			return new THREE.Vector3(x, y, z);
		},

		/*
		 * Calculate the tangents for a cardinal curve, which is a cubic hermite curve where the
		 * tangents are defined by a single 'tension' factor.
		 */
		setTangents = function() {
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
		};

	hemi.Curve = Curve;
	hemi.makeOctanable(hemi.Curve, 'hemi.Curve', hemi.Curve.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// ParticleCurve class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A ParticleCurve is a particle system that uses volumetric waypoints (boxes) to create
	 * curved paths for particles to follow.
	 * 
	 * @param {Object} opt_cfg optional configuration object for the ParticleCurve:
	 *     aim: flag to indicate particles should orient with curve
	 *     boxes: array of bounding boxes for particle curves to pass through
	 *     colors: array of values for particle color ramp (use this or colorKeys)
	 *     colorKeys: array of time keys and values for particle color ramp
	 *     life: lifetime of particle system (in seconds)
	 *     particleCount: number of particles to allocate for system
	 *     particleShape: mesh containg shape geometry to use for particles
	 *     scales: array of values for particle scale ramp (use this or scaleKeys)
	 *     scaleKeys: array of time keys and values for particle size ramp
	 *     tension: tension parameter for the curve (typically from -1 to 1)
	 *     trail: flag to indicate system should have trailing start and stop
	 */
	var ParticleCurve = function(client, opt_cfg) {
		this._aim = false;
		this._boxes = [];
		this._colors = [];
		this._decparam = null;
		this._materialSrc = null;
		this._maxTimeParam = null;
		this._mesh = null;
		this._particles = 0;
		this._scales = [];
		this._tension = 0;
		this._timeParam = null;
		this._viewITParam = null;

		/**
		 * Flag indicating if the ParticleCurve is currently running.
		 * @type boolean
		 */
		this.active = false;
		/**
		 * The Client that the ParticleCurve is being rendered by.
		 * @type hemi.Client
		 */
		this.client = client;
		/**
		 * The lifetime of the ParticleCurve. This is the amount of time it takes a particle to
		 * travel from the first waypoint to the last.
		 * @type number
		 */
		this.life = 0;

		if (opt_cfg) {
			this.loadConfig(opt_cfg);
		}
	};

	/*
	 * Array of Hemi Messages that ParticleCurve is known to send.
	 * @type string[]
	 */
	ParticleCurve.prototype._msgSent = [hemi.msg.start, hemi.msg.stop];

	/*
	 * Octane properties for ParticleCurve.
	 * @type string[]
	 */
	ParticleCurve.prototype._octane = function() {
		return [{
			name: 'mesh',
			id: this._mesh._getId()
		}, {
			name: 'loadConfig',
			arg: [{
				aim: this._aim,
				boxes: this._boxes,
				colorKeys: this._colors,
				life: this.life,
				particleCount: this._particles,
				scaleKeys: this._scales,
				tension: this._tension
			}]
		}];
	};

	/**
	 * Hide the ParticleCurve's waypoint boxes from view.
	 */
	ParticleCurve.prototype.hideBoxes = function() {
		if (this._mesh) {
			var trans = dbgBoxTransforms[this._mesh.id] || [];

			for (var i = 0, il = trans.length; i < il; ++i) {
				this._mesh.remove(trans[i]);
			}

			delete dbgBoxTransforms[this._mesh.id];
		}
	};

	/**
	 * Load the given configuration object and set up the ParticleCurve.
	 * 
	 * @param {Object} cfg configuration options:
	 *     aim: flag to indicate particles should orient with curve
	 *     boxes: array of bounding boxes for particle curves to pass through
	 *     colors: array of values for particle color ramp (use this or colorKeys)
	 *     colorKeys: array of time keys and values for particle color ramp
	 *     life: lifetime of particle system (in seconds)
	 *     particleCount: number of particles to allocate for system
	 *     particleShape: mesh containg shape geometry to use for particles
	 *     scales: array of values for particle scale ramp (use this or scaleKeys)
	 *     scaleKeys: array of time keys and values for particle size ramp
	 *     tension: tension parameter for the curve (typically from -1 to 1)
	 *     trail: flag to indicate system should have trailing start and stop
	 */
	ParticleCurve.prototype.loadConfig = function(cfg) {
		this._aim = cfg.aim === undefined ? false : cfg.aim;
		this._boxes = cfg.boxes ? hemi.utils.clone(cfg.boxes) : [];
		this.life = cfg.life || 5;
		this._particles = cfg.particleCount || 0;
		this._tension = cfg.tension || 0;

		if (cfg.colorKeys) {
			this.setColorKeys(cfg.colorKeys);
		} else if (cfg.colors) {
			this.setColors(cfg.colors);
		} else {
			this._colors = [];
		}

		if (cfg.scaleKeys) {
			this.setScaleKeys(cfg.scaleKeys);
		} else if (cfg.scales) {
			this.setScales(cfg.scales);
		} else {
			this._scales = [];
		}

		if (cfg.particleShape) {
			this.setParticleShape(cfg.particleShape);
		} else {
			this._mesh = null;
		}
	};

	/**
	 * Update the particles on each render.
	 * 
	 * @param {Object} e the render event
	 */
	ParticleCurve.prototype.onRender = function(e) {
		var delta = e.elapsedTime / this.life,
			newTime = this._timeParam.value + delta;

		while (newTime > 1) {
			--newTime;
		}

		// refresh uniforms
		this._timeParam.value = newTime;
		this._viewITParam.value.copy(this.client.camera.threeCamera.matrixWorld).transpose();
	};

	/**
	 * Pause the ParticleCurve.
	 */
	ParticleCurve.prototype.pause = function() {
		if (this.active) {
			hemi.removeRenderListener(this);
			this.active = false;
		}
	};

	/**
	 * Resume the ParticleCurve.
	 */
	ParticleCurve.prototype.play = function() {
		if (!this.active) {
			if (this._maxTimeParam.value === 1) {
				hemi.addRenderListener(this);
				this.active = true;
			} else {
				this.start();
			}
		}
	};

	/**
	 * Set whether or not particles should orient themselves along the curve they are following.
	 * 
	 * @param {boolean} aim flag indicating if particles should aim along the curve
	 */
	ParticleCurve.prototype.setAim = function(aim) {
		if (this._aim !== aim) {
			this._aim = aim;
			setupShaders.call(this);
		}
	};

	/**
	 * Set the bounding boxes that define waypoints for the ParticleCurve's curves.
	 * 
	 * @param {hemi.BoundingBox[]} boxes array of boxes defining volumetric waypoints for the
	 *     ParticleCurve
	 */
	ParticleCurve.prototype.setBoxes = function(boxes) {
		var oldLength = this._boxes.length;
		this._boxes = hemi.utils.clone(boxes);

		if (this._boxes.length === oldLength) {
			setupBounds.call(this);
		} else {
			setupShaders.call(this);
		}
	};

	/**
	 * Set the color ramp for the particles as they travel along the curve.
	 * 
	 * @param {number[4][]} colors array of RGBA color values
	 */
	ParticleCurve.prototype.setColors = function(colors) {
		var len = colors.length,
			step = len === 1 ? 1 : 1 / (len - 1),
			colorKeys = [];

		for (var i = 0; i < len; ++i) {
			colorKeys.push({
				key: i * step,
				value: colors[i]
			});
		}

		this.setColorKeys(colorKeys);
	};

	/**
	 * Set the color ramp for the particles as they travel along the curve, specifying the
	 * interpolation times for each color.
	 * 
	 * @param {Object[]} colorKeys array of color keys, sorted into ascending key order
	 */
	ParticleCurve.prototype.setColorKeys = function(colorKeys) {
		var len = colorKeys.length;

		if (len === 1) {
			// We need at least two to interpolate
			var clr = colorKeys[0].value;
			this._colors = [{
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
			this._colors = colorKeys;
		} else {
			this._colors = [];
		}

		setupShaders.call(this);
	};

	/**
	 * Set the material to use for the particles. Note that the material's shader will be modified
	 * for the ParticleCurve.
	 * 
	 * @param {THREE.Material} material the material to use for particles
	 */
	ParticleCurve.prototype.setMaterial = function(material) {
		if (this._mesh) {
			this._mesh.material = material;

			if (!material.program) {
				var scene = this.client.scene;
				this.client.renderer.initMaterial(material, scene.lights, scene.fog, this._mesh);
			}

			var shads = hemi.utils.getShaders(this.client, material);

			this._materialSrc = {
				frag: shads.fragSrc,
				vert: shads.vertSrc
			};

			setupShaders.call(this);
		}
	};

	/**
	 * Set the total number of particles for the ParticleCurve to create.
	 *  
	 * @param {number} numPtcs number of particles
	 */
	ParticleCurve.prototype.setParticleCount = function(numPtcs) {
		this._particles = numPtcs;

		if (this._mesh) {
			// Recreate the custom vertex buffers
			this.setParticleShape(this._mesh);
		}
	};

	/**
	 * Set the shape of the particles to the given shape geometry. This may take some time as a new
	 * vertex buffer gets created.
	 * 
	 * @param {hemi.Mesh} mesh the mesh containing the shape geometry to use
	 */
	ParticleCurve.prototype.setParticleShape = function(mesh) {			
		if (this._mesh) {
			if (this._mesh.parent) this.client.scene.remove(this._mesh);
			this._mesh = null;
		}

		if (!mesh.parent) this.client.scene.add(mesh);

		this._mesh = mesh;
		this._particles = this._particles || 1;

		var retVal = modifyGeometry(this._mesh.geometry, this._particles);
		this.idArray = retVal.ids;
		this.offsetArray = retVal.offsets;
		this.idOffsets = retVal.idOffsets;

		this.setMaterial(mesh.material || newMaterial());
	};

	/**
	 * Set the scale ramp for the particles as they travel along the curve.
	 * 
	 * @param {THREE.Vector3[]} scales array of XYZ scale values
	 */
	ParticleCurve.prototype.setScales = function(scales) {
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
	 * Set the scale ramp for the particles as they travel along the curve, specifying the
	 * interpolation times for each scale.
	 * 
	 * @param {Object[]} scaleKeys array of scale keys, sorted into ascending key order
	 */
	ParticleCurve.prototype.setScaleKeys = function(scaleKeys) {
		var len = scaleKeys.length;

		if (len === 1) {
			// We need at least two to interpolate
			var scl = scaleKeys[0].value;
			this._scales = [{
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
			this._scales = scaleKeys;
		} else {
			this._scales = [];
		}

		setupShaders.call(this);
	};

	/**
	 * Set the tension parameter for the curve. This controls how round or straight the curve
	 * sections are.
	 * 
	 * @param {number} tension tension value (typically from -1 to 1)
	 */
	ParticleCurve.prototype.setTension = function(tension) {
		this._tension = tension;

		if (this._mesh) {
			this._mesh.material.getParam('tension').value = (1 - this._tension) / 2;
		}
	};

	/**
	 * Render the waypoint boxes which the curves run through (helpful for debugging).
	 */
	ParticleCurve.prototype.showBoxes = function() {
		if (this._mesh) {
			var trans = dbgBoxTransforms[this._mesh.id] || [];

			for (var i = 0; i < this._boxes.length; i++) {
				var b = this._boxes[i],
					w = b.max.x - b.min.x,
					h = b.max.y - b.min.y,
					d = b.max.z - b.min.z,
					x = b.min.x + w/2,
					y = b.min.y + h/2,
					z = b.min.z + d/2,
					box = new THREE.CubeGeometry(w, h, d),
					mesh = new THREE.Mesh(box, dbgBoxMat);

				mesh.position.addSelf(new THREE.Vector3(x, y, z));
				this._mesh.add(mesh);
				trans.push(mesh);
			}

			dbgBoxTransforms[this._mesh.id] = trans;
		}
	};

	/**
	 * Start the ParticleCurve.
	 */
	ParticleCurve.prototype.start = function() {
		if (!this.active) {
			this.active = true;
			this._timeParam.value = 1.0;
			this._maxTimeParam.value = 1.0;
			hemi.addRenderListener(this);
		}
	};

	/**
	 * Stop the ParticleCurve.
	 */
	ParticleCurve.prototype.stop = function() {
		if (this.active) {
			this.active = false;
			this._timeParam.value = 1.1;
			this._maxTimeParam.value = 3.0;
			hemi.removeRenderListener(this);
		}
	};

	/**
	 * Translate the entire particle system by the given amounts
	 * @param {number} x amount to translate in the X direction
	 * @param {number} y amount to translate in the Y direction
	 * @param {number} z amount to translate in the Z direction
	 */
	ParticleCurve.prototype.translate = function(x, y, z) {
		for (var i = 0, il = this._boxes.length; i < il; i++) {
			var box = this._boxes[i],
				min = box.min,
				max = box.max;

			min[0] += x;
			max[0] += x;
			min[1] += y;
			max[1] += y;
			min[2] += z;
			max[2] += z;
		}

		setupBounds.call(this);
	};

// Private functions for ParticleCurve

	/*
	 * Modify the particle material's shaders so that the particle system can be rendered using its
	 * current configuration. At a minimum, the mesh and curve boxes need to be defined.
	 */
	function setupShaders() {
		if (!this._mesh || !this._materialSrc || this._boxes.length < 2) {
			return;
		}

		var gl = this.client.renderer.context,
			chunksVert = shaderChunks.vert,
			chunksFrag = shaderChunks.frag,
			material = this._mesh.material,
			oldProgram = material.program,
			program = material.program = oldProgram.isCurveGen ? oldProgram : gl.createProgram(),
			fragSrc = this._materialSrc.frag,
			vertSrc = this._materialSrc.vert,
			numBoxes = this._boxes.length,
			numColors = this._colors.length,
			numScales = this._scales.length,
			addColors = numColors > 1,
			addScale = numScales > 1,
			shads = hemi.utils.getShaders(this.client, material),
			fragShd = shads.fragShd,
			vertShd = shads.vertShd,
			dec = 1.0,
			maxTime = 3.0,
			time = 1.1,
			uniformNames = ['sysTime', 'ptcMaxTime', 'ptcDec', 'numPtcs',
				'tension', 'ptcScales', 'ptcScaleKeys', 'minXYZ', 'maxXYZ',
				'ptcColors', 'ptcColorKeys', 'viewIT'];

		// Remove any previously existing uniforms that we created
		for (var i = 0, il = uniformNames.length; i < il; ++i) {
			var name = uniformNames[i],
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

			if (this._aim) {
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
				idOffset: { type: 'v2', value: this.idOffsets, needsUpdate: true }
			},
			uniforms = {
				sysTime: { type: 'f', value: time },
				ptcMaxTime: { type: 'f', value: maxTime },
				ptcDec: { type: 'f', value: dec },
				numPtcs: { type: 'f', value: this._particles },
				tension: { type: 'f', value: (1 - this._tension) / 2 },
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

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			hemi.error('Could not initialise shader. VALIDATE_STATUS: ' +
				gl.getProgramParameter( program, gl.VALIDATE_STATUS ) + ', gl error [' +
				gl.getError() + ']');
		}

		program.uniforms = {};
		program.attributes = {};
		program.isCurveGen = true;

		for (var u in material.uniforms) {
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
		this._decparam = material.uniforms.ptcDec;
		this._maxTimeParam = material.uniforms.ptcMaxTime;
		this._timeParam = material.uniforms.sysTime;
		this._viewITParam = material.uniforms.viewIT;

		setupBounds.call(this);

		var needsZ = false;

		for (var i = 0; i < numColors && !needsZ; i++) {
			needsZ = this._colors[i].value[3] < 1;
		}

		material.transparent = needsZ;

		if (addColors) {
			setupColors(material, this._colors);
		}
		if (addScale) {
			setupScales(material, this._scales);
		}

		// force rebuild of buffers
		this._mesh.dynamic = true;
		this._mesh.__webglInit = this._mesh.__webglActive = false;
		delete this._mesh.geometry.geometryGroups;
		delete this._mesh.geometry.geometryGroupsList;
		this.client.scene.__objectsAdded.push(this._mesh);
	}

	/*
	 * Set the parameters for the ParicleCurve's Material so that it supports a curve through its
	 * bounding boxes.
	 */
	function setupBounds() {
		if (this._mesh) {
			var material = this._mesh.material,
				boxes = this._boxes,
				minParam = material.uniforms.minXYZ,
				maxParam = material.uniforms.maxXYZ;

			minParam._array = new Float32Array(3 * boxes.length);
			maxParam._array = new Float32Array(3 * boxes.length);

			for (var i = 0, il = boxes.length; i < il; ++i) {
				var box = boxes[i];

				minParam.value[i] = box.min;
				maxParam.value[i] = box.max;
			}
		}
	}

	hemi.makeCitizen(ParticleCurve, 'hemi.ParticleCurve', {
		toOctane: ParticleCurve.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// ParticleCurveTrail class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A ParticleCurve that has trailing starts and stops.
	 * @extends hemi.ParticleCurve
	 * 
	 * @param {Object} opt_cfg the configuration object for the system
	 */
	var ParticleCurveTrail = function(client, opt_cfg) {
		ParticleCurve.call(this, client, opt_cfg);

		this.endTime = 1.0;
		this.starting = false;
		this.stopping = false;
	};

	ParticleCurveTrail.prototype = new ParticleCurve();
	ParticleCurveTrail.prototype.constructor = ParticleCurveTrail;

	/**
	 * Update the particles on each render.
	 * 
	 * @param {Object} e the render event
	 */
	ParticleCurveTrail.prototype.onRender = function(e) {
		var delta = e.elapsedTime / this.life,
			newTime = this._timeParam.value + delta;

		if (newTime > this.endTime) {
			if (this.stopping) {
				this.active = false;
				this.stopping = false;
				this._maxTimeParam.value = 3.0;
				hemi.removeRenderListener(this);
				newTime = 1.1;
			} else {
				if (this.starting) {
					this.starting = false;
					this.endTime = 1.0;
					this._decparam.value = 1.0;
					this._maxTimeParam.value = 1.0;
				}

				while (--newTime > this.endTime) {}
			}
		}

		if (this.stopping) {
			this._maxTimeParam.value += delta;
		}

		this._timeParam.value = newTime;
		this._viewITParam.value.copy(this.client.camera.threeCamera.matrixWorld).transpose();
	};

	/**
	 * Resume the ParticleCurveTrail.
	 */
	ParticleCurveTrail.prototype.play = function() {
		if (!this.active) {
			if (this.starting || this.stopping || this._maxTimeParam.value === 1.0) {
				hemi.addRenderListener(this);
				this.active = true;
			} else {
				this.start();
			}
		}
	};

	/**
	 * Start the ParticleCurveTrail.
	 */
	ParticleCurveTrail.prototype.start = function() {
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
			this._decparam.value = 2.0;
			this._maxTimeParam.value = 2.0;
			this._timeParam.value = 1.0;
			hemi.addRenderListener(this);
		}
	};

	/**
	 * Stop the ParticleCurveTrail.
	 * 
	 * @param {boolean} opt_hard optional flag to indicate a hard stop (all particles disappear at
	 *     once)
	 */
	ParticleCurveTrail.prototype.stop = function(opt_hard) {
		if (this.active) {
			if (opt_hard) {
				this.endTime = -1.0;
			} else if (!this.stopping) {
				this.endTime = this._timeParam.value + 1.0;
			}

			this.starting = false;
			this.stopping = true;
		}
	};

	hemi.makeCitizen(ParticleCurveTrail, 'hemi.ParticleCurveTrail', {
		toOctane: ParticleCurveTrail.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility Methods
////////////////////////////////////////////////////////////////////////////////////////////////////

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
	}

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
	}

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
	}

	/*
	 * Take the existing vertex buffer in the given primitive and copy the data once for each of the
	 * desired number of particles. 
	 * 
	 * @param {THREE.Geometry} geometry the geoemtry to modify
	 * @param {number} numParticles the number of particles to create vertex
	 *     data for
	 */
	function modifyGeometry(geometry, numParticles) {
		var verts = geometry.vertices,
			faces = geometry.faces,
			faceVertexUvs = geometry.faceVertexUvs,
			numVerts = verts.length,
			numFaces = faces.length,
			ids = [],
			offsets = [],
			idOffsets = [];

		for (var i = 0; i < numVerts; i++) {
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
		};
	}

	/*
	 * Create a new material for a ParticleCurve to use.
	 * 
	 * @param {string} opt_type optional shader type to use (defaults to phong)
	 * @param {boolean} opt_trans optional flag indicating if material should support transparency
	 *     (defaults to true)
	 * @return {THREE.Material} the created material
	 */
	function newMaterial(opt_type, opt_trans) {
		var params = {
				color: 0xff0000,
				opacity: 1,
				transparent: opt_trans === undefined ? true : opt_trans
			},
			mat;

		if (opt_type === 'lambert') {
			mat = new THREE.MeshLambertMaterial(params);
		} else {
			mat = new THREE.MeshPhongMaterial(params);
		}

		return mat;
	}

	/*
	 * Set the parameters for the given Material so that it adds a color ramp to the particles using
	 * it.
	 * 
	 * @param {THREE.Material} material material to set parameters for
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
	}

	/*
	 * Set the parameters for the given Material so that it adds a scale ramp to the particles using
	 * it.
	 * 
	 * @param {THREE.Material} material material to set parameters for
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
	}

})();
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Sprite class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Sprite can display a 2d image on a plane with several options. The image can be made
	 * to always face the camera, and it can scale to stay the same size in the viewer. It can also
	 * cycle through a series of frames to create an animation effect, for a number of cycles or
	 * indefinitely.
	 * 
	 * @param {number} width the width of the sprite
	 * @param {number} height the height of the sprite
	 * @param {string} opt_source the location of a source image to start with (not implemented)
	 */
	var Sprite = function(client, parameters) {
		// before super(), set up all the maps and then assign the first in the series as the map
		var maps = parameters.maps,
			count = 0;

		/*
		 * The current animation time for the Sprite.
		 * @type number
		 */
		this._clock = 0;
		/*
		 * The current animation cycle for the Sprite.
		 * @type number
		 */
		this._cycle = 0;
		/*
		 * Array of textures to display as animation frames.
		 */
		this._maps = [];
		/*
		 * The number of cycles to run for before the Sprite stops animating.
		 * @type number
		 */
		this._maxCycles = 0;
		/*
		 * Flag indicating if Sprite animation is currently running.
		 * @type boolean
		 */
		this._running = false;
		/**
		 * The Client that the Sprite is being rendered by.
		 * @type hemi.Client
		 */
		this.client = client;
		/**
		 * The period of time that each frame of the Sprite's animation will display, in seconds.
		 * @type number
		 */
		this.period = 1;

		for (var i = 0, il = maps.length; i < il; ++i) {
			var map = maps[i];

			if (map instanceof THREE.Texture) {
				this._maps.push(map);
				handleTexture();
			} else {
				this.addFrame(map, handleTexture);
			}

			if (i === 0) {
				parameters.map = this._maps[0];
				THREE.Sprite.call(this, parameters);
			}
		}

		function handleTexture() {
			if (++count >= maps.length && parameters.callback) {
				parameters.callback();
			}
		}

		client.scene.add(this);
	};

	Sprite.prototype = new THREE.Sprite({ map: new THREE.Texture(new Image()) });
	Sprite.prototype.constructor = Sprite;

	/**
	 * Add an image to be used as a frame in the animation, or as a standalone image.
	 *
	 * @param {string} path the path to the image source
	 */
	Sprite.prototype.addFrame = function(path, opt_callback) {
		var texture = hemi.loadTextureSync(path, function(texture) {
				if (opt_callback) {
					opt_callback(texture);
				}
			});

		this._maps.push(texture);
	};

	/**
	 * Function to call on every render cycle. Scale or rotate the Sprite if needed, and update the
	 * frame if needed.
	 *
	 *	@param {Object} e render event
	 */
	Sprite.prototype.onRender = function(e) {
		if (!this._running) return;

		this._clock += e.elapsedTime;

		if (this._clock >= this.period) {
			this._cycle++;

			if (this._cycle === this._maxCycles) {
				this.stop();
			} else {
				this.setFrame(this._cycle);
				this._clock %= this.period;
			}
		}
	};

	/**
	 * Start the Sprite animating, for a set number of cycles, or pass in -1 for infinite looping.
	 *
	 * @param {number} opt_cycles number of cycles, defaults to one loop through the frames
	 */
	Sprite.prototype.run = function(opt_cycles) {
		if (!this._running) {
			this._cycle = 0;
			this._maxCycles = opt_cycles || this.samplers.length;
			this._clock = 0;
			this.setFrame(0);
			this._running = true;
			hemi.addRenderListener(this);
		}
	};

	/**
	 * Set the Sprite to display one of its frames.
	 *
	 * @param {number} index index of desired frame
	 */
	Sprite.prototype.setFrame = function(index) {
		// set the map to the frame at the given index
		if (this._maps.length > 0) {
			var ndx = index % this._maps.length;
			this.map = this._maps[ndx];
		}
	};

	/**
	 * Stop the animating frames.
	 */
	Sprite.prototype.stop = function() {
		if (this._running) {
			this._running = false;
			hemi.removeRenderListener(this);
		}
	}; 

	hemi.makeCitizen(Sprite, 'hemi.Sprite', {
	});

})();
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

(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Enum for different geometry shape types.
	 */
	hemi.ShapeType = {
		ARROW: 'arrow',
		BOX: 'box',
		CONE: 'cone',
		CUBE: 'cube',
		CUSTOM: 'custom',
		CYLINDER: 'cylinder',
		OCTA: 'octa',
		PLANE: 'plane',
		PYRAMID: 'pyramid',
		SPHERE: 'sphere',
		TETRA: 'tetra'
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Shape class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Shape is a wrapper class around basic geometric shapes such as cubes and spheres
	 * that allows them to interact with the World in complex ways.
	 * 
	 * @param {hemi.Client} client the Client that will render the Shape
	 * @param {Object} opt_config optional configuration for the Shape
	 */
	var Shape = function(client, opt_config) {
		this.client = client;
		this.config = opt_config || {};
		this.mesh = null;

		if (this.config.shape) {
			this.create();
		}
	};

	/*
	 * Remove all references in the Shape.
	 */
	Shape.prototype._clean = function() {
		if (this.mesh !== null) {
			this.mesh.cleanup();
			this.mesh = null;
		}

		this.client = null;
		this.config = {};
	};

	/*
	 * Octane properties for Shape.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Shape.prototype._octane = ['client', 'config', 'mesh', 'create'];

	/**
	 * Create the actual geometry for the Shape.
	 */
	Shape.prototype.create = function() {
		if (this.mesh === null) {
			this.mesh = new hemi.Mesh();
		}

		hemi.createShape(this.config, this.mesh);
		this.setName(this.name);

		if (this.mesh.parent === undefined) {
			this.client.scene.add(this.mesh);
		} else {
			// need the renderer to do some setup
			this.mesh.__webglInit = false;
			this.mesh.__webglActive = false;
			this.client.scene.__objectsAdded.push(this.mesh);
			this.client.renderer.initWebGLObjects(this.client.scene);
		}
	};

	/**
	 * Set the color of the Shape.
	 * 
	 * @param {number} color the new color (in hex)
	 */
	Shape.prototype.setColor = function(color) {
		if (this.config.material) {
			this.config.material.color = color;
		} else {
			this.config.color = color;
			this.mesh.material.color = color;
		}
	};

	/**
	 * Set the name for the Shape as well as its Mesh and geometry.
	 * 
	 * @param {string} name the new name
	 */
	Shape.prototype.setName = function(name) {
		this.name = name;
		this.mesh.name = this.name + ' Mesh';
		this.mesh.geometry.name = this.name + ' Geometry';
	};

	/**
	 * Set the opacity of the Shape.
	 * 
	 * @param {number} opacity the new opacity (0 to 1)
	 */
	Shape.prototype.setOpacity = function(opacity) {
		this.config.opacity = opacity;
		this.mesh.material.opacity = opacity;
		this.mesh.material.transparent = opacity < 1;
	};

	/**
	 * Set the shape type of the Shape.
	 * 
	 * @param {string} type the new shape type
	 */
	Shape.prototype.setType = function(type) {
		this.config.shape = type;
		this.create();
	};
	
	/**
	 * Convenience method for translating the mesh.
	 * 
	 * @param {number} x amount to translate in the x direction 
	 * @param {number} y amount to translate in the y direction
	 * @param {number} z amount to translate in the z direction
	 */
	Shape.prototype.translate = function(x, y, z) {
		this.mesh.translateX(x);
		this.mesh.translateY(y);
		this.mesh.translateZ(z);
	};

	hemi.makeCitizen(Shape, 'hemi.Shape', {
		cleanup: Shape.prototype._clean,
		toOctane: Shape.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Create a geometric shape with the given properties. Valid properties:
	 * shape: the type of shape to create
	 * color: the color of the shape
	 * opacity: the opacity of the shape
	 * material: the Material to use for the shape (overrides color and opacity)
	 * height/h: height of the shape
	 * width/w: width of the shape
	 * depth/d: depth of the shape
	 * size: size of the shape
	 * radius/r: radius of the shape
	 * radiusB/r1: bottom radius of the shape
	 * radiusT/r2: top radius of the shape
	 * tail: length of the tail of the shape
	 * vertices/v: a series of vertices defining the shape
	 * faces/f: a series of faces referencing three vertices each
	 * faceVertexUvs/uvs: a series of uv coordinates
	 * 
	 * @param {Object} shapeInfo properties of the shape to create
	 * @param {hemi.Mesh} opt_mesh optional Mesh to contain the geometry
	 * @return {THREE.Mesh} the parent Mesh of the created geometry
	 */
	hemi.createShape = function(shapeInfo, opt_mesh) {
		var mesh = opt_mesh || new hemi.Mesh(),
			shapeType = shapeInfo.shape || hemi.ShapeType.Box;

		if (!mesh.material) {
			if (shapeInfo.material !== undefined) {
				mesh.material = shapeInfo.material;
			} else {
				var color = shapeInfo.color || 0x000000,
					opacity = shapeInfo.opacity === undefined ? 1 : shapeInfo.opacity;

				mesh.material = new THREE.MeshPhongMaterial({
					color: color,
					opacity: opacity,
					transparent: opacity < 1
				});
			}
		}

		switch (shapeType.toLowerCase()) {
			case hemi.ShapeType.BOX:
				var w = shapeInfo.width !== undefined ? shapeInfo.width :
						shapeInfo.w !== undefined ? shapeInfo.w : 1,
					h = shapeInfo.height !== undefined ? shapeInfo.height :
						shapeInfo.h !== undefined ? shapeInfo.h : 1,
					d = shapeInfo.depth !== undefined ? shapeInfo.depth :
						shapeInfo.d !== undefined ? shapeInfo.d : 1;

				mesh.geometry = new THREE.CubeGeometry(w, h, d);
				break;
			case hemi.ShapeType.CUBE:
				var size = shapeInfo.size !== undefined ? shapeInfo.size : 1;

				mesh.geometry = new THREE.CubeGeometry(size, size, size);
				break;
			case hemi.ShapeType.SPHERE:
				var r = shapeInfo.radius !== undefined ? shapeInfo.radius :
						shapeInfo.r !== undefined ? shapeInfo.r : 1;

				mesh.geometry = new THREE.SphereGeometry(r, 24, 12);
				break;
			case hemi.ShapeType.CYLINDER:
				var r1 = shapeInfo.radiusB !== undefined ? shapeInfo.radiusB :
						shapeInfo.r1 !== undefined ? shapeInfo.r1 : 1,
					r2 = shapeInfo.radiusT !== undefined ? shapeInfo.radiusT :
						shapeInfo.r2 !== undefined ? shapeInfo.r2 : 1,
					h = shapeInfo.height !== undefined ? shapeInfo.height :
						shapeInfo.h !== undefined ? shapeInfo.h : 1;

				mesh.geometry = new THREE.CylinderGeometry(r1, r2, h, 24);
				break;
			case hemi.ShapeType.CONE:
				var r = shapeInfo.radius !== undefined ? shapeInfo.radius :
						shapeInfo.r !== undefined ? shapeInfo.r : 1,
					h = shapeInfo.height !== undefined ? shapeInfo.height :
						shapeInfo.h !== undefined ? shapeInfo.h : 1;

				mesh.geometry = new THREE.CylinderGeometry(0, r, h, 24);
				break;
			case hemi.ShapeType.PLANE:
				var w = shapeInfo.width !== undefined ? shapeInfo.width :
						shapeInfo.w !== undefined ? shapeInfo.w : 1,
					h = shapeInfo.height !== undefined ? shapeInfo.height :
						shapeInfo.h !== undefined ? shapeInfo.h : 1;

				mesh.geometry = new THREE.PlaneGeometry(w, h);
				break;
			case hemi.ShapeType.ARROW:
				mesh.geometry = createArrow(
					shapeInfo.size !== undefined ? shapeInfo.size : 1,
					shapeInfo.tail !== undefined ? shapeInfo.tail : 1,
					shapeInfo.depth !== undefined ? shapeInfo.depth : 1);
				break;
			case hemi.ShapeType.TETRA:
				mesh.geometry = createTetra(shapeInfo.size !== undefined ? shapeInfo.size : 1);
				break;
			case hemi.ShapeType.OCTA:
				var size = shapeInfo.size !== undefined ? shapeInfo.size : 1;

				mesh.geometry = new THREE.OctahedronGeometry(size/2, 0);
				break;
			case hemi.ShapeType.PYRAMID:
				mesh.geometry = createPyramid(
					shapeInfo.height !== undefined ? shapeInfo.height :
						shapeInfo.h !== undefined ? shapeInfo.h : 1,
					shapeInfo.width !== undefined ? shapeInfo.width :
						shapeInfo.w !== undefined ? shapeInfo.w : 1,
					shapeInfo.depth !== undefined ? shapeInfo.depth :
						shapeInfo.d !== undefined ? shapeInfo.d : 1);
				break;
			case hemi.ShapeType.CUSTOM:
				mesh.geometry = createCustom(
					shapeInfo.vertices !== undefined ? shapeInfo.vertices :
						shapeInfo.v !== undefined ? shapeInfo.v : [],
					shapeInfo.faces !== undefined ? shapeInfo.faces :
						shapeInfo.f !== undefined ? shapeInfo.f : [],
					shapeInfo.faceVertexUvs !== undefined ? shapeInfo.faceVertexUvs :
						shapeInfo.uvs !== undefined ? shapeInfo.uvs : []);
				break;
		}

		mesh.geometry.computeBoundingSphere();
		mesh.boundRadius = mesh.geometry.boundingSphere.radius;
		return mesh;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Create arrow geometry.
	 * 
	 * @param {number} size the scale of the arrow head on each axis
	 * @param {number} tail the length of the arrow tail
	 * @param {number} depth the depth to extrude the arrow
	 * @return {THREE.Geometry} the arrow geometry
	 */
	function createArrow(size, tail, depth) {
		var totalWidth = size + tail,
			halfSize = size / 2,
			halfWidth = totalWidth / 2,
			heightDif = halfSize / 2,
			curX = 0,
			curY = halfWidth,
			points = [
				new THREE.Vector2(curX, curY),
				new THREE.Vector2(curX += halfSize, curY -= size),
				new THREE.Vector2(curX -= heightDif, curY),
				new THREE.Vector2(curX, curY -= tail),
				new THREE.Vector2(curX -= halfSize, curY),
				new THREE.Vector2(curX, curY += tail),
				new THREE.Vector2(curX -= heightDif, curY),
				new THREE.Vector2(curX += halfSize, curY += size)
			],
			shape = new THREE.Shape(points);

		return shape.extrude({amount: depth, bevelEnabled: false});
	}

	/**
	 * Create custom geometry from lists of vertices, faces, and uvs.
	 * 
	 * @param {THREE.Vertex[]} verts list of vertices
	 * @param {THREE.Face3[]} faces list of faces. The normal is determined by right-hand rule (i.e.
	 *     polygon will be visible from side from which vertices are listed in counter-clockwise
	 *     order)
	 * @param {THREE.UV[3][]} faceUvs list of face vertex uvs
	 * @return {THREE.Geometry} the custom geometry
	 */
	function createCustom(verts, faces, faceUvs) {
		var geo = new THREE.Geometry();

		geo.vertices = verts;	
		geo.faces = faces;
		geo.faceVertexUvs[0] = faceUvs;

		for (var i = 0, il = faces.length; i < il; ++i) {
			var face = faces[i],
				normal = hemi.utils.computeNormal(verts[face.a], verts[face.b], verts[face.c]);

			face.normal.copy(normal);
			face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		}

		geo.computeCentroids();
		geo.mergeVertices();
		return geo;
	}

	/**
	 * Create pyramid geometry.
	 * 
	 * @param {number} h height of pyramid (along z-axis)
	 * @param {number} w width of pyramid (along x-axis)
	 * @param {number} d depth of pyramid (along y-axis)
	 * @return {THREE.Geometry} the pyramid geometry
	 */
	function createPyramid(h, w, d) {
		var halfH = h / 2,
			halfW = w / 2,
			halfD = d / 2,
			v = [new THREE.Vertex(new THREE.Vector3(halfW, -halfH, halfD)),
				 new THREE.Vertex(new THREE.Vector3(-halfW, -halfH, halfD)),
				 new THREE.Vertex(new THREE.Vector3(-halfW, -halfH, -halfD)),
				 new THREE.Vertex(new THREE.Vector3(halfW, -halfH, -halfD)),
				 new THREE.Vertex(new THREE.Vector3(0, halfH, 0))],
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

		return createCustom(v, f, uvs);
	}

	/*
	 * Create tetrahedron geometry.
	 * 
	 * @param {number} size size of cube in which tetrahedron will be inscribed
	 * @return {THREE.Geometry} the tetrahedron geometry
	 */
	function createTetra(size) {
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

		return createCustom(v, f, uvs);
	}

})();
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

	var clientData = [];

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	hemi.fx = hemi.fx || {};

	hemi.fx.cleanup = function() {
		clientData = [];
	};

	/**
	 * Removes the fog for the given client
	 * 
	 * @param {hemi.Client} client the client view to clear fog for
	 */
	hemi.fx.clearFog = function(client) {
		var data = findData(client);

		if (data && data.fog) {
			client.scene.fog = undefined;
			client.setBGColor(data.oldBGHex);

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
	 * @param {number} far the viewing distance where fog opacity obscures the subject
	 */
	hemi.fx.setFog = function(client, color, near, far) {
		var data = findData(client),
			objs = client.scene.__webglObjects.concat(client.scene.__webglObjectsImmediate),
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
			refresh = true;
		}

		data.fog.color.setHex(color);
		data.fog.near = near;
		data.fog.far = far;

		client.scene.fog = data.fog;
		client.setBGColor(color);

		if (refresh) {
			// go through all the materials and update
			// first get the materials
			for (var i = 0, il = objs.length; i < il; i++) {
				var webglObject = objs[i], 
					object = webglObject.object, 
					opaque = webglObject.opaque, 
					transparent = webglObject.transparent;

				if (opaque) {
					mats.push({
						mat: opaque,
						obj: object
					});
				}
				if (transparent) {
					mats.push({
						mat: transparent,
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
	 * Sets the opacity for the given object.
	 * 
	 * @param {hemi.Client} client the client view in which to change opacity
	 * @param {THREE.Mesh} object the object whose material's opacity we're changing
	 * @param {THREE.Material} material the material to set opacity on
	 * @param {number} opacity the opacity value between 0 and 1
	 */
	hemi.fx.setOpacity = function(client, object, opacity) {
		var objs = client.scene.__webglObjects.concat(client.scene.__webglObjectsImmediate),
			material = object.material,
			sharedObjects = [];

		for (var i = 0, il = objs.length; i < il; i++) {
			var webglObject = objs[i],
				obj = webglObject.object;
			
			if (obj.material === material) {
				sharedObjects.push(webglObject);
			}
		}

		if (sharedObjects.length > 0) {
			material.transparent = opacity < 1;
			material.opacity = opacity;
			
			// setup transparent and opaque list for objects with the same material
			for (var i = 0, il = sharedObjects.length; i < il; i++) {
				var obj = sharedObjects[i];
				unrollBufferMaterial(obj);
				unrollImmediateBufferMaterial(obj);
			}
		}
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	function findData(client) {
		var retVal = null;
		for (var i = 0, il = clientData.length; i < il && retVal === null; i++) {
			if (clientData[i].client === client) {
				retVal = clientData[i];
			}
		}
		return retVal;
	}

	/*
	 * The following three functions are exact duplicates of the functions in WebGLRenderer. Until
	 * those functions are exposed, we have to duplicate them here.
	 */
	function addToFixedArray(where, what) {
		where.list[ where.count ] = what;
		where.count += 1;
	}

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
	}

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
	}

})();
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// TextureSet class
////////////////////////////////////////////////////////////////////////////////////////////////////

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

})();
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Timer class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Timer is a simple countdown timer that can be used to script behavior and sequence
	 * events.
	 */
	var Timer = function() {
		/*
		 * The epoch time that this Timer was last started (or resumed).
		 * @type number
		 */
		this._started = null;
		/*
		 * The elapsed time (not including any currently running JS timer).
		 * @type number
		 */
		this._time = 0;
		/*
		 * The id of the current JS timer.
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

	/*
	 * Remove all references in the Timer.
	 */
	Timer.prototype._clean = function() {
		if (this._timeId !== null) {
			clearTimeout(this._timeId);
			this._timeId = null;
			this._started = null;
		}
	};

	/*
	 * Array of Hemi Messages that Timer is known to send.
	 * @type string[]
	 */
	Timer.prototype._msgSent = [hemi.msg.start, hemi.msg.stop];

	/*
	 * Octane properties for Timer.
	 * @type string[]
	 */
	Timer.prototype._octane = ['startTime'];

	/**
	 * Pause the Timer if it is currently running.
	 */
	Timer.prototype.pause = function() {
		if (this._timeId !== null) {
			clearTimeout(this._timeId);
			this._timeId = null;

			var stopped = (new Date()).getTime();
			this._time += (stopped - this._started);
		}
	};

	/**
	 * Reset the Timer so it is ready to count down again.
	 */
	Timer.prototype.reset = function() {
		this._started = null;
		this._time = 0;
		this._timeId = null;
	};

	/**
	 * Resume the Timer's count down if it is currently paused.
	 */
	Timer.prototype.resume = function() {
		if (this._timeId === null && this._started !== null) {
			this._timeId = setTimeout(handleTimeout, this.startTime - this._time, this);
			this._started = (new Date()).getTime();
		}
	};

	/**
	 * Start the Timer's count down. If it is currently running, restart the Timer from its initial
	 * count down value.
	 */
	Timer.prototype.start = function() {
		if (this._timeId !== null) {
			clearTimeout(this._timeId);
		}

		this._time = 0;
		this.send(hemi.msg.start, {
			time: this.startTime
		});
		this._timeId = setTimeout(handleTimeout, this.startTime, this);
		this._started = (new Date()).getTime();
	};

	/**
	 * Stop the Timer if it is currently running or paused. This resets any currently elapsed time
	 * on the Timer.
	 */
	Timer.prototype.stop = function() {
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
	};

	hemi.makeCitizen(Timer, 'hemi.Timer', {
		cleanup: Timer.prototype._clean,
		toOctane: Timer.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Utility to handle the Timer naturally finishing its countdown.
	 */
	function handleTimeout(timer) {
		timer.reset();
		timer.send(hemi.msg.stop, {
			time: timer.startTime
		});
	}

})();
