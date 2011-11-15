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

var hemi = (function(hemi) {
	
	hemi.Client = function(renderer) {
		renderer.domElement.style.width = "100%";
		renderer.domElement.style.height = "100%";
		this.camera = new hemi.Camera();
		this.renderer = renderer;
		this.scene = new THREE.Scene();
		this.scene.add(this.camera.light);
		this.lights = [];
        hemi.input.init(renderer.domElement);
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
		
		addLight: function(light) {
			this.lights.push(light);
			this.scene.add(light);
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
		},
		
		setBGColor: function(hex, opt_alpha) {
			this.renderer.setClearColorHex(hex, opt_alpha == null ? 1 : opt_alpha);
		}
	};
	
	return hemi;
})(hemi || {});
