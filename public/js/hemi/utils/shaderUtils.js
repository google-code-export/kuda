/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
/*
The MIT License (MIT)

Copyright (c) 2011 SRI International

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var hemi = (function(hemi) {
	hemi.utils = hemi.utils || {};
	
	/**
	 * Build a shader source string from the given parsed source structure.
	 * 
	 * @param {Object} parsed structure populated with parsed shader source:
	 *     (all fields are optional)
	 *     preHdr: source positioned before the header
	 *     hdr: header source
	 *     postHdr: source positioned after the header
	 *     preSprt: source positioned before the support
	 *     sprt: support source
	 *     postSprt: source positioned after the support
	 *     preBody: source positioned before the body
	 *     body: body source
	 *     postBody: source positioned after the body
	 *     preGlob: source positioned before the global
	 *     glob: global variable assignment source
	 *     postGlob: source positioned after the global
	 * @return {string} the new shader source string
	 */
	hemi.utils.buildSrc = function(parsed) {
		var src = (parsed.preHdr ? parsed.preHdr : '') +
			(parsed.hdr ? parsed.hdr : '') +
			(parsed.postHdr ? parsed.postHdr : '') +
			(parsed.preSprt ? parsed.preSprt : '') +
			(parsed.sprt ? parsed.sprt : '') +
			(parsed.postSprt ? parsed.postSprt : '') +
			parsed.main +
			(parsed.preBody ? parsed.preBody : '') +
			(parsed.body ? parsed.body : '') +
			(parsed.postBody ? parsed.postBody : '') +
			(parsed.preGlob ? parsed.preGlob : '') +
			(parsed.glob ? parsed.glob : '') +
			(parsed.postGlob ? parsed.postGlob : '') +
			parsed.end;
		
		return src;
	};
	
	/**
	 * Combine the given strings into one cohesive fragment shader source
	 * string.
	 * 
	 * @param {string} src the original shader source string
	 * @param {Object} cfg configuration object for how to build the new shader:
	 *     (all fields are optional)
	 *     preHdr: source to prepend to the existing header
	 *     hdr: source to replace the existing header
	 *     postHdr: source to append to the existing header
	 *     preSprt: source to prepend to the existing support
	 *     sprt: source to replace the existing support
	 *     postSprt: source to append to the existing support
	 *     preBody: source to prepend to the existing body
	 *     body: source to replace the existing body
	 *     postBody: source to append to the existing body
	 *     preGlob: source to prepend to the existing global
	 *     glob: source to replace the existing global variable assignment
	 *     postGlob: source to append to the existing global
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineFragSrc = function(src, cfg) {
		return this.combineSrc(src, cfg, 'gl_FragColor');
	};
	
	/**
	 * Combine the given strings into one cohesive shader source string.
	 * 
	 * @param {string} src the original shader source string
	 * @param {Object} cfg configuration object for how to build the new shader:
	 *     (all fields are optional)
	 *     preHdr: source to prepend to the existing header
	 *     hdr: source to replace the existing header
	 *     postHdr: source to append to the existing header
	 *     preSprt: source to prepend to the existing support
	 *     sprt: source to replace the existing support
	 *     postSprt: source to append to the existing support
	 *     preBody: source to prepend to the existing body
	 *     body: source to replace the existing body
	 *     postBody: source to append to the existing body
	 *     preGlob: source to prepend to the existing global
	 *     glob: source to replace the existing global variable assignment
	 *     postGlob: source to append to the existing global
	 * @param {string} globName name of the global variable to set in main()
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineSrc = function(src, cfg, globName) {
		var parsed = this.parseSrc(src, globName);
		hemi.utils.join(parsed, cfg);
		return this.buildSrc(parsed);
	};
	
	/**
	 * Combine the given strings into one cohesive vertex shader source string.
	 * 
	 * @param {string} src the original shader source string
	 * @param {Object} cfg configuration object for how to build the new shader:
	 *     (all fields are optional)
	 *     preHdr: source to prepend to the existing header
	 *     hdr: source to replace the existing header
	 *     postHdr: source to append to the existing header
	 *     preSprt: source to prepend to the existing support
	 *     sprt: source to replace the existing support
	 *     postSprt: source to append to the existing support
	 *     preBody: source to prepend to the existing body
	 *     body: source to replace the existing body
	 *     postBody: source to append to the existing body
	 *     preGlob: source to prepend to the existing global
	 *     glob: source to replace the existing global variable assignment
	 *     postGlob: source to append to the existing global
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineVertSrc = function(src, cfg) {
		return this.combineSrc(src, cfg, 'gl_Position');
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
			globEnd = src.lastIndexOf(';') + 1;
		
		if (src.charAt(hdrEnd) === '\n') {
			++hdrEnd;
		}
		if (src.charAt(bodyStart) === '\n') {
			++bodyStart;
		}
		if (src.charAt(bodyEnd) === '\n') {
			++bodyEnd;
		}
		if (src.charAt(globEnd) === '\n') {
			++globEnd;
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
