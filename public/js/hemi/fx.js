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
	
	/**
	 * Add parameters to the given Material that will allow the user to define a
	 * fog effect for it. The returned object will have these parameters:
	 * color: array of floats defining fog color in RGBA format
	 * start: float defining distance from the camera that fog starts
	 * end: float defining distance from the camera that fog becomes opaque
	 * 
	 * @param {o3d.Material} material the Material to create opacity for
	 * @return {Object} an object containing the ParamObjects listed above
	 */
	hemi.fx.addFog = function(material) {
		// get the source
		var gl = material.gl,
			program = material.effect.program_,
			shad = hemi.utils.getShaders(material),
			fragShd = shad.fragShd,
			fragSrc = shad.fragSrc,
			vertShd = shad.vertShd,
			vertSrc = shad.vertSrc;
		
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
			
			vertSrc = hemi.utils.combineVertSrc(vertHdr, vertEnd, vertSrc, 'vec4 pos');
			gl.detachShader(program, vertShd);
			material.effect.loadVertexShaderFromString(vertSrc);
		}
		if (fragSrc.search('fog') < 0) {
			var fragHdr = "varying float fogAlpha;\
					uniform vec4 fogColor;",
				fragEnd = "gl_FragColor = (1.0 - fogAlpha)*clr + fogAlpha*fogColor;";
			
			fragSrc = hemi.utils.combineFragSrc(fragHdr, fragEnd, fragSrc, 'vec4 clr');
			gl.detachShader(program, fragShd);
			material.effect.loadPixelShaderFromString(fragSrc);
		}
		
		material.effect.createUniformParameters(material);
		return {
			start: material.getParam('fogStart'),
			end: material.getParam('fogEnd'),
			color: material.getParam('fogColor')
		};
	};
	
	/**
	 * Add an opacity parameter to the given Material that will allow
	 * transparency to be set for it. Transparency ranges from 0.0 to 1.0.
	 * 
	 * @param {o3d.Material} material the Material to create opacity for
	 * @return {o3d.ParamObject} a ParamObject linked to opacity
	 */
	hemi.fx.addOpacity = function(material) {
		// get the source
		var gl = material.gl,
			program = material.effect.program_,
			shad = hemi.utils.getShaders(material),
			fragShd = shad.fragShd,
			fragSrc = shad.fragSrc;
		
		// modify the pixel shader
		if (fragSrc.search('opacity') < 0) {
			var fragHdr = 'uniform float opacity;',
				fragEnd = 'gl_FragColor = vec4(clr.rgb, clr.a * opacity);';
			
			fragSrc = hemi.utils.combineFragSrc(fragHdr, fragEnd, fragSrc, 'vec4 clr');
			gl.detachShader(program, fragShd);
			material.effect.loadPixelShaderFromString(fragSrc);
		}
		
		material.effect.createUniformParameters(material);
		return material.getParam('opacity');
	};
	
	/*
	 * The following functions may be out-dated and need some work before using.
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
	
	return hemi;
})(hemi || {});