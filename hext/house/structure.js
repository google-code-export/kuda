var hext = (function(hext) {

	/**
	 * @namespace A module for pre-defined household objects, with standard
	 * 		behaviors attached.
	 */
	hext.house = hext.house || {};
	
	/**
	 * @class Door is a standard door that swings 90 degrees when clicked on.
	 * @extends hemi.world.Citizen
	 * @param {o3d.transform} transform The transform containing the door shape
	 * @param {float} opt_angle Number of degrees to swing open
	 * @param {float} opt_time How many seconds the swing shall take by default
	 */
	hext.house.Door = function(transform, opt_angle, opt_time) {
		this.rotator = new hemi.motion.Rotator(transform);
		this.closed = true;
		this.angle = opt_angle || Math.PI/2.0;
		this.time = opt_time || 1;
		var that = this;
		hemi.world.subscribe(hemi.msg.pick, function(msg) {
				that.pickCallback(msg);
			});
	};
	
	hext.house.Door.prototype = {
	
		/** 
		 * Open the door.
		 * @param {float} opt_time How many seconds the swing open shall take
		 */
		open : function(opt_time) {
			var time = opt_time || this.time;
			if (this.closed) {
				this.closed = false;
				if(!this.rotator.rotate([0,this.angle,0],time,true)) {
					this.closed = true;
				}
			}
		},
		
		/**
		 * Close the door.
		 * @param {float} opt_time How many seconds the swing closed shall take
		 */
		close : function(opt_time) {
			var time = opt_time || this.time;
			if (!this.closed) {
				this.closed = true;
				if(!this.rotator.rotate([0,-this.angle,0],time,true)) {
					this.closed = false;
				}
			}		
		},
		
		/**
		 * Swing the door, toggling the open/closed state.
		 * @param {float} opt_time How many seconds the swing shall take
		 */
		swing : function(opt_time) {
			if (this.closed) {
				this.open(opt_time);
			} else {
				this.close(opt_time);
			}
		},
		
		/**
		 * Set the callback to be executed when the door begins opening.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */
		onOpening : function(callback) {
			var that = this;
			this.rotator.subscribe(hemi.msg.start, function(msg) {
				if (!that.closed) callback(msg);
				});
		},
		
		/**
		 * Set the callback to be executed when the door finishes opening.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */		
		onOpen : function(callback) {
			var that = this;
			this.rotator.subscribe(hemi.msg.stop, function(msg) {
				if (!that.closed) callback(msg);
			});		
		},

		/**
		 * Set the callback to be executed when the door begins closing.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */		
		onClosing : function(callback) {
			var that = this;
			this.rotator.subscribe(hemi.msg.start, function(msg) {
				if (that.closed) callback(msg);
			});	
		},

		/**
		 * Set the callback to be executed when the door finishes closing.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */		
		onClosed : function(callback) {
			var that = this;
			this.rotator.subscribe(hemi.msg.stop, function(msg) {
				if (that.closed) callback(msg);
			});			
		},

		/**
		 * Set the callback to be executed when a pick message comes in from the world.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */
		onPick : function(callback) {
			this.pickCallback = callback;
		},
		
		/**
		 * Default pick message callback, swings the door if the rotator transform has been picked.
		 * @param {hemi.dispatch.Message} msg Message generated describing a pick event
		 */
		pickCallback : function(msg) {
			var that = this;
			if (msg.data.pickInfo.shapeInfo.parent.transform.clientId ==
					that.rotator.offsetTransform.clientId) {
				this.swing();
			}
		}
	
	};
	
	/**
	 * @class Window is a pre-defined window that slides to a given point when clicked on
	 * @extends hemi.world.Citizen
	 * @param {o3d.transform} transform The transform containing the window shape
	 * @param {float} openPoint [x,y,z] point at which the window will be open
	 * @param {float} opt_time How many seconds the slide shall take by default
	 */	
	hext.house.Window = function(transform,openPoint,opt_time) {
		this.translator = new hemi.motion.Translator(transform);
		this.openPoint = openPoint;
		this.time = opt_time || 1;
		this.closed = true;
		var that = this;
		hemi.world.subscribe(hemi.msg.pick, function(msg) {
				that.pickCallback(msg);
			});		
	};
	
	hext.house.Window.prototype = {

		/** 
		 * Open the window.
		 * @param {float} opt_time How many seconds the slide open shall take
		 */
		open : function(opt_time) {
			var time = opt_time || this.time;
			if (this.closed) {
				this.closed = false;
				if(!this.translator.move(this.openPoint,time,true)) {
					this.closed = true;
				}
			}
		},
		
		/**
		 * Close the window.
		 * @param {float} opt_time How many seconds the closing slide shall take
		 */
		close : function(opt_time) {
			var time = opt_time || this.time;
			if (!this.closed) {
				this.closed = true;
				if(!this.translator.move(hemi.core.math.mulScalarVector(-1,this.openPoint),time,true)) {
					this.closed = false;
				}
			}		
		},
		
		/**
		 * Slide the window, toggling the open/closed state.
		 * @param {float} opt_time How many seconds the slide shall take
		 */
		slide : function(opt_time) {
			if (this.closed) {
				this.open(opt_time);
			} else {
				this.close(opt_time);
			}
		},
	
		/**
		 * Set the callback to be executed when the window begins opening.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */
		onOpening : function(callback) {
			var that = this;
			this.translator.subscribe(hemi.msg.start, function(msg) {
				if (!that.closed) callback(msg);
				});
		},
		
		/**
		 * Set the callback to be executed when the window finishes opening.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */		
		onOpen : function(callback) {
			var that = this;
			this.translator.subscribe(hemi.msg.stop, function(msg) {
				if (!that.closed) callback(msg);
			});		
		},

		/**
		 * Set the callback to be executed when the window begins closing.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */		
		onClosing : function(callback) {
			var that = this;
			this.translator.subscribe(hemi.msg.start, function(msg) {
				if (that.closed) callback(msg);
			});	
		},

		/**
		 * Set the callback to be executed when the window finishes closing.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */		
		onClosed : function(callback) {
			var that = this;
			this.translator.subscribe(hemi.msg.stop, function(msg) {
				if (that.closed) callback(msg);
			});			
		},	

		/**
		 * Set the callback to be executed when a pick message comes in from the world.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */
		onPick : function(callback) {
			this.pickCallback = callback;
		},
		
		/**
		 * Default pick message callback, slides the window if the translator transform has been picked.
		 * @param {hemi.dispatch.Message} msg Message generated describing a pick event
		 */
		pickCallback : function(msg) {
			var that = this;
			if (msg.data.pickInfo.shapeInfo.parent.transform.clientId ==
					that.translator.transform.clientId) {
				this.slide();
			}
		}		
	
	};
	
	return hext;
})(hext || {});
