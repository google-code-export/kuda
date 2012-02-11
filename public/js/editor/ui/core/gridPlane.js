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

(function(editor) {
	editor.ui = editor.ui || {};
	
	editor.ui.GridPlane = function(client, extent, fidelity) {
		this.extent = extent;
		this.fidelity = fidelity;
		this.client = client;
			
		this.createShape();	
	};
		
	editor.ui.GridPlane.prototype.createShape = function() {
		var mat = new THREE.MeshPhongMaterial({
				color: 0x666666,
				opacity: 0.2,
				wireframe: true
			}),
			markerMat = new THREE.MeshPhongMaterial({
				color: 0x666666,
				lighting: false,
				opacity: 0.5,
				wireframe: true
			}),
			division = this.extent / this.fidelity,
			fullExtent = this.extent * 2,
			marker = this.fidelity * 5,
			markerDivision = this.extent / marker;
		
		// create the actual shape
		var mainPlane = new THREE.Mesh(new THREE.PlaneGeometry(fullExtent, fullExtent, division, 
				division), mat),
			markerPlane = new THREE.Mesh(new THREE.PlaneGeometry(fullExtent, fullExtent, 
				markerDivision, markerDivision), markerMat);
			coloredPlane = new THREE.Mesh(new THREE.PlaneGeometry(fullExtent, fullExtent), 
				new THREE.MeshBasicMaterial({
					color: 0x75d0f4,
					opacity: 0.1,
					transparent: true
				}));
				
		this.transform = new THREE.Object3D();
		this.transform.add(mainPlane);
		this.transform.add(markerPlane);
		this.transform.add(coloredPlane);
		coloredPlane.translateZ(-0.1);
		this.transform.rotation.x = -Math.PI/2;
		
		this.material = mat;
		this.markerMaterial = markerMat;
		this.client.scene.add(this.transform);

		coloredPlane.doubleSided = true;
		hemi.utils.centerGeometry(coloredPlane);
	};

	editor.ui.GridPlane.prototype.setClient = function(client) {
		this.client = client;
		this.createShape();
	};

	editor.ui.GridPlane.prototype.setVisible = function(visible) {
		this.transform.visible = visible;
	};
	
})(editor);
