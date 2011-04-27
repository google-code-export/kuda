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
	 * @param {string} head any source to insert before the main function
	 * @param {string} tail any source to append to the end of main, typically
	 *     setting the value of the global variable for the shader
	 * @param {string} src the original shader source string
	 * @param {string} opt_local an optional new local variable to receive the
	 *     value that was previously being set to the global variable (otherwise
	 *     the previous value is just overwritten)
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineFragSrc = function(head, tail, src, opt_local) {
		return hemi.utils.combineSrc(head, tail, 'gl_FragColor', src, opt_local);
	};
	
	/**
	 * Combine the given strings into one cohesive shader source string.
	 * 
	 * @param {string} head any source to insert before the main function
	 * @param {string} tail any source to append to the end of main, typically
	 *     setting the value of the global variable for the shader
	 * @param {string} global the global variable previously being set by the
	 *     main function
	 * @param {string} src the original shader source string
	 * @param {string} opt_local an optional new local variable to receive the
	 *     value that was previously being set to the global variable (otherwise
	 *     the previous value is just overwritten)
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineSrc = function(head, tail, global, src, opt_local) {
		var hdrNdx = src.search('void main'),
			globNdx = src.search(global),
			newHead = src.slice(0, hdrNdx) + head,
			body = src.slice(hdrNdx, globNdx),
			oldEnd = src.slice(globNdx),
			endNdx = oldEnd.search(';') + 1,
			newEnd = tail + src.slice(globNdx + endNdx);
		
		if (opt_local) {
			var oldGlobal = oldEnd.slice(0, endNdx),
				newGlobal = oldGlobal.replace(global, opt_local);
			
			newEnd = newGlobal + '\n' + newEnd;
		}
		
		src = newHead + body + newEnd;
		return src;
	};
	
	/**
	 * Combine the given strings into one cohesive vertex shader source string.
	 * 
	 * @param {string} head any source to insert before the main function
	 * @param {string} tail any source to append to the end of main, typically
	 *     setting the value of the global variable for the shader
	 * @param {string} src the original shader source string
	 * @param {string} opt_local an optional new local variable to receive the
	 *     value that was previously being set to the global variable (otherwise
	 *     the previous value is just overwritten)
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineVertSrc = function(head, tail, src, opt_local) {
		return hemi.utils.combineSrc(head, tail, 'gl_Position', src, opt_local);
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
	
	return hemi;
})(hemi || {});
