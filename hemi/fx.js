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
	 
	hemi.fx.gridShader = 
		"uniform float4x4 worldViewProjection : WORLDVIEWPROJECTION;" +
		"uniform float4 color1;" +
		"uniform float4 color2;" +
		"uniform float squares;" +
		"uniform float thickness;" +
		"struct PixelShaderInput {" +
		"  float4 position : POSITION;" +
		"  float2 texcoord : TEXCOORD0;" +
		"};" +
		"struct VertexShaderInput {" +
		"  float4 position : POSITION;" +
		"  float2 texcoord : TEXCOORD0;" +
		"};" +
		"PixelShaderInput vertexShaderFunction(VertexShaderInput input) {" +
		"  PixelShaderInput output;" +
		"  output.position = mul(input.position, worldViewProjection);" +
		"  output.texcoord = input.texcoord;" +
		"  return output;" +
		"}" +
		"float4 pixelShaderFunction(PixelShaderInput input): COLOR {" +
		"  float2 uv = input.texcoord;" +
		"  float fmodX = fmod((squares+thickness)*uv.x,1.0);" +
		"  float fmodY = fmod((squares+thickness)*uv.y,1.0);" +
		"  if (fmodX < thickness || fmodY < thickness) {" +
		"    return color1;" +
		"  } else {" +
		"  return color2;" +
		"  }" +
		"}" +
		"// #o3d VertexShaderEntryPoint vertexShaderFunction" +
		"// #o3d PixelShaderEntryPoint pixelShaderFunction" +
		"// #o3d MatrixLoadOrder RowMajor";
	
	hemi.fx.create = function(spec,callback) {
		switch (spec.type) {
			case 'constant':
				if (spec.texture) {
					return hemi.fx.createConstantTexture(spec.texture,callback);
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
					return hemi.fx.createBasicTexture(spec.texture,callback);
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
				if (callback) {
					callback(hemi.fx.createGridTexture(spec));
				} else {
					return hemi.fx.createGridTexture(spec);
				}
				break;
		}
	};
	
	hemi.fx.modify = function(material,spec) {
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
	
	hemi.fx.createConstantTexture = function(path,callback) {
		var url = o3djs.util.getCurrentURI() + path;
		var material;
		hemi.core.io.loadTexture(hemi.core.mainPack,url,function(texture,e) {
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
	
	hemi.fx.createBasicTexture = function(path,callback) {
		var url = o3djs.util.getCurrentURI() + path;
		var material;
		hemi.core.io.loadTexture(hemi.core.mainPack,url,function(texture,e) {
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
	
	hemi.fx.addPixelInputField = function(shader,field) {
		var index1 = shader.search('PixelShaderInput');
		if (index1 < 0) index1 = shader.search('OutVertex');
		var index = index1 + shader.slice(index1).search('}');
		return shader.slice(0,index) + field + shader.slice(index);
	};
	
	hemi.fx.addVertexInputField = function(shader,field) {
		var index1 = shader.search('VertexShaderInput');
		if (index1 < 0) index1 = shader.search('InVertex');
		var index = index1 + shader.slice(index1).search('}');
		return shader.slice(0,index) + field + shader.slice(index);
	};
	
	hemi.fx.modifyPixelReturn = function(shader,code) {
		var index = shader.search('pixelShaderFunction');
		var head = shader.slice(0,index);
		var tail = shader.slice(index).replace('return','float4 pxl =');
		index = tail.search('pxl') + tail.slice(tail.search('pxl')).search(';') + 1;
		return head + tail.slice(0,index) + code + tail.slice(index);
	};
	
	hemi.fx.addFog = function(material,fog) {
		var header = "uniform float fogStart; uniform float fogEnd; uniform float4 fogColor;";
		var insert1 = 
			"float fog;if(output.position.z<=fogStart){fog=0.0;}" + 
			"else if(output.position.z>=fogEnd){fog = 1.0;}" + 
			"else{fog=(output.position.z-fogStart)/(fogEnd-fogStart);}" +
			"output.color = float4(fogColor.rgb,fog);";
		var shader = material.effect.source;	
		if(shader.search('fog') < 0) {
			shader = hemi.fx.addPixelInputField(shader,'float4 color: COLOR;');
			var index = shader.search('return');
			var fogShader = hemi.fx.modifyPixelReturn(
				header + shader.slice(0,index) + insert1 + shader.slice(index),
				'return (1-input.color.a)*pxl + input.color.a*input.color;');
			hemi.fx.replaceShader(material,fogShader);
		}
		material.effect.createUniformParameters(material);
		material.getParam('fogStart').value = fog.start;
		material.getParam('fogEnd').value = fog.end;
		material.getParam('fogColor').value = fog.color;
	};
	
	hemi.fx.replaceShader = function(material,shader) {
		material.effect.loadFromFXString(shader);
		material.effect.createUniformParameters(material);
	};
	
	return hemi;
})(hemi || {});