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
	var shorthand = editor.tools.behavior = editor.tools.behavior || {};
	
	shorthand.init = function() {		
		var tabpane = new editor.ui.TabPane('Behaviors'),
			toolbar = new editor.ui.Toolbar();

		var bhvMdl = new editor.tools.BehaviorModel(),
			bhvView = new editor.tools.BehaviorView(),
			bhvCtr = new editor.tools.BehaviorController();
				
		bhvCtr.setModel(bhvMdl);
		bhvCtr.setView(bhvView);
		
		toolbar.add(bhvView);
		
		tabpane.setToolBar(toolbar);	
		editor.ui.addTabPane(tabpane);
	};	
	
	editor.ui.whenDoneLoading(function() {		
		// grab all views
		var views = editor.ui.getViews();
		
		// for each view, if there is a list widget, insert a behavior widget
		// and replace the createListItem() method in the list widget
		for (var i = 0, il = views.length; i < il; i++) {
			var view = views[i],
				panels = view.panels,
				done = false;
				
			for (var j = 0, jl = panels.length; j < jl && !done; j++) {
				var widgets = panels[j].widgets;
				
				for (var k = 0, kl = widgets.length; k < kl && !done; k++) {
					var widget = widgets[k];
					
					if (widget instanceof editor.ui.ListWidget) {
						var bhvWgt = shorthand.createBehaviorWidget();
						
						// add the behavior widget
						view.sidePanel.addWidget(bhvWgt);
						
						// replace the createListItem method
						widget.behaviorWidget = bhvWgt;
						widget.createListItem = function() {
							return new shorthand.BhvListItem(this.behaviorWidget);
						}
						
						bhvWgt.parentPanel = view.sidePanel;
						bhvWgt.addListener(editor.EventTypes.WidgetVisible, function(obj) {
							var thisWgt = obj.widget,
								wgts = thisWgt.parentPanel.widgets;
							
							editor.ui.sizeAndPosition.call(bhvWgt);
							
							for (var ndx = 0, len = wgts.length; ndx < len; ndx++) {
								var wgt = wgts[ndx];
								
								if (wgt !== thisWgt) {
									wgt.setVisible(!obj.visible);
								}
							}
						});
						
						done = true;
					}
				}
			}
		}
	});

////////////////////////////////////////////////////////////////////////////////
//                     			  	Extra Scripts  		                      //
////////////////////////////////////////////////////////////////////////////////

	editor.ui.getScript('js/editor/plugins/behavior/js/treeData.js');
	editor.ui.getScript('js/editor/plugins/behavior/js/behaviorTrees.js');
	editor.ui.getScript('js/editor/plugins/behavior/js/behaviorWidget.js');
	editor.ui.getScript('js/editor/plugins/behavior/js/behaviors.js');
//	editor.ui.getScript('js/editor/plugins/behavior/js/timer.js');
	editor.ui.getCss('js/editor/plugins/behavior/css/style.css');
})();
