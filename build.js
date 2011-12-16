// WARNING: When using process.exit() you may exit or cut off an operation due
// to node's/JavaScript non-blocking calls

var child = require('child_process'),
	fs = require('fs'),
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
	args.libData = '';
	args.libMinData = '';
	args.moduleData = '';

	for (var i = 0, il = args.libFiles.length; i < il; i++) {
		var file = args.libFiles[i],
			data = fs.readFileSync(args.dist + '/' + file),
			fileData = data.toString();
		args.libData += fileData;
	}

	for (var i = 0, il = args.libMinFiles.length; i < il; i++) {
		var file = args.libMinFiles[i],
			data = fs.readFileSync(args.dist + '/' + file),
			fileData = data.toString();
		args.libMinData += fileData;
	}

	for (var i = 0, il = args.moduleFiles.length; i < il; i++) {
		var file = args.moduleFiles[i],
			data = fs.readFileSync(args.dist + '/' + file),
			fileData = data.toString();
		args.moduleData += fileData;
	}
};

var uglifyHemi = function(src, dst) {
		var args = {
				dist: src,
				libFiles: [
					'lib/Detector.js',
					'lib/jshashtable.js',
					'hemi/particles.js',
				],
				libMinFiles: [
					'lib/Detector.min.js',
					'lib/jshashtable.min.js',
					'hemi/particles.min.js',
				],
				moduleFiles: [
					'hemi/utils/inheritance.js',
					'hemi/utils/hashtable.js',
					'hemi/utils/jsUtils.js',
					'hemi/utils/mathUtils.js',
					'hemi/utils/shaderUtils.js',
					'hemi/utils/stringUtils.js',
					'hemi/utils/transformUtils.js',
					'hemi/msg.js',
					'hemi/console.js',
					'hemi/core.js',
					'hemi/loader.js',
					//'hemi/accessibility.js',
					'hemi/world.js',
					'hemi/octane.js',
					//'hemi/handlers/valueCheck.js',
					//'hemi/audio.js',
					'hemi/dispatch.js',
					'hemi/input.js',
					'hemi/transform.js',
					'hemi/view.js',
					'hemi/model.js',
	                'hemi/picker.js',
	                'hemi/client.js',
					'hemi/animationSequence.js',
					'hemi/motion.js',
					'hemi/effect.js',
					//'hemi/scene.js',
					//'hemi/hud.js',
					//'hemi/manip.js',
					'hemi/curve.js',
					//'hemi/sprite.js',
					'hemi/shape.js',
					'hemi/fx.js',
					//'hemi/texture.js',
					'hemi/timer.js'
				]
			},
			header =
'/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */\n\
/*\n\
The MIT License (MIT)\n\
\n\
Copyright (c) 2011 SRI International\n\
\n\
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated\n\
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the\n\
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit\n\
persons to whom the Software is furnished to do so, subject to the following conditions:\n\
\n\
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the\n\
Software.\n\
\n\
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE\n\
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\n\
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n\
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\
*/\n';
		catFiles(args);
		fs.writeFileSync(dst + '/hemi.src.js', args.libData + args.moduleData);

		var uglyData = uglifyMe(args.moduleData),
			outFile = fs.openSync(dst + '/hemi.min.js', 'w+');
		fs.writeSync(outFile, args.libMinData + header + uglyData);
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
	} else if (type === 'uglify') {
		uglifyFile(toDir, '');
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
