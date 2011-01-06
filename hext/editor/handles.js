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

o3djs.require('hemi.core');
o3djs.require('hemi.view');
o3djs.require('hemi.world');
o3djs.require('hemi.manip');
o3djs.require('hext.msg');

var hext = (function(hext) {
	/**
	 * @namespace A module for simulation engines.
	 */
	hext.editor = hext.editor || {};
	
	hext.editor.handleType = {
		TRANSLATE : 'translate',
		ROTATE    : 'rotate',
		SCALE     : 'scale'
	};
	
	hext.editor.initHandles = function() {
		if (hext.editor.transforms) return;
		var m4 = hemi.core.math.matrix4,
			t = {
			main : hemi.core.mainPack.createObject('o3d.Transform'),
			x    : hemi.core.mainPack.createObject('o3d.Transform'),
			y    : hemi.core.mainPack.createObject('o3d.Transform'),
			z    : hemi.core.mainPack.createObject('o3d.Transform')
		};	
		hext.editor.arrowMat = hemi.core.material.createConstantMaterial(
			hemi.core.mainPack,
			hemi.view.viewInfo,
			[1,1,1,1]);
		t.x.parent = t.main;
		t.y.parent = t.main;
		t.z.parent = t.main;
		t.x.name = 'hext.editor.handleX';
		t.y.name = 'hext.editor.handleY';
		t.z.name = 'hext.editor.handleZ';
		t.x.createParam('emissive','o3d.ParamFloat4').value = [1,0,0,1];
		t.y.createParam('emissive','o3d.ParamFloat4').value = [0,1,0,1];
		t.z.createParam('emissive','o3d.ParamFloat4').value = [0,0,1,1];
		t.x.rotateZ(Math.PI/2);
		t.x.rotateY(Math.PI/2);
		t.z.rotateX(Math.PI/2);
		t.z.rotateY(Math.PI/2);
		var upMatrix = m4.translation([0,1.4,0,1]);
		var downMatrix = m4.rotateX(m4.translation([0,-1.4,0,1]),Math.PI);
		
		var transShape1 = hemi.core.primitives.createTruncatedCone(
			hemi.core.mainPack,
			hext.editor.arrowMat,
			0.2, 0.0, 0.6, 24, 1,upMatrix);
		var transShape2 = hemi.core.primitives.createTruncatedCone(
			hemi.core.mainPack,
			hext.editor.arrowMat,
			0.2, 0.0, 0.6, 24, 1,downMatrix);
		transShape1.name = transShape2.name = 'T';
		
		var rotShape1 = hemi.core.primitives.createBox(
			hemi.core.mainPack,
			hext.editor.arrowMat,
			0.05, 0.2, 1.0, upMatrix);
		var rotShape2 = hemi.core.primitives.createBox(
			hemi.core.mainPack,
			hext.editor.arrowMat,
			0.05, 0.2, 1.0, downMatrix);
		rotShape1.name = rotShape2.name = 'R';		
		
		hext.editor.transforms = t;
		hext.editor.shapes = {
			translate : [transShape1,transShape2],
			rotate    : [rotShape1, rotShape2],
			scale     : []
		};
	};
		
	hext.editor.Handle = function(transform,type) {
		hext.editor.initHandles();
		this.transform = transform;
		this.scale = hext.editor.maxExtent(this.transform);
		hext.editor.transforms.main.parent = this.transform;
		hext.editor.transforms.main.scale([this.scale,this.scale,this.scale]);
		this.draggable = null;
		this.initShapes(type);
		this.enable();
	};
	
	hext.editor.Handle.prototype = {
	
		cleanup : function() {
			var t = hext.editor.transforms;
			this.transform = null;
			t.main.parent = null;
			this.draggable = null;
			t.main.identity();
			for (var i = t.x.shapes.length - 1; i >= 0; i--) {
				t.x.removeShape(t.x.shapes[i]);
				t.y.removeShape(t.y.shapes[i]);
				t.z.removeShape(t.z.shapes[i]);
			}
			this.disable();
		},
		
		disable: function() {
			if (this.enabled) {
				hemi.world.unsubscribe(this.msgHandler, hemi.msg.pick);
				hemi.input.removeMouseUpListener(this);
				this.enabled = false;
			}
		},
	
		enable : function() {
			if (!this.enabled) {
				this.msgHandler = hemi.world.subscribe(
					hemi.msg.pick,
					this,
					'onPick',
					[hemi.dispatch.MSG_ARG + 'data.pickInfo', 
					 hemi.dispatch.MSG_ARG + 'data.mouseEvent']);
				hemi.input.addMouseUpListener(this);
				this.enabled = true;
			}
		},
		
		initShapes : function(type) {
			var shapes = hext.editor.shapes[type.toLowerCase()];
			for (i in shapes) {
				hext.editor.transforms.x.addShape(shapes[i]);
				hext.editor.transforms.y.addShape(shapes[i]);
				hext.editor.transforms.z.addShape(shapes[i]);
			}
		},
		
		onMouseUp : function() {
		    if (this.draggable) this.draggable.cleanup();
			this.draggable = null;
		},
		
		onPick : function(pickInfo,event) {
			var picked = pickInfo.shapeInfo.parent.transform.name + 
						 pickInfo.shapeInfo.shape.name;
			switch (picked) {
				case 'hext.editor.handleXT':
					this.draggable = new hemi.manip.Draggable(
						hemi.manip.Plane.XY,
						[[null,0],[null,0]]);
					break;
				case 'hext.editor.handleYT':
					this.draggable = new hemi.manip.Draggable(
						hemi.manip.Plane.XY,
						[[0,null],[0,null]]);
					break;
				case 'hext.editor.handleZT':
					this.draggable = new hemi.manip.Draggable(
						hemi.manip.Plane.YZ,
						[[null,0],[null,0]]);
					break;
				case 'hext.editor.handleXR':
					this.draggable = new hemi.manip.Turnable(hemi.manip.Axis.Z);
					break;
				case 'hext.editor.handleYR':
					this.draggable = new hemi.manip.Turnable(hemi.manip.Axis.X);
					break;
				case 'hext.editor.handleZR':
					this.draggable = new hemi.manip.Turnable(hemi.manip.Axis.Y);
			}
			if (this.draggable) {
				this.draggable.addTransform(this.transform);
				this.draggable.onPick(pickInfo,event);
			}
		}
	
	};
	
	hext.editor.maxExtent = function(t) {
		var max = 0.0,
			shape,bbox,x;
		for (i in t.shapes) {
			shape = t.shapes[i];
			for (j in shape.elements) {
				bbox = shape.elements[j].boundingBox;
				for (k in bbox.maxExtent) {
					x = Math.abs(bbox.maxExtent[k]);
					max = (x>max) ? x : max;
				}
				for (k in bbox.minExtent) {
					x = Math.abs(bbox.minExtent[k]);
					max = (x>max) ? x : max;
				}
			}
		}
		for (i in t.children) {
			x = hext.editor.maxExtent(t.children[i]);
			max = (x>max) ? x : max;
		}
		return max;
	};
	
	return hext;
})(hext || {});