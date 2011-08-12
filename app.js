
/**
 * Module dependencies.
 */
var express = require('express'),
	child = require('child_process'),
	fs = require('fs'),
	util = require('util'),
	path = require('path');

var app = module.exports = express.createServer(),
	projectsPath = 'public/projects',
	assetsPath = 'public/assets',
	uploadPath = 'public/tmp',
	procFds = [process.stdin.fd, process.stdout.fd, process.stderr.fd];

// Configuration

app.configure(function(){
//    app.set('views', __dirname + '/views');
//    app.set('view engine', 'jade');
//	app.use(form({ keepExtensions: true }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: 'your secret here'
    }));
//    app.use(express.compiler({
//        src: __dirname + '/public',
//        enable: ['sass']
//    }));
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

// Routes

//app.get('/', function(req, res){
//  res.render('index', {
//    title: 'Express'
//  });
//});

app.get('/projects', function(req, res) {
	if (req.xhr) {
		var data = {
			projects: []
		};
		
		if (!path.existsSync(projectsPath)) {
			fs.mkdirSync(projectsPath, 0755);
		} else {
			var files = fs.readdirSync(projectsPath);
			
			for (var i = 0, il = files.length; i < il; i++) {				
				var file = files[i];
				
				if (file.match('.json')) {
					file = file.split('.')[0];
					data.projects.push(file);	
				}
			}
		}
		
		res.send(data, 200);		
	}
});

app.post('/project', function(req, res) {	
	if (req.xhr) {		
		if (!path.existsSync(projectsPath)) {
			fs.mkdirSync(projectsPath, 0755);
		}
		
		var defName = 'project',			
			name = req.param('name', defName) + '.json',
			replace = req.param('replace') == 'true',
			filePath = projectsPath + '/' + name;
		
		if (path.existsSync(filePath) && !replace) {
			var oldData = {
				name: req.param('name'),
				octane: req.param('octane')
			};
			
			res.send({
				errType: 'fileExists',
				errData: oldData,
				errMsg: 'File by that name already exists'
			}, 400);
		}
		else {
			var input = req.param('octane');
			
			fs.writeFileSync(filePath, input);
			res.send({
				name: name
			}, 200);
		}
	}
});

app.get('/project', function(req, res) {
	if (req.xhr) {
		var name = req.param('name') + '.json',
			filePath = projectsPath + '/' + name;
		
		if (path.existsSync(filePath)) {			
			var data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			res.send(data, 200);
		}
		else {
			res.send('File named ' + name + ' does not exist', 400);
		}
	}
});

app.get('/models', function(req, res) {
	var data = {
		models: []
	};
	
	if (!path.existsSync(assetsPath)) {
		fs.mkdirSync(assetsPath, 0755);
	} else {
		var files = fs.readdirSync(assetsPath),
			urlDir = 'assets/';
		
		for (var i = 0, il = files.length; i < il; i++) {				
			var file = files[i],
				dir = assetsPath + '/' + file,	
				mDir = urlDir + file,				
				stat = fs.statSync(dir);
			
			if (stat.isDirectory()) {
				var mFiles = fs.readdirSync(dir),
					mData = {
						name: file
					},
					found = false;
				
				for (var j = 0, jl = mFiles.length; j < jl && !found; j++) {
					var mFile = mFiles[j];
					
					if (mFile.match('.json')) {
						mData.url = mDir + '/' + mFile;
						found = true;
					}
				}
				
				if (found) {
					data.models.push(mData);
				}	
			}
		}
	}
	
	res.send(data, 200);
});

