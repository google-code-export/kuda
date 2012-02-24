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

	/**
	 * @class A Light is a wrapper class around light types.
	 * 
	 * @param {hemi.Client} client the Client that will render the Light
	 * @param {Object} config Configurations for light
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
            }
        }
    }
    Light.prototype.removeFromScene = function() {
        if (this.client) {
            var scene = this.client.scene;
            if (this.light) {
                scene.remove(this.light);
            }
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

	hemi.makeCitizen(Light, 'hemi.Light', {
		cleanup: Light.prototype._clean,
		toOctane: Light.prototype._octane
	});

    hemi.makeOctanable(THREE.Vector3, 'THREE.Vector3', ['x', 'y', 'z']);
    hemi.makeOctanable(THREE.AmbientLight, 'THREE.AmbientLight', ['color']);    
    hemi.makeOctanable(THREE.PointLight, 'THREE.PointLight', ['color', 'intensity', 'position', 'distance']);
    //hemi.makeOctanable(THREE.DirectionalLight, 'THREE.DirectionalLight', ['color', 'intensity', 'position', 'distance', 'target']);
    //hemi.makeOctanable(THREE.SpotLight, 'THREE.SpotLight', ['color', 'intensity', 'position', 'distance']);
    

})();
