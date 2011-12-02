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

	THREE.Object3D.prototype.pickable = true;

	var getObject3DsRecursive = function(name, obj3d, returnObjs) {
			for (var i = 0; i < obj3d.children.length; ++i) {
				var child = obj3d.children[i];

				if (child.name === name) {
					returnObjs.push(child);
				}

				getObject3DsRecursive(name, child, returnObjs)
			}
		};
	    
	hemi.ModelBase = function(client) {
		this.client = client;
		this.fileName = null;
		this.root = null;
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
				that.root = collada.scene;
				that.client.scene.add(that.root);
				that.send(hemi.msg.load, {});
			});
		},

		setFileName: function(fileName, callback) {
			this.fileName = fileName;
			this.load(callback);
		}
	};

	hemi.makeCitizen(hemi.ModelBase, 'hemi.Model', {
		cleanup: function() {
			this.client.scene.remove(this.root);
			this.client = null;
			this.root = null;
		},
		msgs: [hemi.msg.load],
		toOctane: ['client', 'fileName', 'load']
	});

	return hemi;
})(hemi || {});
