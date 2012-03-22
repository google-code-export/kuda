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

(function() {	
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Initialization
////////////////////////////////////////////////////////////////////////////////////////////////////
 
	var shorthand = editor.tools.viewpoints,
		eyeCache = new THREE.Vector3(),
		tgtCache = new THREE.Vector3();

	shorthand.init = function() {
		var navPane = editor.ui.getNavPane('Camera'),
			
			vptMdl = new ViewpointsModel(),
			vptView = new ViewpointsView(),
			vptCtr = new ViewpointsController();
		
		vptCtr.setView(vptView);
		vptCtr.setModel(vptMdl);
		
		navPane.add(vptView);
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Tool Definition
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	shorthand.events = {
		// model events
		CameraUpdated: "viewpoints.CameraUpdated",
		UpdateCameraInfo: "viewpoints.UpdateCameraInfo",
		
		// Create Viewpoint Widget events
		SaveViewpoint: "viewpoints.SaveViewpoint",
		PreviewViewpoint: "viewpoints.PreviewViewpoint",
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Model
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * A ViewpointsModel handles the creation camera viewpoints 
	 */
	var ViewpointsModel = function() {
		editor.ToolModel.call(this, 'viewpoints');
		this.camData = null;
		this.curve = null;
		this.prevHandler = null;
		this.prevCurve = null;
		this.previewing = false;
		this.waypoints = [];
        that = this;
		hemi.addRenderListener(this);
		hemi.subscribe(hemi.msg.load, function(msg) {
			if (msg.src instanceof hemi.Model) {
                var vps = hemi.world.getViewpoints();
                for(var i = 0; i < vps.length; i++){
                    that.notifyListeners(editor.events.Created, vps[i]);
                }
            }
		});

	};
	
	ViewpointsModel.prototype = new editor.ToolModel();
	ViewpointsModel.prototype.constructor = ViewpointsModel;
	
	ViewpointsModel.prototype.cancelViewpointEdit = function() {
		if (this.camData) {
			editor.client.camera.moveToView(this.camData);
		}
		
		this.camData = null;
		this.currentVp = null;
	};
		
	ViewpointsModel.prototype.createViewpoint = function(params) {
		var viewpoint;
		
		viewpoint = this.currentVp ? this.currentVp 
			: new hemi.Viewpoint();
			
		viewpoint.eye = params.eye;
		viewpoint.target = params.target;
		viewpoint.fov = params.fov;
		viewpoint.np = params.np;
		viewpoint.fp = params.fp;
		viewpoint.up = editor.client.camera.up;
		viewpoint.name = params.name || '';
		
		return viewpoint;
	};
		
	ViewpointsModel.prototype.editViewpoint = function(viewpoint) {
		this.currentVp = viewpoint;			
	};
		
	ViewpointsModel.prototype.enableMonitoring = function(enable) {
		if (enable) {
			hemi.addRenderListener(this);
		}
		else {
			hemi.removeRenderListener(this);
		}
	};
	
	ViewpointsModel.prototype.onRender = function(renderEvt) {
		var cam = editor.client.camera;

		this.notifyListeners(shorthand.events.CameraUpdated, {
			eye: cam.threeCamera.position.clone(),
			target: cam.getTarget(tgtCache),
			fov: cam.fov.current,
			np: cam.threeCamera.near,
			fp: cam.threeCamera.far
		});
	};
		
	ViewpointsModel.prototype.previewViewpoint = function(params) {
		if (this.camData == null) {
			this.camData = hemi.createViewData(editor.client.camera);
		}
		
		params.up = editor.client.camera.up;
		var vd = new hemi.ViewData(params);
		editor.client.camera.moveToView(vd);
	};
		
	ViewpointsModel.prototype.removeViewpoint = function(viewpoint) {
		this.notifyListeners(editor.events.Removing, viewpoint);
		viewpoint.cleanup();
	};
		
	ViewpointsModel.prototype.saveViewpoint = function(params) {
		var viewpoint = this.createViewpoint(params),
			msgType = this.currentVp ? editor.events.Updated
				: editor.events.Created;
			
		this.notifyListeners(msgType, viewpoint);
		
		if (this.camData) {
			editor.client.camera.moveToView(this.camData);
		}
		
		this.currentVp = null;
		this.camData = null;
	};

	ViewpointsModel.prototype.updateCamera = function(paramName, paramValue) {
		var tokens = paramName.split('-'),
			type = tokens[1],
			param = tokens[2],
			cam = editor.client.camera,
			vd = hemi.createViewData(cam);


		if (type === 'pos') {
			vd.eye[param] = paramValue;
		} else if (type === 'tgt') {
			vd.target[param] = paramValue;
		} else if (type === 'lens') {
			vd[param] = paramValue;
		}

		cam.moveToView(vd, 0.5);
	};
		
	ViewpointsModel.prototype.worldCleaned = function() {
		var viewpoints = hemi.world.getViewpoints();
		
		for (var ndx = 0, len = viewpoints.length; ndx < len; ndx++) {
			var vpt = viewpoints[ndx];
			this.notifyListeners(editor.events.Removing, vpt);
		}
	};

	ViewpointsModel.prototype.worldLoaded = function() {
		var viewpoints = hemi.world.getViewpoints();
		
		for (var ndx = 0, len = viewpoints.length; ndx < len; ndx++) {
			var vpt = viewpoints[ndx];
			this.notifyListeners(editor.events.Created, vpt);
		}
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Camera Info Widget
//////////////////////////////////////////////////////////////////////////////////////////////////// 

	var CamInfoWidget = function() {
		editor.ui.FormWidget.call(this, {
			name: 'camInfoWidget',
			height: editor.ui.Height.MANUAL
		});
	};

	CamInfoWidget.prototype = new editor.ui.FormWidget();
	CamInfoWidget.prototype.constructor = CamInfoWidget;

	CamInfoWidget.prototype.layout = function() {
		var ctn = this.container = jQuery(
				'<div class="cameraInfo">' +
				'	<form action="post">' +
				'		<fieldset>' +
				'			<legend>Position</legend>' +
				'			<label for="camInf-pos-x">x</label>' +
				'			<input id="camInf-pos-x" type="text" />' +
				'			<label for="camInf-pos-y">y</label>' +
				'			<input id="camInf-pos-y" type="text" />' +
				'			<label for="camInf-pos-z">z</label>' +
				'			<input id="camInf-pos-z" type="text" />' +
				'		</fieldset>' +
				'		<fieldset>' +
				'			<legend>Target</legend>' +
				'			<label for="camInf-tgt-x">x</label>' +
				'			<input id="camInf-tgt-x" type="text" />' +
				'			<label for="camInf-tgt-y">y</label>' +
				'			<input id="camInf-tgt-y" type="text" />' +
				'			<label for="camInf-tgt-z">z</label>' +
				'			<input id="camInf-tgt-z" type="text" />' +
				'		</fieldset>' +
				'		<fieldset>' +
				'			<legend>Lens</legend>' +
				'			<label for="camInf-lens-fov">fov</label>' +
				'			<input id="camInf-lens-fov" type="text" />' +
				'			<label for="camInf-lens-np">near plane</label>' +
				'			<input id="camInf-lens-np" type="text" />' +
				'			<label for="camInf-lens-fp">far plane</label>' +
				'			<input id="camInf-lens-fp" type="text" />' +
				'		</fieldset>' +
				'	</form>' +
				'</div>'
			),
			inputs = ctn.find('input'),
			wgt = this;

		inputs.bind('blur', function(evt) {
			var ipt = jQuery(this),
				id = ipt.attr('id');

			wgt.notifyListeners(shorthand.events.UpdateCameraInfo, {
				name: id,
				value: parseFloat(ipt.val())
			});
		});
	};

	CamInfoWidget.prototype.updateCameraInfo = function(camData) {
		var ctn = this.container,
			camPosX = ctn.find('#camInf-pos-x'),
			camPosY = ctn.find('#camInf-pos-y'),
			camPosZ = ctn.find('#camInf-pos-z'),
			camTgtX = ctn.find('#camInf-tgt-x'),
			camTgtY = ctn.find('#camInf-tgt-y'),
			camTgtZ = ctn.find('#camInf-tgt-z'),
			camFov = ctn.find('#camInf-lens-fov'),
			camNp = ctn.find('#camInf-lens-np'),
			camFp = ctn.find('#camInf-lens-fp');

		if (!camPosX.is(':focus')) {
			camPosX.val(camData.eye.x);
		}
		if (!camPosY.is(':focus')) {
			camPosY.val(camData.eye.y);
		}
		if (!camPosZ.is(':focus')) {
			camPosZ.val(camData.eye.z);
		}
		if (!camTgtX.is(':focus')) {
			camTgtX.val(camData.target.x);
		}
		if (!camTgtY.is(':focus')) {
			camTgtY.val(camData.target.y);
		}
		if (!camTgtZ.is(':focus')) {
			camTgtZ.val(camData.target.z);
		}
		if (!camFov.is(':focus')) {
			camFov.val(camData.fov);
		}
		if (!camNp.is(':focus')) {
			camNp.val(camData.np);
		}
		if (!camFp.is(':focus')) {
			camFp.val(camData.fp);
		}
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Create Viewpoint Widget
////////////////////////////////////////////////////////////////////////////////////////////////////

	var CreateWidget = function() {
		editor.ui.FormWidget.call(this, {
			name: 'createVptWidget',
			uiFile: 'js/editor/plugins/viewpoints/html/viewpointsForms.htm'
		});

	};
	
	var formWgtSuper = editor.ui.FormWidget.prototype;
	
	CreateWidget.prototype = new editor.ui.FormWidget();
	CreateWidget.prototype.constructor = CreateWidget;

		
	CreateWidget.prototype.checkToggleButtons = function() {
		var np = this.nearPlane.getValue(),
			fp = this.farPlane.getValue(),
			fov = this.fov.getValue(),
			isSafe = this.eye.getValue() != null && 
				this.target.getValue() != null && 
				hemi.utils.isNumeric(fov) && hemi.utils.isNumeric(np) && 
				hemi.utils.isNumeric(fp);
				
		if (isSafe) {
			this.previewBtn.removeAttr('disabled');
			
			if (this.name.getValue() != null) {
				this.saveBtn.removeAttr('disabled');
			} else {
				this.saveBtn.attr('disabled', 'disabled');
			}
		} else {
			this.saveBtn.attr('disabled', 'disabled');
			this.previewBtn.attr('disabled', 'disabled');
		}
	};
		
	CreateWidget.prototype.layout = function() {
		formWgtSuper.layout.call(this);
		
		var wgt = this,
			validator = editor.ui.createDefaultValidator(),
			inputs = this.find('input:not(#vptName)'),
			form = this.find('form'),
			onBlurFcn = function(ipt, evt) {
				wgt.checkToggleButtons();
			};
		
		this.saveBtn = this.find('#vptSaveBtn');
		this.cancelBtn = this.find('#vptCancelBtn');
		this.previewBtn = this.find('#vptPreviewBtn');
		this.autofillBtn = this.find('#vptAutoFill');
		this.fov = new editor.ui.Input({
			container: wgt.find('#vptFov'),
			type: 'angle'
		});
		this.nearPlane = new editor.ui.Input({
			container: wgt.find('#vptNearPlane')
		});
		this.farPlane = new editor.ui.Input({
			container: wgt.find('#vptFarPlane')
		});
		this.name = new editor.ui.Input({
			container: wgt.find('#vptName'),
			type: 'string'
		});
		this.eye = new editor.ui.Vector({
			container: wgt.find('#vptCameraDiv'),
			paramName: 'eye',
			onBlur: onBlurFcn,
			validator: validator
		});
		this.target = new editor.ui.Vector({
			container: wgt.find('#vptTargetDiv'),
			paramName: 'position',
			onBlur: onBlurFcn,
			validator: validator
		});

		validator.setElements(inputs);
		
		inputs.bind('blur', function(evt) {
			wgt.checkToggleButtons();
		});
		
		form.bind('submit', function() {
			return false;
		});
		
		this.saveBtn.bind('click', function(evt) {					
			wgt.notifyListeners(shorthand.events.SaveViewpoint, 
				wgt.getParams());
		});
		
		this.cancelBtn.bind('click', function(evt) {
			wgt.notifyListeners(editor.events.Cancel, null);
		});
		
		this.previewBtn.bind('click', function(evt) {					
			wgt.notifyListeners(shorthand.events.PreviewViewpoint, 
				wgt.getParams());
		});
		
		this.autofillBtn.bind('click', function(evt) {
			var vd = hemi.createViewData(editor.client.camera);
			
			wgt.set(vd);
			wgt.checkToggleButtons();
		});
		
		this.name.getUI().bind('keyup', function(evt) {
			wgt.checkToggleButtons();
		});
	};
		
	CreateWidget.prototype.getParams = function() {
		var eyeVal = this.eye.getValue(),
			tgtVal = this.target.getValue(),
			params = {
				eye: eyeVal,
				target: tgtVal,
				fov: this.fov.getValue(),
				np: this.nearPlane.getValue(),
				fp: this.farPlane.getValue(),
				name: this.name.getValue()
			};
			
		return params;
	};
		
	CreateWidget.prototype.reset = function() {
		this.eye.reset();
		this.target.reset();
		this.fov.reset();
		this.nearPlane.reset();
		this.farPlane.reset();
		this.name.reset();
		this.saveBtn.attr('disabled', 'disabled');
		this.previewBtn.attr('disabled', 'disabled');
	};
		
	CreateWidget.prototype.set = function(viewpoint) {
		
		this.eye.setValue({
			x: viewpoint.eye.x,
			y: viewpoint.eye.y,
			z: viewpoint.eye.z
		});
		this.target.setValue({
			x: viewpoint.target.x,
			y: viewpoint.target.y,
			z: viewpoint.target.z
		});
		this.fov.setValue(viewpoint.fov);
		this.nearPlane.setValue(viewpoint.np);
		this.farPlane.setValue(viewpoint.fp);
		if (viewpoint.name) {
			this.name.setValue(viewpoint.name);
		}
		this.previewBtn.removeAttr('disabled');
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Viewpoint List Widget
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var ListWidget = function() {
		editor.ui.ListWidget.call(this, {
			name: 'viewpointListWidget',
			listId: 'viewpointList',
			prefix: 'vptLst',
			title: 'Camera Viewpoints',
			instructions: "Add new viewpoints above."
		});
	};
	
	var listWgtSuper = editor.ui.ListWidget.prototype;
	
	ListWidget.prototype = new editor.ui.ListWidget();
	ListWidget.prototype.constructor = ListWidget;

	ListWidget.prototype.bindButtons = function(li, obj) {
		listWgtSuper.bindButtons.call(this, li, obj); // check if this is right
		//this._super(li, obj);
		
		li.title.bind('click', function(evt) {
			var vpt = li.getAttachedObject();
			editor.client.camera.moveToView(vpt);
		});
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// View
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The ViewpointsView controls the dialog and toolbar widget for the
	 * animation tool.
	 */
	var ViewpointsView = function() {
		editor.ToolView.call(this, {
			toolName: 'Viewpoints',
			toolTip: 'Create and edit viewpoints for cameras to move between',
			id: 'viewpoints'        
		});

		this.addPanel(new editor.ui.Panel());
		this.addPanel(new editor.ui.Panel({
			location: editor.ui.Location.BOTTOM,
			classes: ['bottomPanel', 'vptBottomPanel']
		}));
		
		this.sidePanel.addWidget(new CreateWidget());
		this.sidePanel.addWidget(new ListWidget());
		this.bottomPanel.addWidget(new CamInfoWidget());
	};

	ViewpointsView.prototype = new editor.ToolView();
	ViewpointsView.prototype.constructor = ViewpointsView;
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Controller
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * The ViewpointsController facilitates ViewpointsModel and ViewpointsView
	 * communication by binding event and message handlers.
	 */
	var ViewpointsController = function() {
		editor.ToolController.call(this);
	};

	var viewpointsCtrSuper = editor.ToolController.prototype;
	
	ViewpointsController.prototype = new editor.ToolController();
	ViewpointsController.prototype.constructor = ViewpointsController;
		
		/**
		 * Binds event and message handlers to the view and model this object
		 * references.
		 */
	ViewpointsController.prototype.bindEvents = function() {
		viewpointsCtrSuper.bindEvents.call(this);
			
		var model = this.model,
			view = this.view,
			crtWgt = view.sidePanel.createVptWidget,
			camInfWgt = view.bottomPanel.camInfoWidget,
			lstWgt = view.sidePanel.viewpointListWidget;
		
		// special listener for when the toolbar button is clicked
		view.addListener(editor.events.ToolModeSet, function(value) {
			var isDown = value.newMode === editor.ToolConstants.MODE_DOWN;
			model.enableMonitoring(isDown);
		});
		
		// create viewpoint widget specific
		crtWgt.addListener(editor.events.Cancel, function(params) {
			model.cancelViewpointEdit();
			crtWgt.reset();
		});
		crtWgt.addListener(shorthand.events.SaveViewpoint, function(params) {
			var eye = params.eye,
				tgt = params.target;
			params.eye = new THREE.Vector3(eye[0], eye[1], eye[2]);
			params.target = new THREE.Vector3(tgt[0], tgt[1], tgt[2]);
			
			model.saveViewpoint(params);
		});
		crtWgt.addListener(shorthand.events.PreviewViewpoint, function(params) {
			var eye = params.eye,
				tgt = params.target;
			params.eye = new THREE.Vector3(eye[0], eye[1], eye[2]);
			params.target = new THREE.Vector3(tgt[0], tgt[1], tgt[2]);
			model.previewViewpoint(params);
		});

		// camera info widget
		camInfWgt.addListener(shorthand.events.UpdateCameraInfo, function(data) {
			model.updateCamera(data.name, data.value);
		});
		
		// viewpoint list widget specific
		lstWgt.addListener(editor.events.Edit, function(viewpoint) {
			model.editViewpoint(viewpoint);
			crtWgt.set(viewpoint);
		});
		lstWgt.addListener(editor.events.Remove, function(vpt) {
			model.removeViewpoint(vpt);
		});

        
		// model specific 
		model.addListener(shorthand.events.CameraUpdated, function(camData) {
			camInfWgt.updateCameraInfo(camData);
		});
		model.addListener(editor.events.Created, function(vpt) {
			crtWgt.reset();
			lstWgt.add(vpt);
		});
		model.addListener(editor.events.Updated, function(vpt) {
			crtWgt.reset();
			lstWgt.update(vpt);
		});
		model.addListener(editor.events.Removing, function(vpt) {
			lstWgt.remove(vpt);
		});
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////////
// Extra Scripts
////////////////////////////////////////////////////////////////////////////////////////////////////

	editor.getCss('js/editor/plugins/viewpoints/css/style.css');
})();
