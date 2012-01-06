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
 * This demo shows us how to set up some basic HUD pages and display them on the screen. We also see
 * how to register some mouse event handlers with the HUD elements to respond to the user's actions.
 */
(function() {
	var client;

	function createWorld() {
		createHudDisplay();

		var house = new hemi.Model(client);
		house.setFileName('assets/house_v12/house_v12.dae');

		// Create an initial viewpoint
		var viewpoint = new hemi.Viewpoint();
		viewpoint.eye.set(1600, 1700, 160);
		viewpoint.target.set(1400, 1460, 160);

		// When the World is done loading, move the camera to the viewpoint.
		hemi.subscribe(hemi.msg.ready,
			function(msg) {
				client.camera.moveToView(viewpoint);
				client.camera.enableControl();
			});

		// Indicate that we are ready to start our script
		hemi.ready();
	}

	function createHudDisplay() {
		// The HudDisplay is the first thing we create.
		var display = new hemi.HudDisplay(client);
		createHudPage1(display);
		createHudPage2(display);
		createHudPage3(display);
		createHudPage4(display);

		// This adds a nice navigation control element that allows us to move between HudPages.
		hext.hud.addPagingInfo(display);

		// When the World is done loading, show the HudDisplay.
		hemi.subscribe(hemi.msg.ready,
			function(msg) {
				display.show();
			});
	}

	function createHudPage1(display) {
		var page = new hemi.HudPage();
		
		page.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the background for page 1');
		};

		var image = new hemi.HudImage();
		image.x = 100;
		image.y = 200;
		image.setUrl('http://o3d.googlecode.com/svn/trunk/samples/assets/egg.png');
		// Add a nice mousedown handler to all the HUD elements that lets us know when we click on
		// them.
		image.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the image for page 1');
		};

		page.add(image);

		var text = new hemi.HudText();
		text.x = image.x + 128;
		text.y = image.y;
		text.config.textAlign = 'left';
		// This sets the maximum width of the text element. The text will be wrapped if it is wider.
		text.setWidth(300);
		text.setText(["This text was added to the first page of the HUD display, along with the image to the left.","This is the second line of text."]);

		text.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the text for page 1');
		};

		page.add(text);
		display.add(page);
	}

	function createHudPage2(display) {
		var page = new hemi.HudPage();

		page.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the background for page 2');
		};

		var text = new hemi.HudText();
		text.x = 300;
		text.y = 400;
		text.config.textStyle = 'italic';
		text.config.textAlign = 'left';
		text.setWidth(200);
		var textMsg = "This is the second page of text. Please click on the image to the right and hold the mouse button down.";
		text.setText(textMsg);

		text.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the text for page 2');
		};

		page.add(text);

		var image = new hemi.HudImage();
		image.x = text.x + text._wrappedWidth;
		image.y = text.y;
		image.setUrl('http://o3d.googlecode.com/svn/trunk/samples/assets/purple-flower.png');
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

		page.add(image);
		display.add(page);
	}

	function createHudPage3(display) {
		var page = new hemi.HudPage();
		page.config.curve = 0.3;

		page.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the background for page 3');
		};

		var text = new hemi.HudText();
		text.x = 400;
		text.y = 100;
		text.config.textSize = 16;
		text.config.textTypeface = 'times new roman';
		// This gives the HUD a little more freedom when it performs the text
		// wrapping. It may end up slightly wider than 350. 
		text.config.strictWrapping = false;
		text.setWidth(350);
		text.setText(["This third page has rounded corners. This text is center aligned and a new font."]);

		text.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the text for page 3');
		};

		page.add(text);
		display.add(page);
	}

	function createHudPage4(display) {
		var page = new hemi.HudPage();

		page.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the background for page 4');
		};

		var video = new hemi.HudVideo();
		video.x = 50;
		video.y = 100;
		// Optional - the video will default to its native height and width
		video.setHeight(270);
		video.setWidth(480);
		// We add multiple formats in case the browser does not support one
		video.addUrl('assets/videos/BigBuckBunny_640x360.mp4', 'mp4');
		video.addUrl('assets/videos/BigBuckBunny_640x360.ogv', 'ogg');

		video.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the video for page 4');
		};

		page.add(video);

		var text = new hemi.HudText();
		text.x = video.x;
		text.y = video.y + 275;
		text.config.textAlign = 'left';
		// This sets the maximum width of the text element. The text will be
		// wrapped if it is wider.
		text.setWidth(300);
		text.setText(["This video will pause when you go to a different page."]);

		text.mouseDown = function(mouseEvent) {
			updateMessageDiv('You clicked on the text for page 4');
		};

		page.add(text);
		display.add(page);
	}

	function updateMessageDiv(msg) {
		// Print the given message on the webpage.
		document.getElementById('HudMessages').innerHTML = msg;
	}

	window.onload = function() {
		client = hemi.makeClients()[0];
		client.setBGColor(0xffffff, 1);

		hemi.loadPath = '../../';
		createWorld();
	};
})();