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
 * This demo shows us how to set up some basic HUD pages and display them on
 * the screen. We also see how to register some mouse event handlers with the
 * HUD elements to respond to the user's actions.
 */
(function() {
	o3djs.require('o3djs.util');
	o3djs.require('hext.hud.paging');

	function init(clientElements) {
		hemi.core.init(clientElements[0]);
		hemi.view.setBGColor([1, 1, 1, 1]);
		
		// This adds a nice navigation control element. It allows us to move
		// between HudPages.
		hext.hud.showPagingInfo();
		
		createHudDisplay();
		
		var house = new hemi.model.Model();
		house.setFileName('assets/ScenarioB_v017.o3dtgz');
		
		// Create an initial viewpoint
		var viewpoint = new hemi.view.Viewpoint();
		viewpoint.eye = [1600, 1700, 160];
		viewpoint.target = [1400, 1460, 160];
		
		// When the World is done loading, move the camera to the viewpoint.
		hemi.world.subscribe(hemi.msg.ready,
			function(msg) {
				hemi.world.camera.moveToView(viewpoint);
			});
		
		// Now that everything is ready, tell the World to start.
		hemi.world.ready();
	}

	function createHudDisplay() {
		// The HudDisplay is the first thing we create.
		var display = new hemi.hud.HudDisplay();
		
		createHudPage1(display);
		createHudPage2(display);
		createHudPage3(display);
		
		// When the World is done loading, show the HudDisplay.
		hemi.world.subscribe(hemi.msg.ready,
			function(msg) {
				display.show();
			});
	}
	
	function createHudPage1(display) {
		var page = new hemi.hud.HudPage();
		
		page.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the background for page 1');
		};
		
		var image = new hemi.hud.HudImage();
		image.x = 100;
		image.y = 200;
		image.setImageUrl('http://o3d.googlecode.com/svn/trunk/samples/assets/egg.png');
		// Add a nice mousedown handler to all the HUD elements that lets us
		// know when we click on them.
		image.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the image for page 1');
		};
		
		page.addElement(image);
		
		var text = new hemi.hud.HudText();
		text.x = image.x + 128;
		text.y = image.y;
		text.config.textAlign = hemi.core.o3d.CanvasPaint.LEFT;
		// This sets the maximum width of the text element. The text will be
		// wrapped if it is wider.
		text.setWidth(300);
		text.setText(["This text was added to the first page of the HUD display, along with the image to the left.","This is the second line of text."]);
		
		text.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the text for page 1');
		};
		
		page.addElement(text);
		
		display.addPage(page);
	}
	
	function createHudPage2(display) {
		var page = new hemi.hud.HudPage();
		
		page.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the background for page 2');
		};
		
		var text = new hemi.hud.HudText();
		text.x = 300;
		text.y = 400;
		text.config.textStyle = hemi.core.o3d.CanvasPaint.ITALIC;
		text.config.textAlign = hemi.core.o3d.CanvasPaint.LEFT;
		text.setWidth(200);
		var textMsg = "This is the second page of text. Please click on the image to the right and hold the mouse button down.";
		text.setText(textMsg);
		
		text.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the text for page 2');
		};
		
		page.addElement(text);
		
		var image = new hemi.hud.HudImage();
		image.x = text.x + text.wrappedWidth;
		image.y = text.y;
		image.setImageUrl('http://o3d.googlecode.com/svn/trunk/samples/assets/purple-flower.png');
		// This time we create a mousedown and a mouseup handler that will
		// change the HudText element we created.
		image.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the image for page 2');
			text.setText("You are now clicking on the image to the right!");
			display.showPage();
		};
		image.mouseUp = function(mouseEvent) {
			text.setText(textMsg);
			display.showPage();
		};
		
		page.addElement(image);
		
		display.addPage(page);
	}
	
	function createHudPage3(display) {
		var page = new hemi.hud.HudPage();
		
		page.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the background for page 3');
		};
		
		var text = new hemi.hud.HudText();
		text.x = 400;
		text.y = 100;
		text.config.textSize = 16;
		text.config.textTypeface = 'times new roman';
		// This gives the HUD a little more freedom when it performs the text
		// wrapping. It may end up slightly wider than 350. 
		text.config.strictWrapping = false;
		text.setWidth(350);
		text.setText(["This third page has HUD text but it does not have an image. This text is center aligned and a new font."]);
		
		text.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the text for page 3');
		};
		
		page.addElement(text);
		
		display.addPage(page);
	}
	
	function updateMessageDiv(msg) {
		// Print the given message on the webpage.
		jQuery('#HudMessages').text(msg);
	}

	jQuery(window).load(function() {
		o3djs.util.makeClients(init);
	});

	jQuery(window).unload(function() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	});
})();