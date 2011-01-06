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

/**
 * This is a simple hello world, showing how to set up a simple world, 
 *		load a model, and set the camera to a viewpoint once the model
 *		has loaded.
 */
(function() {
	o3djs.require('o3djs.util');
	o3djs.require('hemi.msg');
	o3djs.require('hemi.motion');
	o3djs.require('hemi.curve');

	/* This is the string which will be used as our custom shader. It is 
	 * a basic phong-lambert shader with one variable added in, opacity, that
	 * allows us to override the alpha value of the texture, which on a jpg
	 * will always be 1.
	 */
	var shaderString = "uniform float4x4 worldViewProjection : WORLDVIEWPROJECTION; uniform float3 lightWorldPos; uniform float4 lightColor; uniform float4x4 world : WORLD; uniform float4x4 viewInverse : VIEWINVERSE; uniform float4x4 worldInverseTranspose : WORLDINVERSETRANSPOSE; uniform float4 emissive; uniform float4 ambient; sampler2D diffuseSampler; uniform float4 specular; uniform float shininess; uniform float specularFactor; uniform float opacity; struct InVertex { float4 position : POSITION; float3 normal : NORMAL; float2 diffuseUV : TEXCOORD0; }; struct OutVertex { float4 position : POSITION; float2 diffuseUV : TEXCOORD0; float3 normal : TEXCOORD1; float3 surfaceToLight: TEXCOORD2; float3 surfaceToView : TEXCOORD3; }; OutVertex vertexShaderFunction(InVertex input) { OutVertex output; output.diffuseUV = input.diffuseUV; output.position = mul(input.position, worldViewProjection); output.normal = mul(float4(input.normal, 0), worldInverseTranspose).xyz; output.surfaceToLight = lightWorldPos - mul(input.position, world).xyz; output.surfaceToView = (viewInverse[3] - mul(input.position, world)).xyz; return output; } float4 pixelShaderFunction(OutVertex input) : COLOR { float4 diffuse = tex2D(diffuseSampler, input.diffuseUV); float3 normal = normalize(input.normal); float3 surfaceToLight = normalize(input.surfaceToLight); float3 surfaceToView = normalize(input.surfaceToView); float3 halfVector = normalize(surfaceToLight + surfaceToView); float4 litR = lit(dot(normal, surfaceToLight), dot(normal, halfVector), shininess); return float4((emissive + lightColor * (ambient * diffuse + diffuse * litR.y + + specular * litR.z * specularFactor)).rgb, diffuse.a*opacity); } // #o3d VertexShaderEntryPoint vertexShaderFunction // #o3d PixelShaderEntryPoint pixelShaderFunction // #o3d MatrixLoadOrder RowMajor "

	
	function initStep1() {
		o3djs.util.makeClients(initStep2);
	};
	
	function initStep2 (clientElements) {
		
		/*
		 * It is possible to have multiple clients (i.e. multiple frames
		 * 		rendering 3d content) on one page that would have to be
		 * 		initialized. In this case, we only want to initialize the
		 *		first one.
		 */
		hemi.core.init(clientElements[0]);	
		
		/*
		 * Set the background color to a light-bluish. The parameter is in
		 * 		the form [red,blue,green,alpha], with each value on a 
		 *		scale of 0-1.
		 */
		hemi.view.setBGColor([0.7, 0.8, 1, 1]);
		
		createWorld();
	};
	
	function uninit() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	};
	
	function createWorld() {
	
		/*
		 * hemi.world.theWorld is the default world created to manage all of
		 * 		our models, cameras, effects, etc. New worlds can be created,
		 *		but we're happy with the default world in this case.
		 */
		var world = hemi.world;
		
		var house = new hemi.model.Model();				// Create a new Model
		house.setFileName('assets/Boxhouse.o3dtgz');	// Set the model file

		/*
		 * When the file name for the house model was set, it began loading.
		 *		When it finishes, it will send out a load message. Here, we
		 *		register a handler, setUpScene(), to be run when house finishes
		 *		loading and sends the message.
		 */
		house.subscribe(hemi.msg.load,
			function(msg) {	
				setUpScene(house);
			});
	};
	
	function setUpScene(house) {
		var vp1 = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp1.eye = [68,51,143];					// Set viewpoint eye
		vp1.target = [5,15,2];					// Set viewpoint target

		/*
		 * Move the camera from it's default position (eye : [0,0,-1],
		 *		target : [0,0,0]} to the new viewpoint, and take 120
		 *		render cycles (~2 seconds) to do so.
		 */
		hemi.world.camera.moveToView(vp1,120);
		hemi.world.camera.enableControl();
		
		var count = 0;					// Counter to keep track of wall opacity
		var dir = 1;					// Whether wall is becoming more or less opaque
		
		/* Get the material used on the walls, set it to use the shader defined at the
		 * top of the file, and get the parameter that controls the opacity
		 */
		var wallT = house.getTransform('exteriorwall2');
		var brickMat = wallT.shapes[0].elements[0].material;
		brickMat.getParam('o3d.drawList').value = hemi.view.viewInfo.zOrderedDrawList;
		var effect = house.pack.createObject('o3d.Effect');
		effect.loadFromFXString(shaderString);
		brickMat.getParam('effect').value = effect;
		brickMat.effect.createUniformParameters(brickMat);
		brickMat.getParam('opacity').value = 1.0;
		
		/* Create a transform-level opacity paramater that will override the material-
		 * level opacity parameter. That way, we can make this wall fade without fading
		 * every object that uses the wall material.
		 */
		var opacity = wallT.createParam('opacity','ParamFloat');
		opacity.value = 1.0;
		
		/* On any keyDown, begin the fading. Reverse the direction each time */
		hemi.input.addKeyDownListener({
			onKeyDown : function(e) {
				if (count == 0) {
					count = 30;
					dir = -dir;
				} 
			}});
			
		/* Fade the wall a little more on each frame, between 1 and 0.4 */
		hemi.view.addRenderListener({
			onRender : function(e) {
				if (count > 0) {
					opacity.value += dir*0.02;
					count--;
				}
			}});
		
	};
	
	window.onload = function() {
		initStep1();
	};
	window.onunload = function() {
		uninit();
	};
})();
