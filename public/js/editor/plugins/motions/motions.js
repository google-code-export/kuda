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
	"use strict";

////////////////////////////////////////////////////////////////////////////////////////////////////
//                     			   			Initialization			  		                      //
////////////////////////////////////////////////////////////////////////////////////////////////////

	var shorthand = editor.tools.motions,
		_vector1 = new THREE.Vector3(),
		_vector2 = new THREE.Vector3();

	shorthand.init = function() {
		var navPane = editor.ui.getNavPane('Animation'),

			mtnMdl = new MotionsModel(),
			mtnView = new MotionsView(),
			mtnCtr = new MotionsController();

		mtnCtr.setModel(mtnMdl);
		mtnCtr.setView(mtnView);

		navPane.add(mtnView);

		var model = editor.getModel('browser');

		if (model) {
			mtnCtr.setBrowserModel(model);
		} else {
			editor.addListener(editor.events.PluginLoaded, function(name) {
				if (name === 'browser' && !mtnCtr.bound) {
					mtnCtr.setBrowserModel(editor.getModel(name));
				}
			});
		}
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
//                     			  			Tool Definition			  		                      //
////////////////////////////////////////////////////////////////////////////////////////////////////

	shorthand.events = {
		// view specific
		SaveMotion: "Motion.SaveMotion",
		StartPreview: "Motion.StartPreview",
		StopPreview: "Motion.StopPreview"
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                   			 Model                                    		  //
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * A MotionsModel handles the creation, updating, and removal of Rotators and Translators.
	 */
	var MotionsModel = function() {
		editor.ToolModel.call(this, 'motions');

		this.currentTransform = null;
		this.previewProps = {
			active: false,
			moveAccel: new THREE.Vector3(),
			moveVel: new THREE.Vector3(),
			position: new THREE.Vector3(),
			rotation: new THREE.Vector3(),
			scale: new THREE.Vector3(),
			turnAccel: new THREE.Vector3(),
			turnVel: new THREE.Vector3()
		};
	};

	MotionsModel.prototype = new editor.ToolModel();
	MotionsModel.prototype.constructor = MotionsModel;

	MotionsModel.prototype.clearMotion = function(transform) {
		transform.cancelMoving();
		transform.cancelTurning();
		this.notifyListeners(editor.events.Removing, transform);
	};

	MotionsModel.prototype.saveMotion = function(props) {
		var transform = this.currentTransform,
			motionBefore = hasMotions(transform);

		this.stopPreview();
		setTransformMotion(transform, props, true);
		this.setTransform(null);

		var motionAfter = hasMotions(transform);

		if (motionBefore && !motionAfter) {
			this.notifyListeners(editor.events.Removing, transform);
		} else if (!motionBefore && motionAfter) {
			this.notifyListeners(editor.events.Created, transform);
		}
	};

	MotionsModel.prototype.setTransform = function(transform, opt_notify) {
		if (this.currentTransform !== transform) {
			this.stopPreview();
			this.currentTransform = transform;

			if (opt_notify !== false) {
				this.notifyListeners(editor.events.Editing, transform);
			}
		}
	};

	MotionsModel.prototype.startPreview = function(props) {
		var transform = this.currentTransform,
			prevProps = this.previewProps;

		this.stopPreview();
		hemi.utils.useEuler(transform);

		prevProps.active = true;
		prevProps.position.copy(transform.position);
		prevProps.rotation.copy(transform.rotation);
		prevProps.scale.copy(transform.scale);
		transform.getAcceleration(hemi.MotionType.MOVE, prevProps.moveAccel);
		transform.getVelocity(hemi.MotionType.MOVE, prevProps.moveVel);
		transform.getAcceleration(hemi.MotionType.TURN, prevProps.turnAccel);
		transform.getVelocity(hemi.MotionType.TURN, prevProps.turnVel);

		setTransformMotion(transform, props, false);
	};

	MotionsModel.prototype.stopPreview = function() {
		var transform = this.currentTransform,
			props = this.previewProps;

		if (props.active) {
			props.active = false;

			if (!props.moveAccel.isZero() || !props.moveVel.isZero()) {
				transform.setMoving(props.moveVel, props.moveAccel);
                transform._translator.disable();
			} else {
				transform.cancelMoving();
			}

			if (!props.turnAccel.isZero() || !props.turnVel.isZero()) {
				transform.setTurning(props.turnVel, props.turnAccel);
                transform._rotator.disable();
			} else {
				transform.cancelTurning();
			}

			transform.position.copy(props.position);
			transform.rotation.copy(props.rotation);
			transform.scale.copy(props.scale);
			transform.updateMatrix();
			transform.updateMatrixWorld();
		}
	};

	MotionsModel.prototype.worldCleaned = function() {
		var transform = editor.client.scene,
			children = transform.children.slice(0);

		while (children.length > 0) {
			transform = children.pop();

			if (hasMotions(transform)) {
				this.notifyListeners(editor.events.Removing, transform);
			}

			for (var i = 0, il = transform.children.length; i < il; ++i) {
				children.push(transform.children[i]);
			}
		}
	};

	MotionsModel.prototype.worldLoaded = function() {
		var transform = editor.client.scene,
			children = transform.children.slice(0);

		while (children.length > 0) {
			transform = children.pop();

			if (hasMotions(transform)) {
				this.notifyListeners(editor.events.Created, transform);
			}

			for (var i = 0, il = transform.children.length; i < il; ++i) {
				children.push(transform.children[i]);
			}
		}
	};

	function hasMotions(transform) {
		return transform._translator != null || transform._rotator != null;
	}

	function setTransformMotion(transform, props, disable) {
		if (props.moveAccel.join() !== '0,0,0' || props.moveVel.join() !== '0,0,0') {
			_vector1.x = props.moveAccel[0];
			_vector1.y = props.moveAccel[1];
			_vector1.z = props.moveAccel[2];
			_vector2.x = props.moveVel[0];
			_vector2.y = props.moveVel[1];
			_vector2.z = props.moveVel[2];

			transform.setMoving(_vector2, _vector1);

			if (disable) {
				transform._translator.disable();
			} else { 
                transform._translator.enable();
            }
		} else {
			transform.cancelMoving();
		}

		if (props.turnAccel.join() !== '0,0,0' || props.turnVel.join() !== '0,0,0') {
			_vector1.x = props.turnAccel[0];
			_vector1.y = props.turnAccel[1];
			_vector1.z = props.turnAccel[2];
			_vector2.x = props.turnVel[0];
			_vector2.y = props.turnVel[1];
			_vector2.z = props.turnVel[2];

			transform.setTurning(_vector2, _vector1);

			if (disable) {
				transform._rotator.disable();
			} else { 
                transform._rotator.enable();
            }
		} else {
			transform.cancelTurning();
		}
	}

////////////////////////////////////////////////////////////////////////////////////////////////////
//                     	   			 Create Motion Sidebar Widget    	                          //
////////////////////////////////////////////////////////////////////////////////////////////////////
	var NO_TRANS = 'NONE_SELECTED',

		crtWgtSuper = editor.ui.FormWidget.prototype,

		CreateWidget = function() {
			editor.ui.FormWidget.call(this, {
				name: 'createMtnWidget',
				uiFile: 'js/editor/plugins/motions/html/motionsForms.htm'
			});

			this.transform = null;
			this.tranList = {};
		};

	CreateWidget.prototype = new editor.ui.FormWidget();
	CreateWidget.prototype.constructor = CreateWidget;

	CreateWidget.prototype.checkStatus = function() {
		var prevBtn = this.find('#mtnPrevBtn'),
			saveBtn = this.find('#mtnSaveBtn'),
			isSafe = this.transform !== null;

		if (isSafe) {
			prevBtn.removeAttr('disabled');
		} else {
			prevBtn.attr('disabled', 'disabled');
		}

		if (isSafe) {
			saveBtn.removeAttr('disabled');
		} else {
			saveBtn.attr('disabled', 'disabled');
		}
	};

	CreateWidget.prototype.getProperties = function() {
		return {
				moveAccel: this.moveAccel.getValue() || [0,0,0],
				moveVel: this.moveVel.getValue() || [0,0,0],
				turnAccel: this.turnAccel.getValue() || [0,0,0],
				turnVel: this.turnVel.getValue() || [0,0,0]
			};
	};

	CreateWidget.prototype.layout = function() {
		crtWgtSuper.layout.call(this);

		var validator = editor.ui.createDefaultValidator(),
			wgt = this;

		this.tranList[NO_TRANS] = jQuery('<li><label>None selected</label></li>');
		this.find('#mtnTranList').append(this.tranList[NO_TRANS]);

		this.moveVel = new editor.ui.Vector({
			container: wgt.find('#movVelDiv'),
			validator: validator
		});
		this.moveAccel = new editor.ui.Vector({
			container: wgt.find('#movAccelDiv'),
			validator: validator
		});
		this.turnVel = new editor.ui.Vector({
			container: wgt.find('#trnVelDiv'),
			inputType: 'angle',
			validator: validator
		});
		this.turnAccel = new editor.ui.Vector({
			container: wgt.find('#trnAccelDiv'),
			inputType: 'angle',
			validator: validator
		});

		this.find('#movParams').hide();
		this.find('#trnParams').hide();

		this.find('#mtnSaveBtn').bind('click', function(evt) {
			var props = wgt.getProperties();
			wgt.reset();
			wgt.notifyListeners(shorthand.events.SaveMotion, props);
		})
		.attr('disabled', 'disabled');

		this.find('#mtnCancelBtn').bind('click', function(evt) {
			wgt.reset();
			wgt.notifyListeners(editor.events.Edit, null);
		});

		this.find('#mtnPrevBtn').bind('click', function(evt) {
			var btn = jQuery(this);

			if (btn.data('previewing')) {
				wgt.notifyListeners(shorthand.events.StopPreview, null);
				btn.text('Start Preview').data('previewing', false);
			} else {
				var props = wgt.getProperties();
				wgt.notifyListeners(shorthand.events.StartPreview, props);
				btn.text('Stop Preview').data('previewing', true);
			}
		}).data('previewing', false);

		this.find('form').submit(function(evt) {
			return false;
		});
	};

	CreateWidget.prototype.reset = function() {
		if (this.transform !== null) {
			this.find('#mtnTranList').append(this.tranList[NO_TRANS]);
			this.tranList[this.transform.name].detach();
			this.transform = null;
		}

		// reset the vectors and hide them
		this.moveVel.reset();
		this.moveAccel.reset();
		this.turnVel.reset();
		this.turnAccel.reset();
		this.find('#movParams').hide();
		this.find('#trnParams').hide();

		// disable the save and preview buttons
		this.find('#mtnSaveBtn').attr('disabled', 'disabled');
		this.find('#mtnPrevBtn').attr('disabled', 'disabled')
			.text('Start Preview')
			.data('previewing', false);

		this.invalidate();
	};

	CreateWidget.prototype.setTransform = function(transform) {
		if (transform === this.transform) return;

		if (transform === null) {
			this.reset();
			return;
		} else if (this.transform !== null) {
			this.tranList[this.transform.name].detach();
		} else {
			this.tranList[NO_TRANS].detach();
		}

		var name = transform.name,
			li = this.tranList[name],
			ol = this.find('#mtnTranList');

		if (li === undefined) {
			this.tranList[name] = li = jQuery('<li><label>' + name + '</label></li>');
		}

		setInput(transform.getAcceleration(hemi.MotionType.MOVE, _vector1), this.moveAccel);
		setInput(transform.getVelocity(hemi.MotionType.MOVE, _vector1), this.moveVel);
		setInput(transform.getAcceleration(hemi.MotionType.TURN, _vector1), this.turnAccel);
		setInput(transform.getVelocity(hemi.MotionType.TURN, _vector1), this.turnVel);

		ol.append(li);
		this.find('#movParams').show();
		this.find('#trnParams').show();
		this.invalidate();

		this.transform = transform;
		this.checkStatus();
	};

	function setInput(vector, input) {
		if (vector.x !== 0 || vector.y !== 0 || vector.z !== 0) {
			input.setValue({
				x: vector.x,
				y: vector.y,
				z: vector.z
			});
		} else {
			input.reset();
		}
	}

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                  			View		                                      //
////////////////////////////////////////////////////////////////////////////////////////////////////   

	/**
	 * The MotionsView controls the dialog and toolbar widget for the motions tool.
	 */
	var MotionsView = function() {
		editor.ToolView.call(this, {
			toolName: 'Motions',
			toolTip: 'Create and edit moving transforms',
			id: 'motions'
		});

		this.addPanel(new editor.ui.Panel({
			name: 'sidePanel',
			classes: ['mtnSidePanel']
		}));

		this.sidePanel.addWidget(new CreateWidget());
		this.sidePanel.addWidget(new editor.ui.ListWidget({
			name: 'mtnListWidget',
			listId: 'motionList',
			prefix: 'mtnLst',
			title: 'Transforms with motions',
			instructions: "Add motions above."
		}));
	};

	MotionsView.prototype = new editor.ToolView();
	MotionsView.prototype.constructor = MotionsView;

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                			  Controller		                                  //
////////////////////////////////////////////////////////////////////////////////////////////////////

	var mtnCtrSuper = editor.ToolController.prototype,

		/**
		 * The MotionsController facilitates MotionsModel and MotionsView communication by binding
		 * event and message handlers.
		 */
		MotionsController = function() {
			editor.ToolController.call(this);

			this.bound = false;
			this.bwrModel = null;
		};

	MotionsController.prototype = new editor.ToolController();
	MotionsController.prototype.constructor = MotionsController;

	MotionsController.prototype.bindEvents = function() {
		mtnCtrSuper.bindEvents.call(this);

		this.bound = true;

		var model = this.model,
			bwrModel = this.bwrModel,
			view = this.view,
			crtWgt = view.sidePanel.createMtnWidget,
			lstWgt = view.sidePanel.mtnListWidget;

		// create motion widget events
		crtWgt.addListener(editor.events.Edit, function(transform) {
			model.setTransform(transform);
		});
		crtWgt.addListener(shorthand.events.SaveMotion, function(props) {
			model.saveMotion(props);
		});
		crtWgt.addListener(shorthand.events.StartPreview, function(props) {
			bwrModel.enableSelection(false);
			model.startPreview(props);
		});
		crtWgt.addListener(shorthand.events.StopPreview, function(value) {
			bwrModel.enableSelection(true);
			model.stopPreview();
		});

		// motion list widget events
		lstWgt.addListener(editor.events.Edit, function(transform) {
			model.setTransform(transform);
		});
		lstWgt.addListener(editor.events.Remove, function(transform) {
			model.clearMotion(transform);
		});

		// view events
		view.addListener(editor.events.ToolModeSet, function(value) {
			var isDown = value.newMode === editor.ToolConstants.MODE_DOWN;
			bwrModel.enableSelection(isDown);
		});

		// model events
		model.addListener(editor.events.Created, function(transform) {
			lstWgt.add(transform);
		});
		model.addListener(editor.events.Editing, function(transform) {
			bwrModel.deselectAll();
			bwrModel.enableSelection(true);
			crtWgt.setTransform(transform);

			if (transform !== null) {
				bwrModel.selectTransform(transform);
			}
		});
		model.addListener(editor.events.Removing, function(transform) {
			lstWgt.remove(transform);
		});

		// browser model events
		var browserEvents = editor.tools.browser.events;

		bwrModel.addListener(browserEvents.TransformDeselected, function(transform) {
			model.setTransform(null, false);
			crtWgt.setTransform(null);
		});
		bwrModel.addListener(browserEvents.TransformSelected, function(transform) {
			model.setTransform(transform, false);
			crtWgt.setTransform(transform);
		});
	};

	MotionsController.prototype.checkBindEvents = function() {
		return !this.bound && this.bwrModel && this.model && this.view;
	};

	MotionsController.prototype.setBrowserModel = function(model) {
		this.bwrModel = model;

		if (this.checkBindEvents()) {
			this.bindEvents();
		}
	};

})();