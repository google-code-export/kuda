var child = require('child_process'),
	fs = require('fs'),
	path = require('path'),
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
	filter = ['.svn', '.hg', '.hgtags', '.project', '.settings'];
	
	if (type === 'core') {
		// Copy only the core Hemi library
		filter.push('app.js', 'editor');
		copyFiles('.', toDir, false);
		copyFiles('./public/js', toDir, true);
        
        if (docs) {
            copyFiles('./public/doc', toDir + '/doc', true);
        }
	} else {
		// Unless building a full package, do not copy samples
		if (type !== 'full') {
			filter.push('samples');
			filter.push('assets');
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
		'Valid options are: --no-doc, --no-zip\n' +
		'Valid types are: core, editor, full\n');
}
