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

/*
var r = editor.client.renderer; var s = editor.client.scene; var cam = editor.client.camera; cam.light.position = cam.threeCamera.position.clone(); cam.light.rotation = cam.threeCamera.rotation.clone(); cam.light.scale = cam.threeCamera.scale.clone();

r.shadowMapEnabled = true; r.shadowMapSoft = true;

var shapes = hemi.world.getShapes(); shapes[0].mesh.castShadow = shapes[0].mesh.receiveShadow = shapes[1].mesh.castShadow = shapes[1].mesh.receiveShadow = true;

cam.light.castShadow = true; cam.light.shadowCameraNear = cam.threeCamera.near; cam.light.shadowCameraFar = cam.threeCamera.far; cam.light.shadowCameraFov = cam.fov.current * hemi.RAD_TO_DEG;

r.initMaterial(shapes[0].mesh.material, s.__lights, s.fog, shapes[0].mesh); r.initMaterial(shapes[1].mesh.material, s.__lights, s.fog, shapes[1].mesh);

var r = editor.client.renderer; var s = editor.client.scene; var cam = editor.client.camera; cam.light.position = cam.threeCamera.position.clone(); cam.light.rotation = cam.threeCamera.rotation.clone(); cam.light.scale = cam.threeCamera.scale.clone(); r.shadowMapEnabled = true; r.shadowMapSoft = true;
var shapes = hemi.world.getShapes(); shapes[0].mesh.castShadow = shapes[0].mesh.receiveShadow = shapes[1].mesh.castShadow = shapes[1].mesh.receiveShadow = true;
cam.light.castShadow = true; cam.light.shadowCameraNear = cam.threeCamera.near; cam.light.shadowCameraFar = cam.threeCamera.far; cam.light.shadowCameraFov = cam.fov.current * hemi.RAD_TO_DEG;
r.initMaterial(shapes[0].mesh.material, s.__lights, s.fog, shapes[0].mesh); r.initMaterial(shapes[1].mesh.material, s.__lights, s.fog, shapes[1].mesh);
*/

