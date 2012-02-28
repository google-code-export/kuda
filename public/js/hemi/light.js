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
	 * Enum for different light types.
	 */
	hemi.LightType = {
        POINT: 'point',
        SPOT: 'spot',
        DIRECTIONAL: 'directional',
        AMBIENT: 'ambient'
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Light class
////////////////////////////////////////////////////////////////////////////////////////////////////
    var clientData = [],
        mats = [];
	/**
	 * @class A Light is a wrapper class around light types.
	 * 
	 * @param {hemi.Client} client the Client that will render the Light
	 * @param {Object} light A THREE.js light object
	 */
	var Light = function(client, light) {
        this.client = client;
        this.light = light;
        this.name = '';
        if (this.light) {
            this.addToScene();
        }
	};

	/*
	 * Remove all references in the Shape.
	 */
	Light.prototype._clean = function() {
        if (this.client && this.client.scene) {
            this.removeFromScene();
        }
		this.client = null;
		this.light = null;
        this.name = '';
	};

	/*
	 * Octane properties for Shape.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Light.prototype._octane = ['client', 'light','addToScene'];
    
    Light.prototype.addToScene = function() {
        if (this.client) {
            var scene = this.client.scene;
            if (this.light) {
                scene.add(this.light);
                this.updateTargetMatrix();
            }
        }
    }
    Light.prototype.removeFromScene = function() {
        if (this.client) {
            var scene = this.client.scene;
            if (this.light) {
                scene.remove(this.light);
                this.updateTargetMatrix();
            }
        }
    };
    
    Light.prototype.updateTargetMatrix = function() {
        if (this.light.target) {
            this.light.target.updateMatrix();
            this.light.target.updateMatrixWorld();  
        }
    };
	/**
	 * Set the name for the Light object.
	 * 
	 * @param {string} name the new name
	 */
	Light.prototype.setName = function(name) {
		this.name = name;
	};
    
    Light.prototype.initMaterial = function() {
    
        var data = findData(this.client),
            objs = this.client.scene.__webglObjects.concat(this.client.scene.__webglObjectsImmediate);
        if (!data) {
            data = {
                client: this.client
            };
            clientData.push(data);
        }
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
		for (var i = 0, il = data.materials.length; i < il; i++) {
			var matData = data.materials[i],
				material = matData.mat,
				object = matData.obj,
				fog = this.client.scene.fog;

				this.client.renderer.initMaterial(material, this.client.scene.__lights, 
					fog, object);
		}
    }

	hemi.makeCitizen(Light, 'hemi.Light', {
		cleanup: Light.prototype._clean,
		toOctane: Light.prototype._octane
	});

    hemi.makeOctanable(THREE.Vector3, 'THREE.Vector3', ['x', 'y', 'z']);
    hemi.makeOctanable(THREE.AmbientLight, 'THREE.AmbientLight', ['color']);    
    hemi.makeOctanable(THREE.PointLight, 'THREE.PointLight', ['color', 'intensity', 'position', 'distance']);
    hemi.makeOctanable(THREE.DirectionalLight, 'THREE.DirectionalLight', ['color', 'intensity', 'position', 'distance', 'target']);
    hemi.makeOctanable(THREE.SpotLight, 'THREE.SpotLight', ['color', 'intensity', 'position', 'distance', 'target']);
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

})();
