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
	editor.tools.effects = editor.tools.effects || {};

	editor.tools.effects.init = function() {
		var tabpane = editor.ui.getTabPane('Effects'),

			ptcMdl = new editor.tools.ParticleCurvesModel(),
			ptcView = new editor.tools.ParticleCurvesView(),
			ptcCtr = new editor.tools.ParticleCurvesController(),
			
			pteMdl = new editor.tools.ParticleFxModel(),
			pteView = new editor.tools.ParticleFxView(),
			pteCtr = new editor.tools.ParticleFxController(),
			
			fogMdl = new editor.tools.FogModel(),
			fogView = new editor.tools.FogView(),
			fogCtr = new editor.tools.FogController();

		ptcCtr.setModel(ptcMdl);
		ptcCtr.setView(ptcView);

		pteCtr.setModel(pteMdl);
		pteCtr.setView(pteView);
		
		fogCtr.setModel(fogMdl);
		fogCtr.setView(fogView);

		tabpane.toolbar.add(ptcView);
		tabpane.toolbar.add(pteView);
		tabpane.toolbar.add(fogView);
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     			  	Extra Scripts  		                      //
////////////////////////////////////////////////////////////////////////////////
	editor.getScript('js/editor/plugins/effects/js/curves.js');
	editor.getScript('js/editor/plugins/effects/js/fog.js');
	editor.getScript('js/editor/plugins/effects/js/particles.js');
	editor.getCss('js/editor/plugins/effects/css/style.css');
	
})();
