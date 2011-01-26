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
		
	var vertStr = "uniform mat4 worldViewProjection; \n\
		uniform vec3 lightWorldPos; \n\
		uniform mat4 world; \n\
		uniform mat4 viewInverse; \n\
		uniform mat4 worldInverseTranspose; \n\
		\n\
		attribute vec4 position; \n\
		attribute vec3 normal; \n\
		attribute vec2 texCoord0; \n\
		\n\
		varying vec4 v_position; \n\
		varying vec2 v_diffuseUV; \n\
		varying vec3 v_normal; \n\
		varying vec3 v_surfaceToLight; \n\
		varying vec3 v_surfaceToView; \n\
			\n\
		void main() { \n\
			v_diffuseUV = texCoord0; \n\
			v_position = worldViewProjection * position; \n\
			v_normal = (vec4(normal, 0) * worldInverseTranspose).xyz; \n\
			v_surfaceToLight = lightWorldPos - (position * world).xyz; \n\
			v_surfaceToView = (viewInverse[3] - (position * world)).xyz; \n\
			gl_Position = v_position;\n\
		}";
		
	var fragStr = "uniform float shininess; \n\
		uniform float specularFactor; \n\
		uniform float opacity; \n\
		uniform vec4 emissive; \n\
		uniform vec4 ambient; \n\
		uniform vec4 specular; \n\
		uniform vec4 lightColor; \n\
		uniform sampler2D diffuseSampler; \n\
		\n\
		varying vec4 v_position; \n\
		varying vec2 v_diffuseUV; \n\
		varying vec3 v_normal; \n\
		varying vec3 v_surfaceToLight; \n\
		varying vec3 v_surfaceToView; \n\
		\n\
		vec4 lit(float l ,float h, float m) { \n\
         	return vec4(1.0,\n\
                        max(l, 0.0),\n\
                        (l > 0.0) ? pow(max(0.0, h), m) : 0.0,\n\
                       1.0);\n\
        }\n\
		\n\
		void main() {\n\
			vec4 diffuse = texture2D(diffuseSampler, v_diffuseUV); \n\
			vec3 normal = normalize(v_normal); \n\
			vec3 surfaceToLight = normalize(v_surfaceToLight); \n\
			vec3 surfaceToView = normalize(v_surfaceToView); \n\
			vec3 halfVector = normalize(surfaceToLight + surfaceToView); \n\
			vec4 litR = lit(dot(normal, surfaceToLight), dot(normal, halfVector), shininess); \n\
			gl_FragColor = vec4((emissive + lightColor * (ambient * diffuse + diffuse * litR.y + + specular * litR.z * specularFactor)).rgb, diffuse.a*opacity); \n\
		}";

	
	function initStep1() {
		o3djs.webgl.makeClients(initStep2);
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
		house.setFileName('assets/house_v12/scene.json');	// Set the model file

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
		vp1.eye = hemi.core.math.matrix4.getTranslation(house.getTransform('camEye_outdoors').localMatrix);
		vp1.target = hemi.core.math.matrix4.getTranslation(house.getTransform('camTarget_outdoors').localMatrix);

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
		var wallT = house.getTransform('wallFront');
		var brickMat = wallT.shapes[0].elements[0].material;
		brickMat.getParam('o3d.drawList').value = hemi.view.viewInfo.zOrderedDrawList;
		var effect = house.pack.createObject('o3d.Effect');
		
		effect.loadVertexShaderFromString(vertStr);
		effect.loadPixelShaderFromString(fragStr);
		
		brickMat.effect = effect;
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
