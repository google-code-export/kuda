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

var hemi = (function(hemi) {
	hemi.utils = hemi.utils || {};
	
	/**
	 * Combine the given strings into one cohesive fragment shader source
	 * string.
	 * 
	 * @param {string} src the original shader source string
	 * @param {Object} cfg configuration object for how to build the new shader:
	 *     hdr: optional new header source
	 *     sprt: optional new support source
	 *     body: optional new body source
	 *     glob: optional new global variable assignment source
	 *     local: optional local variable to assign old global variable value to
	 *     replaceHdr: flag indicating if old header source should be removed
	 *     replaceSprt: flag indicating if old support source should be removed
	 *     replaceBody: flag indicating if old body source should be removed
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineFragSrc = function(src, cfg) {
		cfg.globName = 'gl_FragColor';
		return this.combineSrc(src, cfg);
	};
	
	/**
	 * Combine the given strings into one cohesive shader source string.
	 * 
	 * @param {string} src the original shader source string
	 * @param {Object} cfg configuration object for how to build the new shader:
	 *     globName: name of the global variable to set in the main function
	 *     hdr: optional new header source
	 *     sprt: optional new support source
	 *     body: optional new body source
	 *     glob: optional new global variable assignment source
	 *     local: optional local variable to assign old global variable value to
	 *     replaceHdr: flag indicating if old header source should be removed
	 *     replaceSprt: flag indicating if old support source should be removed
	 *     replaceBody: flag indicating if old body source should be removed
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineSrc = function(src, cfg) {
		var parsed = this.parseSrc(src, cfg.globName),
			newHdr = cfg.replaceHdr ? '' : parsed.hdr,
			newSprt = cfg.replaceSprt ? '' : parsed.sprt,
			newBody = cfg.replaceBody ? '' : parsed.body,
			newGlob = cfg.glob ? cfg.glob : parsed.glob,
			newSrc;
		
		if (cfg.hdr) {
			newHdr += cfg.hdr;
		}
		if (cfg.sprt) {
			newSprt += cfg.sprt;
		}
		if (cfg.body) {
			newBody += cfg.body;
		}
		if (cfg.local && cfg.glob) {
			newGlob = parsed.glob.replace(cfg.globName, cfg.local) + '\n' + newGlob;
		}
		
		newSrc = newHdr + newSprt + parsed.main + newBody + newGlob + parsed.end;
		return newSrc;
	};
	
	/**
	 * Combine the given strings into one cohesive vertex shader source string.
	 * 
	 * @param {string} src the original shader source string
	 * @param {Object} cfg configuration object for how to build the new shader:
	 *     hdr: optional new header source
	 *     sprt: optional new support source
	 *     body: optional new body source
	 *     glob: optional new global variable assignment source
	 *     local: optional local variable to assign old global variable value to
	 *     replaceHdr: flag indicating if old header source should be removed
	 *     replaceSprt: flag indicating if old support source should be removed
	 *     replaceBody: flag indicating if old body source should be removed
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineVertSrc = function(src, cfg) {
		cfg.globName = 'gl_Position';
		return this.combineSrc(src, cfg);
	};
	
	/**
	 * Get the vertex and pixel shaders (as well as their source) for the given
	 * Material.
	 * 
	 * @param {o3d.Material} material the material to get shaders for
	 * @return {Object} object containing shaders and source strings
	 */
	hemi.utils.getShaders = function(material) {
		var gl = material.gl,
			program = material.effect.program_,
			shaders = gl.getAttachedShaders(program),
			source1 = gl.getShaderSource(shaders[0]),
			source2 = gl.getShaderSource(shaders[1]),
			obj;
		
		if (source1.search('gl_FragColor') > 0) {
			obj = {
				fragShd: shaders[0],
				fragSrc: source1,
				vertShd: shaders[1],
				vertSrc: source2
			};
		} else {
			obj = {
				fragShd: shaders[1],
				fragSrc: source2,
				vertShd: shaders[0],
				vertSrc: source1
			};
		}
		
		return obj;
	};
	
	/**
	 * Parse the given shader source into logical groupings as follows:
	 *   Header - uniform, attribute, and varying parameters
	 *   Support - support/utility functions
	 *   Body - all of the main function except Global
	 *   Global - where the shader's global variable is assigned
	 * 
	 * Example:
	 * (HEADER_START)
	 * #ifdef MYVAR
	 * #endif
	 * uniform mat4 worldViewProjection;
	 * attribute vec4 position;
	 * (HEADER_END)
	 * (SUPPORT_START)
	 * float getOne() {
	 *   return 1.0;
	 * }
	 * (SUPPORT_END)
	 * void main() {
	 *   (BODY_START)
	 *   float one = getOne();
	 *   vec4 realPos = worldViewProjection*position;
	 *   (BODY_END)
	 *   (GLOBAL_START)
	 *   gl_Position = realPos;
	 *   (GLOBAL_END)
	 * }
	 * 
	 * @param {string} src full shader source
	 * @param {string} global global variable assigned by shader
	 * @return {Object} structure populated with parsed shader source
	 */
	hemi.utils.parseSrc = function(src, global) {
		var hdrEnd = src.lastIndexOf(';', src.indexOf('{')) + 1,
			sprtEnd = src.indexOf('void main', hdrEnd),
			bodyStart = src.indexOf('{', sprtEnd) + 1,
			bodyEnd = src.indexOf(global, bodyStart),
			globEnd = src.indexOf(';', bodyEnd) + 1;
		
		if (src.charAt(hdrEnd) === '\n') {
			++hdrEnd;
		}
		if (src.charAt(bodyStart) === '\n') {
			++bodyStart;
		}
		
		var parsedSrc = {
			hdr: src.slice(0, hdrEnd),
			sprt: src.slice(hdrEnd, sprtEnd),
			main: src.slice(sprtEnd, bodyStart),
			body: src.slice(bodyStart, bodyEnd),
			glob: src.slice(bodyEnd, globEnd),
			end: src.slice(globEnd)
		};
		
		return parsedSrc;
	};
	
	return hemi;
})(hemi || {});
