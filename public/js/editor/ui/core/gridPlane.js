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

var editor = (function(module) {
	module.ui = module.ui || {};
	
    module.EventTypes = module.EventTypes || {};
	
	var vertShaderVars = "varying float v_alpha;\n" +
			"varying vec4 v_orig_position;\n\n",
		vertShaderFunc = "void setAlpha(vec4 position) {\n" +
			"  float disX = abs(position.x);\n" +
			"  float disZ = abs(position.z);\n" +
			"  float max = float(EXTENT);\n" +
			"  float temp = disX > disZ ? disX / max : disZ / max;\n" +
			"  float powered = temp * temp * temp;\n" +
			"  v_alpha = 1.0 - powered;\n" +
			"  v_orig_position = position;\n" +
			"}\n",
		vertShaderCall = "setAlpha(position);";
			
	var fragShaderVars = "uniform vec4 xAxisColor;\n" +
			"uniform vec4 zAxisColor;\n" +
			"varying float v_alpha;\n" +
			"varying vec4 v_orig_position;\n\n",
		fragShaderFunc = "void checkAxis(vec4 position) {\n" +
			"  float marker = float(MARKER);\n" +
			"  if (position.z == 0.0) {\n" +
			"    gl_FragColor = vec4(xAxisColor.rgb, gl_FragColor.a);\n" +
			"  } else if (position.x == 0.0) {\n" +
			"    gl_FragColor = vec4(zAxisColor.rgb, gl_FragColor.a);\n" +
			"  }\n" +
			"}\n",
		fragShaderCall = "  gl_FragColor = vec4(gl_FragColor.rgb, v_alpha * gl_FragColor.a);\n" +
			"  checkAxis(v_orig_position);\n";
	
	module.ui.GridPlane = module.Class.extend({
		init: function(extent, fidelity) {
			this.extent = extent;
			this.fidelity = fidelity;
				
			this.createShape();	
			this.modifyShader();	
		},
		
		createShape: function() {
			var mat = hemi.core.material.createConstantMaterial(
					hemi.core.mainPack, 
					hemi.view.viewInfo, 
					[0.6, 0.6, 0.6, 0.4],
					true),
				markerMat = hemi.core.material.createConstantMaterial(
					hemi.core.mainPack, 
					hemi.view.viewInfo, 
					[0.5, 0.5, 0.5, 0.8],
					true),
				division = this.extent / this.fidelity,
				fullExtent = this.extent * 2,
				marker = this.fidelity * 5,
				markerDivision = this.extent / marker; 		
		
			// Setup a state to bring the lines forward.
			var state = hemi.core.mainPack.createObject('State');
			state.getStateParam('PolygonOffset2').value = -1.0;
			state.getStateParam('FillMode').value = hemi.core.o3d.State.WIREFRAME;
			
			mat.state = state;
			
			// create the actual shape
			this.transform = hemi.core.mainPack.createObject('Transform');
			this.transform.addShape(createPlane(fullExtent, fullExtent, division, 
				division, mat, hemi.core.mainPack));
			this.transform.addShape(createPlane(fullExtent, fullExtent, 
				markerDivision, markerDivision, markerMat, hemi.core.mainPack, 0.01));
			
			this.material = mat;
			this.markerMaterial = markerMat;
			this.transform.parent = hemi.core.client.root;
		},
		
		modifyShader: function() {
			modifyMaterial(this.material, this.extent, this.fidelity * 5.0);	
			modifyMaterial(this.markerMaterial, this.extent, this.fidelity * 5.0);
			
			this.markerMaterial.getParam('xAxisColor').value = [1.0, 0.0, 0.0, 1.0];
			this.markerMaterial.getParam('zAxisColor').value = [0.0, 0.0, 1.0, 1.0];
		},
		
		setVisible: function(visible) {
			this.transform.visible = visible;
		}
	});
	
	var modifyMaterial = function(material, extent, marker) {
		var gl = material.gl,
			program = material.effect.program_,
			shad = hemi.utils.getShaders(material),
			fragShd = shad.fragShd,
			fragSrc = shad.fragSrc,
			vertShd = shad.vertShd,
			vertSrc = shad.vertSrc;
			
		if (vertSrc.search('v_alpha') < 0) {			
			vertSrc = hemi.utils.combineVertSrc(vertSrc, {
				postHdr: vertShaderVars,
				postSprt: vertShaderFunc.replace(/EXTENT/g, extent),
				postGlob: vertShaderCall
			});
			
			gl.detachShader(program, vertShd);
			material.effect.loadVertexShaderFromString(vertSrc);
		}
		if (fragSrc.search('v_alpha') < 0) {			
			fragSrc = hemi.utils.combineFragSrc(fragSrc, {
				postHdr: fragShaderVars,
				postSprt: fragShaderFunc.replace(/MARKER/g, marker),
				postGlob: fragShaderCall
			});
			gl.detachShader(program, fragShd);
			material.effect.loadPixelShaderFromString(fragSrc);
		}
			
		material.effect.createUniformParameters(material);
	};
	
	var createPlane = function(width, 
							   depth, 
							   subDivWidth, 
							   subDivDepth, 
							   material, 
							   pack,
							   opt_y) {		
		var vertexInfo = o3djs.primitives.createVertexInfo();
		var positionStream = vertexInfo.addStream(
			3, o3djs.base.o3d.Stream.POSITION);
		var normalStream = vertexInfo.addStream(
			3, o3djs.base.o3d.Stream.NORMAL);
		var texCoordStream = vertexInfo.addStream(
			2, o3djs.base.o3d.Stream.TEXCOORD, 0);
		var y = opt_y || 0;
		
		// Generate the individual vertices in our vertex buffer.
		for (var z = 0; z <= subDivDepth; z++) {
			var v = z / subDivDepth;
			for (var x = 0; x <= subDivWidth; x++) {
				var u = x / subDivWidth;
				positionStream.addElement(width * u - width * 0.5,
					y, depth * v - depth * 0.5);
				normalStream.addElement(0, 1, 0);
				texCoordStream.addElement(u, 1 - v);
			}
		}
		
		var numVertsAcross = subDivWidth + 1;
		
		for (var z = 0; z < subDivDepth; z++) {
			for (var x = 0; x < subDivWidth; x++) {
				vertexInfo.indices.push(z * numVertsAcross + x);
				vertexInfo.indices.push(z * numVertsAcross + x + 1);
				vertexInfo.indices.push((z + 1) * numVertsAcross + x + 1);
				vertexInfo.indices.push((z + 1) * numVertsAcross + x);
				vertexInfo.indices.push(z * numVertsAcross + x);
				vertexInfo.indices.push((z + 1) * numVertsAcross + x);
				vertexInfo.indices.push(z * numVertsAcross + x + 1);
				vertexInfo.indices.push((z + 1) * numVertsAcross + x + 1);
			}
		}						
		
		return vertexInfo.createShapeByType(pack, material, 
			o3djs.base.o3d.Primitive.LINELIST);
	};
	
	return module;
})(editor || {});
