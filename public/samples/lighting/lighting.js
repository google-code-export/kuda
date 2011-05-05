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
o3djs.require('o3djs.util');
o3djs.require('hemi.texture');
	
o3djs.require('hext.progressUI.progressBar');

(function() {
	var	houseModel,
		emissiveSamplers = {},
		skin = {},
		maps = [{
			kitchen: 'assets/images/TimeMaps/Kitchen_0800.jpg',
			walls: 'assets/images/TimeMaps/Walls_0800.jpg',
			logs: 'assets/images/TimeMaps/Logs_0800.jpg',
			ceiling: 'assets/images/TimeMaps/Ceiling_0800.jpg',
			ba: 'assets/images/TimeMaps/BA_0800.jpg',
			b1: 'assets/images/TimeMaps/B1_0800.jpg',
			b2: 'assets/images/TimeMaps/B2_0800.jpg',
			floor: 'assets/images/TimeMaps/Floor_0800.jpg',
			window_south: 'assets/images/TimeMaps/Window_South_0800.jpg',
			window_lr3: 'assets/images/TimeMaps/Window_LR3_0800.jpg',
			window_b2: 'assets/images/TimeMaps/Window_B2_0800.jpg',
			window_b1: 'assets/images/TimeMaps/Window_B1_0800.jpg',
			window_ki: 'assets/images/TimeMaps/Window_KI_0800.jpg',
			window_lr4: 'assets/images/TimeMaps/Window_LR4_0800.jpg'
			}, {
			kitchen: 'assets/images/TimeMaps/Kitchen_1000.jpg',
			walls: 'assets/images/TimeMaps/Walls_1000.jpg',
			logs: 'assets/images/TimeMaps/Logs_1000.jpg',
			ceiling: 'assets/images/TimeMaps/Ceiling_1000.jpg',
			ba: 'assets/images/TimeMaps/BA_1000.jpg',
			b1: 'assets/images/TimeMaps/B1_1000.jpg',
			b2: 'assets/images/TimeMaps/B2_1000.jpg',
			floor: 'assets/images/TimeMaps/Floor_1000.jpg',
			window_south: 'assets/images/TimeMaps/Window_South_1000.jpg',
			window_lr3: 'assets/images/TimeMaps/Window_LR3_1000.jpg',
			window_b2: 'assets/images/TimeMaps/Window_B2_1000.jpg',
			window_b1: 'assets/images/TimeMaps/Window_B1_1000.jpg',
			window_ki: 'assets/images/TimeMaps/Window_KI_1000.jpg',
			window_lr4: 'assets/images/TimeMaps/Window_LR4_1000.jpg'
			}, {
			kitchen: 'assets/images/TimeMaps/Kitchen_1200.jpg',
			walls: 'assets/images/TimeMaps/Walls_1200.jpg',
			logs: 'assets/images/TimeMaps/Logs_1200.jpg',
			ceiling: 'assets/images/TimeMaps/Ceiling_1200.jpg',
			ba: 'assets/images/TimeMaps/BA_1200.jpg',
			b1: 'assets/images/TimeMaps/B1_1200.jpg',
			b2: 'assets/images/TimeMaps/B2_1200.jpg',
			floor: 'assets/images/TimeMaps/Floor_1200.jpg',
			window_south: 'assets/images/TimeMaps/Window_South_1200.jpg',
			window_lr3: 'assets/images/TimeMaps/Window_LR3_1200.jpg',
			window_b2: 'assets/images/TimeMaps/Window_B2_1200.jpg',
			window_b1: 'assets/images/TimeMaps/Window_B1_1200.jpg',
			window_ki: 'assets/images/TimeMaps/Window_KI_1200.jpg',
			window_lr4: 'assets/images/TimeMaps/Window_LR4_1200.jpg'
			}, {
			kitchen: 'assets/images/TimeMaps/Kitchen_1500.jpg',
			walls: 'assets/images/TimeMaps/Walls_1500.jpg',
			logs: 'assets/images/TimeMaps/Logs_1500.jpg',
			ceiling: 'assets/images/TimeMaps/Ceiling_1500.jpg',
			ba: 'assets/images/TimeMaps/BA_1500.jpg',
			b1: 'assets/images/TimeMaps/B1_1500.jpg',
			b2: 'assets/images/TimeMaps/B2_1500.jpg',
			floor: 'assets/images/TimeMaps/Floor_1500.jpg',
			window_south: 'assets/images/TimeMaps/Window_South_1500.jpg',
			window_lr3: 'assets/images/TimeMaps/Window_LR3_1500.jpg',
			window_b2: 'assets/images/TimeMaps/Window_B2_1500.jpg',
			window_b1: 'assets/images/TimeMaps/Window_B1_1500.jpg',
			window_ki: 'assets/images/TimeMaps/Window_KI_1500.jpg',
			window_lr4: 'assets/images/TimeMaps/Window_LR4_1500.jpg'
			}, {
			kitchen: 'assets/images/TimeMaps/Kitchen_1725.jpg',
			walls: 'assets/images/TimeMaps/Walls_1725.jpg',
			logs: 'assets/images/TimeMaps/Logs_1725.jpg',
			ceiling: 'assets/images/TimeMaps/Ceiling_1725.jpg',
			ba: 'assets/images/TimeMaps/BA_1725.jpg',
			b1: 'assets/images/TimeMaps/B1_1725.jpg',
			b2: 'assets/images/TimeMaps/B2_1725.jpg',
			floor: 'assets/images/TimeMaps/Floor_1725.jpg',
			window_south: 'assets/images/TimeMaps/Window_South_1725.jpg',
			window_lr3: 'assets/images/TimeMaps/Window_LR3_1725.jpg',
			window_b2: 'assets/images/TimeMaps/Window_B2_1725.jpg',
			window_b1: 'assets/images/TimeMaps/Window_B1_1725.jpg',
			window_ki: 'assets/images/TimeMaps/Window_KI_1725.jpg',
			window_lr4: 'assets/images/TimeMaps/Window_LR4_1725.jpg'
		}];

	function initStep(clientElements) {
		bindJavaScript();
		hemi.core.init(clientElements[0]);
		hemi.view.setBGColor([1, 1, 1, 1]);
		hemi.loader.loadPath = '../../';
		
		// instantiate the progress bar
		pbar = new hext.progressUI.bar();
		
		houseModel = new hemi.model.Model();
		houseModel.setFileName('assets/LightingHouse_v082/scene.json');
		
		hemi.world.subscribe(hemi.msg.ready,
			function(msg) {
				setupScene();
			});
		hemi.world.ready();
	}

	function bindJavaScript() {
		jQuery(':button').attr('disabled', 'disabled');
		jQuery('#set0800').click(function() {
			changeModelSamplers(skin.set0800);
		});
		jQuery('#set1000').click(function() {
			changeModelSamplers(skin.set1000);
		});
		jQuery('#set1200').click(function() {
			changeModelSamplers(skin.set1200);
		});
		jQuery('#set1500').click(function() {
			changeModelSamplers(skin.set1500);
		});
		jQuery('#set1725').click(function() {
			changeModelSamplers(skin.set1725);
		});
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
		hemi.world.camera.subscribe(hemi.msg.stop,
			function() {
				jQuery('div.loadedTextureSets').append('Loading 5 texture sets...<br/>');
				loadTextures(maps.shift());
			});
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

	function onTextureSet(map, samplers) {
		var set = 'set' + map.kitchen.slice(-8, -4);
		skin[set] = samplers;
		jQuery('#' + set).attr('disabled', '');
		jQuery('div.loadedTextureSets').append(set + ' loaded<br/>');
	}

	function loadTextures(map) {
		if (map) {
			hemi.texture.createTextureSet(map,
				function(samplers) {
					onTextureSet(map, samplers);
					loadTextures(maps.shift());
				});
		}
	}

	jQuery(window).load(function() {
		o3djs.webgl.makeClients(initStep);
	});

	jQuery(window).unload(function() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	});
})();