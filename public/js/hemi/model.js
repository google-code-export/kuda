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
			this.materials = [];
		},
		msgs: [hemi.msg.load],
		toOctane: ['fileName', 'root', 'scene', 'load']
	});

	return hemi;
})(hemi || {});
