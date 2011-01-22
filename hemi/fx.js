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

	hemi.fx = hemi.fx || {};

	/**
	 * 	{
	 *		type      : string ->
	 *			'texture','phong','lambert','basic','custom'
	 *		color     : float4	
	 * 		color1    : float4
	 *      color2    : float4
	 * 		diffuse   : [float4 | url]
	 *		ambient   : [float4 | url]
	 *		emissive  : [float4 | url]
	 *		shader    : [string | url]
	 *		opacity   : float
	 *      light     : boolean (light object?)
	 *		wireframe : boolean
	 *		specular  : float4
	 *		shininess : float
	 *		texture   : url
	 *		texture1  : url
	 *		texture2  : url
	 *      weight    : float
	 *		normalmap : url
	 *      fog       : boolean
	 *	}
	 *
	 */
	
	hemi.fx.create = function(spec,callback) {
		switch (spec.type) {
			case 'constant':
				if (spec.texture) {
					return hemi.fx.createConstantTexture(spec.texture, callback);
				} else {
					callback(hemi.core.material.createConstantMaterial(
						hemi.core.mainPack,
						hemi.view.viewInfo,
						spec.color,
						spec.color[3] < 1));
					return;
				}
				break;
			case 'basic':
				if (spec.texture) {
					return hemi.fx.createBasicTexture(spec.texture, callback);
				} else {
					callback(hemi.core.material.createBasicMaterial(
						hemi.core.mainPack,
						hemi.view.viewInfo,
						spec.color,
						spec.color[3] < 1));
					return;
				}
				break;	
			case 'grid':
//				if (callback) {
//					callback(hemi.fx.createGridTexture(spec));
//				} else {
//					return hemi.fx.createGridTexture(spec);
//				}
				break;
		}
	};
	
	hemi.fx.modify = function(material, spec) {
		switch (spec.type) {
			case 'constant':
				material.effect = null;
				var diffuseParam = material.getParam('diffuseSampler');
				if (diffuseParam) {
					var paramSampler = material.createParam('emissiveSampler', 'ParamSampler');
					paramSampler.value = diffuseParam.value;
					material.removeParam(diffuseParam);
				}
				o3djs.material.attachStandardEffect(
					hemi.core.mainPack, 
					material, 
					hemi.view.viewInfo, 
					'constant');
				return material;
				break;
		}
	};
	
	hemi.fx.createConstantTexture = function(path, callback) {
		var url = o3djs.util.getCurrentURI() + path;
		var material;
		hemi.core.io.loadTexture(hemi.core.mainPack,url,function(texture, e) {
			if (e) {
				alert(e);
			} else {
				material = hemi.core.material.createConstantMaterial(
					hemi.core.mainPack,
					hemi.view.viewInfo,
					texture); 
				callback(material);
			}
		});
	};
	
	hemi.fx.createBasicTexture = function(path, callback) {
		var url = o3djs.util.getCurrentURI() + path;
		var material;
		hemi.core.io.loadTexture(hemi.core.mainPack,url,function(texture, e) {
			if (e) {
				alert(e);
			} else {
				material = hemi.core.material.createBasicMaterial(
					hemi.core.mainPack,
					hemi.view.viewInfo,
					texture); 
				callback(material);
			}
		});
	}; 
	
	hemi.fx.createGridTexture = function(spec) {
		var s = spec || {},
			material = hemi.core.mainPack.createObject('Material');
		material.effect = hemi.core.mainPack.createObject('Effect');
		material.effect.loadFromFXString(hemi.fx.gridShader);
		material.effect.createUniformParameters(material);
		material.getParam('o3d.drawList').value = hemi.view.viewInfo.zOrderedDrawList;
		material.getParam('color1').value = s.color1 || [0,0,0,1];
		material.getParam('color2').value = s.color2 || [0,0,0,0];
		material.getParam('squares').value = s.squares || 10;
		material.getParam('thickness').value = s.thickness || 0.1;		
		return material;
	};
	
	hemi.fx.addFog = function(material, fog) {		
		// get the source
		var gl = material.gl,
			program = material.effect.program_,
			shaders = gl.getAttachedShaders(program),
			source1 = gl.getShaderSource(shaders[0]),
			source2 = gl.getShaderSource(shaders[1]),
			fragSrc = source1.search('gl_FragColor') > 0 ? source1 : source2,
			vertSrc = fragSrc === source1 ? source2 : source1,
			srcCombineFcn = function(head, tail, src, global, retVar) {
				var hdrNdx = src.search('void main'),
					endNdx = src.search(global),
					end = '';
				
				src = src.replace(global, retVar);
				end = src.slice(endNdx);			
				endNdx = endNdx + end.search(';') + 1;
				src = src.slice(0, hdrNdx) + head 
					+ src.slice(hdrNdx, endNdx) + tail
					+ src.slice(endNdx);
					
				return src;
			};
		
		// detach the previous shaders
		gl.detachShader(program, shaders[0]);
		gl.detachShader(program, shaders[1]);
		
		// modify the shaders
		if (vertSrc.search('fog') < 0) {
			var vertHdr = "varying float fogAlpha;\
					uniform float fogStart;\
					uniform float fogEnd;",
				vertEnd = "float z = pos[2];\
					if (z <= fogStart) {\
						fogAlpha = 0.0;\
					}\
					else if (z >= fogEnd) {\
						fogAlpha = 1.0;\
					}\
					else {\
						fogAlpha = (z - fogStart)/(fogEnd - fogStart);\
					}\
					gl_Position = pos;";
					
			vertSrc = srcCombineFcn(vertHdr, vertEnd, vertSrc, 'gl_Position', 'vec4 pos');
			material.effect.loadVertexShaderFromString(vertSrc);
		}
		if (fragSrc.search('fog') < 0) {
			var fragHdr = "varying float fogAlpha;\
					uniform vec4 fogColor;",
				fragEnd = "gl_FragColor = (1.0 - fogAlpha)*clr + fogAlpha*fogColor;";
							
			fragSrc = srcCombineFcn(fragHdr, fragEnd, fragSrc, 'gl_FragColor', 'vec4 clr');
			material.effect.loadPixelShaderFromString(fragSrc);
		}
		
		material.effect.createUniformParameters(material);
		material.getParam('fogStart').value = fog.start;
		material.getParam('fogEnd').value = fog.end;
		material.getParam('fogColor').value = fog.color;
	};
	
	return hemi;
})(hemi || {});