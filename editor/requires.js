var editor = (function(base, jQuery) {
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
	
	o3djs.require('editor.inheritance');
	
    o3djs.require('editor.utils.listener');
	o3djs.require('editor.utils.math');
	
    o3djs.require('editor.ui.component');
	o3djs.require('editor.ui.listWidget');
	o3djs.require('editor.ui.toolbar');
	o3djs.require('editor.ui.sidebar');
    o3djs.require('editor.ui.actionbar');
    o3djs.require('editor.ui.menu');
	o3djs.require('editor.ui.dialog');
	o3djs.require('editor.ui.colorpicker');
	o3djs.require('editor.ui.validator');

    o3djs.require('editor.tools.baseTool');
    o3djs.require('editor.tools.animator');
    o3djs.require('editor.tools.manips');
    o3djs.require('editor.tools.messaging');
    o3djs.require('editor.tools.modelBrowser');
    o3djs.require('editor.tools.motions');
    o3djs.require('editor.tools.viewManip');
    o3djs.require('editor.tools.viewpoints');
    o3djs.require('editor.tools.modelLoader');
	o3djs.require('editor.tools.particleEffects');
	o3djs.require('editor.tools.scenes');
	o3djs.require('editor.tools.shapes');
	o3djs.require('editor.tools.hudDisplays');
	o3djs.require('editor.tools.fog');
	
	o3djs.require('hemi.loader');
	o3djs.require('hemi.handlers.valueCheck');
	
	return base;
})(editor || {}, jQuery);
