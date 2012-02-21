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

(function(editor) {
	"use strict";
	
    editor.ui = editor.ui || {};
	editor.ui.trans = editor.ui.trans || {};
	
	var EXTENT = 5,
		MAX_EXTENT = 10,
		MIN_EXTENT = 4,
		ALL_AXES = new THREE.Vector3(1, 1, 1);
	
	editor.ui.trans.DrawState = {
		TRANSLATE: 0,
		ROTATE: 1,
		SCALE: 2,
		NONE: 3
	};
	
	function getBoundingBox(transform) {
		var children = transform.children,
			box = transform instanceof hemi.Mesh ? transform.getBoundingBox() : null;

		for (var i = 0, il = children.length; i < il; i++) {
			var b = getBoundingBox(children[i]);
			if (box && b) {
				box.min = new THREE.Vector3(
					Math.min(b.min.x, box.min.x),
					Math.min(b.min.y, box.min.y),
					Math.min(b.min.z, box.min.z));
				box.max = new THREE.Vector3(
					Math.max(b.max.x, box.max.x),
					Math.max(b.max.y, box.max.y),
					Math.max(b.max.z, box.max.z));
			}
			else {
				box = b;
			}	
		}
		
		return box;
	};
	
	function getCenterOfGeometry(boundingBox) {
		var x = (boundingBox.min.x + boundingBox.max.x)/2,
			y = (boundingBox.min.y + boundingBox.max.y)/2,
			z = (boundingBox.min.z + boundingBox.max.z)/2;
		return new THREE.Vector3(x, y, z);
	};
	
	function getExtent(boundingBox, transform) {
		var minExt = hemi.utils.pointAsWorld(transform, boundingBox.min),
			maxExt = hemi.utils.pointAsWorld(transform, boundingBox.max),
//				minExt = bdgBox.minExtent,	FOR LOCAL
//				maxExt = bdgBox.maxExtent,	FOR LOCAL
			x = Math.abs(minExt.x - maxExt.x),
			y = Math.abs(minExt.y - maxExt.y),
			z = Math.abs(minExt.z - maxExt.z),
			realExt = (x + y + z) / 3;
			
		return realExt < MIN_EXTENT ? MIN_EXTENT : realExt;
	};
	
	var TransHandles = editor.ui.TransHandles = function() {
		editor.utils.Listenable.call(this);
		this.canvas = hemi.hudManager.currentContext;
		this.drawCallback = null;
		this.transform = null;
		
		this.xArrow = new Arrow(this.canvas, '#f00', '#f99');
		this.yArrow = new Arrow(this.canvas, '#0c0', '#9c9');
		this.zArrow = new Arrow(this.canvas, '#00f', '#99f');
		this.drawState = editor.ui.trans.DrawState.NONE;
		
		hemi.addRenderListener(this);
		this.overrideHandlers();
	};
		
	TransHandles.prototype = new editor.utils.Listenable();
	TransHandles.prototype.constructor = TransHandles;
		
	TransHandles.prototype.cleanup = function() {
		this.setDrawState(editor.ui.trans.DrawState.NONE);
		this.setTransform(null);
		hemi.view.removeRenderListener(this);
		
		var mouseDown = hemi.input.mouseDown,
			mouseUp = hemi.input.mouseUp,
			mouseMove = hemi.input.mouseMove,
			that = this,
			cvs = this.canvas;
			
		cvs.removeEventListener('mousedown', this.mouseDownHandler, true);
		cvs.removeEventListener('mousemove', this.mouseMoveHandler, true);
		cvs.removeEventListener('mouseup', this.mouseUpHandler, true);
		
		cvs.addEventListener('mousedown', mouseDown, true);
		cvs.addEventListener('mousemove', mouseUp, true);
		cvs.addEventListener('mouseup', mouseMove, true);
		jQuery(document).unbind('mouseup.transhandles');
	};
	
	TransHandles.prototype.drawHandles = function() {
		if (this.drawState !== editor.ui.trans.DrawState.NONE) {
//				var origin = this.transform.localMatrix[3],		FOR LOCAL
			var bbox = getBoundingBox(this.transform),
				origin = getCenterOfGeometry(bbox), 
				extent = getExtent(bbox, this.transform) / 2,
				x = origin.x, 
				y = origin.y, 
				z = origin.z, 
//					u = hemi.utils,	 FOR LOCAL
//					xVec = u.pointAsWorld(this.transform, [x + extent, y, z]),	 FOR LOCAL
//					yVec = u.pointAsWorld(this.transform, [x, y + extent, z]),	 FOR LOCAL 
//					zVec = u.pointAsWorld(this.transform, [x, y, z + extent]);	 FOR LOCAL
				xVec = new THREE.Vector3(x + extent, y, z), 
				yVec = new THREE.Vector3(x, y + extent, z), 
				zVec = new THREE.Vector3(x, y, z + extent);
			
			this.xArrow.setParams(origin, xVec,  
				hemi.Plane.XY, this.drawState, extent);
			this.yArrow.setParams(origin, yVec,  
				hemi.Plane.YZ, this.drawState, extent);
			this.zArrow.setParams(origin, zVec,  
				hemi.Plane.XZ, this.drawState, extent);
		}
	};
	
	TransHandles.prototype.convertEvent = function(evt) {
		var elem = jQuery(evt.target ? evt.target : evt.srcElement),
			offset = elem.offset();
		evt.x = evt.pageX - offset.left;
		evt.y = evt.pageY - offset.top;
		
		return evt;
	};
	
	TransHandles.prototype.isInView = function() {
		var worldViewProjection = [[], [], [], []],
			transform = this.transform,
			bdgBox = this.transform.geometry.boundingBox,
			projScreenMatrix = new THREE.Matrix4(),
			frustum = new THREE.Frustum(),
			camera = editor.client.camera;
		
		projScreenMatrix.multiply(camera.projectionMatrix, camera.matrixWorldInverse);
		frustum.setFromMatrix(projScreenMatrix);

		return frustum.contains(transform);;
	};
	
	TransHandles.prototype.onChange = function(val) {
		var that = this;
		
		this.notifyListeners(editor.events.Updated, {
			tran: that.transform,
			delta: val
		});
	};
	
	TransHandles.prototype.onMouseDown = function(evt) {
		if (!this.transform 
				|| this.drawState === editor.ui.trans.DrawState.NONE) {
			return false;
		}
		
		var x = evt.x,
			y = evt.y,
			plane,
			axis,
			scaleAxis;
			
		if (this.xArrow.isInside(x, y)) {
			this.down = true;
			plane = hemi.Plane.XY;
			axis = hemi.Axis.Z;
			scaleAxis = hemi.Axis.X;
		}
		else if (this.yArrow.isInside(x, y)) {
			this.down = true;
			plane = hemi.Plane.YZ;
			axis = hemi.Axis.X;
			scaleAxis = hemi.Axis.Y;
		}
		else if (this.zArrow.isInside(x, y)) {
			this.down = true;	
			plane = hemi.Plane.XZ;
			axis = hemi.Axis.Y;
			scaleAxis = hemi.Axis.Z;
		}
		
		if (this.down) {
			switch(this.drawState) {
				case editor.ui.trans.DrawState.ROTATE:
					this.startRotate(axis, evt);
					break;
				case editor.ui.trans.DrawState.SCALE:
					this.startScale(scaleAxis, evt);
					break;
				case editor.ui.trans.DrawState.TRANSLATE:
				    this.startTranslate(plane, evt);
					break;
			}			
			return true;
		}
		
		return false;
	};
	
	TransHandles.prototype.onMouseMove = function(evt) {
		if (!this.transform || this.drawState === editor.ui.trans.DrawState.NONE) {
			return false;
		} 
		else if (this.down) {
			this.manip.onMouseMove(evt);
		}
		
		var x = evt.x,
			y = evt.y,
			hovered = false;
				
		this.xArrow.hover = false;
		this.yArrow.hover = false;
		this.zArrow.hover = false;
		
		if (this.xArrow.isInside(x, y)) {
			hovered = this.xArrow.hover = true;
		}
		else if (this.yArrow.isInside(x, y)) {
			hovered = this.yArrow.hover = true;
		}
		else if (this.zArrow.isInside(x, y)) {
			hovered = this.zArrow.hover = true;
		}
		
		return hovered;
	};
	
	TransHandles.prototype.onMouseUp = function(evt) {
		if (!this.down) {
			return false;
		}
		
		this.down = false;
		if (this.manip) {
			this.transform.cancelInteraction();
			this.manip = null;
		}
		editor.client.camera.enableControl();
		
		// make the changes octanable
//		var param = this.transform.getParam('ownerId');
//		
//		if (param) {
//			owner = hemi.world.getCitizenById(param.value);
//			
//			if (owner.setTransformMatrix) {
//				owner.setTransformMatrix(this.transform, 
//					this.transform.localMatrix);
//			} else if (owner.setMatrix) {
//				owner.setMatrix(this.transform.localMatrix);
//			}
//		}
		
		return true;
	};
	
	TransHandles.prototype.onRender = function(renderEvent) {
		console.log(this.transform);
		if (this.drawState !== editor.ui.trans.DrawState.NONE && this.transform !== null) {
			hemi.hudManager.clearDisplay();

			if (this.drawCallback) {
				this.drawCallback();
			}

			this.drawHandles();
		}
	};
	
	TransHandles.prototype.overrideHandlers = function() {
		var mouseDown = hemi.input.mouseDown,
			mouseUp = hemi.input.mouseUp,
			mouseMove = hemi.input.mouseMove,
			that = this,
			cvs = this.canvas.canvas;
			
		cvs.removeEventListener('mousedown', mouseDown, true);
		cvs.removeEventListener('mousemove', mouseMove, true);
		cvs.removeEventListener('mouseup', mouseUp, true);
			
		this.mouseDownHandler = function(evt) {
			// Create a writeable clone of the event and convert it
			var wrEvt = hemi.utils.clone(evt, false);
			that.convertEvent(wrEvt);
			
			if (!that.onMouseDown(wrEvt)) {
				// Give the original handler the original event
				mouseDown(evt);
			}
		};
		this.mouseUpHandler = function(evt) {
			var wrEvt = hemi.utils.clone(evt, false);
			that.convertEvent(wrEvt);
			
			if (!that.onMouseUp(wrEvt)) {
				mouseUp(evt);
			}
		};
		this.mouseMoveHandler = function(evt) {
			var wrEvt = hemi.utils.clone(evt, false);
			that.convertEvent(wrEvt);
			
			if (!that.onMouseMove(wrEvt)) {
				mouseMove(evt);
			}
		};
		
		cvs.addEventListener('mousedown', this.mouseDownHandler, true);
		cvs.addEventListener('mousemove', this.mouseMoveHandler, true);
		cvs.addEventListener('mouseup', this.mouseUpHandler, true);
		jQuery(document).bind('mouseup.transhandles', function(evt) {
			that.onMouseUp(evt);
		});
	};
	
	TransHandles.prototype.setDrawCallback = function(callback) {
		this.drawCallback = callback;
	};
	
	TransHandles.prototype.setDrawState = function(state) {
		if (state === editor.ui.trans.DrawState.NONE) {
			// Clear any previously drawn handles off the display
			hemi.hudManager.clearDisplay();
		}

		this.drawState = state;
		// make sure the render handler is called at least once
		this.onRender();
	};
	
	TransHandles.prototype.setTransform = function(transform) {
		this.transform = transform;
		// make sure the render handler is called at least once
		this.onRender();
	};
	
	TransHandles.prototype.startRotate = function(axis, evt) {
		editor.client.camera.disableControl();
		this.transform.setTurnable(axis);
		this.manip = this.transform._manip;
		
		this.manip.onPick(this.transform, evt);
	};
	
	TransHandles.prototype.startScale = function(axis, evt) {
		editor.client.camera.disableControl();
		this.transform.setResizable(axis);
		this.manip = this.transform._manip;
		
		this.transform.subscribe(
			hemi.msg.resize,
			this,
			"onChange",
			[
				hemi.dispatch.MSG_ARG + "data.scale"
			]);
		
		
		if (evt.shiftKey) {
			this.manip.axis = ALL_AXES;
		}
		
		this.manip.onPick(this.transform, evt);
	};
	
	TransHandles.prototype.startTranslate = function(plane, evt) {
		editor.client.camera.disableControl();

		var limits;
		switch(plane) {
			case hemi.Plane.XY:
			    limits = [null, null, 0, 0];
				break;
			case hemi.Plane.YZ:
				limits = [0, 0, null, null];
				break;
			case hemi.Plane.XZ:
				limits = [0, 0, null, null];
				break;
		}
		
		this.transform.setMovable(plane, limits);		
		this.manip = this.transform._manip;
		this.manip.name = editor.ToolConstants.EDITOR_PREFIX + 'Dragger';
		this.transform.subscribe(
			hemi.msg.move,
			this,
			"onChange",
			[
				hemi.dispatch.MSG_ARG + "data.delta"
			]);
		

		this.manip.onPick(this.transform, evt);
	};
	
	var Arrow = function(canvas, color, hoverColor) {
		this.canvas = canvas;
		this.clr = color;
		this.hvrClr = hoverColor;
	};
	
	Arrow.prototype.isInside = function(coordX, coordY) {
		return coordX >= this.topLeft[0] && coordX <= this.bottomRight[0]
			&& coordY >= this.topLeft[1] && coordY <= this.bottomRight[1];
	};
	
	Arrow.prototype.drawLine = function() {	
		var cvs = this.canvas,
			cfg = this.config;
		cvs.beginPath();
		cvs.moveTo(cfg.orgPnt.x, cfg.orgPnt.y);
		cvs.lineTo(cfg.endPnt.x, cfg.endPnt.y);
		cvs.strokeStyle = this.hover ? this.hvrClr : this.clr;
		cvs.lineWidth = cfg.lineWidth;
		cvs.stroke();
	};
			
	Arrow.prototype.drawRotater = function() {
		var cfg = this.config,
			origin = cfg.origin,
			vector = cfg.vector,
			increment = Math.PI / 90,  // 2 degrees
			startAngle = Math.PI / 2,
			radius = cfg.extent,
			angles = [
				startAngle - increment * 3,
				startAngle - increment * 2,
				startAngle - increment,
				startAngle,
				startAngle + increment,
				startAngle + increment * 2,
				startAngle + increment * 3		
			],
			cvs = this.canvas,
			pnt1,
			pnt2;
		
		cvs.beginPath();
		// sample points on a circle in 3d space
		for (var ndx = 0, len = angles.length; ndx < len; ndx++) {
			var a = angles[ndx],
				pnt = origin.clone(); 
				
			switch(cfg.plane) {
				case hemi.Plane.XY:
					pnt.y = origin.y + radius * Math.cos(a);
					pnt.x = origin.x + radius * Math.sin(a);
					break;
				case hemi.Plane.YZ:
					pnt.z = origin.z + radius * Math.cos(a);
					pnt.y = origin.y + radius * Math.sin(a);
					break;
				case hemi.Plane.XZ:
					pnt.x = origin.x + radius * Math.cos(a);
					pnt.z = origin.z + radius * Math.sin(a);
					break;
			}
			
			pnt = hemi.utils.worldToScreen(editor.client, pnt);
			if (ndx === 0) {
				cvs.moveTo(pnt.x, pnt.y);
				pnt1 = pnt;
			}
			else if (ndx === len-1) {
				pnt2 = pnt;
			}
			cvs.lineTo(pnt.x, pnt.y);
		}
		cvs.strokeStyle = this.hover ? this.hvrClr : this.clr;
		cvs.lineWidth = cfg.lineWidth * 3;
		cvs.lineCap = 'round';
		cvs.stroke();
		
		// save coordinates
		var x1 = pnt1.x,
			x2 = pnt2.x,
			y1 = pnt1.y,
			y2 = pnt2.y,
			minX = Math.min(x1, x2),
			minY = Math.min(y1, y2),
			maxX = Math.max(x1, x2),
			
			maxY = Math.max(y1, y2);
			
		if (Math.abs(x1 - x2) < 5) {
			maxX = minX + 5;
		}
		if (Math.abs(y1 - y2) < 5) {
			maxY = minY + 5;
		}
			
		this.topLeft = [minX, minY];
		this.bottomRight = [maxX, maxY];
	};
	
	Arrow.prototype.drawScaler = function() {
		var client = editor.client,
			cfg = this.config,
			origin = cfg.origin,
			vector = cfg.vector,
			size = cfg.extent / 8,  
			points = [],
			cvs = this.canvas,
			clr = this.hover ? this.hvrClr : this.clr,
			cubeFcn = function(ndx1, ndx2, ndx3) {
				var pnt1 = vector.clone(),
					pnts = [];
				pnt1[ndx1] = pnt1[ndx1] + size/2;
				pnt1[ndx2] = pnt1[ndx2] + size/2;
				pnts.push(pnt1);
				
				var pnt2 = pnt1.clone();
				pnt2[ndx2] -= size;
				pnts.push(pnt2);
				
				var pnt3 = pnt2.clone();
				pnt3[ndx1] -= size;	
				pnts.push(pnt3);
				
				var pnt4 = pnt3.clone();
				pnt4[ndx2] += size;
				pnts.push(pnt4);
				
				var pnt = pnt4.clone();
				pnt[ndx3] += size;
				pnts.push(pnt);
				
				pnt = pnt3.clone();
				pnt[ndx3] += size;
				pnts.push(pnt);
				
				pnt = pnt2.clone();
				pnt[ndx3] += size;
				pnts.push(pnt);
				
				pnt = pnt1.clone();
				pnt[ndx3] += size;
				pnts.push(pnt);
				
				return pnts;
			},
			faceFcn = function(point1, point2, point3, point4) {
				cvs.beginPath();
				cvs.moveTo(point1.x, point1.y);
				cvs.lineTo(point2.x, point2.y);
				cvs.lineTo(point3.x, point3.y);
				cvs.lineTo(point4.x, point4.y);
				cvs.lineTo(point1.x, point1.y);
				cvs.closePath();
				cvs.fillStyle = clr;
				cvs.fill();
			};
				
		switch(cfg.plane) {
			case hemi.Plane.XY:
				points = cubeFcn('y', 'z', 'x');
				break;
			case hemi.Plane.YZ:
				points = cubeFcn('z', 'x', 'y');
				break;
			case hemi.Plane.XZ:
				points = cubeFcn('x', 'y', 'z');
				break;
		}
		
		var minX, minY, maxX, maxY;
		
		minX = minY = 10000000;
		maxX = maxY = -10000000;
		
		for (var ndx = 0, len = points.length; ndx < len; ndx++) {
			var pnt = hemi.utils.worldToScreen(client, points[ndx].clone());
			
			minX = Math.min(minX, pnt.x);
			minY = Math.min(minY, pnt.y);
			maxX = Math.max(maxX, pnt.x);
			maxY = Math.max(maxY, pnt.y);
		}
		
		var pnt1 = hemi.utils.worldToScreen(client, points[0]),
			pnt2 = hemi.utils.worldToScreen(client, points[1]),
			pnt3 = hemi.utils.worldToScreen(client, points[2]),
			pnt4 = hemi.utils.worldToScreen(client, points[3]),
			pnt5 = hemi.utils.worldToScreen(client, points[4]),
			pnt6 = hemi.utils.worldToScreen(client, points[5]),
			pnt7 = hemi.utils.worldToScreen(client, points[6]),
			pnt8 = hemi.utils.worldToScreen(client, points[7]);
			
		faceFcn(pnt1, pnt2, pnt3, pnt4);
		faceFcn(pnt1, pnt8, pnt5, pnt4);
		faceFcn(pnt1, pnt2, pnt7, pnt8);
		faceFcn(pnt8, pnt7, pnt6, pnt5);
		faceFcn(pnt7, pnt6, pnt4, pnt3);
		faceFcn(pnt4, pnt3, pnt6, pnt5);
							
		this.topLeft = [minX, minY];
		this.bottomRight = [maxX, maxY];
	};
	
	Arrow.prototype.drawTranslator = function() {
		var client = editor.client,
			cfg = this.config,
			origin = cfg.origin,
			vector = cfg.vector,
			increment = Math.PI / 30,
			startAngle = Math.PI / 2,
			radius = cfg.extent / 20,
			endPnt = vector.clone(),
			angles = 60,
			angle = 0,
			points = [],
			size = cfg.extent / 5,  
			cvs = this.canvas,
			clr = this.hover ? this.hvrClr : this.clr,
			ndx1 = 'x',
			ndx2 = 'x',
			getOutsidePoints = function(pnts) {
				var maxDis = 0,
					retVal = {
						pnt1: pnts[0],
						pnt2: pnts[0]
					};
				
				for (var i = 0, l = angles; i < l; i++) {
					var pnt1 = pnts[i],
						pnt2 = pnts[(i + angles/2) % angles],
						dis = pnt1.distanceTo(pnt2);	
					
					if (dis > maxDis) {
						maxDis = dis;
						retVal.pnt1 = pnt1;
						retVal.pnt2 = pnt2;
					}
				}
				
				return retVal;
			};
			
		// get the endpoint
		switch(cfg.plane) {
			case hemi.Plane.XY:
				endPnt.x = vector.x + size;
				ndx1 = 'y';
				ndx2 = 'z';
				break;
			case hemi.Plane.YZ:
				endPnt.y = vector.y + size;
				ndx1 = 'z';
				break;
			case hemi.Plane.XZ:
				endPnt.z = vector.z + size;
				ndx1 = 'y';
				break;
		}
		endPnt = hemi.utils.worldToScreen(client, endPnt);
		
		// sample points on a circle in 3d space
		cvs.beginPath();
		for (var ndx = 0; ndx < angles; ndx++) {
			var pnt = vector.clone();
			
			angle = angle += increment; 
				
			pnt[ndx1] = vector[ndx1] + radius * Math.cos(angle);
			pnt[ndx2] = vector[ndx2] + radius * Math.sin(angle);
			
			pnt = hemi.utils.worldToScreen(client, pnt);
			if (ndx === 0) {
				cvs.moveTo(pnt.x, pnt.y);
			}
			cvs.lineTo(pnt.x, pnt.y);
									
			points.push(pnt);
		}
		cvs.closePath();
		cvs.fillStyle = clr;
		cvs.fill();
		
		// draw line from the max points to the end point
		var maxPnts = getOutsidePoints(points),
			pnt1 = maxPnts.pnt1,
			pnt2 = maxPnts.pnt2,
			maxX = Math.max(pnt1.x, pnt2.x, endPnt.x),
			maxY = Math.max(pnt1.y, pnt2.y, endPnt.y),
			minX = Math.min(pnt1.x, pnt2.x, endPnt.x),
			minY = Math.min(pnt1.y, pnt2.y, endPnt.y);
		
		cvs.beginPath();
		cvs.moveTo(pnt1.x, pnt1.y);
		cvs.lineTo(pnt2.x, pnt2.y);
		cvs.lineTo(endPnt.x, endPnt.y);
		cvs.closePath();
		cvs.fillStyle = clr;
		cvs.fill();
			
		this.topLeft = [minX, minY];
		this.bottomRight = [maxX, maxY];
//		this.topLeft = [0, 0];
//		this.bottomRight = [0, 0];
	};
	
	Arrow.prototype.setParams = function(origin, vector, plane, drawState, extent) {			
		var client = editor.client,
			ep = hemi.utils.worldToScreen(client, vector.clone()),
			op = hemi.utils.worldToScreen(client, origin.clone()),
			d = op.distanceTo(ep),
			e = editor.client.camera.getEye(),
			ce = new THREE.Vector3().sub(e, origin).normalize(),
			ca = new THREE.Vector3().sub(vector, origin).normalize(),
			oldConfig = this.config;
			
		if (!isNaN(ce.x) && !isNaN(ca.x)) {		
			this.config = {
				origin: origin,
				vector: vector,
				orgPnt: op,
				endPnt: ep,
				distance: d,
				centerEye: ce,
				centerArrow: ca,
				plane: plane,
				extent: extent,
				lineWidth: 3
			};
			
//			if (oldConfig == null || oldConfig.ep != this.config.ep) {
				this.drawLine();
				
				switch (drawState) {
					case editor.ui.trans.DrawState.TRANSLATE:
						this.drawTranslator();
						break;
					case editor.ui.trans.DrawState.ROTATE:
						this.drawRotater();
						break;
					case editor.ui.trans.DrawState.SCALE:
						this.drawScaler();
						break;
				}
//			}
		}
	};
    
})(editor);
