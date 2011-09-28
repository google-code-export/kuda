// WARNING: When using process.exit() you may exit or cut off an operation due
// to node's/JavaScript non-blocking calls

var child = require('child_process'),
	fs = require('fs'),
	sys = require('sys'),
	path = require('path'),
	uglify = require('uglify-js'),
	procFds = [process.stdin.fd, process.stdout.fd, process.stderr.fd],
	filter = [];

var createAssetsDir = function(fromDir, toDir) {
	if (!path.existsSync(toDir)) {
		var stat = fs.statSync(fromDir);
		fs.mkdirSync(toDir, stat.mode);
	}
	
	var data = fs.readFileSync(fromDir + '/LICENSE.cc'),
		newFile = toDir + '/LICENSE.cc';
	
	fs.writeFileSync(newFile, data);
	data = fs.readFileSync(fromDir + '/NOTICES'),
	newFile = toDir + '/NOTICES';
	fs.writeFileSync(newFile, data);
};

var copyFiles = function(fromDir, toDir, subDirs) {
	var files = [],
		dirs = [];
	getDirContents(fromDir, files, dirs);

	if (!path.existsSync(toDir)) {
		var stat = fs.statSync(fromDir);
		fs.mkdirSync(toDir, stat.mode);
	}

	for (var i = 0, il = files.length; i < il; i++) {
		var file = files[i],
			data = fs.readFileSync(file),
			newFile = toDir + '/' + path.basename(file);
		fs.writeFileSync(newFile, data);
	}

	if (subDirs) {
		for (var i = 0, il = dirs.length; i < il; i++) {
			var dir = '/' + path.basename(dirs[i]);
			copyFiles(fromDir + dir, toDir + dir, subDirs);
		}
	}
};

var getDirContents = function(dir, files, dirs) {
	var dirFiles = fs.readdirSync(dir);
	
	for (var i = 0, il = dirFiles.length; i < il; i++) {
		var file = dirFiles[i],
			fName = path.basename(file),
			fPath = path.resolve(dir, file),
			stat = fs.statSync(fPath);
		
		if (filterFile(fName)) {
			if (stat.isDirectory()) {
				dirs.push(fPath);
			} else if (stat.isFile()) {
				files.push(fPath);
			}
		}
	}
};

var filterFile = function(file) {
	return filter.indexOf(file) === -1;
};

var removeFiles = function(dir) {
	var files = [],
		dirs = [];
	getDirContents(dir, files, dirs);

	for (var i = 0, il = dirs.length; i < il; i++) {
		var subDir = '/' + path.basename(dirs[i]);
		removeFiles(dir + subDir);
	}
	
	for (var i = 0, il = files.length; i < il; i++) {
		fs.unlinkSync(files[i]);
	}
	
	fs.rmdirSync(dir);
};

var compressDir = function(toDir) {
	// Package and compress the created directory
	var tarChild = child.spawn('tar', ['-czf', toDir + '.tgz', toDir],
		{customFds: procFds});
	
	tarChild.on('exit', function (code) {
		if (code === 0) {
			// Clean up the created directory
			filter = [];
			removeFiles(toDir);
		}
	});
};

var uglifyMe = function(data) {
	var jsp = uglify.parser,
		pro = uglify.uglify,
		ast = jsp.parse(data),
	ast = pro.ast_mangle(ast);
	ast = pro.ast_squeeze(ast);
	return pro.gen_code(ast);
};

var uglifyFile = function(file, header) {
	var uglyjs = uglifyMe(fs.readFileSync(file).toString()),
		outFile = fs.openSync(file.replace(/\.src\.js|\.js/, '.min.js'), 'w+');
	fs.writeSync(outFile, header + uglyjs);
};

var catFiles = function(args) {
	args.uglyData = "";

	for (var i = 0, il = args.moduleFiles.length; i < il; i++) {
		var file = args.moduleFiles[i],
			data = fs.readFileSync(args.dist + '/' + file),
			uglyData = data.toString().replace(args.replace, "");
		args.uglyData += uglyData;
	}
};

