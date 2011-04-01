var child = require('child_process'),
	fs = require('fs'),
	path = require('path'),
	procFds = [process.stdin.fd, process.stdout.fd, process.stderr.fd],
	filter = [],
	genDoc = true,
	compress = true;

var copyAssets = function(fromDir, toDir) {
	var dirs = ['audio', 'images', 'videos'],
		mDirs = ['DigitalDisplay', 'DollHouse', 'house_v12',
			'LightingHouse_v082', 'ScenarioB_v017', 'TinyHouse_v07'];
	
	for (var i = 0, il = dirs.length; i < il; i++) {
		var dir = '/' + dirs[i];
		copyFiles(fromDir + dir, toDir + dir, true);
	}
	
	fromDir += '/webgl';
	getDirContents(fromDir, [], dirs);
	
	for (var i = 0, il = mDirs.length; i < il; i++) {
		var dir = '/' + mDirs[i];
		copyFiles(fromDir + dir, toDir + dir, true);
	}
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

var generateDocs = function(docDir, srcDirs, callback) {
	if (genDoc) {
		// Generate documentation
		var jsdDir = '../jsdoc_toolkit-2.3.2/jsdoc-toolkit',
			args = ['-jar', 'jsrun.jar', 'app/run.js', '-t=templates/codeview/',
				'-d='+docDir, '-q', '-r', '-s'];
		
		for (var i = 0, il = srcDirs.length; i < il; i++) {
			args.push(srcDirs[i]);
		}
		
		var docChild = child.spawn('java', args, {customFds:procFds, cwd:jsdDir});
		docChild.on('exit', callback);
	} else {
		callback();
	}
};

var compressDir = function(toDir) {
	if (compress) {
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
	}
};

if (process.argv.length > 4) {
	var ndx = 2;
	// Check for flags
	while(process.argv[ndx].substr(0, 2) === '--') {
		var flag = process.argv[ndx++];
		
		switch (flag) {
			case '--no-doc':
				genDoc = false;
				break;
			case '--no-zip':
				compress = false;
				break;
		}
	}
	// Get build arguments
	var type = process.argv[ndx++],
		fromDir = process.argv[ndx++],
		toDir = process.argv[ndx],
		stat = fs.statSync(fromDir),
		docDir, srcDirs;
	
	if (path.existsSync(toDir)) {
		process.stdout.write('Cannot write to ' + toDir + ': already exists\n');
		process.exit(-1);
	}
	// Set up our filter
	filter = ['.svn'];
	
	if (type === 'core') {
		// Set up documentation parameters
		var prefix = '../../kuda/' + toDir;
		docDir = prefix + '/doc';
		srcDirs = [prefix + '/hemi', prefix + '/hext'];
		// Copy only the core Hemi library
		filter.push('app.js', 'editor');
		copyFiles(fromDir, toDir, false);
		copyFiles(fromDir + '/public/js', toDir, true);
		// Create a doc directory since we didn't copy the existing one
		var stat = fs.statSync(toDir);
		fs.mkdirSync(toDir + '/doc', stat.mode);
	} else {
		// Set up documentation parameters
		var prefix = '../../kuda/' + toDir;
		docDir = prefix + '/public/doc';
		srcDirs = [prefix + '/public/js/hemi', prefix + '/public/js/hext'];
		// Unless building a full package, do not copy samples
		if (type !== 'full') {
			filter.push('samples');
		}
		// Now copy the Kuda files
		copyFiles(fromDir, toDir, true);
		// If building a full package, copy sample assets
		if (type === 'full') {
			copyAssets('assets', toDir + '/public/assets');
		}
	}
	
	// Optionally generate documentation and/or compress
	generateDocs(docDir, srcDirs, function(code){
		compressDir(toDir);
	});
} else {
	process.stdout.write('Usage: node build.js [options] [type] [fromDir] [toDir]\n' +
		'Valid options are: --no-doc, --no-zip\n' +
		'Valid types are: core, editor, full\n');
}
