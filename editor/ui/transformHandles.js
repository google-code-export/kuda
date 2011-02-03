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
	
	var EXTENT = 5;
	
	module.ui.TransHandles = module.Class.extend({
		init: function() {
			this.canvas = hemi.hud.hudMgr.canvas;
			
			this.xArrow = new module.ui.Arrow(this.canvas, '#f00', '#f99');
			this.yArrow = new module.ui.Arrow(this.canvas, '#0c0', '#9c9');
			this.zArrow = new module.ui.Arrow(this.canvas, '#00f', '#99f');
			
			hemi.view.addRenderListener(this);
			this.overrideMouse();
		},
		
		drawHandles: function() {
			var origin = this.transform.worldMatrix[3],			
				x = origin[0],
				y = origin[1],
				z = origin[2],
				xVec = [x + EXTENT, y, z],
				yVec = [x, y + EXTENT, z],
				zVec = [x, y, z + EXTENT],
				baseLength = 100 / (hemi.world.camera.distance * 0.5);
			
			this.xArrow.setParams(origin, xVec, baseLength, hemi.manip.Plane.XY);			
			this.yArrow.setParams(origin, yVec, baseLength, hemi.manip.Plane.YZ);			
			this.zArrow.setParams(origin, zVec, baseLength, hemi.manip.Plane.XZ);
		},
		
		onMouseDown: function(evt) {
			if (!this.transform) {
				return false;
			}
			
			var x = evt.layerX,
				y = evt.layerY,
				pos = this.transform.localMatrix[3],
				plane;
				
			if (this.xArrow.isInside(x, y)) {
				this.down = true;
				plane = hemi.manip.Plane.XY;
			}
			else if (this.yArrow.isInside(x, y)) {
				this.down = true;
				plane = hemi.manip.Plane.YZ;
			}
			else if (this.zArrow.isInside(x, y)) {
				this.down = true;	
				plane = hemi.manip.Plane.XZ;
			}
			
			if (this.down) {		
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
				
				var elem = jQuery(evt.target ? evt.target : evt.srcElement),
					offset = elem.offset();
				evt.x = evt.pageX - offset.left;
				evt.y = evt.pageY - offset.top;
				
				this.dragger.onPick({
					shapeInfo: {
						parent: {
							transform: this.transform
						}
					}
				}, evt);
			}
			
			return false;
		},
		
		onMouseMove: function(evt) {
			if (!this.transform || this.down) {
				return false;
			}
			
			var x = evt.layerX,
				y = evt.layerY;
					
			this.xArrow.hover = false;
			this.yArrow.hover = false;
			this.zArrow.hover = false;
			
			if (this.xArrow.isInside(x, y)) {
				this.xArrow.hover = true;
			}
			else if (this.yArrow.isInside(x, y)) {
				this.yArrow.hover = true;
			}
			else if (this.zArrow.isInside(x, y)) {
				this.zArrow.hover = true;
			}
			
			return false;
		},
		
		onMouseOver: function(evt) {	
			if (!this.transform) {
				return false;
			}
			
			var x = evt.layerX,
				y = evt.layerY;
				
			this.xArrow.hover = false;
			this.yArrow.hover = false;
			this.zArrow.hover = false;
			
			if (this.xArrow.isInside(x, y)) {
				this.xArrow.hover = true;
			}
			else if (this.yArrow.isInside(x, y)) {	
				this.yArrow.hover = true;	
			}
			else if (this.zArrow.isInside(x, y)) {
				this.zArrow.hover = true;		
			}
		},
		
		onMouseUp: function(evt) {
			this.down = false;
			if (this.dragger) {
				this.dragger.cleanup();
				this.dragger = null;
			}
			hemi.world.camera.enableControl();
			
			return false;
		},
		
		onRender: function(renderEvent) {
			if (this.transform) {
				hemi.hud.hudMgr.clearDisplay();
				this.drawHandles();
			}
		},
		
		overrideMouse: function() {
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
			var mouseOver = function(evt) {
				that.onMouseOver(evt);
			};
			
			cvs.addEventListener('mousedown', newMouseDown, true);
			cvs.addEventListener('mousemove', newMouseMove, true);
			cvs.addEventListener('mouseup', newMouseUp, true);
			cvs.addEventListener('mouseover', mouseOver, true);
		},
		
		setTransform: function(transform) {
			this.transform = transform;
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
		
		draw: function() {
			this.canvas.save();
			this.drawLine();
			this.drawTranslator();
			this.canvas.restore();
		},
		
		drawLine: function() {	
			var cvs = this.canvas,
				cfg = this.config;
			cvs.beginPath();
			cvs.moveTo(cfg.orgPnt[0], cfg.orgPnt[1]);
			cvs.lineTo(cfg.endPnt[0], cfg.endPnt[1]);
			cvs.strokeStyle = this.hover ? this.hvrClr : this.clr;
			cvs.lineWidth = 3;
			cvs.stroke();
		},
				
		drawRotater: function() {
			var cfg = this.config,
				origin = cfg.origin,
				vector = cfg.vector,
				increment = Math.PI / 36,  // 5 degrees
				startAngle = Math.PI / 2,
				radius = EXTENT,
				points = [],
				angles = [
					startAngle - increment * 3,
					startAngle - increment * 2,
					startAngle - increment,
					startAngle,
					startAngle + increment,
					startAngle + increment * 2,
					startAngle + increment * 3		
				],
				cvs = this.canvas;
			
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
				}
				cvs.lineTo(pnt[0], pnt[1]);
			}
			cvs.strokeStyle = this.hover ? this.hvrClr : this.clr;
			cvs.lineWidth = 3;
			cvs.stroke();
		},
		
		drawScaler: function() {
			
		},
		
		drawTranslator: function() {
			var cfg = this.config,
				slope = cfg.slope,
				dis = cfg.distance,
				invSlope = cfg.invSlope,
				bseLen = cfg.baseLength,
				endPnt = cfg.endPnt,
				orgPnt = cfg.orgPnt,
				orgX = cfg.orgPnt[0],
				orgY = cfg.orgPnt[1],
				endX = cfg.endPnt[0],
				endY = cfg.endPnt[1],
				yInt1 = slope == null ? 0 : endY - (slope * endX),
				yInt2 = invSlope == null ? 0 : endY - (invSlope * endX),
				xPoints = slope == 0 ? [endX, endX] : this.solveX(endPnt, invSlope, bseLen),
				endXPoints = invSlope == 0 ? [endX, endX] : this.solveX(endPnt, slope, dis / 10),
				cvs = this.canvas;
				
			var x1 = xPoints[0],
				x2 = xPoints[1],
				y1 = slope == 0 ? endY + bseLen : invSlope == 0 ? endY : invSlope * x1 + yInt2,
				y2 = slope == 0 ? endY - bseLen : invSlope == 0 ? endY : invSlope * x2 + yInt2,
				newX = orgX < endX ? endXPoints[1] : endXPoints[0],
				newY = invSlope == 0 ? endY - dis/10 : slope * newX + yInt1,
				top = endY - orgY,
				bot = endX - orgX,
				angle = bot === 0 ? Math.PI/2 : Math.atan(top/bot),
				scale = this.math.dot(cfg.centerEye, cfg.centerArrow);
				
			// save coordinates
			this.topLeft = [Math.min(x1, x2, newX), 
				Math.min(y1, y2, newY)];
			this.bottomRight = [Math.max(x1, x2, newX), 
				Math.max(y1, y2, newY)];
				
			cvs.beginPath();
			cvs.moveTo(x1, y1);
			cvs.lineTo(x2, y2);
			cvs.lineTo(newX, newY);
			cvs.lineTo(x1, y1);
			cvs.closePath();
			cvs.shadowBlur = 0;
			cvs.shadowOffsetX = 0;
			cvs.shadowOffsetY = 0;
			cvs.strokeStyle = this.hover ? this.hvrClr : this.clr;
			cvs.fillStyle = this.hover ? this.hvrClr : this.clr;
			cvs.stroke();
			cvs.fill();
			
			cvs.beginPath();
			cvs.save();
			cvs.translate(endX, endY);
			cvs.rotate(angle);
			cvs.scale(bseLen * scale, bseLen);
			cvs.arc(0, 0, 1, 0, Math.PI * 2, false);
			cvs.restore();
			cvs.closePath();
			cvs.shadowBlur = 0;
			cvs.shadowOffsetX = 0;
			cvs.shadowOffsetY = 0;
			cvs.strokeStyle = this.hover ? this.hvrClr : this.clr;
			cvs.fillStyle = this.hover ? this.hvrClr : this.clr;
			cvs.stroke();
			cvs.fill();
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
		
		setParams: function(origin, vector, baseLength, plane) {			
			var ep = hemi.utils.worldToScreen(vector),
				op = hemi.utils.worldToScreen(origin),
				s = this.getSlope(op, ep),
				d = this.math.distance(op, ep),
				e = hemi.world.camera.getEye(),
				ce = this.math.normalize(this.math.subVector(e, origin)),
				ca = this.math.normalize(this.math.subVector(vector, origin));
			
			this.config = {
				origin: origin,
				vector: vector,
				orgPnt: op,
				endPnt: ep,
				slope: s,
				distance: d,
				invSlope: s == null ? 0 : s == 0 ? null : -1/s,
				baseLength: baseLength,
				centerEye: ce,
				centerArrow: ca,
				plane: plane
			};
			
			this.drawLine();
			this.drawTranslator();
			this.drawRotater();
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