app.post('/model', function(req, res) {
    if (req.xhr && req.header('content-type') === 'application/octet-stream') {
		if (!path.existsSync(uploadPath)) {
			fs.mkdirSync(uploadPath, 0755);
		}
		
        var fName = req.header('x-file-name'), 
			fSize = req.header('x-file-size'), 
			fType = req.header('x-file-type'), 
			tmpFile = uploadPath + '/' + fName,
			toDir = assetsPath + '/' + fName.split('.').shift(),
			origDir = toDir,
			ws = fs.createWriteStream(tmpFile),
			ext = fName.split('.').pop(),
			counter = 0;
			
		req.on('data', function(data){
			ws.write(data);
		});
        
		if (ext === 'o3dtgz' || ext === 'tgz' || ext === 'zip') {
			
			while (path.existsSync(toDir)) {
				toDir = origDir + counter++;
			}
			fs.mkdirSync(toDir, 0755);
			
			var tarChild = child.spawn('tar', ['-C', toDir, '-xzf', tmpFile], {
				customFds: procFds
			});
			
			tarChild.on('exit', function(code){
				if (code === 0) {
					// Clean up the temp file
					fs.unlinkSync(tmpFile);
					
					var mFiles = fs.readdirSync(toDir), 
						found = false, 
						retVal = {}, 
						urlDir = toDir.split('/');
					
					urlDir.shift();
					
					for (var j = 0, jl = mFiles.length; j < jl && !found; j++) {
						var mFile = mFiles[j];
						
						if (mFile.match('.json')) {
							retVal.url = urlDir.join('/') + '/' + mFile;
							found = true;
						}
					}
					
					res.send(retVal, 200);
				}
				else {
					res.send('Failed to upload file', 300);
					fs.unlinkSync(tmpFile);
				}
			});
		}
		else {			
			res.send('File must be an archive file', 300);
			fs.unlinkSync(tmpFile);
		}
    }
});

app.post('/publish', function(req, res) {
	if (req.isXMLHttpRequest) {
		var name = req.param('name'),
			models = req.param('models'),
			filePath = projectsPath + '/' + name + '.html',
			content = fs.readFileSync('PublishTemplate.html', 'utf8'),
			readme = fs.readFileSync('PublishReadMe', 'utf8'),
			start = content.indexOf('<!DOCTYPE');
		
		content = content.substr(start);
		fs.writeFileSync(filePath,
			content.replace(/%PROJECT%/g, 'projects/' + name)
				.replace(/%LOAD%/g, '..').replace(/%SCRIPT%/g, '../../js'));
		
		// Create the published package
		var toDir = projectsPath + '/' + name;
		var stat = fs.statSync(projectsPath);
		fs.mkdirSync(toDir, stat.mode);
		fs.mkdirSync(toDir + '/assets', stat.mode);
		fs.mkdirSync(toDir + '/lib', stat.mode);
		copyFiles('./public/js/hemi', toDir + '/hemi');
		copyFiles('./public/js/o3d-webgl', toDir + '/o3d-webgl');
		copyFiles('./public/js/o3djs', toDir + '/o3djs');
		var data = fs.readFileSync('./public/js/lib/jshashtable.js');
		fs.writeFileSync(toDir + '/lib/jshashtable.js', data);
		data = fs.readFileSync(projectsPath + '/' + name + '.json');
		fs.writeFileSync(toDir + '/README', readme.concat(models));
		fs.writeFileSync(toDir + '/' + name + '.json', data);
		fs.writeFileSync(toDir + '/' + name + '.html',
			content.replace(/%PROJECT%/g, name).replace(/%LOAD%/g, '.')
				.replace(/%SCRIPT%/g, '.'));
		
		// Compress the package and remove the files
		var tarChild = child.spawn('tar', ['-czf', name + '.tgz', name],
			{cwd: projectsPath});
		
		tarChild.on('exit', function (code) {
			removeFiles(toDir);
			res.send({
				name: name + '.html'
			}, code === 0 ? 200 : 500);
		});
	}
});

var copyFiles = function(fromDir, toDir) {
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
	
	for (var i = 0, il = dirs.length; i < il; i++) {
		var dir = '/' + path.basename(dirs[i]);
		copyFiles(fromDir + dir, toDir + dir);
	}
};

var getDirContents = function(dir, files, dirs) {
	var dirFiles = fs.readdirSync(dir);
	
	for (var i = 0, il = dirFiles.length; i < il; i++) {
		var file = dirFiles[i],
			fPath = path.resolve(dir, file),
			stat = fs.statSync(fPath);
		
		if (stat.isDirectory()) {
			dirs.push(fPath);
		} else if (stat.isFile()) {
			files.push(fPath);
		}
	}
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


// Only listen on $ node app.js

if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
}
