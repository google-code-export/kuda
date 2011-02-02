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
	
	module.ui.TransHandles = module.Class.extend({
		init: function() {
			this.canvas = hemi.hud.hudMgr.canvas;
			
			this.xArrow = new module.ui.Arrow(this.canvas, '#f00', '#f99');
			this.yArrow = new module.ui.Arrow(this.canvas, '#0c0', '#9c9');
			this.zArrow = new module.ui.Arrow(this.canvas, '#00f', '#99f');
			
			hemi.view.addRenderListener(this);
			this.overrideMouse();
		},
		
		drawArrows: function() {
			var origin = this.transform.worldMatrix[3],			
				x = origin[0],
				y = origin[1],
				z = origin[2],
				xVec = [x + 5, y, z],
				yVec = [x, y + 5, z],
				zVec = [x, y, z + 5],
				scrOrg = hemi.utils.worldToScreen(origin),
				baseLength = 100 / (hemi.world.camera.distance * 0.5);
			
			this.xArrow.setParams(scrOrg, xVec, baseLength);			
			this.yArrow.setParams(scrOrg, yVec, baseLength);			
			this.zArrow.setParams(scrOrg, zVec, baseLength);
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
				this.drawArrows();
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
		},
		
		isInside: function(coordX, coordY) {
			return coordX >= this.topLeft[0] && coordX <= this.bottomRight[0]
				&& coordY >= this.topLeft[1] && coordY <= this.bottomRight[1];
		},
		
		draw: function() {
			this.canvas.save();
			this.drawLine();
			this.drawHead();
			this.canvas.restore();
		},
		
		drawLine: function() {	
			var cvs = this.canvas;
			cvs.beginPath();
			cvs.moveTo(this.orgPnt[0], this.orgPnt[1]);
			cvs.lineTo(this.endPnt[0], this.endPnt[1]);
			cvs.strokeStyle = this.hover ? this.hvrClr : this.clr;
			cvs.lineWidth = 3;
			cvs.stroke();
		},
		
		drawHead: function() {
			var slope = this.getSlope(this.orgPnt, this.endPnt),
				dis = this.getDistance(this.orgPnt, this.endPnt),
				invSlope = slope == null ? 0 : slope == 0 ? null : -1/slope,
				orgX = this.orgPnt[0],
				orgY = this.orgPnt[1],
				endX = this.endPnt[0],
				endY = this.endPnt[1],
				yInt1 = slope == null ? 0 : endY - (slope * endX),
				yInt2 = invSlope == null ? 0 : endY - (invSlope * endX),
				xPoints = slope == 0 ? [endX, endX] : this.solveX(this.endPnt, invSlope, this.bseLen),
				endXPoints = invSlope == 0 ? [endX, endX] : this.solveX(this.endPnt, slope, dis / 10),
				cvs = this.canvas,
				centerEye = hemi.core.math.normalize(hemi.world.camera.getEye()),
				centerArrow = hemi.core.math.normalize(this.vec),
				scale = hemi.core.math.dot(centerEye, centerArrow);
				
			var x1 = xPoints[0],
				x2 = xPoints[1],
				y1 = slope == 0 ? endY + this.bseLen : invSlope == 0 ? endY : invSlope * x1 + yInt2,
				y2 = slope == 0 ? endY - this.bseLen : invSlope == 0 ? endY : invSlope * x2 + yInt2,
				newX = orgX < endX ? endXPoints[1] : endXPoints[0],
				newY = invSlope == 0 ? endY - dis/10 : slope * newX + yInt1,
				top = endY - orgY,
				bot = endX - orgX,
				angle = bot === 0 ? Math.PI/2 : Math.atan(top/bot);
				
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
			cvs.scale(this.bseLen * scale, this.bseLen);
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
		
		getDistance: function(point1, point2) {
			var x = point1[0] - point2[0],
				y = point1[1] - point2[1];
				
			return Math.sqrt(x * x + y * y);
		},
		
		setParams: function(origin, vector, baseLength) {
			this.endPnt = hemi.utils.worldToScreen(vector);
			this.orgPnt = origin;
			this.bseLen = baseLength;
			this.vec = vector;
			
			this.drawLine();
			this.drawHead();
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
