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

var editor = (function(module) {
    module.ui = module.ui || {};
	module.ui.trans = module.ui.trans || {};
	
	var EXTENT = 5;
	
	module.ui.trans.DrawState = {
		TRANSLATE: 0,
		ROTATE: 1,
		SCALE: 2,
		NONE: 3
	};
	
	module.ui.TransHandles = module.Class.extend({
		init: function() {
			this.canvas = hemi.hud.hudMgr.canvas;
			this.drawCallback = null;
			
			this.xArrow = new module.ui.Arrow(this.canvas, '#f00', '#f99');
			this.yArrow = new module.ui.Arrow(this.canvas, '#0c0', '#9c9');
			this.zArrow = new module.ui.Arrow(this.canvas, '#00f', '#99f');
			this.drawState = module.ui.trans.DrawState.NONE;
			
			hemi.view.addRenderListener(this);
			this.overrideHandlers();
		},
		
		drawHandles: function() {
			if (this.drawState !== module.ui.trans.DrawState.NONE
					&& this.isInView()) {
//				var origin = this.transform.localMatrix[3],		FOR LOCAL
				var origin = this.transform.getUpdatedWorldMatrix()[3], 
					extent = this.extent / 2,
					x = origin[0], 
					y = origin[1], 
					z = origin[2], 
//					u = hemi.utils,	 FOR LOCAL
//					xVec = u.pointAsWorld(this.transform, [x + extent, y, z]),	 FOR LOCAL
//					yVec = u.pointAsWorld(this.transform, [x, y + extent, z]),	 FOR LOCAL 
//					zVec = u.pointAsWorld(this.transform, [x, y, z + extent]);	 FOR LOCAL
					xVec = [x + extent, y, z], 
					yVec = [x, y + extent, z], 
					zVec = [x, y, z + extent];
				
				this.xArrow.setParams(origin, xVec,  
					hemi.manip.Plane.XY, this.drawState, extent);
				this.yArrow.setParams(origin, yVec,  
					hemi.manip.Plane.YZ, this.drawState, extent);
				this.zArrow.setParams(origin, zVec,  
					hemi.manip.Plane.XZ, this.drawState, extent);
			}
		},
		
		convertEvent: function(evt) {			
			var elem = jQuery(evt.target ? evt.target : evt.srcElement),
				offset = elem.offset();
			evt.x = evt.pageX - offset.left;
			evt.y = evt.pageY - offset.top;
			
			return evt;
		},
		
		getExtent: function() {
			var bdgBox = o3djs.util.getBoundingBoxOfTree(this.transform),
//				minExt = bdgBox.minExtent,	FOR LOCAL
//				maxExt = bdgBox.maxExtent,	FOR LOCAL
				minExt = hemi.utils.pointAsWorld(this.transform, bdgBox.minExtent),
				maxExt = hemi.utils.pointAsWorld(this.transform, bdgBox.maxExtent),
				x = Math.abs(minExt[0] - maxExt[0]),
				y = Math.abs(minExt[1] - maxExt[1]),
				z = Math.abs(minExt[2] - maxExt[2]);
				
			return (x + y + z) / 3;
		},
		
		isInView: function() {
			var worldViewProjection = [[], [], [], []],
				transform = this.transform,
				bdgBox = o3djs.util.getBoundingBoxOfTree(this.transform);
        	
			o3d.Transform.compose(hemi.view.viewInfo.drawContext.view,
				transform.getUpdatedWorldMatrix(),
				worldViewProjection);
        	o3d.Transform.compose(hemi.view.viewInfo.drawContext.projection,
				worldViewProjection,
				worldViewProjection);

			var onScreen = transform.boundingBox.inFrustum(worldViewProjection);

			return onScreen;
		},
		
		onMouseDown: function(evt) {
			if (!this.transform 
					|| this.drawState === module.ui.trans.DrawState.NONE) {
				return false;
			}
			
			var x = evt.layerX,
				y = evt.layerY,
				plane,
				axis,
				scaleAxis;
				
			if (this.xArrow.isInside(x, y)) {
				this.down = true;
				plane = hemi.manip.Plane.XY;
				axis = hemi.manip.Axis.Z;
				scaleAxis = hemi.manip.Axis.X;
			}
			else if (this.yArrow.isInside(x, y)) {
				this.down = true;
				plane = hemi.manip.Plane.YZ;
				axis = hemi.manip.Axis.X;
				scaleAxis = hemi.manip.Axis.Y;
			}
			else if (this.zArrow.isInside(x, y)) {
				this.down = true;	
				plane = hemi.manip.Plane.XZ;
				axis = hemi.manip.Axis.Y;
				scaleAxis = hemi.manip.Axis.Z;
			}
			
			if (this.down) {
				switch(this.drawState) {
					case module.ui.trans.DrawState.ROTATE:
						this.startRotate(axis, evt);
						break;
					case module.ui.trans.DrawState.SCALE:
						this.startScale(scaleAxis, evt);
						break;
					case module.ui.trans.DrawState.TRANSLATE:
					    this.startTranslate(plane, evt);
						break;
				}			
				return true;
			}
			
			return false;
		},
		
		onMouseMove: function(evt) {
			if (!this.transform || this.down
					|| this.drawState === module.ui.trans.DrawState.NONE) {
				return false;
			}
			
			var x = evt.layerX,
				y = evt.layerY,
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
		},
		
		onMouseUp: function(evt) {
			if (!this.down) {
				return false;
			}
			
			this.down = false;
			if (this.dragger) {
				this.dragger.cleanup();
				this.dragger = null;
			}
			if (this.turnable) {
				this.turnable.cleanup();
				this.turnable = null;
			}
			if (this.scalable) {
				this.scalable.cleanup();
				this.scalable = null;
			}
			hemi.world.camera.enableControl();
			
			// make the changes octanable
			var param = this.transform.getParam('ownerId'),
				model = hemi.world.getCitizenById(param.value);
				
			model.setTransformMatrix(this.transform.name, 
				this.transform.localMatrix);
			
			return true;
		},
		
		onRender: function(renderEvent) {
			if (this.transform) {
				hemi.hud.hudMgr.clearDisplay();
				
				if (this.drawCallback) {
					this.drawCallback();
				}
				
				this.drawHandles();
			}
		},
		
		overrideHandlers: function() {
			var mouseDown = hemi.hud.hudMgr.downHandler,
				mouseUp = hemi.hud.hudMgr.upHandler,
				mouseMove = hemi.hud.hudMgr.moveHandler,
				that = this,
				cvs = hemi.hud.hudMgr.canvasElem;
				
			cvs.removeEventListener('mousedown', mouseDown, true);
			cvs.removeEventListener('mousemove', mouseMove, true);
			cvs.removeEventListener('mouseup', mouseUp, true);
				
			var newMouseDown = function(evt) {
				if (!that.onMouseDown(evt)) {
					mouseDown(evt);
				}
			};
			var newMouseUp = function(evt) {
				if (!that.onMouseUp(evt)) {
					mouseUp(evt);
				}
			};
			var newMouseMove = function(evt) {
				if (!that.onMouseMove(evt)) {
					mouseMove(evt);
				}
			};
			
			cvs.addEventListener('mousedown', newMouseDown, true);
			cvs.addEventListener('mousemove', newMouseMove, true);
			cvs.addEventListener('mouseup', newMouseUp, true);
			jQuery(document).bind('mouseup', function(evt) {
				that.onMouseUp(evt);
			});
		},
		
		setDrawCallback: function(callback) {
			this.drawCallback = callback;
		},
		
		setDrawState: function(state) {
			this.drawState = state;
		},
		
		setTransform: function(transform) {
			this.transform = transform;
			if (transform) {
				this.extent = this.getExtent();
			}
		},
		
		startRotate: function(axis, evt) {
			hemi.world.camera.disableControl();
			this.turnable = new hemi.manip.Turnable(axis);
			this.turnable.addTransform(this.transform);
			this.turnable.enable();
			
			this.turnable.onPick({
				shapeInfo: {
					parent: {
						transform: this.transform
					}
				}
			}, this.convertEvent(evt));
		},
		
		startScale: function(axis, evt) {
			hemi.world.camera.disableControl();
			this.scalable = new hemi.manip.Scalable(axis);
			this.scalable.addTransform(this.transform);
			
			if (evt.shiftKey) {
				this.scalable.axis = [1, 1, 1];
			}
			
			this.scalable.enable();
			
			this.scalable.onPick({
				shapeInfo: {
					parent: {
						transform: this.transform
					}
				}
			}, this.convertEvent(evt));
		},
		
		startTranslate: function(plane, evt) {
			hemi.world.camera.disableControl();		
			this.dragger = new hemi.manip.Draggable();
			this.dragger.name = module.tools.ToolConstants.EDITOR_PREFIX + 'Dragger';
			this.dragger.setPlane(plane);
			
			switch(plane) {
				case hemi.manip.Plane.XY:
				    this.dragger.vmin = this.dragger.vmax = 0;
					break;
				case hemi.manip.Plane.YZ:
				    this.dragger.umin = this.dragger.umax = 0;
					break;
				case hemi.manip.Plane.XZ:
				    this.dragger.umin = this.dragger.umax = 0;
					break;
			}

            this.dragger.addTransform(this.transform);
			
			this.dragger.onPick({
				shapeInfo: {
					parent: {
						transform: this.transform
					}
				}
			}, this.convertEvent(evt));
		}
	});
	
	module.ui.Arrow = module.Class.extend({
		init: function(canvas, color, hoverColor) {
			this.canvas = canvas;
			this.clr = color;
			this.hvrClr = hoverColor;
			this.math = hemi.core.math;
		},
		
		isInside: function(coordX, coordY) {
			return coordX >= this.topLeft[0] && coordX <= this.bottomRight[0]
				&& coordY >= this.topLeft[1] && coordY <= this.bottomRight[1];
		},
		
		drawLine: function() {	
			var cvs = this.canvas,
				cfg = this.config;
			cvs.beginPath();
			cvs.moveTo(cfg.orgPnt[0], cfg.orgPnt[1]);
			cvs.lineTo(cfg.endPnt[0], cfg.endPnt[1]);
			cvs.strokeStyle = this.hover ? this.hvrClr : this.clr;
			cvs.lineWidth = cfg.lineWidth;
			cvs.stroke();
		},
				
		drawRotater: function() {
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
					pnt = hemi.core.math.copyVector(origin); 
					
				switch(cfg.plane) {
					case hemi.manip.Plane.XY:
						pnt[1] = origin[1] + radius * Math.cos(a);
						pnt[0] = origin[0] + radius * Math.sin(a);
						break;
					case hemi.manip.Plane.YZ:
						pnt[2] = origin[2] + radius * Math.cos(a);
						pnt[1] = origin[1] + radius * Math.sin(a);
						break;
					case hemi.manip.Plane.XZ:
						pnt[0] = origin[0] + radius * Math.cos(a);
						pnt[2] = origin[2] + radius * Math.sin(a);
						break;
				}
				
				pnt = hemi.utils.worldToScreen(pnt);
				if (ndx === 0) {
					cvs.moveTo(pnt[0], pnt[1]);
					pnt1 = pnt;
				}
				else if (ndx === len-1) {
					pnt2 = pnt;
				}
				cvs.lineTo(pnt[0], pnt[1]);
			}
			cvs.strokeStyle = this.hover ? this.hvrClr : this.clr;
			cvs.lineWidth = cfg.lineWidth;
			cvs.stroke();
			
			// save coordinates
			var x1 = pnt1[0],
				x2 = pnt2[0],
				y1 = pnt1[1],
				y2 = pnt2[1],
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
		},
		
		drawScaler: function() {
			var cfg = this.config,
				origin = cfg.origin,
				vector = cfg.vector,
				size = cfg.extent / 15,  
				points = [],
				cvs = this.canvas,
				clr = this.hover ? this.hvrClr : this.clr,
				cubeFcn = function(ndx1, ndx2, ndx3) {
					var pnt1 = hemi.core.math.copyVector(vector),
						pnts = [];
					pnt1[ndx1] = vector[ndx1] + size/2;
					pnt1[ndx2] = vector[ndx2] + size/2;
					pnts.push(pnt1);
					
					var pnt2 = hemi.core.math.copyVector(pnt1);
					pnt2[ndx2] -= size;
					pnts.push(pnt2);
					
					var pnt3 = hemi.core.math.copyVector(pnt2);
					pnt3[ndx1] -= size;	
					pnts.push(pnt3);
					
					var pnt4 = hemi.core.math.copyVector(pnt3);
					pnt4[ndx2] += size;
					pnts.push(pnt4);
					
					var pnt = hemi.core.math.copyVector(pnt4);
					pnt[ndx3] += size;
					pnts.push(pnt);
					
					pnt = hemi.core.math.copyVector(pnt3);
					pnt[ndx3] += size;
					pnts.push(pnt);
					
					pnt = hemi.core.math.copyVector(pnt2);
					pnt[ndx3] += size;
					pnts.push(pnt);
					
					pnt = hemi.core.math.copyVector(pnt1);
					pnt[ndx3] += size;
					pnts.push(pnt);
					
					return pnts;
				},
				faceFcn = function(point1, point2, point3, point4) {
					cvs.beginPath();
					cvs.moveTo(point1[0], point1[1]);
					cvs.lineTo(point2[0], point2[1]);
					cvs.lineTo(point3[0], point3[1]);
					cvs.lineTo(point4[0], point4[1]);
					cvs.lineTo(point1[0], point1[1]);
					cvs.closePath();
					cvs.fillStyle = clr;
					cvs.fill();
				};
					
			switch(cfg.plane) {
				case hemi.manip.Plane.XY:
					points = cubeFcn(1, 2, 0);
					break;
				case hemi.manip.Plane.YZ:
					points = cubeFcn(2, 0, 1);
					break;
				case hemi.manip.Plane.XZ:
					points = cubeFcn(0, 1, 2);
					break;
			}
			
			var minX, minY, maxX, maxY;
			
			minX = minY = 10000000;
			maxX = maxY = -10000000;
			
			for (var ndx = 0, len = points.length; ndx < len; ndx++) {
				var pnt = hemi.utils.worldToScreen(points[ndx]);
				
				minX = Math.min(minX, pnt[0]);
				minY = Math.min(minY, pnt[1]);
				maxX = Math.max(maxX, pnt[0]);
				maxY = Math.max(maxY, pnt[1]);
			}
			
			var pnt1 = hemi.utils.worldToScreen(points[0]),
				pnt2 = hemi.utils.worldToScreen(points[1]),
				pnt3 = hemi.utils.worldToScreen(points[2]),
				pnt4 = hemi.utils.worldToScreen(points[3]),
				pnt5 = hemi.utils.worldToScreen(points[4]),
				pnt6 = hemi.utils.worldToScreen(points[5]),
				pnt7 = hemi.utils.worldToScreen(points[6]),
				pnt8 = hemi.utils.worldToScreen(points[7]);
				
			faceFcn(pnt1, pnt2, pnt3, pnt4);
			faceFcn(pnt1, pnt8, pnt5, pnt4);
			faceFcn(pnt1, pnt2, pnt7, pnt8);
			faceFcn(pnt8, pnt7, pnt6, pnt5);
			faceFcn(pnt7, pnt6, pnt4, pnt3);
			faceFcn(pnt4, pnt3, pnt6, pnt5);
								
			this.topLeft = [minX, minY];
			this.bottomRight = [maxX, maxY];
		},
		
		drawTranslator: function() {
			var cfg = this.config,
				origin = cfg.origin,
				vector = cfg.vector,
				increment = Math.PI / 90,  // 2 degrees
				startAngle = Math.PI / 2,
				radius = cfg.extent / 25,
				endPnt = hemi.core.math.copyVector(vector),
				angles = 180,
				angle = 0,
				points = [],
				size = cfg.extent / 10,  
				cvs = this.canvas,
				clr = this.hover ? this.hvrClr : this.clr,
				ndx1 = 0,
				ndx2 = 0,
				getOutsidePoints = function(pnts) {
					var maxDis = 0,
						retVal = {
							pnt1: pnts[0],
							pnt2: pnts[0]
						};
					
					for (var i = 0, l = pnts.length; i < l; i++) {
						var pnt1 = pnts[i];
						
						for (var j = i+1; j < l; j++) {
							var pnt2 = pnts[j],
								dis = hemi.core.math.distance(pnt1, pnt2);	
							
							if (dis > maxDis) {
								maxDis = dis;
								retVal.pnt1 = pnt1;
								retVal.pnt2 = pnt2;
							}
						}
					}
					
					return retVal;
				};
				
			// get the endpoint
			switch(cfg.plane) {
				case hemi.manip.Plane.XY:
					endPnt[0] = vector[0] + size;
					ndx1 = 1;
					ndx2 = 2;
					break;
				case hemi.manip.Plane.YZ:
					endPnt[1] = vector[1] + size;
					ndx1 = 2;
					break;
				case hemi.manip.Plane.XZ:
					endPnt[2] = vector[2] + size;
					ndx1 = 1;
					break;
			}
			endPnt = hemi.utils.worldToScreen(endPnt);
			
			// sample points on a circle in 3d space
			cvs.beginPath();
			for (var ndx = 0; ndx < angles; ndx++) {
				var pnt = hemi.core.math.copyVector(vector);
				
				angle = angle += increment; 
					
				pnt[ndx1] = vector[ndx1] + radius * Math.cos(angle);
				pnt[ndx2] = vector[ndx2] + radius * Math.sin(angle);
				
				pnt = hemi.utils.worldToScreen(pnt);
				if (ndx === 0) {
					cvs.moveTo(pnt[0], pnt[1]);
				}
				cvs.lineTo(pnt[0], pnt[1]);
				
				var x = pnt[0],
					y = pnt[1];
				
				points.push(pnt);
			}
			cvs.closePath();
			cvs.fillStyle = clr;
			cvs.fill();
			
			// draw line from the max points to the end point
			var maxPnts = getOutsidePoints(points),
				pnt1 = maxPnts.pnt1,
				pnt2 = maxPnts.pnt2,
				maxX = Math.max(pnt1[0], pnt2[0], endPnt[0]),
				maxY = Math.max(pnt1[1], pnt2[1], endPnt[1]),
				minX = Math.min(pnt1[0], pnt2[0], endPnt[0]),
				minY = Math.min(pnt1[1], pnt2[1], endPnt[1]);
			
			cvs.beginPath();
			cvs.moveTo(pnt1[0], pnt1[1]);
			cvs.lineTo(pnt2[0], pnt2[1]);
			cvs.lineTo(endPnt[0], endPnt[1]);
			cvs.closePath();
			cvs.fillStyle = clr;
			cvs.fill();
				
			this.topLeft = [minX, minY];
			this.bottomRight = [maxX, maxY];
		},
		
		setParams: function(origin, vector, plane, drawState, extent) {			
			var ep = hemi.utils.worldToScreen(vector),
				op = hemi.utils.worldToScreen(origin),
				d = this.math.distance(op, ep),
				e = hemi.world.camera.getEye(),
				ce = this.math.normalize(this.math.subVector(e, origin)),
				ca = this.math.normalize(this.math.subVector(vector, origin));
				
			if (!isNaN(ce[0]) && !isNaN(ca[0])) {			
				this.config = {
					origin: origin,
					vector: vector,
					orgPnt: op,
					endPnt: ep,
					distance: d,
					baseLength: (extent * 25) / (hemi.world.camera.distance),
					centerEye: ce,
					centerArrow: ca,
					plane: plane,
					extent: extent,
					lineWidth: 100 / hemi.world.camera.distance
				};
				
				this.drawLine();
				
				switch (drawState) {
					case module.ui.trans.DrawState.TRANSLATE:
						this.drawTranslator();
						break;
					case module.ui.trans.DrawState.ROTATE:
						this.drawRotater();
						break;
					case module.ui.trans.DrawState.SCALE:
						this.drawScaler();
						break;
				}
			}
		}
	});
    
    return module;
})(editor || {});
