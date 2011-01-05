var hemi = (function(parent, jQuery) {
	
	parent.test = parent.test || {};
	parent.test.animation = parent.test.animation || {};
	
	o3djs.require('hemi.animation');
	
	var AnimationTarget = function () {
		this.isAnimating = false;
		this.currentTime = 0;
		this.worldId = 10;
	};

	AnimationTarget.prototype = {
		
		getId: function() {
			return this.worldId;
		},
		
		setAnimationTime: function(time) {
			this.currentTime = time;
		}
	};
	
	var UnitTest = {
		name: 'animation',
		runTests: function() {
			module(this.name);

			test("Loop: default constructor", function() {
				expect(4);
			
				var loop = new parent.animation.Loop();
				
				equals(loop.startTime, 0, "Initial start time");
				equals(loop.stopTime, 0, "Initial stop time");
				equals(loop.iterations, -1, "Initial iterations");
				equals(loop.current, 0, "Initial current");
			});
			
			test("Loop: to Octane", function() {
				expect(0);				
			});
			
			test("Animation: default constructor", function() {
				expect(6);
				
				var anim = new parent.animation.Animation();
				
				equals(anim.target, null, "Initial target is null");
				equals(anim.beginTime, 0, "Initial begin time is 0");
				equals(anim.endTime, 0, "Initial end time is 0");
				equals(anim.currentTime, 0, "Initial current time is 0");
				same(anim.loops, [], "Initial loops are empty");;
				equals(anim.getId(), null, "Initial id");
			});
			
			test("Animation: to Octane", function() {
				expect(0);
			});
			
			asyncTest("Animation: no loops", function() {
				expect(6);
				
				var timeOut = 1000;
				var target = new AnimationTarget();
				var beginTime = 0;
				var endTime = 500;
				var interval = 100;
				
				var animation = new parent.animation.Animation();
				animation.currentTime = animation.beginTime = beginTime;
				animation.endTime = endTime;
				animation.target = target;
				
				animation.updateTarget = function(currentTime) {
					this.target.currentTime = currentTime;
					equals(this.target.currentTime, this.currentTime, "Animation running time");
					
					if (currentTime == this.endTime) {
						clearInterval(intervalId);
					}
				};
				
				var intervalId = setInterval(function(){
					animation.onRender({
						activeTime: interval
					});
				}, interval);
				
				setTimeout(function(){
					clearInterval(intervalId);
					equals(animation.currentTime, animation.endTime, "Animation finished");
					
					start();
				}, timeOut);
			});
			
			asyncTest("Animation: simple loop", function() {
				expect(10);
				
				var timeOut = 1000;
				var target = new AnimationTarget();
				var beginTime = 0;
				var endTime = 500;
				var interval = 100;
				var loopStart = 100;
				var loopStop = 300;
				var loopIterations = 2;
				
				var animation = new parent.animation.Animation();
				animation.currentTime = animation.beginTime = beginTime;
				animation.endTime = endTime;
				animation.target = target;
				var loop = new parent.animation.Loop();
				loop.startTime = loopStart;
				loop.stopTime = loopStop;
				loop.iterations = loopIterations;
				animation.addLoop(loop);
				
				animation.updateTarget = function(currentTime) {
					this.target.currentTime = currentTime;
					equals(this.target.currentTime, this.currentTime, "Animation running time");
					
					if (currentTime == this.endTime) {
						clearInterval(intervalId);
					}
				};
				
				var intervalId = setInterval(function(){
					animation.onRender({
						activeTime: interval
					});
				}, interval);
				
				setTimeout(function(){
					clearInterval(intervalId);
					equals(animation.currentTime, animation.endTime, "Animation finished");
					
					start();
				}, timeOut);
			});
			
			asyncTest("Animation: infinite loop", function() {
				expect(15);
				
				var timeOut = 2000;
				var loops = 15;
				var target = new AnimationTarget();
				var beginTime = 0;
				var endTime = 500;
				var interval = 100;
				var loopStart = 100;
				var loopStop = 300;
				var loopIterations = -1;
				
				var animation = new parent.animation.Animation();
				animation.currentTime = animation.beginTime = beginTime;
				animation.endTime = endTime;
				animation.target = target;
				var loop = new parent.animation.Loop();
				loop.startTime = loopStart;
				loop.stopTime = loopStop;
				loop.iterations = loopIterations;
				animation.addLoop(loop);
				
				animation.updateTarget = function(currentTime) {
					this.target.currentTime = currentTime;
					equals(this.target.currentTime, this.currentTime, "Animation running time");
					loops--;
					
					if (currentTime == this.endTime || loops == 0) {
						clearInterval(intervalId);
					}
				};
				
				var intervalId = setInterval(function(){
					animation.onRender({
						activeTime: interval
					});
				}, interval);
				
				setTimeout(function(){
					clearInterval(intervalId);
					start();
				}, timeOut);
			});
			
			asyncTest("Animation: overlapping loops", function() {
				expect(12);
				
				var timeOut = 2000;
				var target = new AnimationTarget();
				var beginTime = 0;
				var endTime = 500;
				var interval = 100;
				var loopStart = 100;
				var loopStop = 300;
				var loopIterations = 1;
				
				var animation = new parent.animation.Animation();
				animation.currentTime = animation.beginTime = beginTime;
				animation.endTime = endTime;
				animation.target = target;
				var loop = new parent.animation.Loop();
				loop.startTime = loopStart;
				loop.stopTime = loopStop;
				loop.iterations = loopIterations;
				animation.addLoop(loop);
				
				loopStart = 200;
				loopStop = 400;
				loopIterations = 2;
				loop = new parent.animation.Loop();
				loop.startTime = loopStart;
				loop.stopTime = loopStop;
				loop.iterations = loopIterations;
				animation.addLoop(loop);
				
				animation.updateTarget = function(currentTime) {
					this.target.currentTime = currentTime;
					equals(this.target.currentTime, this.currentTime, "Animation running time");
					
					if (currentTime == this.endTime) {
						clearInterval(intervalId);
					}
				};
				
				var intervalId = setInterval(function(){
					animation.onRender({
						activeTime: interval
					});
				}, interval);
				
				setTimeout(function(){
					clearInterval(intervalId);
					equals(animation.currentTime, animation.endTime, "Animation finished");
					
					start();
				}, timeOut);
			});
			
			asyncTest("Animation: start/stop", function() {
				expect(0);
				start();
			});
			
			asyncTest("Create model animation", function() {
				expect(6);
				
				var timeOut = 1050;
				var target = new AnimationTarget();
				var beginTime = 0;
				var endTime = 500;
				var interval = 100;
				
				var animation = new parent.animation.ModelAnimation();
				animation.currentTime = animation.beginTime = beginTime;
				animation.endTime = endTime;
				animation.target = target;
				
				animation.updateTarget = function(currentTime) {
					this.target.currentTime = currentTime;
					equals(this.target.currentTime, this.currentTime, "Animation running time");
					
					if (currentTime == this.endTime) {
						clearInterval(intervalId);
					}
				};
				
				var intervalId = setInterval(function(){
					animation.onRender({
						activeTime: interval
					});
				}, interval);
				
				setTimeout(function(){
					clearInterval(intervalId);
					equals(animation.currentTime, animation.endTime, "Animation finished");
					
					start();
				}, timeOut);
			});
			
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
