
/**
 * Module dependencies.
 */
var express = require('express'),
	fs = require('fs'),
	util = require('util'),
	path = require('path');

var app = module.exports = express.createServer(),
	projectsPath = 'public/projects',
	assetsPath = 'public/assets';

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: 'your secret here'
    }));
    app.use(express.compiler({
        src: __dirname + '/public',
        enable: ['sass']
    }));
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
	if (req.isXMLHttpRequest) {
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
	if (req.isXMLHttpRequest) {		
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
	if (req.isXMLHttpRequest) {
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
					};
				
				for (var j = 0, jl = mFiles.length; j < jl; j++) {
					var mFile = mFiles[j];
					
					if (mFile.match('.json')) {
						mData.url = mDir + '/' + mFile;
					}
				}
				data.models.push(mData);	
			}
		}
	}
	
	res.send(data, 200);
});


// Only listen on $ node app.js

if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
}
