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

(function() {
	
////////////////////////////////////////////////////////////////////////////////
//                     			   Initialization  		                      //
////////////////////////////////////////////////////////////////////////////////

	editor.tools = editor.tools || {};
	editor.tools.hud = editor.tools.hud || {};

	editor.tools.hud.init = function() {
		var tabpane = new editor.ui.TabPane('HUD'),
			toolbar = new editor.ui.Toolbar(),
			
			hudMdl = new editor.tools.HudModel(),
			hudView = new editor.tools.HudView(),
			hudCtr = new editor.tools.HudController();
		
		tabpane.setToolBar(toolbar);	
		editor.ui.addTabPane(tabpane);

		hudCtr.setModel(hudMdl);
		hudCtr.setView(hudView);

		toolbar.add(hudView);
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     			  	Extra Scripts  		                      //
////////////////////////////////////////////////////////////////////////////////
	editor.getScript('js/editor/plugins/hud/js/displays.js');
	editor.getCss('js/editor/plugins/hud/css/style.css');
	
})();
