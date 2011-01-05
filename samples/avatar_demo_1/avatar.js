o3djs.require('o3djs.util');
o3djs.require('o3djs.arcball');
o3djs.require('hemi.animation');

/**
 * This is a demo to show the loading of multiple models, and how to create
 * 		simple avatar using the Kuda library.
 */
(function() {

	function init(clientElements) {
		hemi.core.init(clientElements[0]);
		hemi.view.setBGColor([0.5, 0.5, 1, 1]);

		createWorld();
	}

	function createWorld() {
		var loaded = 0;								// How many models are loaded
		
		// Create new models for the man, the town, and the skydome
		var man = new hemi.model.Model();
		var town = new hemi.model.Model();
		var sky = new hemi.model.Model();

		// As each model finishes loading, list that model in the html.
		// Registering with hemi.msg receives messages from anywhere
		hemi.msg.subscribe(hemi.msg.load,
			function(msg) {
				jQuery('div.loadedModels').append(msg.src.fileName + ' loaded<br/>');
			});

		// Associate each of these model objects with a file name
		man.setFileName('assets/CaucasianMale.o3dtgz');
		town.setFileName('assets/test_03.o3dtgz');
		sky.setFileName('assets/skydome.o3dtgz');

		// When this world is done initializing, finish setting up our demo	
		hemi.world.subscribe(hemi.msg.ready,
			function(msg) {
				setupAvatarDemo(man,town,sky);
			});

		// Indicate that we are ready to start our script
		hemi.world.ready();
	}

	function setupAvatarDemo(man,town,sky) {
		hemi.world.camera.transforms.pan.parent = man.root;	// Camera follows avatar
		var viewpoint = new hemi.view.Viewpoint();
		viewpoint.eye = [0,150,-300];
		viewpoint.target = [0,80,0];

		hemi.world.camera.moveToView(viewpoint);	// Move to a nice viewpoint
		hemi.world.camera.tilt.max = 0;				// So we can't go underground
		hemi.world.camera.enableControl();			// Allow camera control

		man.root.scale([0.015,0.015,0.015]);	// The man needs to be scaled down
		man.root.translate([0,-18,900])			// Move him out into the street
		var manAv = new Avatar(man);			// Make a new avatar
												// (See Avatar class below)
		manAv.addBox([-18,12],[39,25]);			// Limit him to the street
		sky.root.translate([0,-100,0]);			// Move the skydome down a bit

		// Make a new animated sprite and make it float above the man's head
		var sprite1 = new hemi.sprite.Sprite(40,30);
		sprite1.parent(man.root);
		sprite1.setPeriod(0.2);
		sprite1.addFrame('assets/images/sun1.png');
		sprite1.addFrame('assets/images/sun2.png');
		sprite1.addFrame('assets/images/sun3.png');
		sprite1.transform.translate([0,140,0]);

		// Do the same but flip it around, so the sprite is two-sided
		var sprite2 = new hemi.sprite.Sprite(40,30);
		sprite2.parent(man.root);
		sprite2.setPeriod(0.2);
		sprite2.addFrame('assets/images/sun1.png');
		sprite2.addFrame('assets/images/sun2.png');
		sprite2.addFrame('assets/images/sun3.png');
		sprite2.transform.translate([0,140,0]);
		sprite2.transform.rotateY(Math.PI);	

		// Start the sprites animating indefinitely
		sprite1.run(-1);
		sprite2.run(-1);
	}

	/*
	 * For this demo we've created a very simple Avatar class. It can
	 * 		walk around, trigger animations, and be bounded by a box.
	 */
	var Avatar = function(model) {
		this.model = model;
		
		// Add a walk animation to this avatar. The key frames are baked
		// into the model, so ask the modeler for these numbers.
		this.walkAnim = hemi.animation.createModelAnimation(model, 24, 28);

		// A loop that will repeat as he is walking
		var loop = new hemi.animation.Loop();
		loop.startTime = 25.1;
		loop.stopTime = 26.2;
		this.walkLoop = loop;

		// Add listeners for keydown, keyup, and render loops */
		hemi.input.addKeyDownListener(this);
		hemi.input.addKeyUpListener(this);
		hemi.view.addRenderListener(this);
		this.wasd = [false,false,false,false];
	};
	
	Avatar.prototype = {
		
		/* Add a box that constrains the avatar */
		addBox : function(min,max) {
			this.min = min;
			this.max = max;
		},

		/* Check key down for WASD and set parameters accordingly */
		onKeyDown : function(e) {
			switch (e.keyCode) {
				case (87):
					this.wasd[0] = true;
					this.startWalking();
					break;
				case (83):
					this.wasd[2] = true;
					this.startWalking();
					break;
				case (65): 
					this.wasd[1] = true;
					break;
				case (68):
					this.wasd[3] = true;
					break;
				default:
			}
		},

		/* Reverse the things set by keyDowns */
		onKeyUp : function(e) {
			switch (e.keyCode) {
				case (87):
					this.wasd[0] = false;
					this.stopWalking();
					break;
				case (83):
					this.wasd[2] = false;
					this.stopWalking()
					break;
				case (65): 
					this.wasd[1] = false;
					break;
				case (68):
					this.wasd[3] = false;
					break;
				default:
			}		
		},

		/* Render loop function.
		 * Move the model if W or S is being pressed, turn the model if
		 * A or D is being pressed, and check for the boundaries.
		 */
		onRender : function(e) {
			var speed = 1.5;
			var rotateSpeed = 0.04;
			var update = false;
			if (this.wasd[0]) {
				this.model.root.translate([0,0,speed]);
				if (this.outOfBounds()) {
					this.model.root.translate([0,0,-speed]);
				}
				update = true;
			}
			if (this.wasd[1]) {
				this.model.root.rotateY(rotateSpeed);
				update = true;
			}
			if (this.wasd[2]) {
				this.model.root.translate([0,0,-speed]);
				if (this.outOfBounds()) {
					this.model.root.translate([0,0,speed]);
				}
				update = true;
			}
			if (this.wasd[3]) {
				this.model.root.rotateY(-rotateSpeed);
				update = true;
			}
			if (update) {
				hemi.world.camera.update();
			}
		},

		/* Check if the model is out of bounds */
		outOfBounds : function() {
			var x = this.model.root.worldMatrix[3][0];
			var z = this.model.root.worldMatrix[3][2];
			if (this.max) {
				if (x > this.max[0]) return true;
				if (z > this.max[1]) return true;
			}
			if (this.min) {
				if (x < this.min[0]) return true;
				if (z < this.min[1]) return true;
			}
			return false;
		},

		/* Begin the walking loop */
		startWalking : function() {
			this.walkAnim.addLoop(this.walkLoop);
			this.walkAnim.start();
		},
		
		/* Stop the walking loop */
		stopWalking : function() {
			this.walkAnim.loops = [];
		}
	};

	jQuery(window).load(function() {
		o3djs.util.makeClients(init);
	});

	jQuery(window).unload(function() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	});
})();