(function() {
	"use strict";

	var _lights = [],
		_materials = {};

////////////////////////////////////////////////////////////////////////////////////////////////////
//											  Initialization									  //
////////////////////////////////////////////////////////////////////////////////////////////////////

	var shorthand = editor.tools.shadows;

	shorthand.init = function() {
		var navPane = editor.ui.getNavPane('Environment'),
			shdMdl = new ShadowsModel(),
			shdView = new ShadowsView(),
			shdCtr = new ShadowsController();
		
		shdCtr.setModel(shdMdl);
		shdCtr.setView(shdView);
		
		navPane.add(shdView);

		var model = editor.getModel('browser');

		if (model) {
			shdCtr.setBrowserModel(model);
		} else {
			editor.addListener(editor.events.PluginLoaded, function(name) {
				if (name === 'browser') {
					shdCtr.setBrowserModel(editor.getModel(name));
				}
			});
		}

		model = editor.getModel('lights');

		if (model) {
			shdCtr.setLightsModel(model);
		} else {
			editor.addListener(editor.events.PluginLoaded, function(name) {
				if (name === 'lights') {
					shdCtr.setLightsModel(editor.getModel(name));
				}
			});
		}

		model = editor.getModel('shapes');

		if (model) {
			shdCtr.setShapesModel(model);
		} else {
			editor.addListener(editor.events.PluginLoaded, function(name) {
				if (name === 'shapes') {
					shdCtr.setShapesModel(editor.getModel(name));
				}
			});
		}
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
//											  Tool Definition									  //
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	shorthand.events = {
		// light/mesh widget specific
		SetParam: 'shadows.setParam'
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                   			   Model		                                  //
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * An TimerModel handles the creation, updating, and removal of 
	 * Timer
	 */
	var ShadowsModel = function() {
		editor.ToolModel.call(this, 'shadows');

		this.currentLight = null;
		this.currentMesh = null;
	};

	ShadowsModel.prototype = new editor.ToolModel();
	ShadowsModel.prototype.constructor = ShadowsModel;

	ShadowsModel.prototype.editLight = function(light) {
		this.currentLight = light;

		if (light != null) {
			this.notifyListeners(editor.events.Editing, light);
		}
	};

	ShadowsModel.prototype.editMesh = function(mesh) {
		this.currentMesh = mesh;

		if (mesh != null) {
			this.notifyListeners(editor.events.Editing, mesh);
		}
	};

	ShadowsModel.prototype.setParam = function(name, val) {
		var tokens = name.split('_'),
			type = tokens[0],
			param = tokens[1];

		if (this.currentLight && type === 'light') {
			var light = this.currentLight.light;

			switch (tokens[1]) {
				case 'bias':
					light.shadowBias = val;
					break;
				case 'cast':
					light.castShadow = val;
					updateLights(light);
					break;
				case 'dark':
					light.shadowDarkness = val;
					break;
			}

			updateMaterials();
		} else if (this.currentMesh && type === 'mesh') {
			if (param === 'cast') {
				this.currentMesh.castShadow = val;
			} else if (param === 'receive') {
				this.currentMesh.receiveShadow = val;
			}

			if (_lights.length > 0) {
				updateMaterials(this.currentMesh.material.id, this.currentMesh);
			}
		}
	};

	function updateLights(light) {
		var ndx = _lights.indexOf(light),
			renderer = editor.client.renderer;

		if (light.castShadow && ndx === -1) {
			_lights.push(light);

			// set up shadow camera
			var cam = editor.client.camera;
			light.shadowCameraNear = cam.threeCamera.near;
			light.shadowCameraFar = cam.threeCamera.far;
			light.shadowCameraFov = cam.fov.current * hemi.RAD_TO_DEG;

			if (_lights.length === 1) {
				renderer.shadowMapEnabled = renderer.shadowMapSoft = true;
			}
		} else if (!light.castShadow && ndx !== -1) {
			_lights.splice(ndx, 1);

			if (_lights.length === 0) {
				renderer.shadowMapEnabled = renderer.shadowMapSoft = false;
			}
		}
	}

	function updateMaterials(opt_matId, opt_mesh) {
		if (opt_matId !== undefined) {
			var matObj = _materials[opt_matId],
				renderer = editor.client.renderer,
				scene = editor.client.scene;

			if (!matObj) {
				matObj = _materials[opt_matId] = {
					mat: opt_mesh.material,
					meshes: [opt_mesh]
				}
			}

			if (opt_mesh) {
				renderer.initMaterial(matObj.mat, scene.__lights, scene.fog, opt_mesh);

				if (!opt_mesh.castShadow && !opt_mesh.receiveShadow) {
					var ndx = matObj.meshes.indexOf(opt_mesh);
					matObj.meshes.splice(ndx, 1);
				}
			} else {
				for (var i = 0, il = matObj.meshes.length; i < il; ++i) {
					renderer.initMaterial(matObj.mat, scene.__lights, scene.fog, matObj.meshes[i]);
				}
			}
		} else {
			for (var id in _materials) {
				updateMaterials(id);
			}
		}
	}

////////////////////////////////////////////////////////////////////////////////////////////////////
//                     	   				Edit Light Sidebar Widget      		                      //
////////////////////////////////////////////////////////////////////////////////////////////////////

	var LightWidget = function() {
		editor.ui.FormWidget.call(this, {
			name: 'lightWidget',
			uiFile: 'js/editor/plugins/shadows/html/shadowsLights.htm',
			manualVisible: true
		});
	};
	var litWgtSuper = editor.ui.FormWidget.prototype;

	LightWidget.prototype = new editor.ui.FormWidget();
	LightWidget.prototype.constructor = LightWidget;

	LightWidget.prototype.add = function(light) {
		var id = light._getId();
		this.lightSel.append('<option id="shd-lights_' + id + '" value="' + id + '">' + light.name +
			'</option>');
	};

	LightWidget.prototype.layout = function() {
		litWgtSuper.layout.call(this);

		var validator = editor.ui.createDefaultValidator(),
			wgt = this;

		this.form = this.find('form');
		this.form.submit(function() { return false; });

		this.lightSel = this.find('#shd-lights')
			.bind('change', function(evt) {
				var id = parseInt(wgt.lightSel.val(), 10),
					light = hemi.world.getCitizenById(id);

				wgt.notifyListeners(editor.events.Edit, light);
			});

		this.castBox = this.find('#shd-cast')
			.bind('change', function(evt) {
				wgt.notifyListeners(shorthand.events.SetParam, {
					name: 'light_cast',
					val: wgt.castBox.prop('checked')
				});
			});

		this.biasIpt = new editor.ui.Input({
			container: wgt.find('#shd-bias'),
			onBlur: function() {
				wgt.notifyListeners(shorthand.events.SetParam, {
					name: 'light_bias',
					val: wgt.biasIpt.getValue()
				});
			},
			validator: validator
		});

		this.darkIpt = new editor.ui.Input({
			container: wgt.find('#shd-dark'),
			onBlur: function() {
				wgt.notifyListeners(shorthand.events.SetParam, {
					name: 'light_dark',
					val: wgt.darkIpt.getValue()
				});
			},
			validator: validator
		});
	};

	LightWidget.prototype.remove = function(light) {
		var id = light._getId(),
			elemId = 'shd-lights_' + id;

		if (parseInt(this.lightSel.val(), 10) === id) {
			// TODO: switch to different one
		}

		this.lightSel.find('#' + elemId).remove();
	};

	LightWidget.prototype.set = function(light) {
		this.lightSel.val(light._getId());
		this.castBox.prop('checked', light.light.castShadow);
		this.biasIpt.setValue(light.light.shadowBias);
		this.darkIpt.setValue(light.light.shadowDarkness);
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
//                     	   				Edit Mesh Sidebar Widget      		                      //
////////////////////////////////////////////////////////////////////////////////////////////////////

	var MeshWidget = function() {
		editor.ui.FormWidget.call(this, {
			name: 'meshWidget',
			uiFile: 'js/editor/plugins/shadows/html/shadowsMeshes.htm',
			manualVisible: true
		});
	};
	var mshWgtSuper = editor.ui.FormWidget.prototype;

	MeshWidget.prototype = new editor.ui.FormWidget();
	MeshWidget.prototype.constructor = MeshWidget;

	MeshWidget.prototype.add = function(mesh) {
		var id = mesh._getId();
		this.meshSel.append('<option id="shd-meshes_' + id + '" value="' + id + '">' + mesh.name +
			'</option>');
	};

	MeshWidget.prototype.layout = function() {
		mshWgtSuper.layout.call(this);

		var wgt = this;

		this.form = this.find('form');
		this.form.submit(function() { return false; });

		this.meshSel = this.find('#shd-meshes')
			.bind('change', function(evt) {
				var id = parseInt(wgt.meshSel.val(), 10),
					mesh = hemi.world.getCitizenById(id);

				wgt.notifyListeners(editor.events.Edit, mesh);
			});

		this.castBox = this.find('#shd-cast')
			.bind('change', function(evt) {
				wgt.notifyListeners(shorthand.events.SetParam, {
					name: 'mesh_cast',
					val: wgt.castBox.prop('checked')
				});
			});

		this.receiveBox = this.find('#shd-receive')
			.bind('change', function(evt) {
				wgt.notifyListeners(shorthand.events.SetParam, {
					name: 'mesh_receive',
					val: wgt.receiveBox.prop('checked')
				});
			});
	};

	MeshWidget.prototype.remove = function(mesh) {
		var id = mesh._getId(),
			elemId = 'shd-meshes_' + id;

		if (parseInt(this.meshSel.val(), 10) === id) {
			// TODO: switch to different one
		}

		this.meshSel.find('#' + elemId).remove();
	};

	MeshWidget.prototype.set = function(mesh) {
		this.meshSel.val(mesh._getId());
		this.castBox.prop('checked', mesh.castShadow);
		this.receiveBox.prop('checked', mesh.receiveShadow);
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                   			  View	                                		  //
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The TimersView controls the dialog and toolbar widget for the 
	 * animation tool.
	 */
	var ShadowsView = function() {
		editor.ToolView.call(this, {
			toolName: 'Shadows',
			toolTip: 'Edit shadows (EXPERIMENTAL)',
			id: 'shadows'
		});

		this.addPanel(new editor.ui.Panel({
			name: 'sidePanel',
			classes: ['shdSidePanel']
		}));

		this.sidePanel.addWidget(new LightWidget());
		this.sidePanel.addWidget(new MeshWidget());
	};
	
	ShadowsView.prototype = new editor.ToolView();
	ShadowsView.prototype.constructor = ShadowsView;
	
////////////////////////////////////////////////////////////////////////////////////////////////////
//                                				Controller		                                  //
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The TimerController facilitates TimerModel and TimerView
	 * communication by binding event and message handlers.
	 */
	var ShadowsController = function() {
		editor.ToolController.call(this);
	};
	var shdCtrSuper = editor.ToolController.prototype;

	ShadowsController.prototype = new editor.ToolController();
	ShadowsController.prototype.constructor = ShadowsController;

	/**
	 * Binds event and message handlers to the view and model this object 
	 * references.  
	 */
	ShadowsController.prototype.bindEvents = function() {
		shdCtrSuper.bindEvents.call(this);

		var model = this.model,
			bwrModel = this.bwrModel,
			lgtModel = this.lgtModel,
			shpModel = this.shpModel,
			view = this.view,
			lgtWgt = view.sidePanel.lightWidget,
			mshWgt = view.sidePanel.meshWidget;

		// light widget specific
		lgtWgt.addListener(editor.events.Edit, function(light) {
			model.editLight(light);
		});
		lgtWgt.addListener(shorthand.events.SetParam, function(data) {
			model.setParam(data.name, data.val);
		});

		// mesh widget specific
		mshWgt.addListener(editor.events.Edit, function(mesh) {
			model.editMesh(mesh);
		});
		mshWgt.addListener(shorthand.events.SetParam, function(data) {
			model.setParam(data.name, data.val);
		});

		// model specific
		model.addListener(editor.events.Editing, function(obj) {
			if (obj.material) {
				mshWgt.set(obj);
			} else {
				lgtWgt.set(obj);
			}
		});
	};

	ShadowsController.prototype.setBrowserModel = function(bwrModel) {
		var mshWgt = this.view.sidePanel.meshWidget;

		bwrModel.addListener(editor.events.Created, function(model) {
			function addMeshes(transform) {
				if (transform.geometry) {
					mshWgt.add(transform);
				}

				for (var i = 0, il = transform.children.length; i < il; ++i) {
					addMeshes(transform.children[i]);
				}
			}

			addMeshes(model.root);
		});
		bwrModel.addListener(editor.events.Removing, function(model) {
			function removeMeshes(transform) {
				if (transform.geometry) {
					mshWgt.remove(transform);
				}

				for (var i = 0, il = transform.children.length; i < il; ++i) {
					removeMeshes(transform.children[i]);
				}
			}

			removeMeshes(model.root);
		});
	};

	ShadowsController.prototype.setLightsModel = function(model) {
		var lgtWgt = this.view.sidePanel.lightWidget;

		model.addListener(editor.events.Created, function(light) {
			lgtWgt.add(light);
		});
		model.addListener(editor.events.Removing, function(light) {
			lgtWgt.remove(light);
		});
	};

	ShadowsController.prototype.setShapesModel = function(model) {
		var mshWgt = this.view.sidePanel.meshWidget;

		model.addListener(editor.events.Created, function(shape) {
			mshWgt.add(shape.mesh);
		});
		model.addListener(editor.events.Removing, function(shape) {
			mshWgt.remove(shape.mesh);
		});
	};

})();