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
 * This is a simple hello world, showing how to set up a simple world, 
 *		load a model, and set the camera to a viewpoint once the model
 *		has loaded.
 */
(function() {

	function init(clientElements) {
		// /**
		 // * It is possible to have multiple clients (i.e. multiple frames
		 // * 		rendering 3d content) on one page that would have to be
		 // * 		initialized. In this case, we only want to initialize the
		 // *		first one.
		 // */
		// hemi.core.init(clientElements[0]);
		
		// /**
		 // * Set the background color to a light-bluish. The parameter is in
		 // * 		the form [red,blue,green,alpha], with each value on a 
		 // *		scale of 0-1.
		 // */
		// hemi.view.setBGColor([0.7, 0.8, 1, 1]);
		//hemi.init();
		/**
		 * Set a prefix for the loader that will allow us to load assets as if
		 * the helloWorld.html file was in the root directory.
		 */
		hemi.loadPath = '../../';

		createWorld();
	}

	function createWorld() {

		/**
		 * hemi.world is the default world created to manage all of our models,
		 *		cameras, effects, etc. When we set the model's file name, it
		 *		will begin loading that file.
		 */
        hemi.loadOctane('samples/GrandmasHouseOctane/grandmasHouseOctane.json',
        
        function() {
            // This will be executed before hemi.world.ready() is called.
            hemi.subscribe(hemi.msg.ready,
                function(msg) {
                    bindJavascript();
                });
        });
	}

    function bindJavascript() {
        jQuery('#next').click(function() {
            var states = hemi.world.getStates();
            
            for(index = 0 ; index < states.length; index++){
                if(states[index].isLoaded)
                    break;
            }
            states[index].nextState();
            if(states[index].next != null && states[index].next.name != null){
                var sceneHTML=states[index].next.name;
                switch(states[index].next.name){
                    case "scene01":
                        sceneHTML="content/scene0.htm";
                        break;
                    case "scene02":
                        sceneHTML="content/scene1.htm";
                        break;
                    case "scene03":
                        sceneHTML="content/scene2.htm";
                        break;
                    case "scene04":
                        sceneHTML="content/scene3.htm";
                        break;
                    case "scene05":
                        sceneHTML="content/scene4.htm";
                        break;
                    case "scene06":
                        sceneHTML="content/scene5.htm";
                        break;
                    case "scene07":
                    case "scene08":
                    case "scene09":
                        sceneHTML="content/scene6.htm";
                        break;
                    case "scene10":
                    case "scene11":
                    case "scene12":
                        sceneHTML="content/scene8.htm";
                        break;
                    default:
                        break;
                }
                document.getElementById("myframe").src=sceneHTML;
            }
		});
		jQuery('#prev').click(function() {
			var states = hemi.world.getStates();
            states.sort();
            for(index = 0 ; index < states.length; index++){
                if(states[index].isLoaded)
                    break;
            }
            states[index].previousState();
            
            if(states[index].prev != null && states[index].prev.name != null){
                var sceneHTML = states[index].prev.name;;
                switch(states[index].prev.name){
                    case "scene01":
                        sceneHTML="content/scene0.htm";
                        break;
                    case "scene02":
                        sceneHTML="content/scene1.htm";
                        break;
                    case "scene03":
                        sceneHTML="content/scene2.htm";
                        break;
                    case "scene04":
                        sceneHTML="content/scene3.htm";
                        break;
                    case "scene05":
                        sceneHTML="content/scene4.htm";
                        break;
                    case "scene06":
                        sceneHTML="content/scene5.htm";
                        break;
                    case "scene07":
                    case "scene08":
                    case "scene09":
                        sceneHTML="content/scene6.htm";
                        break;
                    case "scene10":
                    case "scene11":
                    case "scene12":
                        sceneHTML="content/scene8.htm";
                        break;
                    default:
                        break;
                }
                document.getElementById("myframe").src=sceneHTML;
            }
		});
        jQuery('#reload').click(function() {
            var states = hemi.world.getStates();
            for(index = 0 ; index < states.length; index++){
                if(states[index].isLoaded)
                    break;
            }
            states[index].unload();
            states[index].load();
		});
    }
    jQuery(window).load(function() {
		init();
	});
	// jQuery(window).load(function() {
		// o3djs.webgl.makeClients(init);
	// });

	// jQuery(window).unload(function() {
		// if (hemi.core.client) {
			// hemi.core.client.cleanup();
		// }
	// });
})();
