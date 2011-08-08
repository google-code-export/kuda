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

var copyFiles = function(fromDir, toDir, args) {
	var files = [],
		dirs = [];
	args.uglyData = args.uglyData || "";
	getDirContents(fromDir, files, dirs);

	if (!path.existsSync(toDir)) {
		var stat = fs.statSync(fromDir);
		fs.mkdirSync(toDir, stat.mode);
	}

	for (var i = 0, il = files.length; i < il; i++) {
		var file = files[i],
			data = fs.readFileSync(file),
			newFile = toDir + '/' + path.basename(file);

		if (args.uglyModules) {
			if (args.uglyModules.every(function(e) { return toDir.indexOf(e) !== -1; })) {
				process.stdout.write('newFile:' + newFile + '\n');
				process.stdout.write('path.basename(file):' + path.basename(file) + '\n');
				var uglyData = data.toString().replace(/o3djs.require\('.*?'\);/g, "");
				args.uglyData += ';\n' + uglifyMe(uglyData);
			}
		}

		fs.writeFileSync(newFile, data);
	}

	if (args.subDirs) {
		for (var i = 0, il = dirs.length; i < il; i++) {
			var dir = '/' + path.basename(dirs[i]);
			copyFiles(fromDir + dir, toDir + dir, args);
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

var uglifyFile = function(file) {
	var uglyjs = uglifyMe(fs.readFileSync(file).toString()),
		outFile = fs.openSync(file.replace(/.src.js|.js/, '.min.js'), 'w+');
	fs.writeSync(outFile,uglyjs);
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
			replace: /o3djs\.require\('(hemi|o3djs).*?'\);/g //\.picking).*?'\);/g
		};
		catFiles(args);
		fs.writeFileSync(dst + '/hemi.src.js', args.uglyData);
		// TODO: Add the GPL header
		uglifyFile(dst + '/hemi.src.js');
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
		copyFiles('.', toDir, { subDirs: false });
		var args = { subDirs: true };//, uglyModules: ['hemi'] };
		copyFiles('./public/js', toDir, args);
		uglifyHemi('./public/js', toDir);

		if (docs) {
			var docDir = './public/doc';

			if (path.existsSync(docDir)) {
				copyFiles(docDir, toDir + '/doc', { subDirs: true });
			}
		}
	} else if (type === 'ugly') {
		sys.puts('Making ugly toDir:' + toDir + '\n');
		uglifyFile(toDir);
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
		copyFiles('.', toDir, { subDirs: true });
		// fs.writeFileSync('./public/js/hemi-core-1.4.0.min.js', args.uglyData);

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
		'Valid types are: core, editor, full\n');
}




//cat base.js object_base.js named_object_base.js named_object.js param_object.js param_array.js param.js event.js raw_data.js texture.js bitmap.js file_request.js client.js render_node.js clear_buffer.js state_set.js viewport.js tree_traversal.js draw_list.js draw_pass.js render_surface_set.js render_surface.js state.js draw_context.js ray_intersection_info.js sampler.js transform.js pack.js bounding_box.js draw_element.js element.js field.js buffer.js stream.js vertex_source.js stream_bank.js primitive.js shape.js effect.js material.js archive_request.js param_operation.js function.js counter.js curve.js skin.js > ../../../o3d-webgl.src.js


//cat base.js effect.js util.js webgl.js debug.js element.js event.js loader.js math.js pack.js particles.js picking.js rendergraph.js canvas.js material.js io.js scene.js serialization.js error.js texture.js shape.js > ../../../o3djs.src.js
