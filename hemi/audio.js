o3djs.require('hemi.core');

var hemi = (function(hemi) {
	/**
	 * @namespace A module for supporting audio playback with the
	 * flash_mp3_player_js found at http://flash-mp3-player.net an open source
	 * player. See media/player_mp3_js.license for more.
	 */
	hemi.audio = hemi.audio || {};

	hemi.audio.name = 'Audio';
	
	/**
	 * The html object tag to insert into the page which loads the player.
	 * @type string
	 * @constant
	 */
	hemi.audio.FLASHOBJ = '<object id="kuda_player_mp3_js" type="application/x-shockwave-flash" data="media/player_mp3_js.swf" width="1" height="1">' +
		'<param name="movie" value="media/player_mp3_js.swf"/>' +
		'<param name="AllowScriptAccess" value="always"/>' +
		'<param name="FlashVars" value="listener=hemi.audio.listener&amp;interval=500"/></object>';

	// <!--[if IE]>
	// <script type="text/javascript" event="FSCommand(command,args)" for="kuda_player_mp3_js">
	// eval(args);
	// </script>
	// <![endif]-->

	/**
	 * The flash player's listener for init and updates.
	 * @type Object
	 * @constant
	 */
	hemi.audio.listener = new Object();

	/**
	 * Called by the flash player upon init.
	 */
	hemi.audio.listener.onInit = function() {
		this.position = 0;
		this.url = '';

		if (typeof hemi.audio.listener.onInitCallback === 'function') {
			hemi.audio.listener.onInitCallback();
		}
	};

	/**
	 * Called by the flash player on updates, default is every 500ms.
	 */
	hemi.audio.listener.onUpdate = function() {
		// Implicits
		//this.isPlaying
		//this.url
		//this.volume
		//this.position
		//this.duration
		//this.bytesLoaded
		//this.bytesTotal
		//this.bytesPercent
	};

	/**
	 * Create a hemi.audio flash mp3 player.
	 *
	 * @param {function():void} onInitCallback A function that is called when
	 * the audio player is ready.
	 */
	hemi.audio.createPlayer = function(onInitCallback) {
		jQuery('body').append(hemi.audio.FLASHOBJ);
		hemi.audio.listener.onInitCallback = onInitCallback;
		hemi.audio.flashObject = jQuery('#kuda_player_mp3_js')[0];
	};
	
	/**
	 * Get the id for the audio module.
	 * 
	 * @return {number} the id of the audio module
	 */
	hemi.audio.getId = function() {
		return hemi.world.AUDIO_ID;
	};

	/**
	 * Set the url of the mp3 audio file.
	 *
	 * @param {string} url the new file url
	 */
	hemi.audio.setUrl = function(url) {
		hemi.audio.flashObject.SetVariable('method:setUrl', url);
		hemi.audio.setPosition(0);
	};

	/**
	 * Set the postion within the file to play from.
	 *
	 * @param {number} position the new position
	 */
	hemi.audio.setPosition = function(position) {
		hemi.audio.flashObject.SetVariable('method:setPosition', position);
	};

	/**
	 * Set the volume of the flash mp3 player.
	 *
	 * @param {number} volume the new volume
	 */
	hemi.audio.setVolume = function(volume) {
		hemi.audio.flashObject.SetVariable('method:setVolume', volume);
	};

	/**
	 * Play the mp3 file using the streaming flash player.
	 *
	 * @param {string} opt_url a new optional file to play
	 */
	hemi.audio.play = function(opt_url) {
		if (opt_url) {
			hemi.audio.setUrl(opt_url);
		}

		hemi.audio.flashObject.SetVariable('method:play', '');
	};

	/**
	 * Pause the audio playback.
	 */
	hemi.audio.pause = function() {
		hemi.audio.flashObject.SetVariable('method:pause', '');
	};

	/**
	 * Stop the audio playback.
	 */
	hemi.audio.stop = function() {
		hemi.audio.flashObject.SetVariable('method:stop', '');
	};

	return hemi;
})(hemi || {});