var uglifyO3d = function(src, dst) {
	var args = {
		dist: src,
		moduleFiles: [
			'o3d-webgl/base.js',
			'o3d-webgl/object_base.js',
			'o3d-webgl/named_object_base.js',
			'o3d-webgl/named_object.js',
			'o3d-webgl/param_object.js',
			'o3d-webgl/param_array.js',
			'o3d-webgl/param.js',
			'o3d-webgl/event.js',
			'o3d-webgl/raw_data.js',
			'o3d-webgl/texture.js',
			'o3d-webgl/bitmap.js',
			'o3d-webgl/file_request.js',
			'o3d-webgl/client.js',
			'o3d-webgl/render_node.js',
			'o3d-webgl/clear_buffer.js',
			'o3d-webgl/state_set.js',
			'o3d-webgl/viewport.js',
			'o3d-webgl/tree_traversal.js',
			'o3d-webgl/draw_list.js',
			'o3d-webgl/draw_pass.js',
			'o3d-webgl/render_surface_set.js',
			'o3d-webgl/render_surface.js',
			'o3d-webgl/state.js',
			'o3d-webgl/draw_context.js',
			'o3d-webgl/ray_intersection_info.js',
			'o3d-webgl/sampler.js',
			'o3d-webgl/transform.js',
			'o3d-webgl/pack.js',
			'o3d-webgl/bounding_box.js',
			'o3d-webgl/draw_element.js',
			'o3d-webgl/element.js',
			'o3d-webgl/field.js',
			'o3d-webgl/buffer.js',
			'o3d-webgl/stream.js',
			'o3d-webgl/vertex_source.js',
			'o3d-webgl/stream_bank.js',
			'o3d-webgl/primitive.js',
			'o3d-webgl/shape.js',
			'o3d-webgl/effect.js',
			'o3d-webgl/material.js',
			'o3d-webgl/archive_request.js',
			'o3d-webgl/param_operation.js',
			'o3d-webgl/function.js',
			'o3d-webgl/counter.js',
			'o3d-webgl/curve.js',
			'o3d-webgl/skin.js',
			'o3djs/base.js',
			'o3djs/effect.js',
			'o3djs/util.js',
			'o3djs/webgl.js',
			'o3djs/debug.js',
			'o3djs/element.js',
			'o3djs/event.js',
			'o3djs/loader.js',
			'o3djs/math.js',
			'o3djs/pack.js',
			'o3djs/particles.js',
			'o3djs/picking.js',
			'o3djs/primitives.js',
			'o3djs/rendergraph.js',
			'o3djs/canvas.js',
			'o3djs/material.js',
			'o3djs/io.js',
			'o3djs/scene.js',
			'o3djs/serialization.js',
			'o3djs/error.js',
			'o3djs/texture.js',
			'o3djs/shape.js'
		],
		replace: /(o3d|o3djs)\.(include|require)\('.*?'\);\s*/g
	},
	header =
'/*\n\
 * Copyright 2010, Google Inc.\n\
 * All rights reserved.\n\
 *\n\
 * Redistribution and use in source and binary forms, with or without\n\
 * modification, are permitted provided that the following conditions are\n\
 * met:\n\
 *\n\
 *     * Redistributions of source code must retain the above copyright\n\
 * notice, this list of conditions and the following disclaimer.\n\
 *     * Redistributions in binary form must reproduce the above\n\
 * copyright notice, this list of conditions and the following disclaimer\n\
 * in the documentation and/or other materials provided with the\n\
 * distribution.\n\
 *     * Neither the name of Google Inc. nor the names of its\n\
 * contributors may be used to endorse or promote products derived from\n\
 * this software without specific prior written permission.\n\
 *\n\
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n\
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\n\
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\n\
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\n\
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\n\
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n\
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\n\
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\n\
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n\
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\n\
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n\
 */\n';
	catFiles(args);
	fs.writeFileSync(dst + '/o3d.src.js', args.uglyData);
	// TODO: Add the license
	uglifyFile(dst + '/o3d.src.js', header);
};

