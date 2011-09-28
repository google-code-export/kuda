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

var editor = (function(editor) {
	/**
	 * @namespace A module for managing the string literals for event types.
	 * @example
	 * The documentation for each event type has an example of a typical data
	 * payload for that event type.
	 */
	editor.events = {
		Cancel: 'editor.Cancel',
		
		ColorPicked: 'editor.ColorPicked',
		
		Created: 'editor.Created',
		
		Enabled: 'editor.Enabled',
		
		MenuItemClicked: 'editor.MenuItemClicked',
		
		ModelAdded: 'editor.ModelAdded',
		
		PanelVisible: 'editor.PanelVisible',
		
		PluginLoaded: 'editor.PluginLoaded',
		
		PluginRemoved: 'editor.PluginRemoved',
		
		Removed: 'editor.Removed',
		
		ScriptLoaded: 'editor.ScriptLoaded',
		
		ScriptLoadStart: 'editor.ScriptLoadStart',
		
		SidebarSet: 'editor.SidebarSet',
		
		ToolClicked: 'editor.ToolClicked',
		
		ToolModeSet: 'editor.ToolModeSet',
		
		ToolMouseIn: 'editor.ToolMouseIn',
		
		ToolMouseOut: 'editor.ToolMouseOut',
		
		Updated: 'editor.Updated',
		
		ViewAdded: 'editor.ViewAdded',
		
		WidgetVisible: 'editor.WidgetVisible',
		
		WidgetResized: 'editor.WidgetResized',
		
		WorldCleaned: 'editor.WorldCleaned',
		
		WorldLoaded: 'editor.WorldLoaded'
	};

	return editor;
})(editor || {});
