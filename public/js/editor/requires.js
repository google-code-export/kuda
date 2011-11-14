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
    o3djs.require('o3djs.util');
    o3djs.require('o3djs.math');
    o3djs.require('o3djs.quaternions');
    o3djs.require('o3djs.rendergraph');
    o3djs.require('o3djs.pack');
    o3djs.require('o3djs.arcball');
    o3djs.require('o3djs.scene');
    o3djs.require('o3djs.picking');
    o3djs.require('o3djs.material');
    o3djs.require('o3djs.primitives');
    o3djs.require('o3djs.particles');
	
	o3djs.require('editor.events');
	
    o3djs.require('editor.utils.listener');
	o3djs.require('editor.utils.misc');
	o3djs.require('editor.utils.dependency');
		
	o3djs.require('editor.data.metadata');
	
    o3djs.require('editor.ui.components.component');
	o3djs.require('editor.ui.components.input');
    o3djs.require('editor.ui.components.menu');
	o3djs.require('editor.ui.components.colorpicker');
	o3djs.require('editor.ui.components.vector');
	o3djs.require('editor.ui.components.treeSelector');
	o3djs.require('editor.ui.components.tooltip');
	o3djs.require('editor.ui.components.validator');	
	o3djs.require('editor.ui.components.list');

	o3djs.require('editor.ui.core.view');
	o3djs.require('editor.ui.core.progress');
	o3djs.require('editor.ui.core.transformHandles');
	o3djs.require('editor.ui.core.gridPlane');
    o3djs.require('editor.ui.core.dialogs');

	o3djs.require('editor.tools');
	o3djs.require('editor.project');
	o3djs.require('editor.pluginManager');
	
	o3djs.require('hemi.loader');
	o3djs.require('hemi.handlers.valueCheck');
	
	return editor;
})(editor || {});
