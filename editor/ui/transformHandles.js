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
				var origin = this.transform.worldMatrix[3], 
					extent = this.extent / 2,
					x = origin[0], 
					y = origin[1], 
					z = origin[2], 
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
			var pos = this.transform.localMatrix[3];
			
			hemi.world.camera.disableControl();		
			this.dragger = new hemi.manip.Draggable();
			this.dragger.name = module.tools.ToolConstants.EDITOR_PREFIX + 'Dragger';
			this.dragger.setPlane(plane);
			
			switch(plane) {
				case hemi.manip.Plane.XY:
				    this.dragger.vmin = this.dragger.vmax = pos[1];
					break;
				case hemi.manip.Plane.YZ:
				    this.dragger.umin = this.dragger.umax = pos[2];
					break;
				case hemi.manip.Plane.XZ:
				    this.dragger.umin = this.dragger.umax = pos[0];
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
		
		drawArrow: function(points, xScale, yScale, angle) {
			var cvs = this.canvas,
				x1 = points[0][0],
				y1 = points[0][1],
				clr = this.hover ? this.hvrClr : this.clr;
				
			cvs.beginPath();
			cvs.moveTo(x1, y1);
			cvs.lineTo(points[1][0], points[1][1]);
			cvs.lineTo(points[2][0], points[2][1]);
			cvs.lineTo(x1, y1);
			cvs.shadowBlur = 0;
			cvs.shadowOffsetX = 0;
			cvs.shadowOffsetY = 0;
			cvs.strokeStyle = clr;
			cvs.fillStyle = clr;
			cvs.stroke();
			cvs.fill();
			
			cvs.beginPath();
			cvs.save();
			cvs.translate(points[3][0], points[3][1]);
			cvs.rotate(angle);
			cvs.scale(xScale, yScale);
			cvs.arc(0, 0, 1, 0, Math.PI * 2, false);
			cvs.restore();
			cvs.closePath();
			cvs.shadowBlur = 0;
			cvs.shadowOffsetX = 0;
			cvs.shadowOffsetY = 0;
			cvs.strokeStyle = clr;
			cvs.fillStyle = clr;
			cvs.stroke();
			cvs.fill();
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
				slope = cfg.slope,
				dis = cfg.distance,
				invSlope = cfg.invSlope,
				vector = cfg.vector,
				bseLen = cfg.baseLength, // extent is in 3d space, not 2d
				endPnt = cfg.endPnt,
				orgPnt = cfg.orgPnt,
				orgX = cfg.orgPnt[0],
				orgY = cfg.orgPnt[1],
				endX = cfg.endPnt[0],
				endY = cfg.endPnt[1],
				yInt1 = slope == null ? 0 : endY - (slope * endX),
				yInt2 = invSlope == null ? 0 : endY - (invSlope * endX),
				xPoints = slope == 0 ? [endX, endX] : this.solveX(endPnt, invSlope, bseLen),
				endXPoints = invSlope == 0 ? [endX, endX] : this.solveX(endPnt, slope, dis / 20),
				cvs = this.canvas;
				
			var x1 = xPoints[0],
				x2 = xPoints[1],
				y1 = slope == 0 ? endY + bseLen : invSlope == 0 ? endY : invSlope * x1 + yInt2,
				y2 = slope == 0 ? endY - bseLen : invSlope == 0 ? endY : invSlope * x2 + yInt2,
				newX = orgX < endX ? endXPoints[1] : endXPoints[0],
				newY = invSlope == 0 ? orgY > endY ? endY - dis/10 : endY + dis/10 : slope * newX + yInt1,
				top = endY - orgY,
				bot = endX - orgX,
				angle = bot === 0 ? Math.PI/2 : Math.atan(top/bot),
				scale = this.math.dot(cfg.centerEye, cfg.centerArrow);
				
			// save coordinates
			this.topLeft = [Math.min(x1, x2, newX), 
				Math.min(y1, y2, newY)];
			this.bottomRight = [Math.max(x1, x2, newX), 
				Math.max(y1, y2, newY)];
				
			this.drawArrow([
					[x1, y1], 
					[x2, y2],
					[newX, newY],
					[endX, endY]
				], scale === 0 ? 1 : bseLen * scale, bseLen, angle);
		},
		
		getSlope: function(point1, point2) {
			// due to screen coordinates...
			var rise = point1[1] - point2[1],
				run = point1[0] - point2[0];
				
			if (run == 0) {
				return null;
			}
			return rise / run;
		},
		
		setParams: function(origin, vector, plane, drawState, extent) {			
			var ep = hemi.utils.worldToScreen(vector),
				op = hemi.utils.worldToScreen(origin),
				s = this.getSlope(op, ep),
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
					slope: s,
					distance: d,
					invSlope: s == null ? 0 : s == 0 ? null : -1 / s,
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
		},
		
		solveX: function(point1, slope, distance) {
			if (slope == null) {
				var x = point1[0];
				
				return [x - distance, x + distance];	
			}
			
			var m2 = slope * slope,
				d2 = distance * distance,
				a = point1[0],
				fstX = ((a * m2) + a - Math.sqrt(d2*m2 + d2)) / (m2 + 1),
				secX = ((a * m2) + a + Math.sqrt(d2*m2 + d2)) / (m2 + 1);
				
			return [fstX, secX];
		}
	});
    
    return module;
})(editor || {});