var uglifyHemi = function(src, dst) {
		var args = {
			dist: src,
			moduleFiles: [
				'hemi/core.js',
				'hemi/utils/hashtable.js',
				'hemi/utils/jsUtils.js',
				'hemi/utils/mathUtils.js',
				'hemi/utils/shaderUtils.js',
				'hemi/utils/stringUtils.js',
				'hemi/utils/transformUtils.js',
				'hemi/msg.js',
				'hemi/console.js',
				'hemi/picking.js',
				'hemi/loader.js',
				'hemi/world.js',
				'hemi/octane.js',
				'hemi/handlers/valueCheck.js',
				'hemi/audio.js',
				'hemi/dispatch.js',
				'hemi/input.js',
				'hemi/view.js',
				'hemi/model.js',
				'hemi/animation.js',
				'hemi/motion.js',
				'hemi/effect.js',
				'hemi/scene.js',
				'hemi/hud.js',
				'hemi/manip.js',
				'hemi/curve.js',
				'hemi/sprite.js',
				'hemi/shape.js',
				'hemi/fx.js',
				'hemi/texture.js',
				'hemi/timer.js'
			],
			replace: /o3djs\.require\('(hemi|o3djs).*?'\);\s*/g
		},
		header =
'/*\n\
 * Kuda includes a library and editor for authoring interactive 3D content for the web.\n\
 * Copyright (C) 2011 SRI International.\n\
 *\n\
 * This program is free software; you can redistribute it and/or modify it under the terms\n\
 * of the GNU General Public License as published by the Free Software Foundation; either\n\
 * version 2 of the License, or (at your option) any later version.\n\
 *\n\
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;\n\
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.\n\
 * See the GNU General Public License for more details.\n\
 *\n\
 * You should have received a copy of the GNU General Public License along with this program;\n\
 * if not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,\n\
 * Boston, MA 02110-1301 USA.\n\
 */\n';
		catFiles(args);
		fs.writeFileSync(dst + '/hemi.src.js', args.uglyData);
		// TODO: Add the GPL header
		uglifyFile(dst + '/hemi.src.js', header);
};

var checkForToDir = function(toDir) {
	if (path.existsSync(toDir)) {
		process.stdout.write('Cannot write to ' + toDir + ': already exists\n');
		process.exit(-1);
	}
};

if (process.argv.length > 3) {
	var ndx = 2,
		docs = true,
		compress = false;

	// Check for flags
	while (process.argv[ndx].substr(0, 2) === '--') {
		var flag = process.argv[ndx++];
		
		switch (flag) {
			case '--no-doc':
				docs = false;
				break;
			case '--zip':
				compress = true;
				break;
		}
	}

	// Get build arguments
	var type = process.argv[ndx++],
		toDir = process.argv[ndx];

	// Set up our filter
	filter = ['.svn', '.hg', '.hgignore', '.hgtags', '.project', '.settings'];

	if (type === 'core') {
		checkForToDir(toDir);
		// Copy only the core Hemi library
		filter.push('app.js', 'build.js', 'PublishReadMe',
			'PublishTemplate.html', 'editor', 'hemi', 'o3djs', 'o3d-webgl', 'parse.js');
		copyFiles('.', toDir, false);
		copyFiles('./public/js', toDir, true);

		if (docs) {
			var docDir = './public/doc';

			if (path.existsSync(docDir)) {
				copyFiles(docDir, toDir + '/doc', true);
			}
		}
	} else if (type === 'ugly') {
		sys.puts('Making ugly toDir:' + toDir + '\n');
		uglifyFile(toDir);
	} else if (type === 'uglifyO3d') {
		uglifyO3d('./public/js', toDir);
	} else if (type == 'uglifyHemi') {
		uglifyHemi('./public/js', toDir);
	} else {
		checkForToDir(toDir);

		// Unless building a full package, do not copy samples
		if (type !== 'full') {
			filter.push('samples', 'assets');
		}

		if (!docs) {
			filter.push('doc');
		}

		// Now copy the Kuda files
		copyFiles('.', toDir, true);

		// If not building a full package, create an empty assets directory
		if (type !== 'full') {
			createAssetsDir('public/assets', toDir + '/public/assets');
		}
	}

	// Optionally compress
	if (compress) {
		compressDir(toDir);
	}
} else {
	process.stdout.write('Usage: node build.js [options] [type] [toDir]\n' +
		'Valid options are: --no-doc, --zip\n' +
		'Valid types are: core, editor, full, uglifyHemi, uglifyO3d, ugly\n');
}
