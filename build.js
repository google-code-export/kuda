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
				// process.stdout.write('newFile:' + newFile + '\n');
				// process.stdout.write('path.basename(file):' + path.basename(file) + '\n');
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

var uglifyFile = function(file) {
	var jsp = uglify.parser,
		pro = uglify.uglify,
		ast = jsp.parse(fs.readFileSync(file).toString()),
		outFile = fs.openSync(file.slice(0, -2) + '.min.js', 'w+');
	ast = pro.ast_mangle(ast);
	ast = pro.ast_squeeze(ast);
	fs.writeSync(outFile, pro.gen_code(ast));
};

var uglifyMe = function(data) {
	var jsp = uglify.parser,
		pro = uglify.uglify,
		ast = jsp.parse(data),
	ast = pro.ast_mangle(ast);
	ast = pro.ast_squeeze(ast);
	return pro.gen_code(ast);
};

var uglifyFiles = function(fromDir, toDir, subDirs) {
	var files = [],
		dirs = [];

	getDirContents(fromDir, files, dirs);
	process.stdout.write('fromDir:' + fromDir + '\n');
	process.stdout.write('files:' + files + '\n');
	process.stdout.write('dirs:' + dirs + '\n');
	process.stdout.write('dirs.length:' + dirs.length + '\n\n');

	for (var i = 0, il = dirs.length; i < il; i++) {
		var dir = '/' + path.basename(dirs[i]);
		uglifyFiles(fromDir + dir, toDir + dir, subDirs);
	}
};

if (process.argv.length > 3) {
	var ndx = 2,
	docs = true,
	compress = true;
	// Check for flags
	while(process.argv[ndx].substr(0, 2) === '--') {
		var flag = process.argv[ndx++];
		
		switch (flag) {
			case '--no-doc':
				docs = false;
				break;
			case '--no-zip':
				compress = false;
				break;
		}
	}
	// Get build arguments
	var type = process.argv[ndx++],
		toDir = process.argv[ndx];

	if (path.existsSync(toDir)) {
		process.stdout.write('Cannot write to ' + toDir + ': already exists\n');
		process.exit(-1);
	}
	// Set up our filter
	filter = ['.svn', '.hg', '.hgignore', '.hgtags', '.project', '.settings'];

	if (type === 'core') {
		// Copy only the core Hemi library
		filter.push('app.js', 'build.js', 'PublishReadMe',
			'PublishTemplate.html', 'editor');
		copyFiles('.', toDir, { subDirs: false });
		var args = { subDirs: true };//, uglyModules: ['hemi'] };
		copyFiles('./public/js', toDir, args);
		// process.stdout.write(args.uglyData + '\n');
		// TODO: Make this pull in the hemi version from core or something better than hard coding doh! ;-)
		//fs.writeFileSync(toDir + '/hemi-core-1.4.0.min.js', args.uglyData);

		if (docs) {
			var docDir = './public/doc';

			if (path.existsSync(docDir)) {
				copyFiles(docDir, toDir + '/doc', { subDirs: true });
			}
		}
	} else if (type === 'ugly') {
		process.stdout.write('Making ugly toDir:' + toDir + '\n');
		uglifyFile(toDir);
	} else {
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
		'Valid options are: --no-doc, --no-zip\n' +
		'Valid types are: core, editor, full\n');
}
