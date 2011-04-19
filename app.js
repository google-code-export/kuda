
/**
 * Module dependencies.
 */
var express = require('express'),
	fs = require('fs'),
	util = require('util'),
	path = require('path');

var app = module.exports = express.createServer(),
	projectsPath = 'public/projects';

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

app.get('/listProjects', function(req, res) {
	if (req.isXMLHttpRequest) {
		var data = {
			options: []
		};
		
		if (!path.existsSync(projectsPath)) {
			fs.mkdirSync(projectsPath, 0755);
		} else {
			var files = fs.readdirSync(projectsPath);
			
			for (var ndx = 0, len = files.length; ndx < len; ndx++) {				
				var file = files[ndx];
				
				if (file.match('.json')) {
					file = file.split('.')[0];
					data.options.push(file);	
				}
			}
		}
		
		res.send(data, 200);		
	}
});

app.post('/saveProject', function(req, res) {	
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

app.get('/openProject', function(req, res) {
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


// Only listen on $ node app.js

if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
}
