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
 * This demo shows how to use the hemi.texture module to change the sampled textures on a per material basis.
 */

(function() {
	var	houseModel,
        textureSet = {},
        emissiveSamplers = {};
        
	function initStep(clientElements) {
		hemi.core.init(clientElements[0]);
		hemi.view.setBGColor([1, 1, 1, 1]);
		hemi.loader.loadPath = '../../';
        pbar = new hext.progressUI.bar();
		houseModel = new hemi.model.Model();
		houseModel.setFileName('assets/LightingHouse_v082/scene.json');
		
		hemi.world.subscribe(hemi.msg.ready,
			function(msg) {
				setupScene();
			});
		hemi.world.ready();
	}
   
	function setupScene() {
		for (var i = 0, materials = houseModel.materials; i < materials.length; i++) {
			emissiveSamplers[materials[i].name] = materials[i].getParam("emissiveSampler");
		}

		hemi.world.camera.enableControl();
		var viewpoint = new hemi.view.Viewpoint();
		viewpoint.eye = [160.0, 1500.0, 1500.0];
		viewpoint.target = [160.0, 100.0, 0.0];
		hemi.world.camera.moveToView(viewpoint, 1);
		hemi.world.camera.subscribe(hemi.msg.stop, function(){
            connect();
        });
	}

	jQuery(window).load(function() {
		o3djs.webgl.makeClients(initStep);
	});

	jQuery(window).unload(function() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	});
            
    function connect() {
        var url = "ws://" + document.URL.substr(7).split('/')[0],
            wsCtor = window['WebSocket'] ? WebSocket : MozWebSocket,
            socket = new wsCtor(url, 'websocket-lighting');

        socket.onmessage = function(message) {
            textureImage(JSON.parse(message.data));
        };
        socket.onclose = function() {};
    };

    function textureImage(message) {
        var data = message.data,
            setName = data.setName,
            textureName = data.textureName,
            rawData = new o3d.RawData();
        rawData.image_ = new Image();
        rawData.image_.src = data.img;
        rawData.image_.onload = function() {
            // When loading, create textureSampler and load into a textureSet
            var texture = o3djs.texture.createTextureFromRawData(hemi.core.mainPack, rawData),
                textureSampler = new hemi.texture.TextureSampler();
            textureSampler.value.texture = texture;
            if (setName in textureSet) {
                textureSet[setName].addTextureSampler(textureName, textureSampler);
                textureSet[setName].samplers.length =  textureSet[setName].samplers.length  + 1;
                if (textureSet[setName].samplers.length == 14) {
                    createButton(setName);
                }
            } else {
                textureSet[setName] = new hemi.texture.TextureSet();
                textureSet[setName].addTextureSampler(textureName, textureSampler);        
                textureSet[setName].samplers.length =  textureSet[setName].samplers.length  + 1;
            }    
            return;
        }
    }

    function createButton(setName) {
        //Create an input type dynamically.
        var element = document.createElement("input");
     
        //Assign different attributes to the element.
        element.setAttribute("type", 'button');
        element.setAttribute("value", setName);
        element.setAttribute("name", setName);
        element.onclick = function() {
            changeModelSamplers(textureSet[setName].samplers);
        };
        var buttonDiv = document.getElementById("buttons");
     
        //Append the element in page (in span).
        buttonDiv.appendChild(element); 
    }
        
    function changeModelSamplers(samplers) {
        // Note: value of a "Sampler", or "Sampler2D", the "emmissiveSampler" is write only.
        emissiveSamplers.Walls_S.value = samplers.walls.value;
        emissiveSamplers.Logs_S.value = samplers.logs.value;
        emissiveSamplers.Kitchen_S.value = samplers.kitchen.value;
        emissiveSamplers.Ceiling_S.value = samplers.ceiling.value;
        emissiveSamplers.Bath_S.value = samplers.ba.value;
        emissiveSamplers.B1_S.value = samplers.b1.value;
        emissiveSamplers.B2_S.value = samplers.b2.value;
        emissiveSamplers.Floor_S.value = samplers.floor.value;
        emissiveSamplers.Win_South_S.value = samplers.window_south.value;
        emissiveSamplers.Win_LR3_S.value = samplers.window_lr3.value;
        emissiveSamplers.Win_B2_S.value = samplers.window_b2.value;
        emissiveSamplers.Win_B1_S.value = samplers.window_b1.value;
        emissiveSamplers.Win_KI_S.value = samplers.window_ki.value;
        emissiveSamplers.Win_LR4_S.value = samplers.window_lr4.value;
    }
})();

