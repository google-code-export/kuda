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
	var	client,
		loadProg = 0,
		materials = {},
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
		}],
	numAssets = (maps.length * 14) + 1; // textures and the model file

	function createWorld() {
		// Check if we should display one load bar for all loading
		var full = getParam('fullProgress').toLowerCase() === 'true',
			loadTask = 'LoadTextures',
			houseModel = new hemi.Model(client);

		// if (full) {
		// 	// instantiate the progress bar to receive our progress updates
		// 	pbar = new hext.progressUI.bar(loadTask);
		// 	hemi.loader.createTask(loadTask, null);
			
		// 	hemi.world.subscribe(hemi.msg.progress, function(msg) {
		// 		if (!msg.data.isTotal && msg.data.task !== loadTask) {
		// 			var pct = msg.data.percent / numAssets;
		// 			hemi.loader.updateTask(loadTask, loadProg + pct);
					
		// 			if (msg.data.percent === 100) {
		// 				loadProg += pct;
		// 			}
		// 		}
		// 	});
		// } else {
		// 	// instantiate the progress bar to receive total progress updates
		// 	pbar = new hext.progressUI.bar();
		// }

		houseModel.setFileName('assets/LightingHouse_v082/LightingHouse_v082.dae');

		hemi.subscribe(hemi.msg.ready, function(msg) {
				setupScene(houseModel);
			});

		hemi.ready();
	}

	function setupScene(houseModel) {
		for (var i = 0, il = houseModel.materials.length; i < il; ++i) {
			var mat = houseModel.materials[i],
				name = mat.map.image.src,
				start = name.lastIndexOf('/')
				stop = name.indexOf('.', start);

			materials[name.substring(start + 1, stop)] = mat;
			// Temporary fix for bug in Three.js colladaloader (ignores emission)
			mat.color.setRGB(1,1,1);
		}

		var viewpoint = new hemi.Viewpoint();
		viewpoint.eye.set(160, 1500, 1500);
		viewpoint.target.set(160, 100, 0);

		client.camera.enableControl();
		client.camera.subscribe(hemi.msg.stop, function(msg) {
				jQuery('div.loadedTextureSets').append('Loading 5 texture sets...<br/>');
				loadTextures(maps.shift());
			});
		client.camera.moveToView(viewpoint, 1);
	}

	function changeModelTextures(textures) {
		materials.Walls.map = textures.walls;
		materials.Logs.map = textures.logs;
		materials.Kitchen.map = textures.kitchen;
		materials.Ceiling.map = textures.ceiling;
		materials.BA.map = textures.ba;
		materials.B1.map = textures.b1;
		materials.B2.map = textures.b2;
		materials.Floor.map = textures.floor;
		materials.Window_South.map = textures.window_south;
		materials.Window_LR3.map = textures.window_lr3;
		materials.Window_B2.map = textures.window_b2;
		materials.Window_B1.map = textures.window_b1;
		materials.Window_KI.map = textures.window_ki;
		materials.Window_LR4.map = textures.window_lr4;
	}

	function loadTextures(map) {
		if (!map) return;

		var textureSet = new hemi.TextureSet(map, function(textures) {
				var set = 'set' + map.kitchen.slice(-8, -4);
				skin[set] = textures;
				jQuery('#' + set).removeAttr('disabled');
				jQuery('div.loadedTextureSets').append(set + ' loaded<br/>');
				loadTextures(maps.shift());
			});
	}

	function bindJavaScript() {
		jQuery(':button').attr('disabled', 'disabled');
		jQuery('#set0800').click(function() {
			changeModelTextures(skin.set0800);
		});
		jQuery('#set1000').click(function() {
			changeModelTextures(skin.set1000);
		});
		jQuery('#set1200').click(function() {
			changeModelTextures(skin.set1200);
		});
		jQuery('#set1500').click(function() {
			changeModelTextures(skin.set1500);
		});
		jQuery('#set1725').click(function() {
			changeModelTextures(skin.set1725);
		});
	}

	function getParam(name) {
		name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
		var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
			results = regex.exec(window.location.href);

		return results === null ? "" : results[1];
	}

	window.onload = function() {
		client = hemi.makeClients()[0];
		client.setBGColor(0xffffff, 1);
		hemi.loadPath = '../../';
		bindJavaScript();
		createWorld();
	};
})();