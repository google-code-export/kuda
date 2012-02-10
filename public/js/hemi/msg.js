/*
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 * The MIT License (MIT)
 * 
 * Copyright (c) 2011 SRI International
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated  documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the  Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function() {
	/**
	 * @namespace A module for managing the string literals for Message types.
	 * @example
	 * The documentation for each Message type has an example of a typical Message body for that
	 * type (the 'data' property of a Message).
	 */
	hemi.msg = {
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.Model - the Model's animation time changes
		 * data = {
		 *     previous: (number) the previous animation time for the Model
		 *     time: (number) the new animation time for the Model
		 * }
		 */
		animate: 'hemi.animate',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.ParticleBurst - the ParticleBurst effect is triggered
		 * data = {
		 *     position: (number[3]) the XYZ position the ParticleBurst was triggered at
		 * }
		 */
		burst: 'hemi.burst',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.Citizen - the Citizen is being removed from the World
		 * data = { }
		 */
		cleanup: 'hemi.cleanup',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hext.tools.BaseTool - the tool is enabled or disabled
		 * data = {
		 *     enabled: (boolean) a flag indicating if the tool is enabled
		 * }
		 */
		enable: 'hemi.enable',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.Audio - the Audio's media content is loaded
		 * data = {
		 *     src: (string) the URL of the audio file loaded
		 * }
		 * @example
		 * hemi.HudImage - the HudImage's image data is loaded
		 * data = { }
		 * @example
		 * hemi.HudVideo - the HudVideo's media content is loaded
		 * data = {
		 *     src: (string) the URL of the video file loaded
		 * }
		 * @example
		 * hemi.Model - the Model's 3D data is loaded
		 * data = { }
		 * @example
		 * hemi.State - the State is set as the "current" State
		 * data = { }
		 */
		load: 'hemi.load',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.Mesh - the Mesh has been moved
		 * data = {
		 *     delta: (THREE.Vector3) the change in XYZ position caused by the move
		 * }
		 * @example
		 * hemi.Transform - the Transform has been moved
		 * data = {
		 *     delta: (THREE.Vector3) the change in XYZ position caused by the move
		 * }
		 */
		move: 'hemi.move',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi - a shape is picked by a mouse click
		 * data = {
		 *     mouseEvent: (Object) the mouse down event
		 *     pickedMesh: (hemi.Mesh) the Mesh picked by the mouse click
		 *     worldIntersectionPosition: (THREE.Vector3) the XYZ position of the pick (world space)
		 * }
		 */
		pick: 'hemi.pick',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi - a task's progress data has been updated
		 * data = {
		 *     isTotal: (boolean) a flag indicating if percent is for a specific task or a total of
		 *                        all current tasks
		 *     percent: (number) the task's percentage complete, 0-100
		 *     task: (string) an id for the task, ex: url of a file being loaded
		 * }
		 */
		progress: 'hemi.progress',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi - the World's resources are loaded and ready
		 * data = { }
		 */
		ready: 'hemi.ready',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.Mesh - the Mesh has been resized
		 * data = {
		 *     scale: (number) the new scale
		 * }
		 * @example
		 * hemi.Transform - the Transform has been resized
		 * data = {
		 *     scale: (number) the new scale
		 * }
		 */
		resize: 'hemi.resize',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.AnimationGroup - the AnimationGroup starts
		 * data = { }
		 * @example
		 * hemi.Audio - the Audio starts playing
		 * data = { }
		 * @example
		 * hemi.Camera - the Camera starts moving to a Viewpoint
		 * data = {
		 *     viewpoint: (hemi.view.Viewpoint) the Viewpoint the Camera is moving to
		 * }
		 * @example
		 * hemi.Mesh - the Mesh starts a motion
		 * data = { }
		 * @example
		 * hemi.ParticleTrail - the ParticleTrail effect starts generating particles
		 * data = { }
		 * @example
		 * hemi.Timer - the Timer starts counting down
		 * data = {
		 *     time: (number) the milliseconds the Timer will count down for
		 * }
		 * @example
		 * hemi.Transform - the Transform starts a motion
		 * data = { }
		 */
		start: 'hemi.start',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.AnimationGroup - the AnimationGroup finishes or is stopped
		 * data = { }
		 * @example
		 * hemi.Audio - the Audio finishes playing
		 * data = { }
		 * @example
		 * hemi.Camera - the Camera arrives at a Viewpoint
		 * data = {
		 *     viewpoint: (hemi.view.Viewpoint) the Viewpoint the Camera moved to
		 * }
		 * @example
		 * hemi.Mesh - the Mesh finishes a motion
		 * data = { }
		 * @example
		 * hemi.ParticleTrail - the ParticleTrail effect stops generating particles
		 * data = { }
		 * @example
		 * hemi.Timer - the Timer stops counting down
		 * data = {
		 *     time: (number) the milliseconds the Timer counted down
		 * }
		 * @example
		 * hemi.Transform - the Transform finishes a motion
		 * data = { }
		 */
		stop: 'hemi.stop',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.Audio - the Audio's media content is unloaded
		 * data = { }
		 * @example
		 * hemi.Model - the Model's 3D data is unloaded
		 * data = { }
		 * @example
		 * hemi.State - the State is set to not be the "current" State
		 * data = { }
		 */
		unload: 'hemi.unload',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.ParticleEmitter - the ParticleEmitter is shown or hidden
		 * data = {
		 *     visible: (boolean) a flag indicating if the Emitter is visible
		 * }
		 * @example
		 * hemi.HudDisplay - the HudDisplay shows a page or is hidden
		 * data = {
		 *     page: (number) the page number being shown or 0 if the HudDisplay is hidden
		 * }
		 * @example
		 * hext.tools.BaseTool - the tool is shown or hidden
		 * data = {
		 *     visible: (boolean) a flag indicating if the tool is visible
		 * }
		 */
		visible: 'hemi.visible',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi - the World is being cleaned up and emptied.
		 */
		worldCleanup: 'hemi.worldCleanup'
	};

})();
