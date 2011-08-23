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
	editor.tools.geometry = editor.tools.geometry || {};

	editor.tools.geometry.init = function() {
		var tabpane = new editor.ui.TabPane('Geometry'),
			toolbar = new editor.ui.Toolbar(),
			
			mbrMdl = new editor.tools.ModelBrowserModel(),
			selMdl = new editor.tools.SelectorModel(),
			mbrView = new editor.tools.ModelBrowserView(),
			mbrCtr = new editor.tools.ModelBrowserController(),
			
			shpMdl = new editor.tools.ShapesModel(),
			shpView = new editor.tools.ShapesView(),
			shpCtr = new editor.tools.ShapesController(),
			
			anmMdl = new editor.tools.AnimatorModel(),
			anmView = new editor.tools.AnimatorView(),
			anmCtr = new editor.tools.AnimatorController();
		
		tabpane.setToolBar(toolbar);	
		editor.ui.addTabPane(tabpane);
		
		mbrCtr.setModel(mbrMdl);
		mbrCtr.setSelectorModel(selMdl);
		mbrCtr.setView(mbrView);
				
		shpCtr.setModel(shpMdl);
		shpCtr.setView(shpView);
				
		anmCtr.setModel(anmMdl);
		anmCtr.setView(anmView);
		
		toolbar.add(mbrView);
		toolbar.add(shpView);
		toolbar.add(anmView);
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     			  	Extra Scripts  		                      //
////////////////////////////////////////////////////////////////////////////////

	editor.ui.getScript('js/editor/plugins/geometry/js/browser.js');
	editor.ui.getScript('js/editor/plugins/geometry/js/shapes.js');
	editor.ui.getScript('js/editor/plugins/geometry/js/animator.js');
	editor.ui.getCss('js/editor/plugins/geometry/css/style.css');
})();
